// ============================================================
// MUFASER-X — LEAVE ALL GROUPS COMMAND
//
// Usage:
// .leaveall
//
// WARNING:
// This makes the bot leave EVERY group it belongs to.
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
  name: 'leaveall',

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

    // ── CONFIRMATION ───────────────────────────────────────
    if (String(args?.[0] || '').toLowerCase() !== 'confirm') {
      return sock.sendMessage(jid, {
        text:
`⚠️ *LEAVE ALL GROUPS*

This will make The bot To  leave *EVERY GROUP* it belongs to.

This action cannot be undone automatically.

To continue, send:

.leaveall confirm`
      });
    }

    try {

      console.log(
        `[Bot:${account?.phone || 'unknown'}] 🔍 Getting group list...`
      );

      const groups =
        await sock.groupFetchAllParticipating();

      const groupList =
        Object.values(groups || {});

      if (!groupList.length) {
        return sock.sendMessage(jid, {
          text:
`ℹ️ The bot is not currently in any groups.`
        });
      }

      // Send status before starting
      await sock.sendMessage(jid, {
        text:
`🚪 *LEAVE ALL STARTED*

📊 Groups found: *${groupList.length}*

The bot is leaving the groups...`
      });

      let left = 0;
      let failed = 0;

      for (const group of groupList) {

        const groupJid = group?.id;

        if (!groupJid || !groupJid.endsWith('@g.us')) {
          continue;
        }

        try {

          await sock.groupLeave(groupJid);

          left++;

          console.log(
            `[Bot:${account?.phone || 'unknown'}] 🚪 Left group: ${groupJid}`
          );

          // Small delay to avoid firing requests too quickly
          await new Promise(resolve =>
            setTimeout(resolve, 1000)
          );

        } catch (error) {

          failed++;

          console.error(
            `[Bot:${account?.phone || 'unknown'}] ❌ Failed to leave ${groupJid}:`,
            error.message
          );
        }
      }

      // ── RESULT ───────────────────────────────────────────
      try {

        await sock.sendMessage(jid, {
          text:
`╭━━━〔 🚪 LEAVE ALL 〕━━━╮

✅ *Finished*

📊 Groups found: *${groupList.length}*
🚪 Successfully left: *${left}*
❌ Failed: *${failed}*
`
        });

      } catch (_) {
        console.log(
          `[Bot:${account?.phone || 'unknown'}] ✅ Leave-all completed.`
        );
      }

    } catch (error) {

      console.error(
        `[LeaveAll] ❌ Failed:`,
        error.message
      );

      await sock.sendMessage(jid, {
        text:
`❌ Failed to get the bot's group list.

Reason:
${error.message}`
      });
    }
  }
};