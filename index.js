require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');

// ---------- Config ----------
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const KNOWLEDGE_FILE = path.join(__dirname, 'knowledge.md');
// Small/fast model first; if it errors or is rate-limited, try the bigger one.
// (Groq's free-tier limits are per model, so the fallback also gives extra room.)
// llama-3.1-8b-instant and llama-3.3-70b-versatile were shut down Aug 16, 2026.
const MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

if (!BOT_TOKEN || !GROQ_API_KEY) {
  console.error('Missing TELEGRAM_BOT_TOKEN or GROQ_API_KEY in .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
// Fail fast instead of hanging: 20s timeout, 1 automatic retry (SDK retries 429s too)
const groq = new Groq({ apiKey: GROQ_API_KEY, timeout: 15000, maxRetries: 0 });

// ---------- Providers (all FREE, no credit card) ----------
// Tried in order. Extra providers are optional: they're only used if their key is set.
// Each one has its own separate rate limit, so when Groq is rate-limited the bot
// keeps answering from the next one. NEVER add a payment method to any of these.
const PROVIDERS = [
  ...MODELS.map((model) => ({ name: `groq/${model}`, kind: 'groq', model })),
  ...(process.env.GEMINI_API_KEY
    ? [{
        name: 'gemini', kind: 'openai',
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        key: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest', // check the name in AI Studio
      }]
    : []),
];
console.log('LLM providers:', PROVIDERS.map((p) => p.name).join(' -> '));

const cooldownUntil = new Map(); // provider name -> timestamp; skip providers that just rate-limited us

// ---------- Load control ----------
// Max 3 Groq calls at once; extra questions wait in line instead of all
// firing together and hitting rate limits.
const MAX_CONCURRENT = 3;
let running = 0;
const waiting = [];
function limited(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      running++;
      fn().then(resolve, reject).finally(() => {
        running--;
        if (waiting.length) waiting.shift()();
      });
    };
    running < MAX_CONCURRENT ? run() : waiting.push(run);
  });
}

// ---------- Answer cache ----------
// Same question within 1 hour -> reuse the answer (no Groq call).
// Identical questions asked at the same moment share one Groq call.
const answerCache = new Map(); // key -> { answer, at }
const pending = new Map();     // key -> Promise
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 300;
const cacheKey = (q) => q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- Short chat memory ----------
// Remembers the last few exchanges per person per chat so follow-ups like
// "and how do I do that?" make sense. Forgotten after 20 min of silence.
const HISTORY_TURNS = 3;
const HISTORY_TTL_MS = 20 * 60 * 1000;
const histories = new Map(); // "chatId:userId" -> { msgs: [{role, content}], at }
const clip = (t, n) => (t.length > n ? t.slice(0, n) + '…' : t);
function getHistory(key) {
  const h = histories.get(key);
  return h && Date.now() - h.at < HISTORY_TTL_MS ? h.msgs : [];
}
function saveHistory(key, base, question, answer) {
  const msgs = [...base, { role: 'user', content: clip(question, 400) }, { role: 'assistant', content: clip(answer, 500) }];
  histories.set(key, { msgs: msgs.slice(-HISTORY_TURNS * 2), at: Date.now() });
}
setInterval(() => {
  for (const [k, h] of histories) if (Date.now() - h.at > HISTORY_TTL_MS) histories.delete(k);
}, 5 * 60 * 1000);

// One question per user every 4 seconds (stops spam from clogging the queue)
const COOLDOWN_MS = 4000;
const lastAsk = new Map();
setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [id, t] of lastAsk) if (t < cutoff) lastAsk.delete(id);
}, 60000);

// ---------- Tiny HTTP server ----------
// Free hosts like Render need something listening on a port to consider
// the service "alive" — this does nothing except say OK. It also gives
// you a URL you can ping (e.g. with UptimeRobot) to stop the free
// instance from going to sleep from inactivity.
const http = require('http');
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running');
  })
  .listen(PORT, () => console.log(`Health check server on port ${PORT}`));

