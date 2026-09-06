// ============================================================
// MUFASER-X — AUTO VIEW STATUS SYSTEM
//.autoviewstatus on / off
//.autoview on / off
// OWNER ONLY
// ============================================================

const fs = require('fs');
const path = require('path');
const ACCOUNTS_PATH = path.join(__dirname, '../accounts.json');

function saveAccount(account) {
  try {
    if (!fs.existsSync(ACCOUNTS_PATH)) {
      console.log('[AutoView] accounts.json not found at', ACCOUNTS_PATH);
      return;
    }
    let data = JSON.parse(fs.readFileSync(ACCOUNTS_PATH, 'utf8'));
    const phone = account.phone || account.number;

    if (Array.isArray(data)) {
      const i = data.findIndex(a => (a.phone || a.number) === phone);
      if (i!== -1) {
        data[i].autoviewstatus = account.autoviewstatus;
        console.log(`[AutoView] Saved ARRAY ${phone} = ${account.autoviewstatus}`);
      }
    } else {
      // OBJECT format { "255xxx": {...} }
      let saved = false;
      if (data[phone]) {
        data[phone].autoviewstatus = account.autoviewstatus;
        saved = true;
      }
      for (const k in data) {
        if (k === phone || (data[k].phone || data[k].number) === phone) {
          data[k].autoviewstatus = account.autoviewstatus;
          saved = true;
        }
      }
      if (saved) console.log(`[AutoView] Saved OBJECT ${phone} = ${account.autoviewstatus}`);
    }

    fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('[AutoView] Save fail:', e.message);
  }
}

module.exports = {
  name: 'autoviewstatus',
  aliases: ['autoview', 'viewstatus', 'avs'],
  desc: 'Auto view WhatsApp status',
  category: 'Owner',
  usage: '.autoviewstatus on / off',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!msg?.key?.fromMe) {
        return sock.sendMessage(jid, {
          text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
        }, { quoted: msg });
      }

      const mode = String(args?.[0] || '').toLowerCase().trim();

      if (!['on', 'off'].includes(mode)) {
        return sock.sendMessage(jid, {
          text: `👁️ *AUTO VIEW STATUS SETTINGS*\n\nCurrent: *${account.autoviewstatus? 'ON ✅' : 'OFF ❌'}*\n\n*.autoviewstatus on* - Auto view all status\n*.autoviewstatus off* - Stop viewing status\n\n_Aliases:.autoview,.viewstatus,.avs_`
        }, { quoted: msg });
      }

      account.autoviewstatus = mode === 'on';
      saveAccount(account);

      console.log(`[AutoView] ${account.phone} set to ${account.autoviewstatus}`);

      const txt = mode === 'on'
       ? `✅ *AUTO VIEW STATUS ENABLED*\n\n👁️ I will automatically view all WhatsApp statuses now.`
        : `❌ *AUTO VIEW STATUS DISABLED*\n\n👁️ I will not view statuses anymore.`;

      return sock.sendMessage(jid, { text: txt }, { quoted: msg });

    } catch (e) {
      console.error('[AUTOVIEWSTATUS]', e);
      return sock.sendMessage(jid, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
    }
  }
};