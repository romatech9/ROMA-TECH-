// ============================================================
// MUFASER-X — TOEMOJI COMMAND
// Convert a replied emoji into a WhatsApp sticker
// ============================================================

const sharp = require('sharp');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
  name: 'toemoji',

  aliases: [
    'emoji2sticker',
    'emojisticker'
  ],

  desc: 'Convert an emoji into a sticker',

  category: 'Tools',

  usage: '.toemoji [reply to emoji]',

  async execute(sock, msg, jid, args, sender, account) {
    try {

      // --------------------------------------------------------
      // GET QUOTED MESSAGE
      // --------------------------------------------------------

      const context =
        msg.message?.extendedTextMessage?.contextInfo;

      const quoted =
        context?.quotedMessage;

      if (!quoted) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to an emoji with .toemoji*\n\n' +
              'Example: Reply to 😎 and send *.toemoji*'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // GET TEXT / CAPTION
      // --------------------------------------------------------

      const emojiText =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        quoted.videoMessage?.caption ||
        '';

      if (!emojiText.trim()) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I cannot find an emoji.*\n\n' +
              'Reply directly to an emoji and send *.toemoji*.'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // KEEP EMOJI
      // --------------------------------------------------------

      const emoji = emojiText.trim();

      // Prevent extremely long text from becoming a sticker
      if (emoji.length > 30) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Too much text.*\n\n' +
              'Please reply to one emoji.'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // CREATE TRANSPARENT PNG WITH SHARP
      // --------------------------------------------------------

      const width = 512;
      const height = 512;

      const svg = `
        <svg
          width="${width}"
          height="${height}"
          viewBox="0 0 ${width} ${height}"
          xmlns="http://www.w3.org/2000/svg"
        >

          <rect
            width="512"
            height="512"
            fill="transparent"
          />

          <text
            x="256"
            y="285"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="300"
          >${escapeXml(emoji)}</text>

        </svg>
      `;

      const pngBuffer =
        await sharp(Buffer.from(svg))
          .png()
          .toBuffer();

      // --------------------------------------------------------
      // CREATE WHATSAPP STICKER
      // --------------------------------------------------------

      const sticker =
        new Sticker(pngBuffer, {
          pack: 'MUFASER-X',
          author: 'ROMA-TECH',
          type: StickerTypes.FULL,
          quality: 90
        });

      const stickerBuffer =
        await sticker.toBuffer();

      // --------------------------------------------------------
      // SEND STICKER
      // --------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          sticker: stickerBuffer
        },
        { quoted: msg }
      );

      console.log(
        `[ToEmoji:${account?.phone || 'unknown'}] ✅ Emoji converted to sticker`
      );

    } catch (error) {

      console.error(
        '[ToEmoji] ❌ Error:',
        error
      );

      await sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to create emoji sticker.*\n\n` +
            `Reason: ${error?.message || 'Unknown error'}`
        },
        { quoted: msg }
      );
    }
  }
};


// ============================================================
// XML ESCAPE
// ============================================================

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}