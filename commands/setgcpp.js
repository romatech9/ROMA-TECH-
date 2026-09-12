// ============================================================
// MUFASER-X — SET GROUP PROFILE PICTURE
// ============================================================

const {
  downloadMediaMessage
} = require('@whiskeysockets/baileys');

const sharp = require('sharp');

module.exports = {
  name: 'setgcpp',

  aliases: [
    'setppgc',
    'setgpic'
  ],

  desc: 'Set group profile picture. Reply to image or sticker',

  category: 'Group',

  usage: '.setgcpp',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    // ========================================================
    // CHECK GROUP
    // ========================================================

    const isGroup =
      typeof jid === 'string' &&
      jid.endsWith('@g.us');

    if (!isGroup) {

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *This command only works in groups.*'
        },
        {
          quoted: msg
        }
      );
    }

    try {

      // ======================================================
      // GET GROUP METADATA
      // ======================================================

      const metadata =
        await sock.groupMetadata(jid);

      if (!metadata) {
        throw new Error(
          'Group metadata unavailable.'
        );
      }

      const participants =
        metadata?.participants || [];

      // ======================================================
      // ADMIN HELPERS
      // SAME METHOD USED BY WORKING .MUTE
      // ======================================================

      const cleanJid = (value) => {
        if (!value) return '';

        return String(value)
          .trim()
          .toLowerCase();
      };

      const getNumber = (value) => {
        if (!value) return '';

        return String(value)
          .split('@')[0]
          .split(':')[0]
          .replace(/\D/g, '');
      };

      const participantMatches = (
        participant,
        targetJid,
        targetNumber
      ) => {

        if (!participant) return false;

        const participantId =
          cleanJid(participant.id);

        const target =
          cleanJid(targetJid);

        // Exact JID
        if (
          participantId &&
          target &&
          participantId === target
        ) {
          return true;
        }

        // Base number
        const participantNumber =
          getNumber(participant.id);

        if (
          targetNumber &&
          participantNumber &&
          participantNumber === targetNumber
        ) {
          return true;
        }

        // phoneNumber fallback
        const participantPhone =
          getNumber(
            participant.phoneNumber
          );

        if (
          targetNumber &&
          participantPhone &&
          participantPhone === targetNumber
        ) {
          return true;
        }

        return false;
      };

      // ======================================================
      // FIND BOT
      // ======================================================

      const botJid =
        sock?.user?.id || '';

      const botNumber =
        getNumber(botJid);

      const botParticipant =
        participants.find(
          participant =>
            participantMatches(
              participant,
              botJid,
              botNumber
            )
        );

      const isBotAdmin =
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin';

      console.log(
        '[SetGCPp] 🤖 Bot:',
        {
          botJid,
          botNumber,
          found:
            botParticipant?.id || null,
          admin:
            botParticipant?.admin || null,
          isBotAdmin
        }
      );

      // ======================================================
      // BOT ADMIN CHECK
      // ======================================================

      if (!isBotAdmin) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I need to be a group admin to change the group profile picture.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // FIND COMMAND SENDER
      // ======================================================

      const senderJid =
        msg?.key?.participant ||
        sender?.jid ||
        msg?.participant ||
        (
          msg?.key?.fromMe
            ? botJid
            : ''
        );

      const senderNumber =
        getNumber(
          sender?.number ||
          senderJid
        );

      // ======================================================
      // FIND SENDER PARTICIPANT
      // ======================================================

      let senderParticipant =
        participants.find(
          participant =>
            participantMatches(
              participant,
              senderJid,
              senderNumber
            )
        );

      // ======================================================
      // FROM-ME FALLBACK
      // ======================================================

      if (
        !senderParticipant &&
        msg?.key?.fromMe === true
      ) {

        senderParticipant =
          participants.find(
            participant =>
              participantMatches(
                participant,
                botJid,
                botNumber
              )
          );
      }

      // ======================================================
      // CHECK SENDER ADMIN
      // ======================================================

      const isAdmin =
        msg?.key?.fromMe === true ||
        senderParticipant?.admin === 'admin' ||
        senderParticipant?.admin === 'superadmin';

      console.log(
        '[SetGCPp] 👤 Sender:',
        {
          senderJid,
          senderNumber,
          found:
            senderParticipant?.id || null,
          admin:
            senderParticipant?.admin || null,
          isAdmin
        }
      );

      if (!isAdmin) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Only group admins can use this command.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET QUOTED MESSAGE
      // ======================================================

      const contextInfo =
        msg?.message?.extendedTextMessage?.contextInfo ||
        msg?.message?.imageMessage?.contextInfo ||
        msg?.message?.conversation?.contextInfo;

      const quotedMessage =
        contextInfo?.quotedMessage;

      if (!quotedMessage) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to an image or sticker.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // CHECK MEDIA TYPE
      // ======================================================

      let mediaType = '';

      if (quotedMessage.imageMessage) {
        mediaType = 'imageMessage';
      } else if (quotedMessage.stickerMessage) {
        mediaType = 'stickerMessage';
      }

      if (
        mediaType !== 'imageMessage' &&
        mediaType !== 'stickerMessage'
      ) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to an image or sticker only.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // BUILD MESSAGE OBJECT
      // ======================================================

      const quotedKey =
        contextInfo?.stanzaId
          ? {
              remoteJid: jid,
              id: contextInfo.stanzaId,
              participant: contextInfo.participant
            }
          : null;

      if (!quotedKey) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Unable to read the replied media.*'
          },
          {
            quoted: msg
          }
        );
      }

      const mediaMessage = {
        key: quotedKey,
        message: quotedMessage
      };

      // ======================================================
      // DOWNLOAD MEDIA
      // ======================================================

      const buffer =
        await downloadMediaMessage(
          mediaMessage,
          'buffer',
          {},
          {
            logger: console,

            reuploadRequest:
              sock.updateMediaMessage
          }
        );

      if (
        !buffer ||
        buffer.length === 0
      ) {
        throw new Error(
          'Media download returned empty data.'
        );
      }

      // ======================================================
      // RESIZE + CONVERT
      // ======================================================

      const resized =
        await sharp(buffer)
          .resize(
            640,
            640,
            {
              fit: 'cover',
              position: 'centre'
            }
          )
          .jpeg({
            quality: 90
          })
          .toBuffer();

      // ======================================================
      // UPDATE GROUP PROFILE
      // ======================================================

      await sock.updateProfilePicture(
        jid,
        resized
      );

      // ======================================================
      // SUCCESS
      // ======================================================

      const senderMention =
        senderJid ||
        botJid;

      const senderDisplay =
        getNumber(senderMention) ||
        'Admin';

      return await sock.sendMessage(
        jid,
        {
          text:
            `✅ *GROUP PROFILE UPDATED SUCCESSFULLY!*`
            
          mentions:
            senderMention
              ? [senderMention]
              : []
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[SetGCPp] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to set group profile picture.*\n\n' +
            `⚠️ *Reason:* ${
              error?.message ||
              'Make sure the media is a valid image/sticker and try again.'
            }`
        },
        {
          quoted: msg
        }
      );
    }
  }
};