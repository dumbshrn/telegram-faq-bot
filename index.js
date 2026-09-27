require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ---------- Config ----------
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const KNOWLEDGE_FILE = path.join(__dirname, 'knowledge.md');
const GEMINI_MODEL = 'gemini-2.0-flash'; // fast + cheap, good enough for FAQ answering

if (!BOT_TOKEN || !GEMINI_API_KEY) {
  console.error('Missing TELEGRAM_BOT_TOKEN or GEMINI_API_KEY in .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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

  const prompt = `You are a helpful support assistant for a Telegram group. Answer the user's question using ONLY the information in the knowledge base below.

Rules:
- If the answer is in the knowledge base, answer clearly and concisely (a few sentences, or short steps for troubleshooting).
- If the knowledge base does not cover the question, say you don't have that information and suggest they ask an admin — do NOT guess or make things up.
- Do not mention "the knowledge base" in your reply, just answer naturally.
- Keep it short enough to read comfortably in a chat app.

KNOWLEDGE BASE:
"""
${knowledge}
"""

QUESTION: ${question}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
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
