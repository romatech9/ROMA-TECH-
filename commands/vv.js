// ============================================================
// MUFASER-X — VIEW ONCE RETRIEVER
// ============================================================

const {
  downloadContentFromMessage,
  getContentType
} = require('@whiskeysockets/baileys');

module.exports = {

  name: 'vv',

  aliases: [
    'viewonce',
    'retrieve'
  ],

  desc: 'Open and resend View Once media',

  category: 'Tools',

  usage: '.vv (reply to View Once media)',

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
      // GET CONTEXT INFO
      // ======================================================

      const contextInfo =
        msg?.message
          ?.extendedTextMessage
          ?.contextInfo;

      // ======================================================
      // CHECK REPLY
      // ======================================================

      if (!contextInfo?.quotedMessage) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to a View Once photo, video, or voice note with* `.vv`'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET QUOTED MESSAGE
      // ======================================================

      let quoted =
        contextInfo.quotedMessage;

      // ======================================================
      // UNWRAP MESSAGE LAYERS
      // ======================================================

      let unwrapped = true;

      while (unwrapped && quoted) {

        unwrapped = false;

        // -----------------------------------------------
        // Ephemeral message
        // -----------------------------------------------

        if (quoted.ephemeralMessage?.message) {

          quoted =
            quoted.ephemeralMessage.message;

          unwrapped = true;

          continue;
        }

        // -----------------------------------------------
        // View Once V2
        // -----------------------------------------------

        if (quoted.viewOnceMessageV2?.message) {

          quoted =
            quoted.viewOnceMessageV2.message;

          unwrapped = true;

          continue;
        }

        // -----------------------------------------------
        // View Once V2 Extension
        // -----------------------------------------------

        if (
          quoted
            .viewOnceMessageV2Extension
            ?.message
        ) {

          quoted =
            quoted
              .viewOnceMessageV2Extension
              .message;

          unwrapped = true;

          continue;
        }

        // -----------------------------------------------
        // Older View Once
        // -----------------------------------------------

        if (quoted.viewOnceMessage?.message) {

          quoted =
            quoted.viewOnceMessage.message;

          unwrapped = true;

          continue;
        }

        // -----------------------------------------------
        // Document With Caption wrapper
        // -----------------------------------------------

        if (
          quoted.documentWithCaptionMessage
            ?.message
        ) {

          quoted =
            quoted
              .documentWithCaptionMessage
              .message;

          unwrapped = true;

          continue;
        }
      }

      // ======================================================
      // DETERMINE MEDIA TYPE
      // ======================================================

      const type =
        getContentType(quoted);

      console.log(
        '[VV] 📦 Content type:',
        type
      );

      if (!type) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I could not detect the media in this message.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // ONLY SUPPORT MEDIA
      // ======================================================

      const supportedTypes = [
        'imageMessage',
        'videoMessage',
        'audioMessage'
      ];

      if (
        !supportedTypes.includes(type)
      ) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Unsupported View Once media.*\n\n' +
              'Supported:\n' +
              '📷 Photo\n' +
              '🎥 Video\n' +
              '🎤 Voice note'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET MEDIA
      // ======================================================

      const media =
        quoted[type];

      if (!media) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Media data could not be found.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // CHECK VIEW ONCE
      // ======================================================

      const isViewOnce =
        media.viewOnce === true ||
        quoted.viewOnce === true;

      console.log(
        '[VV] 👁️ View Once:',
        isViewOnce
      );

      if (!isViewOnce) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *This message is not a View Once message.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // DOWNLOAD MEDIA
      // ======================================================

      let downloadType;

      if (type === 'imageMessage') {
        downloadType = 'image';
      }

      else if (type === 'videoMessage') {
        downloadType = 'video';
      }

      else if (type === 'audioMessage') {
        downloadType = 'audio';
      }

      console.log(
        '[VV] ⬇️ Downloading:',
        downloadType
      );

      const stream =
        await downloadContentFromMessage(
          media,
          downloadType
        );

      // ======================================================
      // BUILD BUFFER
      // ======================================================

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
        '[VV] ✅ Downloaded:',
        buffer.length,
        'bytes'
      );

      // ======================================================
      // CAPTION
      // ======================================================

      const caption =
        media.caption ||
        '> 👁️ *ViewOnce Opened*';

      // ======================================================
      // SEND IMAGE
      // ======================================================

      if (
        type === 'imageMessage'
      ) {

        return await sock.sendMessage(
          jid,
          {
            image: buffer,
            caption
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // SEND VIDEO
      // ======================================================

      if (
        type === 'videoMessage'
      ) {

        return await sock.sendMessage(
          jid,
          {
            video: buffer,
            caption,
            mimetype:
              media.mimetype ||
              'video/mp4'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // SEND AUDIO / VOICE NOTE
      // ======================================================

      if (
        type === 'audioMessage'
      ) {

        return await sock.sendMessage(
          jid,
          {
            audio: buffer,
            mimetype:
              media.mimetype ||
              'audio/ogg; codecs=opus',
            ptt:
              media.ptt === true
          },
          {
            quoted: msg
          }
        );
      }

    } catch (error) {

      console.error(
        '[VV] ❌ Failed:',
        error
      );

      try {

        await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Failed to retrieve View Once media.*\n\n' +
              `⚠️ *Reason:* ${
                error?.message ||
                'Unknown error.'
              }`
          },
          {
            quoted: msg
          }
        );

      } catch (sendError) {

        console.error(
          '[VV] ❌ Could not send error message:',
          sendError
        );
      }
    }
  }
};