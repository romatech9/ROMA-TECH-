// ============================================================
// MUFASER-X — VV2 COMMAND
// Owner Only: Retrieve replied View Once / Media
// Usage: Reply to media with .vv2
// ============================================================

const {
  downloadContentFromMessage,
  getContentType
} = require('@whiskeysockets/baileys');


// ============================================================
// NORMALIZE NUMBER
// ============================================================

function normalizeNumber(value) {

  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}


// ============================================================
// VV2
// ============================================================

module.exports = {

  name: 'vv2',

  aliases: [
    'viewonce2',
    'steal'
  ],

  desc:
    'Owner only: Retrieve View Once and replied media',

  category: 'Owner',

  usage:
    '.vv2 (reply to View Once/media)',


  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    try {

      // ======================================================
      // OWNER ONLY
      // ======================================================

      if (!msg?.key?.fromMe) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '😅 *OWNER ONLY!*\n\n' +
              'Sorry Comrade, this command is reserved for my owner. 😌'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // GET CONTEXT
      // ======================================================

      const contextInfo =
        msg?.message
          ?.extendedTextMessage
          ?.contextInfo;


      // ======================================================
      // GET QUOTED MESSAGE
      // ======================================================

      if (!contextInfo?.quotedMessage) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to a View Once photo, video, voice note, or sticker with* `.vv2`'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // ORIGINAL QUOTED MESSAGE
      // ======================================================

      let quoted =
        contextInfo.quotedMessage;


      // ======================================================
      // UNWRAP ALL COMMON WHATSAPP LAYERS
      // ======================================================

      let changed = true;

      while (
        changed &&
        quoted
      ) {

        changed = false;


        // ----------------------------------------------------
        // EPHEMERAL
        // ----------------------------------------------------

        if (
          quoted.ephemeralMessage?.message
        ) {

          quoted =
            quoted
              .ephemeralMessage
              .message;

          changed = true;

          continue;
        }


        // ----------------------------------------------------
        // VIEW ONCE V2
        // ----------------------------------------------------

        if (
          quoted.viewOnceMessageV2?.message
        ) {

          quoted =
            quoted
              .viewOnceMessageV2
              .message;

          changed = true;

          continue;
        }


        // ----------------------------------------------------
        // VIEW ONCE V2 EXTENSION
        // ----------------------------------------------------

        if (
          quoted
            .viewOnceMessageV2Extension
            ?.message
        ) {

          quoted =
            quoted
              .viewOnceMessageV2Extension
              .message;

          changed = true;

          continue;
        }


        // ----------------------------------------------------
        // OLD VIEW ONCE
        // ----------------------------------------------------

        if (
          quoted.viewOnceMessage?.message
        ) {

          quoted =
            quoted
              .viewOnceMessage
              .message;

          changed = true;

          continue;
        }


        // ----------------------------------------------------
        // DOCUMENT WITH CAPTION
        // ----------------------------------------------------

        if (
          quoted
            .documentWithCaptionMessage
            ?.message
        ) {

          quoted =
            quoted
              .documentWithCaptionMessage
              .message;

          changed = true;

          continue;
        }

      }


      // ======================================================
      // DETECT MEDIA TYPE
      // ======================================================

      const mediaType =
        getContentType(quoted);


      console.log(
        '[VV2] 📦 Detected type:',
        mediaType
      );


      // ======================================================
      // SUPPORTED MEDIA
      // ======================================================

      const supportedTypes = [

        'imageMessage',

        'videoMessage',

        'audioMessage',

        'stickerMessage',

        'documentMessage'

      ];


      if (
        !mediaType ||
        !supportedTypes.includes(mediaType)
      ) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Unsupported message type.*\n\n' +

              'Supported:\n' +
              '📷 Image\n' +
              '🎥 Video\n' +
              '🎤 Voice note\n' +
              '🖼️ Sticker\n' +
              '📄 Document'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // GET MEDIA OBJECT
      // ======================================================

      const media =
        quoted?.[mediaType];


      if (!media) {

        throw new Error(
          'Media data was not found.'
        );
      }

      // ======================================================
      // DOWNLOAD TYPE
      // ======================================================

      let downloadType;


      switch (mediaType) {

        case 'imageMessage':
          downloadType = 'image';
          break;

        case 'videoMessage':
          downloadType = 'video';
          break;

        case 'audioMessage':
          downloadType = 'audio';
          break;

        case 'stickerMessage':
          downloadType = 'sticker';
          break;

        case 'documentMessage':
          downloadType = 'document';
          break;

        default:
          throw new Error(
            'Unsupported download type.'
          );
      }


      console.log(
        '[VV2] ⬇️ Downloading:',
        downloadType
      );


      // ======================================================
      // DOWNLOAD
      // ======================================================

      const stream =
        await downloadContentFromMessage(
          media,
          downloadType
        );


      const chunks = [];


      for await (
        const chunk of stream
      ) {

        chunks.push(chunk);

      }


      const buffer =
        Buffer.concat(chunks);


      if (
        !buffer ||
        buffer.length === 0
      ) {

        throw new Error(
          'Downloaded media is empty.'
        );
      }


      console.log(
        '[VV2] ✅ Downloaded:',
        buffer.length,
        'bytes'
      );


      // ======================================================
      // OWNER / BOT JID
      // ======================================================

      const botJid =
        sock?.user?.id || '';


      const botNumber =
        normalizeNumber(botJid);


      if (!botNumber) {

        throw new Error(
          'Could not determine bot number.'
        );
      }


      const ownerJid =
        `${botNumber}@s.whatsapp.net`;


      // ======================================================
      // CAPTION
      // ======================================================

      const caption =
        media.caption ||
        '> 👁️ *ViewOnce Opened*';


      // ======================================================
      // SEND IMAGE TO OWNER
      // ======================================================

      if (
        mediaType === 'imageMessage'
      ) {

        await sock.sendMessage(
          ownerJid,
          {
            image: buffer,
            caption
          }
        );
      }


      // ======================================================
      // SEND VIDEO TO OWNER
      // ======================================================

      else if (
        mediaType === 'videoMessage'
      ) {

        await sock.sendMessage(
          ownerJid,
          {
            video: buffer,

            caption,

            mimetype:
              media.mimetype ||
              'video/mp4'
          }
        );
      }


      // ======================================================
      // SEND AUDIO TO OWNER
      // ======================================================

      else if (
        mediaType === 'audioMessage'
      ) {

        await sock.sendMessage(
          ownerJid,
          {
            audio: buffer,

            mimetype:
              media.mimetype ||
              'audio/ogg; codecs=opus',

            ptt:
              media.ptt === true
          }
        );
      }


      // ======================================================
      // SEND STICKER TO OWNER
      // ======================================================

      else if (
        mediaType === 'stickerMessage'
      ) {

        await sock.sendMessage(
          ownerJid,
          {
            sticker: buffer
          }
        );
      }


      // ======================================================
      // SEND DOCUMENT TO OWNER
      // ======================================================

      else if (
        mediaType === 'documentMessage'
      ) {

        await sock.sendMessage(
          ownerJid,
          {
            document: buffer,

            mimetype:
              media.mimetype ||
              'application/octet-stream',

            fileName:
              media.fileName ||
              'retrieved-file'
          }
        );
      }


      // ======================================================
      // SUCCESS
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            ''
        },
        {
          quoted: msg
        }
      );


      console.log(
        '',
        ownerJid
      );

    }

    catch (error) {

      console.error(
        '[VV2] ❌ Failed:',
        error
      );


      try {

        await sock.sendMessage(
          jid,
          {
            text:
              '❌ *VV2 failed.*\n\n' +
              `⚠️ *Reason:* ${
                error?.message ||
                'Unknown error.'
              }`
          },
          {
            quoted: msg
          }
        );

      }

      catch (sendError) {

        console.error(
          '[VV2] ❌ Could not send error:',
          sendError
        );

      }

    }

  }

};