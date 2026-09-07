// ============================================================
// MUFASER-X — UPTIME COMMAND
// Command: .up
// ============================================================

const os = require('os');

// Bot start time
const START_TIME = Date.now();

// ── FORMAT UPTIME ─────────────────────────────────────────
function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
}

// ── COMMAND ───────────────────────────────────────────────
module.exports = {
  name: 'up',

  async execute(sock, msg, jid, args, sender, account) {

    const start = Date.now();

    // Current uptime
    const uptime = formatUptime(
      Date.now() - START_TIME
    );

    // Memory usage
    const memory = process.memoryUsage();

    const ram =
      (memory.rss / 1024 / 1024).toFixed(1);

    // System information
    const platform = os.platform();

    // Send response
    await sock.sendMessage(jid, {
      text:
`╭─〔 📡 SYSTEM STATUS 〕─╮
│
│ 🟢 Status   : *ONLINE*
│ ⚡ Speed    : *${Date.now() - start} ms*
│ ⏱️ Uptime   : *${uptime}*
│ 📅 Days     : *${Math.floor((Date.now() - START_TIME) / 86400000)} day(s)*
│ 💾 RAM      : *${ram} MB*
│ 🖥️ Platform : *${platform}*
╰────────────────────╯
`
    });
  }
};