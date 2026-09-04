// ============================================================
// MUFASER-X — ALIVE COMMAND
//.alive
// ============================================================

const os = require('os');

const START_TIME = Date.now();

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
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

module.exports = {
  name: 'alive',
  alias: ['status', 'bot'],
  desc: 'Check if bot is alive',
  category: 'General',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      const start = Date.now();

      const uptime = formatUptime(Date.now() - START_TIME);
      const memory = process.memoryUsage();
      const ramUsed = (memory.rss / 1024 / 1024).toFixed(1);
      const platform = os.platform();

      // Get sender name
      const senderName = msg.pushName || sender.split('@')[0]

      await sock.sendMessage(jid, {
        image: {
          url: 'https://res.cloudinary.com/dqxlb29uz/image/upload/v1787564133/bwm_uploads/media-1787564133487.jpg' },
        caption:
`╭━━━〔 🤖 MUFASER-X 〕━━━╮

🌹 *Hi there!* ${senderName}

*🤗 How are you comrade*
*I'm Mufaser-X your*
*WhatsApp Multi-Device Bot*

*🇺🇬 Created with so much* ❤️
*from Uganda.*

*🥰 Don't worry...*
*I'm still ALIVE & RUNNING SMOOTHLY!*

🟢 Status : *ONLINE*  ⚡ Speed : *${Date.now() - start} ms*  ⏱️ Uptime : *${uptime}* 💾 RAM : *${ramUsed} MB*  🖥️ Platform : *${platform}*`
      }, { quoted: msg });

      // small delay so song doesn't merge with image
      await new Promise(resolve => setTimeout(resolve, 800));

      // ── SEND SONG AFTER ───────────────────────────────────
      await sock.sendMessage(jid, {
        audio: { url: 'https://res.cloudinary.com/dqxlb29uz/raw/upload/v1787991274/bwm_uploads/media-1787991274030.mp3' },
        mimetype: 'audio/mp4',
        ptt: false // set to true if you want it as voice note
      }, { quoted: msg });

    } catch (error) {
      console.error('[Alive] ❌ Error:', error);
      await sock.sendMessage(jid, {
        text: '❌ Failed to send alive message'
      }, { quoted: msg });
    }
  }
};