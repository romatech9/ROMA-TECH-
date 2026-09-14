// ============================================================
// MUFASER-X — QURAN VERSE COMMAND (PREFIX ONLY)
// Usage: .quran 2:255  .quran 36:1  .quran 1:1
// ============================================================
const axios = require('axios');

module.exports = {
  name: 'quran',
  aliases: ['quranverse', 'ayah'],
  desc: 'Get Quran verse',
  category: 'Religion',
  usage: '.quran 2:255',

  async execute(sock, msg, jid, args) {
    try {
      let query = args.join('').trim(); // 2:255 or 2: 255
      if (!query) {
        return await sock.sendMessage(jid, { 
          text: `📖 *QURAN USAGE*\n\nExample:\n.quran 2:255\n.quran 36:1\n.quran 1:1\n.quran 2:286` 
        }, { quoted: msg });
      }

      query = query.replace(/\s*:\s*/g, ':').trim();
      
      if (!query.includes(':')) {
        return await sock.sendMessage(jid, { text: `❌ Use format Chapter:Verse\nExample: .quran 2:255` }, { quoted: msg });
      }

      await sock.sendMessage(jid, { react: { text: '📖', key: msg.key } }).catch(()=>{});

      // Fetch arabic + english
      const arabicUrl = `https://api.alquran.cloud/v1/ayah/${query}/ar.alafasy`;
      const englishUrl = `https://api.alquran.cloud/v1/ayah/${query}/en.asad`;

      const [arRes, enRes] = await Promise.all([
        axios.get(arabicUrl, { timeout: 10000 }),
        axios.get(englishUrl, { timeout: 10000 })
      ]);

      if (arRes.data.code !== 200 || enRes.data.code !== 200) {
        return await sock.sendMessage(jid, { text: `❌ Verse not found: ${query}` }, { quoted: msg });
      }

      const ar = arRes.data.data;
      const en = enRes.data.data;

      const reply = `📖 *AL-QURAN AL-KAREEM*\n\n` +
                    `*Surah ${ar.surah.englishName} (${ar.surah.name}) - ${ar.surah.number}:${ar.numberInSurah}*\n` +
                    `▬▬▬▬▬▬\n\n` +
                    `*ARABIC:*\n${ar.text}\n\n` +
                    `*ENGLISH:*\n${en.text}\n\n` +
                    `*Juz:* ${ar.juz} | *Page:* ${ar.page}\n\n` +
                    `> *POWERED BY @MUFASER-X BOT*`;

      await sock.sendMessage(jid, { text: reply }, { quoted: msg });

    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Failed to get Ayah.\nCheck format: .quran 2:255` }, { quoted: msg });
    }
  }
};