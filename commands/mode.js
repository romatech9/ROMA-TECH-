// ============================================================
// MUFASER-X — MODE COMMAND
// .mode private
// .mode public
// .mode dm
// .mode group
// ============================================================
const config = require('../config.js');

function normalizeNumber(value) {
  if (!value) return '';

  let number = String(value);
  number = number.split('@')[0];
  number = number.split(':')[0];

  return number.replace(/\D/g, '');
}
module.exports = {
  name: 'mode',

  async execute(sock, msg, jid, args, sender, account) {

    // ── OWNER ONLY ─────────────────────────────────────────
    const senderNumber = normalizeNumber(
  sender?.number ||
  msg.key?.participant ||
  msg.key?.remoteJid
);

const ownerNumber = normalizeNumber(
  config.ownerNumber
);

const isOwner = msg.key?.fromMe === true;

if (
  !isOwner &&
  (!ownerNumber || senderNumber !== ownerNumber)
) {
  return sock.sendMessage(jid, {
    text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
  });
}

    // ── GET MODE ───────────────────────────────────────────
    const requestedMode =
      String(args?.[0] || '').toLowerCase();

    // ── SHOW CURRENT MODE ─────────────────────────────────
    if (!requestedMode) {
      return sock.sendMessage(jid, {
        text:
`╭━━━〔 MUFASER-X MODE 〕━━━╮

⚙️ Current Mode: *${account.mode || 'public'}*

Available modes:

🔒 private
Everyone except owner is blocked.

🌍 public
Everyone can use commands.

💬 dm
Commands work only in private chats.

👥 group
Commands work only in groups.
`
      });
    }

    // ── VALID MODES ───────────────────────────────────────
    const validModes = [
      'private',
      'public',
      'dm',
      'group'
    ];

    if (!validModes.includes(requestedMode)) {
      return sock.sendMessage(jid, {
        text:
`❌ Invalid mode.

Use one of:

🔒 private
🌍 public
💬 dm
👥 group

Example:
.mode public`
      });
    }

    // ── SAVE MODE ─────────────────────────────────────────
    account.mode = requestedMode;

    // ── CONFIRM ────────────────────────────────────────────
    const modeDescriptions = {
      private: '🔒 Only the owner can use bot commands.',
      public: '🌍 Everyone can use bot commands.',
      dm: '💬 Bot commands work only in private chats.',
      group: '👥 Bot commands work only in groups.'
    };

    await sock.sendMessage(jid, {
      text:
`

✅ *Mode changed successfully!*

⚙️ Mode: *${requestedMode}*

${modeDescriptions[requestedMode]}
`
    });

    console.log(
      `[Mode:${account.phone}] ⚙️ Mode changed to: ${requestedMode}`
    );
  }
};