// ============================================================
// MUFASER-X — AUTO READ - FIXED
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
  ],

  desc: 'Automatically mark incoming messages as read',

  category: 'Owner',

  usage: '.autoread on / off',

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

    account.autoread = mode === 'on';

    try {
      if (fs.existsSync(ACCOUNTS_PATH)) {
        const data = JSON.parse(
          fs.readFileSync(ACCOUNTS_PATH, 'utf8')
        );
        const phone = account.phone || account.number;

        if (Array.isArray(data)) {
          const found = data.find(
            a => (a.phone || a.number) === phone
          );
          if (found) found.autoread = account.autoread;
        } else if (data[phone]) {
          data[phone].autoread = account.autoread;
        }

        fs.writeFileSync(
          ACCOUNTS_PATH,
          JSON.stringify(data, null, 2)
        );
      }
    } catch (e) {
      console.log(`[AutoRead] Save error: ${e.message}`);
    }

    return sock.sendMessage(jid, {
      text: mode === 'on'
       ? '✅ *AUTO READ ENABLED*\n\n👁️ Incoming messages will automatically be marked as read.'
        : '❌ *AUTO READ DISABLED*\n\n👁️ Messages will no longer be marked as read.'
    }, { quoted: msg });
  }
};