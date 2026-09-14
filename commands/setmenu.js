// ============================================================
// MUFASER-X — SETMENU COMMAND 
// ============================================================
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'setmenu',
  aliases: ['setmunu', 'menustyle'],
  desc: 'Owner only: Set menu style',
  category: 'Owner',
  usage: '.setmenu 1-6',

  async execute(sock, msg, jid, args, sender, account) {

    // SAME OWNER CHECK AS VV2
    if (!msg?.key?.fromMe) {
      return await sock.sendMessage(jid, { text: '😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌' }, { quoted: msg });
    }

    const dbPath = path.join(__dirname, '../database/menuStyle.json');
    if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const s = args[0];

    if (!s ||!['1','2','3','4','5','6'].includes(s)) {
      return await sock.sendMessage(jid, {
        text: `*SET MENU STYLE*\n\n` +
              `.setmenu 1 = 𝑯𝑬𝑳𝑳𝑶\n` +
              `.setmenu 2 = 𝘏𝘌𝘓𝘓𝘖\n` +
              `.setmenu 3 = 𝙃𝙀𝙇𝙇𝙊\n` +
              `.setmenu 4 = 𝐇𝐄𝐋𝐋𝐎\n` +
              `.setmenu 5 = H̷E̷L̷L̷O̷\n` +
              `.setmenu 6 = > HELLO\n\n` +
              `Example:.setmenu 6`
      }, { quoted: msg });
    }

    fs.writeFileSync(dbPath, JSON.stringify({ style: Number(s) }));
    await sock.sendMessage(jid, { text: `✅ *Menu style ${s} set successfully!*\n\nType *.menu* to see` }, { quoted: msg });
  }
};