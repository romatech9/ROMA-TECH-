// ============================================================
// MUFASER-X — TOIMAGE COMMAND
// Convert sticker to image
// Usage: Reply to a sticker with.toimage
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'toimage',
  aliases: ['stickertoimg', 's2img'],
  desc: 'Convert sticker to image',
  category: 'Tools',
  usage: '.toimage [reply to sticker]',

  async execute(sock, msg, jid, args, sender, account) {

    try {
      // ======================================================
      // 1. CHECK IF REPLIED TO STICKER
      // ======================================================
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) {
        return await sock.sendMessage(jid, {
          text: '❌ *Reply to a sticker with.toimage*'
        }, { quoted: msg });
      }

      const stickerMsg = quoted.stickerMessage;
      if (!stickerMsg) {
        return await sock.sendMessage(jid, {
          text: '❌ *This is not a sticker.*\n\nReply to a sticker to convert it to image.'
        }, { quoted: msg });
      }

      await sock.sendMessage(jid, {
        text: ''
      }, { quoted: msg });

      // ======================================================
      // 2. DOWNLOAD STICKER
      // ======================================================
      const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // ======================================================
      // 3. SEND AS IMAGE
      // ======================================================
      await sock.sendMessage(jid, {
        image: buffer,
        caption: `✅ *Converted to Image*\n\n> 🎉*╔POWERED BY MUFASER-X╗*🌹`
      }, { quoted: msg });

    } catch (error) {
      console.error('[ToImage] ❌ Error:', error);
      await sock.sendMessage(jid, {
        text: `❌ *Failed to convert sticker.*\n\nReason: ${error.message || 'Unknown error'}`
      }, { quoted: msg });
    }
  }
};