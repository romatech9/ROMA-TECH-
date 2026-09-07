// ============================================================
// MUFASER-X — TAKE STICKER (FIXED)
// ============================================================
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const WebP = require('node-webpmux');

async function downloadSticker(stickerMessage) {
  const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function getQuotedSticker(msg) {
  try {
    const m = msg.message;
    if (!m) return null;

    // handle ephemeral / viewOnce wrappers
    const inner = m.ephemeralMessage?.message || m.viewOnceMessageV2?.message || m.viewOnceMessage?.message || m;

    const contexts = [
      inner.extendedTextMessage?.contextInfo?.quotedMessage,
      inner.imageMessage?.contextInfo?.quotedMessage,
      inner.videoMessage?.contextInfo?.quotedMessage,
      inner.conversation?.contextInfo?.quotedMessage
    ];

    // also check the old loop method as fallback
    for (const type of Object.keys(inner)) {
      const q = inner[type]?.contextInfo?.quotedMessage;
      if (q?.stickerMessage) return q.stickerMessage;
    }

    for (const q of contexts) {
      if (q?.stickerMessage) return q.stickerMessage;
    }

    return null;
  } catch {
    return null;
  }
}

function createStickerExif(packName, publisher, emoji = '🔥') {
  const metadata = {
    'sticker-pack-id': 'com.mufaserx.take',
    'sticker-pack-name': packName,
    'sticker-pack-publisher': publisher,
    'emojis': [emoji]
  };
  const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
  const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);
  return exif;
}

module.exports = {
  name: 'take',
  aliases: ['takesticker', 'steal'],
  desc: 'Take sticker with your name',
  category: 'Tools',
  usage: '.take [emoji]',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      const stickerMessage = getQuotedSticker(msg);
      if (!stickerMessage) {
        return await sock.sendMessage(jid, {
          text: '❌ *Reply to a sticker with.take*\n\nExample: reply to sticker with `.take 😎`'
        }, { quoted: msg });
      }

      const userName = msg?.pushName || 'MUFASER-X';
      const emoji = args[0] || '🔥';

      console.log('[Take] ⬇️ Downloading...');
      const stickerBuffer = await downloadSticker(stickerMessage);

      if (!stickerBuffer?.length) throw new Error('Failed to download sticker');

      console.log('[Take] 🔧 Adding metadata...');
      const image = new WebP.Image();
      await image.load(stickerBuffer);
      image.exif = createStickerExif('MUFASER-X', userName, emoji);
      const finalSticker = await image.save(null);

      if (!finalSticker?.length) throw new Error('node-webpmux returned empty');

      await sock.sendMessage(jid, { sticker: finalSticker }, { quoted: msg });
      console.log(`[Take] ✅ Sent by ${userName}`);

    } catch (error) {
      console.error('[Take] ❌ Error:', error);
      await sock.sendMessage(jid, {
        text: `❌ *Failed to take sticker.*\n⚠️ Reason: ${error.message}`
      }, { quoted: msg });
    }
  }
};