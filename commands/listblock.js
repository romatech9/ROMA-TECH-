// ============================================================
// MUFASER-X — LIST BLOCKED USERS
// OWNER ONLY
//
// Usage:
// .listblock
//
// Lists all WhatsApp accounts currently blocked by the bot.
// ============================================================

const config = require('../config.js');


// ============================================================
// NORMALIZE NUMBER
// ============================================================

function normalizeNumber(value) {

  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}


// ============================================================
// LIST BLOCKED COMMAND
// ============================================================

module.exports = {

  name: 'listblock',

  aliases: [
    'listblocked',
    'blockedlist',
    'blocklist'
  ],

  desc: 'List all blocked WhatsApp users',

  category: 'Owner',

  usage: '.listblock',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    try {

      // ======================================================
      // OWNER ONLY
      // ======================================================

      if (!msg?.key?.fromMe) {

        return sock.sendMessage(
          jid,
          {
            text:
              `😅 *OWNER ONLY!*\n\n` +
              `Sorry Comrade, this command is reserved for my owner. 😌`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // DO NOT USE IN GROUPS
      // ======================================================

      if (
        String(jid).endsWith('@g.us')
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *This command works in a DM only.*\n\n` +
              `Use:\n` +
              `.listblock`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // FETCH BLOCKED USERS
      // ======================================================

      console.log(
        '[ListBlock] 🔍 Fetching blocked users...'
      );


      let blockedUsers = [];


      try {

        blockedUsers =
          await sock.fetchBlocklist();

      } catch (error) {

        console.error(
          '[ListBlock] ❌ Failed to fetch blocklist:',
          error
        );

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *Could not fetch the blocked users list.*\n\n` +
              `⚠️ *Reason:*\n` +
              `${error?.message || 'Unknown error'}`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // VALIDATE RESULT
      // ======================================================

      if (
        !Array.isArray(blockedUsers)
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *WhatsApp returned an invalid blocked users list.*`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // NO BLOCKED USERS
      // ======================================================

      if (
        blockedUsers.length === 0
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `📋 *BLOCKED USERS*\n\n` +
              `✅ No blocked accounts found.`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // BUILD LIST
      // ======================================================

      const list =
        blockedUsers
          .map((blocked, index) => {

            const blockedJid =
              typeof blocked === 'string'
                ? blocked
                : blocked?.jid ||
                  blocked?.id ||
                  blocked?.participant ||
                  'Unknown';


            const number =
              normalizeNumber(
                blockedJid
              );


            return (
              `┃ ${index + 1}. ` +
              `+${number || blockedJid}`
            );

          })
          .join('\n');


      // ======================================================
      // FINAL MESSAGE
      // ======================================================

      const text =
        `📋 *MUFASER-X BLOCKED USERS*\n\n` +
        `👥 *Total:* ${blockedUsers.length}\n\n` +
        `${list}\n\n` +
        `🔓 Use *.unblock <number>* to unblock one.\n` +
        `🔓 Use *.unblockall* to unblock everyone.`;


      // ======================================================
      // SEND LIST
      // ======================================================

      console.log(
        `[ListBlock] ✅ Found ${blockedUsers.length} blocked users`
      );


      return sock.sendMessage(
        jid,
        {
          text
        },
        {
          quoted: msg
        }
      );


    } catch (error) {

      // ======================================================
      // GLOBAL ERROR
      // ======================================================

      console.error(
        '[ListBlock] ❌ Fatal error:',
        error
      );


      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to list blocked users.*\n\n` +
            `⚠️ *Reason:*\n` +
            `${error?.message || 'Unknown error'}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};