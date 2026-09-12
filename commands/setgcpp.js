// ============================================================
// MUFASER-X — SET GROUP PROFILE PICTURE
// ============================================================

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

module.exports = {
  name: 'setgcpp',
  aliases: ['setppgc', 'setgpic'],
  desc: 'Set group profile picture. Reply to image or sticker',
  category: 'Group',
  usage: '.setgcpp',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');
    if (!isGroup) {
      return await sock.sendMessage(jid, { text: '❌ *This command only works in groups.*' }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata?.participants || [];

      const cleanJid = (v) => v? String(v).trim().toLowerCase() : '';
      const getNumber = (v) => v? String(v).split('@')[0].split(':')[0].replace(/\D/g, '') : '';
      const participantMatches = (p, tJid, tNum) => {
        if (!p) return false;
        if (cleanJid(p.id) === cleanJid(tJid)) return true;
        if (tNum && getNumber(p.id) === tNum) return true;
        if (tNum && getNumber(p.phoneNumber) === tNum) return true;
        return false;
      };

      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);
      const botParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      if (!isBotAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *I need to be a group admin to change the group profile picture.*' }, { quoted: msg });
      }

      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || (msg?.key?.fromMe? botJid : '');
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
      if (!senderParticipant && msg?.key?.fromMe === true) senderParticipant = botParticipant;
      const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
      if (!isAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *Only group admins can use this command.*' }, { quoted: msg });
      }

      const contextInfo = msg?.message?.extendedTextMessage?.contextInfo;
      const quotedMessage = contextInfo?.quotedMessage;
      if (!quotedMessage) {
        return await sock.sendMessage(jid, { text: '❌ *Reply to an image or sticker.*' }, { quoted: msg });
      }

      let mediaType = '';
      if (quotedMessage.imageMessage) mediaType = 'imageMessage';
      else if (quotedMessage.stickerMessage) mediaType = 'stickerMessage';
      if (mediaType!== 'imageMessage' && mediaType!== 'stickerMessage') {
        return await sock.sendMessage(jid, { text: '❌ *Reply to an image or sticker only.*' }, { quoted: msg });
      }

      const quotedKey = contextInfo?.stanzaId? { remoteJid: jid, id: contextInfo.stanzaId, participant: contextInfo.participant } : null;
      if (!quotedKey) {
        return await sock.sendMessage(jid, { text: '❌ *Unable to read the replied media.*' }, { quoted: msg });
      }

      const mediaMessage = { key: quotedKey, message: quotedMessage };
      const buffer = await downloadMediaMessage(mediaMessage, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });

      if (!buffer || buffer.length === 0) throw new Error('Media download returned empty data.');

      const resized = await sharp(buffer).resize(640, 640, { fit: 'cover', position: 'centre' }).jpeg({ quality: 90 }).toBuffer();

      await sock.updateProfilePicture(jid, resized);

      return await sock.sendMessage(jid, { text: `✅ *GROUP PROFILE UPDATED SUCCESSFULLY!*` }, { quoted: msg });

    } catch (error) {
      return await sock.sendMessage(jid, { text: `❌ *Failed to set group profile picture.*\n\n⚠️ *Reason:* ${error?.message || 'Try again.'}` }, { quoted: msg });
    }
  }
};