// ---------- Knowledge base ----------
// knowledge.md is split into "## " sections. For each question we only send
// the few sections that match (keyword scoring, no AI, instant) instead of
// the whole file. Edit knowledge.md any time — it's re-read automatically
// when the file changes, no restart needed.
const STOP = new Set(('the a an is are was were be been to of in on at for with and or but not no how do does ' +
  'did i my me you your it its this that what why when where can cant cannot could should would will just any ' +
  'some get got have has had app vivi music song songs please help there they them then than so if as from ' +
  'im ive dont doesnt wont keeps keep hi hey hello hii work works working').split(' '));

// Extra words that point at a section (matched after simple stemming)
const SYN = {
  quiet: 'volume', loud: 'volume', sound: 'volume', audio: 'volume', mute: 'volume',
  lag: 'freeze', laggy: 'freeze lyrics', slow: 'freeze', hang: 'freeze', crash: 'crashes freezes',
  black: 'screen', white: 'screen', blank: 'screen',
  login: 'account', signin: 'account', logout: 'account', token: 'account', password: 'account',
  lyric: 'lyrics', sync: 'lyrics', translat: 'lyrics',
  download: 'downloads', offline: 'downloads',
  battery: 'battery', drain: 'battery', hot: 'battery', notif: 'notifications', notification: 'notifications',
  spotify: 'importing spotify', import: 'importing spotify',
  vpn: 'region', country: 'region', region: 'region', unavailable: 'region',
  bug: 'reporting logs', log: 'reporting logs', logcat: 'reporting logs', report: 'reporting logs',
  update: 'nightly beta', beta: 'nightly beta', apk: 'nightly install', install: 'nightly install', nightly: 'nightly beta',
  rule: 'rules', link: 'links', website: 'links', donate: 'links', sponsor: 'links', telegram: 'links',
  ios: 'ios features', flac: 'features', cast: 'features', pip: 'features', local: 'features', iphone: 'ios features', pc: 'features', tv: 'features',
  stop: 'pause volume', pause: 'pause volume',
  skip: 'skipping', shuffle: 'skipping', repeat: 'skipping', crossfade: 'skipping', loop: 'skipping',
  queue: 'queue', playlist: 'queue', reorder: 'queue',
  backup: 'backups', restore: 'backups', lost: 'backups', liked: 'backups', stats: 'backups',
  canvas: 'canvas', animated: 'canvas', apple: 'apple', player: 'apple', design: 'apple',
  recommendation: 'home', home: 'home', quick: 'home',
};

function stem(w) {
  return w.length > 4 ? w.replace(/(ing|ed|es|s|e|er)$/, '') : w;
}
const SYN_STEMMED = {};
for (const k of Object.keys(SYN)) SYN_STEMMED[stem(k)] = SYN[k];
function tokens(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP.has(w))
    .map(stem);
}

