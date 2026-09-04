// ============================================================
// MUFASER-X — ANTICALL SYSTEM
//.anticall on / off / block
// OWNER ONLY - fromMe check
// ============================================================

const fs = require('fs');
const path = require('path');
const ACCOUNTS_PATH = path.join(__dirname, '../accounts.json');

function saveAccount(account) {
  try {
    if (!fs.existsSync(ACCOUNTS_PATH)) return;
    let data = JSON.parse(fs.readFileSync(ACCOUNTS_PATH, 'utf8'));
    if (Array.isArray(data)) {
      const i = data.findIndex(a => (a.phone||a.number) === (account.phone||account.number));
      if (i!== -1) { data[i].anticall = account.anticall; fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(data,null,2)); }
    }
  } catch(e){ console.log('Save anticall fail', e.message) }
}

module.exports = {
  name: 'anticall',
  desc: 'Block calls',
  category: 'Owner',
  usage: '.anticall on / off / block',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!msg?.key?.fromMe) {
        return sock.sendMessage(jid, { text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌` }, { quoted: msg });
      }

      const mode = String(args?.[0]||'').toLowerCase().trim();

      if (!['on','off','block','reject'].includes(mode)) {
        return sock.sendMessage(jid, {
          text: `📵 *ANTICALL SETTINGS*\n\nCurrent: *${account.anticall||'off'}*\n\n.antidelete on - reject calls\n.antidelete block - reject + block caller\n.antidelete off - allow calls`
        }, { quoted: msg });
      }

      account.anticall = mode==='on'? 'on' : mode;
      saveAccount(account);

      let txt = mode==='off'? `✅ *ANTICALL DISABLED*\nCalls allowed` : mode==='block'? `📵 *ANTICALL BLOCK MODE*\nCalls will be rejected and caller blocked` : `📵 *ANTICALL ENABLED*\nCalls will be rejected`;

      return sock.sendMessage(jid, { text: txt }, { quoted: msg });

    } catch(e){
      console.error('[ANTICALL]', e);
      return sock.sendMessage(jid, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
    }
  }
};