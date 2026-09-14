// ============================================================
// MUFASER-X — HADITH COMMAND (ALL BOOKS - FREE API)
// Usage:.hadith bukhari 1.hadith muslim 10
// ============================================================

module.exports = {
  name: 'hadith',
  aliases: ['hadis'],
  desc: 'Get hadith by book and number',
  category: 'Religion',
  usage: '.hadith bukhari 1',

  async execute(sock, msg, jid, args) {
    try {
      // args: ["bukhari", "1"] or ["bukhari", "1-10"]
      let book = args[0]?.toLowerCase();
      let number = args[1];

      if (!book ||!number) {
        return await sock.sendMessage(jid, {
          text: `📚 *HADITH USAGE*\n\n.hadith bukhari 1\n.hadith muslim 10\n.hadith abudawud 2\n\n*Available books:*\n- bukhari\n- muslim\n- abudawud\n- tirmidhi\n- nasai\n- ibnmajah\n- malik\n- ahmad`
        }, { quoted: msg });
      }

      // Validate book
      const validBooks = ['bukhari','muslim','abudawud','tirmidhi','nasai','ibnmajah','malik','ahmad'];
      if (!validBooks.includes(book)) {
        return await sock.sendMessage(jid, { text: `❌ Invalid book. Use: ${validBooks.join(', ')}` }, { quoted: msg });
      }

      // Clean number: allow 1 or 1-5
      number = number.replace(/\s+/g, '');
      if (!number.includes('-')) number = `${number}-${number}`;

      await sock.sendMessage(jid, { react: { text: '📚', key: msg.key } }).catch(()=>{});

      const url = `https://api.hadith.gading.dev/books/${book}?range=${number}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!json.data || json.data.length === 0) {
        return await sock.sendMessage(jid, { text: `❌ Hadith not found: ${book} ${number}` }, { quoted: msg });
      }

      const hadith = json.data[0];
      const arabic = hadith.arab || '';
      const english = hadith.id || hadith.english || '';

      const reply = `📚 *HADITH - ${book.toUpperCase()}*\n\n` +
                    `*No:* ${hadith.number}\n` +
                    `*Grade:* ${hadith.grade || 'Sahih'}\n` +
                    `▬▬▬▬▬▬\n\n` +
                    `*ARABIC:*\n${arabic}\n\n` +
                    `*ENGLISH:*\n${english}\n\n` +
                    `> *POWERED BY @MUFASER-X BOT*`;

      await sock.sendMessage(jid, { text: reply }, { quoted: msg });

    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Failed to get hadith.\nTry:.hadith bukhari 1` }, { quoted: msg });
    }
  }
};