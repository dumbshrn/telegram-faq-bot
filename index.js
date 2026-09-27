require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');

// ---------- Config ----------
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const KNOWLEDGE_FILE = path.join(__dirname, 'knowledge.md');
const GROQ_MODEL = 'openai/gpt-oss-120b'; // llama-3.3-70b-versatile was deprecated Aug 16, 2026

if (!BOT_TOKEN || !GROQ_API_KEY) {
  console.error('Missing TELEGRAM_BOT_TOKEN or GROQ_API_KEY in .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const groq = new Groq({ apiKey: GROQ_API_KEY });

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
// Just a plain text/markdown file. Reloaded fresh on every question, so you
// can edit knowledge.md on the server and it takes effect immediately —
// no restart needed.
function loadKnowledge() {
  try {
    return fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
  } catch (err) {
    console.error('Could not read knowledge.md:', err.message);
    return '';
  }
}

// ---------- Answering ----------
async function answerQuestion(question) {
  const knowledge = loadKnowledge();

  const systemPrompt = `You are a helpful support assistant for a Telegram group. Answer the user's question using ONLY the information in the knowledge base below.

Rules:
- If the answer is in the knowledge base, answer clearly and concisely (a few sentences, or short steps for troubleshooting).
- If the knowledge base does not cover the question, say you don't have that information and suggest they ask an admin — do NOT guess or make things up.
- Do not mention "the knowledge base" in your reply, just answer naturally.
- Keep it short enough to read comfortably in a chat app.

KNOWLEDGE BASE:
"""
${knowledge}
"""`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
  });

  return completion.choices[0].message.content.trim();
}

// ---------- Command handling ----------
// Only responds to: /ask <question>
bot.command('ask', async (ctx) => {
  const question = ctx.message.text.replace(/^\/ask(@\w+)?\s*/i, '').trim();

  if (!question) {
    await ctx.reply('Ask something after the command, e.g.\n/ask how do I fix buffering?');
    return;
  }

  try {
    await ctx.sendChatAction('typing');
    const answer = await answerQuestion(question);
    await ctx.reply(answer, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error('Error answering question:', err);
    await ctx.reply(
      "Sorry, I couldn't process that right now — try again in a bit.",
      { reply_to_message_id: ctx.message.message_id }
    );
  }
});

bot.catch((err) => console.error('Bot error:', err));

bot.launch();
console.log('FAQ bot running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
