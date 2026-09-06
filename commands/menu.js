// ============================================================
// Command: .menu
// ============================================================
const os = require('os');
const config = require('../config');
const { getRamUsage, getCpuModel, formatUptime, getDate, getTime, getPlatform } = require('../utils');

// Count commands dynamically
const path = require('path');
const fs = require('fs');
function countCommands() {
  try {
    return fs.readdirSync(path.join(__dirname)).filter(f => f.endsWith('.js')).length;
  } catch {
    return 0;
  }
}

module.exports = {
  name: 'menu',
  description: 'Show the bot command menu',

  /**
   * @param {object} sock   - Baileys socket
   * @param {object} msg    - Full WAMessage object
   * @param {string} jid    - Chat JID
   * @param {string[]} args - Remaining arguments
   * @param {object} sender - { name, number }
   */
  async execute(sock, msg, jid, args, sender) {
    const uptime = formatUptime(process.uptime());
    const ram = getRamUsage();
    const cpu = getCpuModel();
    const platform = getPlatform();
    const date = getDate();
    const time = getTime();
    const cmdCount = countCommands();

    const menu = `
╔══════════════════════════════╗
║        *MUFASER-X BOT*       ║
╠══════════════════════════════╣
║  👤 Owner    : ${config.ownerNumber || 'N/A'}
║  🙎 User     : ${sender?.name || 'Unknown'}
║  ⚙️  Prefix   : ${config.prefix}
║  🔖 Version  : v${config.version}
║  🌐 Platform : ${platform}
║  🟢 Node.js  : ${process.version}
║  💾 RAM      : ${ram}
║  🖥️  CPU      : ${cpu.slice(0, 28)}
║  ⏱️  Runtime  : ${uptime}
║  🕐 Uptime   : ${uptime}
║  📅 Date     : ${date}
║  🕑 Time     : ${time}
║  🔒 Mode     : Public
║  📟 Commands : ${cmdCount}
║  👨‍💻 Dev      : ROMA-TECH
╠══════════════════════════════╣
║         📌 *COMMANDS*        ║
╠══════════════════════════════╣
║  ${config.prefix}menu   - Show this menu
║  ${config.prefix}ping   - Check bot status
╠══════════════════════════════╣
║   ⚡ *Powered By ROMA-TECH*  ║
╚══════════════════════════════╝
`.trim();

    await sock.sendMessage(jid, { text: menu }, { quoted: msg });
  },
};
