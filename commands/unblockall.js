// ============================================================
// MUFASER-X — UNBLOCK ALL COMMAND
// OWNER ONLY
//
// Usage:
// .unblockall
//
// Unblocks ALL WhatsApp accounts currently blocked by the bot.
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
// GET BOT NUMBER
// ============================================================

function getBotNumber(sock) {

  return normalizeNumber(
    sock?.user?.id
  );
}


// ============================================================
// GET OWNER NUMBER
// ============================================================

function getOwnerNumber(account) {

  return normalizeNumber(
    account?.ownerNumber ||
    account?.phone ||
    account?.number ||
    config?.ownerNumber ||
    process.env.OWNER_NUMBER
  );
}


// ============================================================
// UNBLOCK ALL COMMAND
// ============================================================

module.exports = {

  name: 'unblockall',

  aliases: [
    'unblockall',
    'unblock-all'
  ],

  desc: 'Unblock all blocked WhatsApp users',

  category: 'Owner',

  usage: '.unblockall',

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
              `.unblockall`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // GET BLOCKED USERS
      // ======================================================

      console.log(
        '[UnblockAll] 🔍 Getting blocked users...'
      );


      let blockedUsers = [];


      try {

        blockedUsers =
          await sock.fetchBlocklist();

      } catch (error) {

        console.error(
          '[UnblockAll] ❌ Failed to fetch blocklist:',
          error
        );

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *Could not get the blocked users list.*\n\n` +
              `⚠️ *Reason:*\n` +
              `${error?.message || 'Unknown error'}`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // VALIDATE BLOCKLIST
      // ======================================================

      if (
        !Array.isArray(blockedUsers)
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `❌ *Invalid blocked users list returned by WhatsApp.*`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // NOTHING BLOCKED
      // ======================================================

      if (
        blockedUsers.length === 0
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              `✅ *NO BLOCKED USERS FOUND!*\n\n` +
              `There are currently no blocked WhatsApp accounts.`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // SHOW START MESSAGE
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            `⏳ *UNBLOCKING ALL USERS...*\n\n` +
            `👥 *Blocked accounts:* ${blockedUsers.length}\n\n` +
            `Please wait...`
        },
        {
          quoted: msg
        }
      );


      // ======================================================
      // BOT / OWNER NUMBERS
      // ======================================================

      const ownerNumber =
        getOwnerNumber(account);

      const botNumber =
        getBotNumber(sock);


      // ======================================================
      // RESULTS
      // ======================================================

      let success = 0;
      let failed = 0;
      let skipped = 0;

      const failedUsers = [];


      // ======================================================
      // UNBLOCK EACH USER
      // ======================================================

      for (
        const blocked of blockedUsers
      ) {

        try {

          let targetJid =
            typeof blocked === 'string'
              ? blocked
              : blocked?.jid ||
                blocked?.id ||
                blocked?.participant ||
                '';


          if (!targetJid) {

            skipped++;

            continue;
          }


          // --------------------------------------------------
          // Make sure it is a proper JID
          // --------------------------------------------------

          if (
            !targetJid.includes('@')
          ) {

            targetJid +=
              '@s.whatsapp.net';
          }


          const targetNumber =
            normalizeNumber(targetJid);


          // --------------------------------------------------
          // Never touch the bot itself
          // --------------------------------------------------

          if (
            botNumber &&
            targetNumber === botNumber
          ) {

            console.log(
              `[UnblockAll] 🤖 Skipping bot: ${targetJid}`
            );

            skipped++;

            continue;
          }


          // --------------------------------------------------
          // Never touch owner number
          // --------------------------------------------------

          if (
            ownerNumber &&
            targetNumber === ownerNumber
          ) {

            console.log(
              `[UnblockAll] 👑 Skipping owner: ${targetJid}`
            );

            skipped++;

            continue;
          }


          // --------------------------------------------------
          // UNBLOCK
          // --------------------------------------------------

          console.log(
            `[UnblockAll] 🔓 Unblocking: ${targetJid}`
          );


          await sock.updateBlockStatus(
            targetJid,
            'unblock'
          );


          success++;


          console.log(
            `[UnblockAll] ✅ Unblocked: ${targetJid}`
          );


          // --------------------------------------------------
          // Small delay to avoid sending requests too fast
          // --------------------------------------------------

          await new Promise(
            resolve =>
              setTimeout(resolve, 300)
          );


        } catch (error) {

          failed++;


          const failedJid =
            typeof blocked === 'string'
              ? blocked
              : blocked?.jid ||
                blocked?.id ||
                'Unknown';


          failedUsers.push(
            failedJid
          );


          console.error(
            `[UnblockAll] ❌ Failed: ${failedJid}`,
            error?.message || error
          );
        }
      }


      // ======================================================
      // FINAL RESULT
      // ======================================================

      let resultText =
        `✅ *UNBLOCK ALL COMPLETED!*\n\n` +
        `👥 *Found:* ${blockedUsers.length}\n` +
        `🔓 *Unblocked:* ${success}\n` +
        `❌ *Failed:* ${failed}\n` +
        `⏭️ *Skipped:* ${skipped}`;


      // ======================================================
      // FAILED USERS
      // ======================================================

      if (
        failedUsers.length > 0
      ) {

        resultText +=
          `\n\n⚠️ *Failed accounts:*\n` +
          failedUsers
            .slice(0, 20)
            .map(
              user =>
                `• ${user}`
            )
            .join('\n');


        if (
          failedUsers.length > 20
        ) {

          resultText +=
            `\n• ...and ${
              failedUsers.length - 20
            } more`;
        }
      }


      // ======================================================
      // SEND RESULT
      // ======================================================

      return sock.sendMessage(
        jid,
        {
          text: resultText
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
        '[UnblockAll] ❌ Fatal error:',
        error
      );


      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to unblock all users.*\n\n` +
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