// ============================================================
// MUFASER-X — GREETINGS COMMAND
// gudmorning, gudafternoon, gudevening, gudnight, godbless
// ============================================================

module.exports = {
  name: 'gudmorning',
  aliases: ['gudafternoon', 'gudevening', 'gudnight', 'godbless', 'goodmorning', 'goodafternoon', 'goodevening', 'goodnight'],
  desc: 'Greetings',
  category: 'Fun',
  usage: '.gudmorning /.gudafternoon /.gudevening /.gudnight /.godbless',

  async execute(sock, msg, jid, args, sender) {
    const cmd = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').toLowerCase().split(' ')[0].replace(/^[.\/!#]/, '').trim();
    const pushName = msg.pushName || sender?.split('@')[0] || 'Comrade';

    const replies = {
      gudmorning: {
        text: `🌅 *Good Morning ${pushName}!* \n\n☀️ Rise and shine comrade!\nMay your day be full of wins and blessings.`,
        react: '🌅'
      },
      goodmorning: {
        text: `🌅 *Good Morning ${pushName}!* \n\n☀️ Rise and shine comrade!\nMay your day be full of wins and blessings.`,
        react: '🌅'
      },
      gudafternoon: {
        text: `🌤️ *Good Afternoon ${pushName}!* \n\nHope your day is going smooth. Keep pushing! 💪`,
        react: '🌤️'
      },
      goodafternoon: {
        text: `🌤️ *Good Afternoon ${pushName}!* \n\nHope your day is going smooth. Keep pushing! 💪`,
        react: '🌤️'
      },
      gudevening: {
        text: `🌆 *Good Evening ${pushName}!* \n\nEvening vibes, relax and enjoy. You did well today! ✨`,
        react: '🌆'
      },
      goodevening: {
        text: `🌆 *Good Evening ${pushName}!* \n\nEvening vibes, relax and enjoy. You did well today! ✨`,
        react: '🌆'
      },
      gudnight: {
        text: `🌙 *Good Night ${pushName}!* \n\nSleep tight, sweet dreams. Tomorrow we go harder! 😴💤`,
        react: '🌙'
      },
      goodnight: {
        text: `🌙 *Good Night ${pushName}!* \n\nSleep tight, sweet dreams. Tomorrow we go harder! 😴💤`,
        react: '🌙'
      },
      godbless: {
        text: `🙏 *God Bless You ${pushName}!* \n\nMay God protect you, guide you and open doors for you today. Amen! ❤️`,
        react: '🙏'
      }
    };

    const data = replies[cmd] || replies['gudmorning'];

    try { await sock.sendMessage(jid, { react: { text: data.react, key: msg.key } }); } catch {}

    await sock.sendMessage(jid, { text: data.text }, { quoted: msg });
  }
};