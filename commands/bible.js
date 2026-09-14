// ============================================================
// MUFASER-X — BIBLE VERSE COMMAND (PREFIX ONLY)
// ============================================================
const axios = require('axios');

module.exports = {
  name: 'bible',
  aliases: ['verse', 'scripture'],
  desc: 'Get bible verse',
  category: 'Religion',
  usage: '.bible John 3:16',

  async execute(sock, msg, jid, args, sender) {
    try {
      let query = args.join(' ').trim();

      if (!query) {
        return await sock.sendMessage(jid, { text: `📖 *BIBLE USAGE*\n\nExample:\n.bible John 3:16\n.bible Genesis 1:1\n.bible Psalms 23` }, { quoted: msg });
      }

      await sock.sendMessage(jid, { react: { text: '📖', key: msg.key } }).catch(()=>{});

      // Fix "John 3: 28" -> "John 3:28"
      const cleanQuery = query.replace(/\s*:\s*/g, ':').replace(/\s+/g, ' ').trim();

      const apiUrl = `https://bible-api.com/${encodeURIComponent(cleanQuery)}?translation=kjv`;
      const { data } = await axios.get(apiUrl, { timeout: 10000 });

      if (!data || data.text === undefined) {
        return await sock.sendMessage(jid, { text: `❌ Verse not found: *${cleanQuery}*\n\nTry: John 3:16` }, { quoted: msg });
      }

      const book = data.reference || cleanQuery;
      const verses = data.verses ? data.verses.map(v => `*${v.verse}* ${v.text.trim()}`).join('\n\n') : data.text.trim();

      const reply = `📖 *HOLY BIBLE - KJV*\n\n` +
                    `*${book.toUpperCase()}*\n` +
                    `▬▬▬▬▬▬\n\n` +
                    `${verses}\n\n`;

      await sock.sendMessage(jid, { text: reply }, { quoted: msg });

    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Failed to get verse.\n\nCheck format: .bible John 3:28` }, { quoted: msg });
    }
  }
};