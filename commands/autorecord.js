// ============================================================
// MUFASER-X — AUTO RECORD COMMAND
//
// .autorecord
// .autorecord on
// .autorecord off
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

  name: 'autorecord',

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
              `╭━━━〔 MUFASER-X AUTO RECORD 〕━━━╮\n\n` +
              `🎙️ Auto Recording:\n` +
              `*${account.autorecord ? 'ON ✅' : 'OFF ❌'}*\n\n` +
              `Use:\n` +
              `.autorecord on\n` +
              `.autorecord off`
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

        account.autorecord = true;

        // Make the two modes mutually exclusive.
        // Recording gets priority when explicitly enabled.
        account.autotyping = false;

        return sock.sendMessage(
          jid,
          {
            text:
              '✅ *Auto Recording Enabled*\n\n' +
              '🎙️ MUFASER-X will now show *recording...* while processing commands.'
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

        account.autorecord = false;

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Auto Recording Disabled*\n\n' +
              '🎙️ MUFASER-X will no longer show *recording...*.'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // INVALID
      // ======================================================

      return sock.sendMessage(
        jid,
        {
          text:
            '❌ *Invalid option.*\n\n' +
            'Use:\n' +
            '.autorecord on\n' +
            '.autorecord off'
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[AutoRecord] ❌ Error:',
        error
      );

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Auto Record error:*\n${error.message}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};