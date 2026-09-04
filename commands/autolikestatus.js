// ============================================================
// MUFASER-X — AUTO LIKE STATUS
// ============================================================

const fs = require('fs');
const path = require('path');

const ACCOUNTS_PATH =
  path.join(__dirname, '../accounts.json');

module.exports = {
  name: 'autolikestatus',

  aliases: [
    'autolike',
    'likestatus'
  ],

  desc: 'Auto like WhatsApp status',

  category: 'Owner',

  usage: '.autolikestatus on / off',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    if (!msg?.key?.fromMe) {
      return sock.sendMessage(jid, {
        text: '😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌'
      }, { quoted: msg });
    }

    const mode =
      String(args?.[0] || '')
        .toLowerCase()
        .trim();

    if (!['on', 'off'].includes(mode)) {
      return sock.sendMessage(jid, {
        text:
          `❤️ *AUTO LIKE STATUS*\n\n` +
          `Current: *${
            account.autolikestatus
              ? 'ON ✅'
              : 'OFF ❌'
          }*\n\n` +
          `*.autolikestatus on*\n` +
          `*.autolikestatus off*`
      }, { quoted: msg });
    }

    account.autolikestatus =
      mode === 'on';

    try {

      if (fs.existsSync(ACCOUNTS_PATH)) {

        const data = JSON.parse(
          fs.readFileSync(
            ACCOUNTS_PATH,
            'utf8'
          )
        );

        const phone =
          account.phone || account.number;

        if (Array.isArray(data)) {

          const found = data.find(
            a => (a.phone || a.number) === phone
          );

          if (found) {
            found.autolikestatus =
              account.autolikestatus;
          }

        } else if (data[phone]) {

          data[phone].autolikestatus =
            account.autolikestatus;
        }

        fs.writeFileSync(
          ACCOUNTS_PATH,
          JSON.stringify(data, null, 2)
        );
      }

    } catch (e) {

      console.log(
        `[AutoLike] Save error: ${e.message}`
      );
    }

    return sock.sendMessage(jid, {
      text: mode === 'on'
        ? '✅ *AUTO LIKE STATUS ENABLED*\n\n❤️ I will automatically like statuses now.'
        : '❌ *AUTO LIKE STATUS DISABLED*\n\n❤️ I will stop liking statuses.'
    }, { quoted: msg });
  }
};