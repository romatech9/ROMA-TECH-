// ============================================================
// MUFASER-X — SET PROFILE PICTURE
//
// Usage:
// Reply to an image:.setpp
// Reply to a sticker:.setpp
// ============================================================
const config = require('../config.js');

function normalizeNumber(value) {
  if (!value) return '';
  let number = String(value);
  number = number.split('@')[0];
  number = number.split(':')[0];
  return number.replace(/\D/g, '');
}

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

module.exports = {
  name: 'setpp',

  async execute(sock, msg, jid, args, sender, account) {

    // ── OWNER ONLY ─────────────────────────────────────────
    const senderNumber = normalizeNumber(sender?.number || msg.key?.participant || msg.key?.remoteJid);
    const ownerNumber = normalizeNumber(config.ownerNumber);
    const isOwner = msg.key?.fromMe === true;

    if (!isOwner && (!ownerNumber || senderNumber!== ownerNumber)) {
      return sock.sendMessage(jid, {
        text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
      });
    }

    // ── GET REPLIED MESSAGE ────────────────────────────────
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;

    if (!quotedMessage) {
      return sock.sendMessage(jid, {
        text: `❌ *Reply to an image or sticker*`
      });
    }

    // Reconstruct message for download
    const quotedMsg = {
      key: {
        remoteJid: jid,
        id: contextInfo.stanzaId,
        participant: contextInfo.participant
      },
      message: quotedMessage
    };

    // ── DETECT MEDIA ────────────────────────────────────────
    const imageMessage = quotedMessage.imageMessage;
    const stickerMessage = quotedMessage.stickerMessage;

    if (!imageMessage &&!stickerMessage) {
      return sock.sendMessage(jid, {
        text: `❌ *Reply to an image or sticker*`
      });
    }

    try {
      await sock.sendMessage(jid, { text: '⏳ Updating my profile picture...' });

      // ── DOWNLOAD MEDIA ───────────────────────────────────
      const mediaBuffer = await downloadMediaMessage(
        quotedMsg,
        'buffer',
        {},
        { logger: sock.logger }
      );

      if (!mediaBuffer) throw new Error('Could not download the media.');

      // ── CONVERT TO JPEG 640x640 ──────────────────────────
      // This fixes webp sticker issues
      const profileBuffer = await sharp(mediaBuffer, { animated: false })
       .resize(640, 640, { fit: 'cover', position: 'centre' })
       .toFormat('jpeg')
       .jpeg({ quality: 90 })
       .toBuffer();

      // ── GET BOT'S OWN JID ─────────────────────────────────
      const botJid = sock.user?.id;
      if (!botJid) throw new Error('Could not get bot JID.');

      // ── UPDATE PROFILE PICTURE ───────────────────────────
      // FIX: Pass buffer directly, not {url: buffer}
      await sock.updateProfilePicture(botJid, profileBuffer);

      console.log(`[Bot:${account?.phone || 'unknown'}] ✅ Profile picture updated.`);

      await sock.sendMessage(jid, {
        text: `✅ *Profile picture updated!*`
      });

    } catch (error) {
      console.error(`[SetPP] ❌ Failed:`, error);
      await sock.sendMessage(jid, {
        text: `❌ *Failed to update profile picture.*\n\nReason:\n${error.message}`
      });
    }
  }
};