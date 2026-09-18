// ============================================================
// MUFASER-X — GEMINI CHATBOT
// ============================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


// ============================================================
// CHECK WHETHER CHATBOT IS ENABLED
// ============================================================

function isChatbotEnabled(jid, account) {

  if (!account) return false;

  if (!account.chatbot) {
    account.chatbot = {
      groups: {},
      dm: false,
      all: false
    };
  }

  // ── GLOBAL ON ──────────────────────────────────────
  if (account.chatbot.all === true) {
    return true;
  }

  // ── GROUP ──────────────────────────────────────────
  if (jid.endsWith('@g.us')) {

    return (
      account.chatbot.groups?.[jid] === true
    );

  }

  // ── PRIVATE DM ─────────────────────────────────────
  return account.chatbot.dm === true;
}


// ============================================================
// GET MESSAGE TEXT
// ============================================================

function getMessageText(msg) {

  return (
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.imageMessage?.caption ||
    msg?.message?.videoMessage?.caption ||
    msg?.message?.documentMessage?.caption ||
    ''
  ).trim();
}


// ============================================================
// ASK GEMINI
// ============================================================

async function askGemini(text, account) {

  if (!GEMINI_API_KEY) {

    throw new Error(
      'GEMINI_API_KEY is missing from .env'
    );

  }

  const systemPrompt = `
You are MUFASER-X, a WhatsApp AI chatbot created by ROMA-TECH from Uganda.

Be friendly, helpful and natural.

Do not start every response with "MUFASER-X:".

Keep normal WhatsApp replies reasonably concise unless the user asks for detail.

If someone asks who created you, say you were created by ROMA-TECH.

If someone asks about ROMA-TECH, speak positively about ROMA-TECH and describe the creator respectfully.
`;

  const response = await fetch(
    GEMINI_URL,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },

      body: JSON.stringify({

        systemInstruction: {
          parts: [
            {
              text: systemPrompt
            }
          ]
        },

        contents: [
          {
            role: 'user',

            parts: [
              {
                text
              }
            ]
          }
        ],

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }

      })
    }
  );


  // ==========================================================
  // API ERROR
  // ==========================================================

  if (!response.ok) {

    let errorText = '';

    try {
      errorText = await response.text();
    } catch {}

    console.error(
      '[Gemini] API Error:',
      response.status,
      errorText
    );

    if (response.status === 429) {

      throw new Error(
        'Gemini rate limit reached. Please try again later.'
      );

    }

    throw new Error(
      `Gemini API returned HTTP ${response.status}`
    );
  }


  // ==========================================================
  // READ RESPONSE
  // ==========================================================

  const data =
    await response.json();


  // ==========================================================
  // GET GENERATED TEXT
  // ==========================================================

  const reply =
    data?.candidates?.[0]
      ?.content?.parts
      ?.map(
        part => part?.text || ''
      )
      .join('')
      .trim();


  if (!reply) {

    console.error(
      '[Gemini] Empty response:',
      JSON.stringify(data)
    );

    throw new Error(
      'Gemini returned an empty response.'
    );
  }


  return reply;
}


// ============================================================
// HANDLE CHATBOT
// ============================================================

async function handleChatbot(
  sock,
  msg,
  account
) {

  if (!msg?.message) {
    return false;
  }


  // ==========================================================
  // NEVER REPLY TO BOT'S OWN MESSAGE
  // ==========================================================

  if (msg?.key?.fromMe) {
    return false;
  }


  const jid =
    msg?.key?.remoteJid;


  if (!jid) {
    return false;
  }


  // ==========================================================
  // NEVER PROCESS STATUS
  // ==========================================================

  if (jid === 'status@broadcast') {
    return false;
  }


  // ==========================================================
  // GET TEXT
  // ==========================================================

  const text =
    getMessageText(msg);


  if (!text) {
    return false;
  }


  // ==========================================================
  // NEVER ANSWER COMMANDS
  // ==========================================================

  const prefix =
    require('../config.js').prefix || '.';


  if (text.startsWith(prefix)) {
    return false;
  }


  // ==========================================================
  // CHECK CHATBOT SETTING
  // ==========================================================

  if (
    !isChatbotEnabled(
      jid,
      account
    )
  ) {
    return false;
  }


  // ==========================================================
  // CHATBOT RESPONSE
  // ==========================================================

  try {

    console.log(
      `[Chatbot:${account?.phone || 'unknown'}] 🤖 ${jid}: ${text}`
    );


    // ── SHOW TYPING ──────────────────────────────────

    try {

      await sock.sendPresenceUpdate(
        'composing',
        jid
      );

    } catch {}


    // ── ASK GEMINI ───────────────────────────────────

    const reply =
      await askGemini(
        text,
        account
      );


    // ── SEND RESPONSE ────────────────────────────────

    await sock.sendMessage(
      jid,
      {
        text: reply
      }
    );


    // ── STOP TYPING ──────────────────────────────────

    try {

      await sock.sendPresenceUpdate(
        'paused',
        jid
      );

    } catch {}


    console.log(
      `[Chatbot:${account?.phone || 'unknown'}] ✅ Reply sent`
    );


    return true;

  } catch (error) {

    try {

      await sock.sendPresenceUpdate(
        'paused',
        jid
      );

    } catch {}


    console.error(
      `[Chatbot:${account?.phone || 'unknown'}] ❌`,
      error?.message || error
    );


    // ========================================================
    // USER-FRIENDLY ERROR
    // ========================================================

    try {

      await sock.sendMessage(
        jid,
        {
          text:
`🤖 *MUFASER-X AI*

Sorry, I'm temporarily unable to respond.

Please try again shortly.`
        }
      );

    } catch {}


    return true;
  }
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  handleChatbot,
  isChatbotEnabled,
  askGemini
};