// ============================================================
// MUFASER-X — AUTO TYPING COMMAND
//
// .autotyping
// .autotyping on
// .autotyping off
//
// OWNER ONLY
// ============================================================

const config = require('../config.js');

function normalizeNumber(value) {
  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

module.exports = {

  name: 'autotyping',

  async execute(sock, msg, jid, args, sender, account) {

    try {

      // ======================================================
      // OWNER CHECK
      // ======================================================

      const senderNumber =
        normalizeNumber(
          sender?.number ||
          msg.key?.participant ||
          msg.key?.remoteJid
        );

      const ownerNumber =
        normalizeNumber(
          config.ownerNumber ||
          account?.ownerNumber
        );

      const isOwner =
        msg.key?.fromMe === true ||
        (
          ownerNumber &&
          senderNumber === ownerNumber
        );

      if (!isOwner) {

        return sock.sendMessage(
          jid,
          {
            text:
              '🙅 *Sorry Comrade, this command is for my owner only!* 😌'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // OPTION
      // ======================================================

      const option =
        String(args?.[0] || '')
          .toLowerCase()
          .trim();


      // ======================================================
      // SHOW STATUS
      // ======================================================

      if (!option) {

        return sock.sendMessage(
          jid,
          {
            text:
              `╭━━━〔 MUFASER-X AUTO TYPING 〕━━━╮\n\n` +
              `⌨️ Auto Typing:\n` +
              `*${account.autotyping ? 'ON ✅' : 'OFF ❌'}*\n\n` +
              `Use:\n` +
              `.autotyping on\n` +
              `.autotyping off`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // ON
      // ======================================================

      if (option === 'on') {

        account.autotyping = true;

        // Don't allow typing and recording together.
        account.autorecord = false;

        return sock.sendMessage(
          jid,
          {
            text:
              '✅ *Auto Typing Enabled*\n\n' +
              '⌨️ MUFASER-X will now show *typing...* while processing commands.'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // OFF
      // ======================================================

      if (option === 'off') {

        account.autotyping = false;

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Auto Typing Disabled*\n\n' +
              '⌨️ MUFASER-X will no longer show *typing...*.'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // INVALID OPTION
      // ======================================================

      return sock.sendMessage(
        jid,
        {
          text:
            '❌ *Invalid option.*\n\n' +
            'Use:\n' +
            '.autotyping on\n' +
            '.autotyping off'
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[AutoTyping] ❌ Error:',
        error
      );

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Auto Typing error:*\n${error.message}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};