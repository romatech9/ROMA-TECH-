// ============================================================
// MUFASER-X — VV2 COMMAND
// Owner Only: Retrieve replied View Once / Media
// ============================================================

const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');

function normalizeNumber(value) {
  if (!value) return '';
  return String(value).split('@')[0].split(':')[0].replace(/\D/g, '');
}

module.exports = {
  name: 'vv2',
  aliases: ['viewonce2', 'steal'],
  desc: 'Owner only: Retrieve View Once and replied media',
  category: 'Owner',
  usage: '.vv2 (reply to View Once/media)',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!msg?.key?.fromMe) {
        return await sock.sendMessage(jid, { text: '😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌' }, { quoted: msg });
      }

      const contextInfo = msg?.message?.extendedTextMessage?.contextInfo;
      if (!contextInfo?.quotedMessage) {
        return await sock.sendMessage(jid, { text: '❌ *Reply to a View Once photo, video, voice note, or sticker with* `.vv2`' }, { quoted: msg });
      }

      let quoted = contextInfo.quotedMessage;
      let changed = true;
      while (changed && quoted) {
        changed = false;
        if (quoted.ephemeralMessage?.message) { quoted = quoted.ephemeralMessage.message; changed = true; continue; }
        if (quoted.viewOnceMessageV2?.message) { quoted = quoted.viewOnceMessageV2.message; changed = true; continue; }
        if (quoted.viewOnceMessageV2Extension?.message) { quoted = quoted.viewOnceMessageV2Extension.message; changed = true; continue; }
        if (quoted.viewOnceMessage?.message) { quoted = quoted.viewOnceMessage.message; changed = true; continue; }
        if (quoted.documentWithCaptionMessage?.message) { quoted = quoted.documentWithCaptionMessage.message; changed = true; continue; }
      }

      const mediaType = getContentType(quoted);
      const supportedTypes = ['imageMessage','videoMessage','audioMessage','stickerMessage','documentMessage'];
      if (!mediaType ||!supportedTypes.includes(mediaType)) {
        return await sock.sendMessage(jid, { text: '❌ *Unsupported message type.*\n\nSupported:\n📷 Image\n🎥 Video\n🎤 Voice note\n🖼️ Sticker\n📄 Document' }, { quoted: msg });
      }

      const media = quoted?.[mediaType];
      if (!media) throw new Error('Media data was not found.');

      let downloadType;
      switch (mediaType) {
        case 'imageMessage': downloadType = 'image'; break;
        case 'videoMessage': downloadType = 'video'; break;
        case 'audioMessage': downloadType = 'audio'; break;
        case 'stickerMessage': downloadType = 'sticker'; break;
        case 'documentMessage': downloadType = 'document'; break;
        default: throw new Error('Unsupported download type.');
      }

      const stream = await downloadContentFromMessage(media, downloadType);
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      if (!buffer || buffer.length === 0) throw new Error('Downloaded media is empty.');

      const botJid = sock?.user?.id || '';
      const botNumber = normalizeNumber(botJid);
      if (!botNumber) throw new Error('Could not determine bot number.');
      const ownerJid = `${botNumber}@s.whatsapp.net`;
      const caption = media.caption || '> 👁️ *ViewOnce Opened*';

      if (mediaType === 'imageMessage') {
        await sock.sendMessage(ownerJid, { image: buffer, caption });
      } else if (mediaType === 'videoMessage') {
        await sock.sendMessage(ownerJid, { video: buffer, caption, mimetype: media.mimetype || 'video/mp4' });
      } else if (mediaType === 'audioMessage') {
        await sock.sendMessage(ownerJid, { audio: buffer, mimetype: media.mimetype || 'audio/ogg; codecs=opus', ptt: media.ptt === true });
      } else if (mediaType === 'stickerMessage') {
        await sock.sendMessage(ownerJid, { sticker: buffer });
      } else if (mediaType === 'documentMessage') {
        await sock.sendMessage(ownerJid, { document: buffer, mimetype: media.mimetype || 'application/octet-stream', fileName: media.fileName || 'retrieved-file' });
      }

      // No progress message - silent

    } catch (error) {
      try {
        await sock.sendMessage(jid, { text: `❌ *VV2 failed.*\n\n⚠️ *Reason:* ${error?.message || 'Unknown error.'}` }, { quoted: msg });
      } catch {}
    }
  }
};