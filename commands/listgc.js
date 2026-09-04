// ============================================================
// MUFASER-X — LIST ALL GROUPS COMMAND
//
// Usage:
// .listgc
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
  name: 'listgc',

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

    try {

      console.log(
        `[Bot:${account?.phone || 'unknown'}] 📋 Fetching groups...`
      );

      const groups =
        await sock.groupFetchAllParticipating();

      const groupList =
        Object.values(groups || {})
          .filter(group =>
            group?.id &&
            group.id.endsWith('@g.us')
          )
          .sort((a, b) =>
            String(a.subject || '').localeCompare(
              String(b.subject || '')
            )
          );

      // ── NO GROUPS ────────────────────────────────────────
      if (!groupList.length) {
        return sock.sendMessage(jid, {
          text:
`*ℹ️ The bot is not currently in any WhatsApp groups.*
`
        });
      }

      // ── BUILD LIST ───────────────────────────────────────
      let text =
`╭━━━〔 📋 MUFASER-X GROUPS 〕━━━╮

👥 *Total Groups:* ${groupList.length}

`;

      groupList.forEach((group, index) => {

        const name =
          group.subject || 'Unnamed Group';

        text +=
`*${index + 1}.* ${name}
🆔 ${group.id}

`;
      });

      text +=
`▬▬ι══════════════════ι▬▬
           MUFASER-X BOT GROUPS 
▬▬ι══════════════════ι▬▬`;

      // ── SEND LIST ────────────────────────────────────────
      await sock.sendMessage(jid, {
        text
      });

      console.log(
        `[Bot:${account?.phone || 'unknown'}] ✅ Listed ${groupList.length} group(s).`
      );

    } catch (error) {

      console.error(
        `[ListGC] ❌ Failed to get groups:`,
        error.message
      );

      await sock.sendMessage(jid, {
        text:
`❌ Failed to retrieve the group list.

Reason:
${error.message}`
      });
    }
  }
};