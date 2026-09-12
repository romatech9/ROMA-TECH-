// ============================================================
// MUFASER-X — LEAVE GROUP COMMAND
//
// Usage:
// .leave
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
  name: 'leave',

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
    text: '❌ Only the bot owner can use this command.'
  });
}

    // ── CHECK GROUP ────────────────────────────────────────
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
      });
    }

    try {

      // Get group name before leaving
      let groupName = 'this group';

      try {
        const metadata =
          await sock.groupMetadata(jid);

        groupName =
          metadata?.subject || 'this group';
      } catch (_) {}

      // Leave the group
      await sock.groupLeave(jid);

      console.log(
        `[Bot:${account?.phone || 'unknown'}] 🚪 Left group: ${groupName}`
      );

    } catch (error) {

      console.error(
        `[Leave] ❌ Failed to leave group:`,
        error.message
      );

      return sock.sendMessage(jid, {
        text:
`❌ Failed to leave the group.

Reason:
${error.message}`
      });
    }
  }
};