// Each "### " heading is its own unit ("Topic > Subtopic"). A "## " topic with no
// "### " inside is one unit. The AI router picks units by their titles.
function parseSections(full) {
  const topics = full.replace(/\r/g, '').split(/^(?=## )/m).filter((c) => c.startsWith('## '));
  const sections = [];
  let index = '';
  const add = (title, text) => {
    const tf = new Map();
    for (const t of tokens(title + ' ' + text)) tf.set(t, (tf.get(t) || 0) + 1);
    sections.push({ title, text: text.trim(), tf, titleTokens: new Set(tokens(title)) });
  };
  for (const topic of topics) {
    const topicTitle = topic.split('\n')[0].replace(/^##\s*/, '').trim();
    if (/^quick index/i.test(topicTitle)) { index = topic.trim(); continue; } // fallback only
    const short = topicTitle.replace(/\s*\(.*\)\s*$/, '');
    const parts = topic.split(/^(?=### )/m);
    const subs = parts.filter((p) => p.startsWith('### '));
    if (!subs.length) { add(short, topic); continue; }
    const pre = parts[0].split('\n').slice(1).join('\n').trim();
    if (pre) add(`${short} > Overview`, `## ${topicTitle}\n${pre}`);
    for (const sub of subs) {
      const subTitle = sub.split('\n')[0].replace(/^###\s*/, '').trim();
      add(`${short} > ${subTitle}`, `## ${topicTitle}\n${sub}`);
    }
  }
  const menu = sections.map((sec, i) => `${i + 1}. ${sec.title}`).join('\n');
  return { sections, index, menu };
}

let kb = { mtime: 0, full: '', sections: [], index: '', menu: '' };
function getKnowledge() {
  try {
    const mtime = fs.statSync(KNOWLEDGE_FILE).mtimeMs;
    if (mtime !== kb.mtime) {
      const full = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
      kb = { mtime, full, ...parseSections(full) };
      answerCache.clear(); // knowledge changed -> old answers may be stale
      console.log(`knowledge.md loaded: ${kb.sections.length} sections`);
    }
  } catch (err) {
    console.error('Could not read knowledge.md:', err.message);
  }
  return kb;
}

// Keyword ranking (no AI): used to skip the router when the match is obvious,
// and as a fallback if the router call fails. Rare words count more (IDF).
function rankSections(question) {
  const { sections } = getKnowledge();
  const qTokens = [...new Set(tokens(question))];
  const extra = new Set();
  for (const t of qTokens) if (SYN_STEMMED[t]) SYN_STEMMED[t].split(' ').forEach((w) => extra.add(stem(w)));

  const N = sections.length;
  const idf = (t) => {
    const df = sections.filter((x) => x.tf.has(t) || x.titleTokens.has(t)).length;
    return df ? Math.log(1 + N / df) : 0;
  };
  return sections
    .map((sec) => {
      let score = 0;
      for (const t of qTokens) {
        const w = idf(t);
        if (sec.titleTokens.has(t)) score += 4 * w;
        score += Math.min(sec.tf.get(t) || 0, 4) * w;
      }
      for (const t of extra) {
        const w = idf(t);
        if (sec.titleTokens.has(t)) score += 3 * w;
        score += Math.min(sec.tf.get(t) || 0, 3) * 0.5 * w;
      }
      // hits = how many distinct question words (or their synonym triggers) show up in this unit
      let hits = 0;
      for (const t of qTokens) {
        const has = (w) => sec.tf.has(w) || sec.titleTokens.has(w);
        const syn = SYN_STEMMED[t] ? SYN_STEMMED[t].split(' ').map(stem) : [];
        if (has(t) || syn.some(has)) hits++;
      }
      return { sec, score, hits };
    })
    .sort((a, b) => b.score - a.score);
}

// ---------- AI router ----------
// Small, cheap call: the model sees ONLY the list of headings (no content) and
// answers with the numbers of the ones needed. Then we fetch just those.
async function callProvider(p, messages, maxTokens) {
  if (p.kind === 'groq') {
    const res = await groq.chat.completions.create({
      model: p.model,
      messages,
      temperature: 0,
      reasoning_effort: 'low', // gpt-oss is a reasoning model; low = much faster
      max_completion_tokens: maxTokens,
    });
    return (res.choices[0].message.content || '').trim();
  }
  // OpenAI-compatible providers (Gemini): plain fetch, 15s timeout
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
      // x2: some models spend part of the budget "thinking" before answering
      body: JSON.stringify({ model: p.model, messages, temperature: 0, max_tokens: maxTokens * 2 }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  } finally {
    clearTimeout(timer);
  }
}

// Ask the first provider that works. Returns plain text.
async function llmChat(messages, maxTokens) {
  const now = Date.now();
  let candidates = PROVIDERS.filter((p) => (cooldownUntil.get(p.name) || 0) <= now);
  if (!candidates.length) candidates = PROVIDERS; // everything cooling down -> just try anyway
  let lastErr;
  for (const p of candidates) {
    try {
      const text = await callProvider(p, messages, maxTokens);
      if (text) return text;
      throw new Error('empty reply');
    } catch (err) {
      lastErr = err;
      const rateLimited = err.status === 429;
      cooldownUntil.set(p.name, Date.now() + (rateLimited ? 60000 : 20000));
      console.error(`${p.name} failed (${err.status || err.message}); trying next…`);
    }
  }
  throw lastErr || new Error('no providers configured');
}

// Returns an array of section indexes (may be empty = "nothing fits"), or null if the router failed.
async function routeWithAI(question) {
  const { sections, menu } = getKnowledge();
  if (!sections.length) return null;
  try {
    const raw = await llmChat(
      [
        {
          role: 'system',
          content:
            'You route questions for a Vivi Music (Android music app) support bot. Below is a numbered list of help topics. ' +
            "Reply with ONLY the numbers of the topics needed to answer the user's message (max 3, best first), comma-separated, e.g. 4,12. " +
            'If the message is a greeting, a general/off-topic question, or no topic fits, reply 0. No other text.\n\nTOPICS:\n' + menu,
        },
        { role: 'user', content: question },
      ],
      300
    );
    const ids = [...new Set((raw.match(/\d+/g) || []).map(Number))]
      .filter((n) => n >= 1 && n <= sections.length)
      .slice(0, 3)
      .map((n) => n - 1);
    return ids;
  } catch (err) {
    console.error('Router failed, using keyword match:', err.status || err.message);
    return null;
  }
}

const MAX_KB_CHARS = 9000;
function buildFrom(indexes) {
  const { sections } = getKnowledge();
  let text = '';
  const titles = [];
  for (const i of indexes) {
    const sec = sections[i];
    if (text.length + sec.text.length > MAX_KB_CHARS && text) break;
    text += sec.text + '\n\n';
    titles.push(sec.title);
  }
  return { text: text.trim(), picked: titles };
}

// Decide what knowledge to send for this question.
async function pickKnowledge(question) {
  const { sections, index } = getKnowledge();
  const ranked = rankSections(question);
  const top = ranked[0];
  const second = ranked[1];
  const idxOf = (r) => sections.indexOf(r.sec);

  // Obvious keyword match -> skip the router call (saves a request + tokens)
  if (top && top.hits >= 2 && top.score >= 12 && top.score >= 1.8 * (second ? second.score : 0)) {
    const r = buildFrom(ranked.filter((x, i) => i < 3 && x.score >= top.score * 0.6).map(idxOf));
    return { ...r, via: 'keywords' };
  }

  const routed = await routeWithAI(question);
  if (routed === null) {
    // Router unavailable -> keyword fallback
    if (!top || top.score < 2.5) return { text: index, picked: ['(index only)'], via: 'fallback' };
    return { ...buildFrom(ranked.filter((x, i) => i < 3 && x.score >= top.score * 0.5).map(idxOf)), via: 'fallback' };
  }

  const picks = [...routed];
  // Safety net: if keywords strongly point somewhere the router didn't, add it too
  if (top && top.score >= 6 && !picks.includes(idxOf(top))) picks.push(idxOf(top));
  if (!picks.length) return { text: index, picked: ['(none — general question)'], via: 'router' };
  return { ...buildFrom(picks.slice(0, 4)), via: 'router' };
}

// ---------- Answering ----------
async function answerQuestion(question, history = []) {
  // Follow-ups depend on the conversation, so only fresh questions use the cache
  if (history.length) return askGroq(question, history);
  const key = cacheKey(question);
  const hit = answerCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.answer;
  if (pending.has(key)) return pending.get(key);

  const p = askGroq(question)
    .then((answer) => {
      if (answerCache.size >= CACHE_MAX) answerCache.delete(answerCache.keys().next().value);
      answerCache.set(key, { answer, at: Date.now() });
      return answer;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}

async function askGroq(question, history = []) {
  // For follow-ups ("and then?"), route on the previous question + this one
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  const routingText = lastUser ? `${lastUser.content} ${question}` : question;
  const { text: knowledge, picked, via } = await pickKnowledge(routingText);
  console.log(`Q: "${question.slice(0, 60)}" [${via}] -> ${picked.join(' | ')} (${knowledge.length} chars)`);

  const systemPrompt = `You are a friendly, knowledgeable assistant in a Telegram group about the Vivi Music app. You can answer any question, like a normal AI assistant.

For questions about Vivi Music: the RELEVANT KNOWLEDGE below has real, confirmed facts (settings names, known bugs, exact steps). Trust it over your own guesses.
- Work out which parts apply, even if the question is worded differently. Connect the dots instead of matching literally.
- If it's close to something covered but not identical, use general troubleshooting sense (force-stop the app, check the internet, etc.) but NEVER invent specific Vivi facts: no made-up setting names, menu paths, buttons, or claims about what the app can or can't do. If you're unsure of a specific detail, say so, and suggest asking an admin.
- If the knowledge has nothing relevant to a Vivi question, say you don't have confirmed info on that.

This is mainly a Vivi Music support group, so stay focused on it. For other questions (general knowledge, tech, phone, Android, study), you may help, but keep it brief: a few sentences, no long essays, code projects or homework. Small talk is fine; answer it briefly and warmly. If someone wants a big off-topic task, give a short pointer and say you're mainly here for Vivi Music. Be honest when you're not sure; don't make things up.

Earlier messages from this conversation may be included above the latest one; use them to understand follow-ups.

Group rules to respect: don't discuss, compare or recommend other music streaming apps (this is a Vivi-only group); keep replies clean and respectful.

Style: write like a person, not a manual. Don't say "the knowledge base". Keep it short enough to read comfortably in a chat app.

RELEVANT KNOWLEDGE (sections most related to this question; may be only a topic index):
"""
${knowledge}
"""`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: question },
  ];

  return await llmChat(messages, 900); // reasoning + answer; modest for per-minute token limits
}

// ---------- Command handling ----------
// Responds to: /ask <question>, and to replies to the bot's own messages.
async function respond(ctx, question, repliedBotText) {
  const uid = ctx.from.id;
  const now = Date.now();
  if (now - (lastAsk.get(uid) || 0) < COOLDOWN_MS) {
    await ctx.reply('Slow down a little — one question at a time 🙂', {
      reply_to_message_id: ctx.message.message_id,
    });
    return;
  }
  lastAsk.set(uid, now);

  // Conversation so far for this person in this chat
  const hkey = `${ctx.chat.id}:${uid}`;
  let history = getHistory(hkey);
  if (repliedBotText) {
    // They replied to a specific bot message: that message is the context.
    const known = history.some((m) => m.role === 'assistant' && m.content.slice(0, 80) === repliedBotText.slice(0, 80));
    if (!known) history = [{ role: 'assistant', content: clip(repliedBotText, 500) }];
  }

  try {
    await ctx.sendChatAction('typing');
    const answer = await limited(() => answerQuestion(question, history));
    saveHistory(hkey, history, question, answer);
    try {
      await ctx.reply(answer, {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: 'Markdown',
      });
    } catch (parseErr) {
      // Telegram's Markdown parser is strict (unmatched * or _ throws a
      // 400). Fall back to plain text rather than losing the answer.
      await ctx.reply(answer, { reply_to_message_id: ctx.message.message_id });
    }
  } catch (err) {
    console.error('Error answering question:', err);
    await ctx.reply(
      "Sorry, I couldn't process that right now — try again in a bit.",
      { reply_to_message_id: ctx.message.message_id }
    );
  }
}

bot.command('ask', async (ctx) => {
  const question = ctx.message.text.replace(/^\/ask(@\w+)?\s*/i, '').trim();
  if (!question) {
    await ctx.reply('Ask something after the command, e.g.\n/ask how do I fix buffering?');
    return;
  }
  // /ask sent as a reply to one of the bot's messages keeps that context too
  const replied = ctx.message.reply_to_message;
  const botId = (ctx.botInfo || bot.botInfo || {}).id;
  const repliedBotText = replied && replied.from && replied.from.id === botId ? replied.text || '' : '';
  await respond(ctx, question, repliedBotText);
});

// Someone replies to a bot message (no /ask needed) -> treat it as a follow-up
bot.on('text', async (ctx) => {
  const replied = ctx.message.reply_to_message;
  const botId = (ctx.botInfo || bot.botInfo || {}).id;
  if (!replied || !replied.from || replied.from.id !== botId) return;
  const question = ctx.message.text.trim();
  if (!question || question.startsWith('/')) return;
  await respond(ctx, question, replied.text || '');
});

bot.catch((err) => console.error('Bot error:', err));

// dropPendingUpdates: after a Render sleep/restart, ignore the old backlog
// instead of replaying every missed message
bot.launch({ dropPendingUpdates: true }).catch((e) => {
  console.error('Launch failed:', e);
  process.exit(1);
});
console.log('FAQ bot running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
