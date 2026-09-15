// ============================================================
// MUFASER-X — HADITH COMMAND
// Arabic + Indonesian translation
// API: api.hadith.gading.dev
//
// Usage:
// .hadith bukhari 1
// .hadith muslim 10
// .hadith bukhari 1-5
// ============================================================

module.exports = {

  name: 'hadith',

  aliases: ['hadis'],

  desc: 'Get Hadith by book and number',

  category: 'Religion',

  usage: '.hadith bukhari 1',

  async execute(sock, msg, jid, args) {

    try {

      // ========================================================
      // BOOKS
      // ========================================================

      const validBooks = [
        'bukhari',
        'muslim',
        'abudawud',
        'tirmidhi',
        'nasai',
        'ibnmajah',
        'malik',
        'ahmad',
        'darimi'
      ];


      // ========================================================
      // USAGE
      // ========================================================

      const book = String(args?.[0] || '')
        .trim()
        .toLowerCase();

      const number = String(args?.[1] || '')
        .trim()
        .replace(/\s+/g, '');


      if (!book || !number) {

        return await sock.sendMessage(
          jid,
          {
            text:
              `📚 *MUFASER-X HADITH*\n\n` +

              `*Usage:*\n` +
              `.hadith bukhari 1\n` +
              `.hadith muslim 10\n` +
              `.hadith bukhari 1-5\n\n` +

              `*Available Books:*\n` +
              `• bukhari\n` +
              `• muslim\n` +
              `• abudawud\n` +
              `• tirmidhi\n` +
              `• nasai\n` +
              `• ibnmajah\n` +
              `• malik\n` +
              `• ahmad\n` +
              `• darimi`
          },
          { quoted: msg }
        );

      }


      // ========================================================
      // VALIDATE BOOK
      // ========================================================

      if (!validBooks.includes(book)) {

        return await sock.sendMessage(
          jid,
          {
            text:
              `❌ *Invalid Hadith book.*\n\n` +
              `Available books:\n` +
              validBooks.map(b => `• ${b}`).join('\n')
          },
          { quoted: msg }
        );

      }


      // ========================================================
      // VALIDATE NUMBER
      // ========================================================

      if (!/^\d+$/.test(number) && !/^\d+-\d+$/.test(number)) {

        return await sock.sendMessage(
          jid,
          {
            text:
              `❌ *Invalid Hadith number.*\n\n` +
              `Examples:\n` +
              `.hadith bukhari 1\n` +
              `.hadith bukhari 1-5`
          },
          { quoted: msg }
        );

      }


      // ========================================================
      // REACT
      // ========================================================

      await sock.sendMessage(
        jid,
        {
          react: {
            text: '📚',
            key: msg.key
          }
        }
      ).catch(() => {});


      // ========================================================
      // API URL
      // ========================================================

      let url;

      // Single hadith
      if (/^\d+$/.test(number)) {

        url =
          `https://api.hadith.gading.dev/books/${book}/${number}`;

      }

      // Range
      else {

        const [start, end] = number.split('-').map(Number);

        if (end < start) {

          return await sock.sendMessage(
            jid,
            {
              text:
                `❌ *Invalid range.*\n\n` +
                `Example: \`.hadith bukhari 1-5\``
            },
            { quoted: msg }
          );

        }

        if ((end - start + 1) > 300) {

          return await sock.sendMessage(
            jid,
            {
              text:
                `❌ *Range too large.*\n\n` +
                `Maximum range is *300 hadiths*.`
            },
            { quoted: msg }
          );

        }

        url =
          `https://api.hadith.gading.dev/books/${book}?range=${start}-${end}`;

      }


      console.log(`[Hadith] Requesting: ${url}`);


      // ========================================================
      // FETCH
      // ========================================================

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });


      if (!response.ok) {

        throw new Error(
          `API returned HTTP ${response.status}`
        );

      }


      const json = await response.json();


      // ========================================================
      // NORMALIZE RESPONSE
      // ========================================================

      let hadith;

      // Single endpoint normally returns data as an object.
      if (
        json?.data &&
        !Array.isArray(json.data)
      ) {

        hadith = json.data;

      }

      // Range endpoint returns data as an array.
      else if (
        Array.isArray(json?.data) &&
        json.data.length > 0
      ) {

        hadith = json.data[0];

      }


      if (!hadith) {

        return await sock.sendMessage(
          jid,
          {
            text:
              `❌ *Hadith not found.*\n\n` +
              `Book: *${book}*\n` +
              `Number: *${number}*`
          },
          { quoted: msg }
        );

      }


      // ========================================================
      // DATA
      // ========================================================

      const hadithNumber =
        hadith.number ||
        number;

      const arabic =
        hadith.arab ||
        hadith.arabic ||
        'Arabic text unavailable.';

      const translation =
        hadith.id ||
        hadith.indo ||
        hadith.translation ||
        hadith.english ||
        'Translation unavailable.';


      // ========================================================
      // BOOK NAME
      // ========================================================

      const bookNames = {

        bukhari: 'SAHIH AL-BUKHARI',

        muslim: 'SAHIH MUSLIM',

        abudawud: 'SUNAN ABU DAWUD',

        tirmidhi: 'JAMI AT-TIRMIDHI',

        nasai: 'SUNAN AN-NASA’I',

        ibnmajah: 'SUNAN IBN MAJAH',

        malik: 'MUWATTA MALIK',

        ahmad: 'MUSNAD AHMAD',

        darimi: 'SUNAN AD-DARIMI'

      };


      const displayBook =
        bookNames[book] ||
        book.toUpperCase();


      // ========================================================
      // RESPONSE
      // ========================================================

      const reply =

        `📚 *${displayBook}*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +

        `🔢 *Hadith No:* ${hadithNumber}\n\n` +

        `🕋 *ARABIC:*\n` +
        `${arabic}\n\n` +

        `🌍 *TRANSLATION:*\n` +
        `${translation}\n\n` +

        `━━━━━━━━━━━━━━━━━━\n` +
        `> *POWERED BY @MUFASER-X BOT*`;


      // ========================================================
      // SEND
      // ========================================================

      return await sock.sendMessage(
        jid,
        {
          text: reply
        },
        { quoted: msg }
      );


    } catch (error) {

      console.error(
        '[Hadith] ❌',
        error?.stack || error?.message || error
      );


      return await sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to get Hadith.*\n\n` +
            `Please try again later.\n\n` +
            `Example:\n` +
            `.hadith bukhari 1`
        },
        { quoted: msg }
      );

    }

  }

};
