// ============================================================
// MUFASER-X — AUTO READ
// ============================================================

const fs = require('fs');
const path = require('path');

const ACCOUNTS_PATH =
  path.join(__dirname, '../accounts.json');

module.exports = {
  name: 'autoread',

  aliases: [
    'readmsg',
    'autoreadmsg'
    'online'
  ],

  desc: 'Automatically mark incoming messages as read',

  category: 'Owner',

  usage: '.autoread on / off / status',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    // ========================================================
    // OWNER ONLY
    // ========================================================

    if (!msg?.key?.fromMe) {
      return sock.sendMessage(jid, {
        text:
          '😅 *OWNER ONLY!*\n\n' +
          'Sorry Comrade, this command is reserved for my owner. 😌'
      }, { quoted: msg });
    }

    // ========================================================
    // MODE
    // ========================================================

    const mode =
      String(args?.[0] || '')
        .toLowerCase()
        .trim();

    // ========================================================
    // STATUS / HELP
    // ========================================================

    if (!['on', 'off'].includes(mode)) {
      return sock.sendMessage(jid, {
        text:
          `👁️ *AUTO READ*\n\n` +
          `Current: *${
            account.autoread
              ? 'ON ✅'
              : 'OFF ❌'
          }*\n\n` +
          `*.autoread on*\n` +
          `*.autoread off*`
      }, { quoted: msg });
    }

    // ========================================================
    // SETTING
    // ========================================================

    account.autoread =
      mode === 'on';

    // ========================================================
    // SAVE TO ACCOUNTS.JSON
    // ========================================================

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
            found.autoread =
              account.autoread;
          }

        } else if (data[phone]) {

          data[phone].autoread =
            account.autoread;
        }

        fs.writeFileSync(
          ACCOUNTS_PATH,
          JSON.stringify(data, null, 2)
        );
      }

    } catch (e) {

      console.log(
        `[AutoRead] Save error: ${e.message}`
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return sock.sendMessage(jid, {
      text: mode === 'on'
        ? '✅ *AUTO READ ENABLED*\n\n👁️ Incoming messages will automatically be marked as read.'
        : '❌ *AUTO READ DISABLED*\n\n👁️ Incoming messages will no longer be automatically marked as read.'
    }, { quoted: msg });

  }
};