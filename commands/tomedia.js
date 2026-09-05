const axios = require('axios');

module.exports = {
  name: 'tomedia',

  aliases: [
    'sendurl',
    'mediaurl'
  ],

  desc: 'Send media from a direct URL',

  category: 'Media',

  usage: '.tomedia <direct media URL> OR reply to a URL',

  async execute(sock, msg, jid, args) {
    try {

      // ============================================================
      // GET TEXT FROM MESSAGE
      // ============================================================

      const getMessageText = (message) => {

        if (!message) return '';

        return (
          message.conversation ||

          message.extendedTextMessage?.text ||

          message.imageMessage?.caption ||

          message.videoMessage?.caption ||

          message.documentMessage?.caption ||

          message.buttonsResponseMessage?.selectedButtonId ||

          message.listResponseMessage?.singleSelectReply
            ?.selectedRowId ||

          ''
        );
      };


      // ============================================================
      // EXTRACT URL FROM TEXT
      // ============================================================

      const extractUrl = (text) => {

        if (!text) return '';

        const match =
          text.match(
            /https?:\/\/[^\s<>"']+/i
          );

        if (!match) return '';

        return match[0]
          .replace(/[)\]}>.,!?]+$/g, '');
      };


      // ============================================================
      // 1. URL TYPED AFTER COMMAND
      // ============================================================

      let url =
        args
          .join(' ')
          .trim();


      // ============================================================
      // 2. IF NO URL, CHECK REPLIED MESSAGE
      // ============================================================

      if (!url) {

        const quoted =
          msg?.message?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage;

        const quotedText =
          getMessageText(quoted);

        url =
          extractUrl(quotedText);
      }


      // ============================================================
      // 3. ALSO SUPPORT REPLY CONTEXT URL
      // ============================================================

      if (!url) {

        const contextInfo =
          msg?.message?.extendedTextMessage
            ?.contextInfo;

        const quotedText =
          getMessageText(
            contextInfo?.quotedMessage
          );

        url =
          extractUrl(quotedText);
      }


      // ============================================================
      // VALIDATE URL
      // ============================================================

      if (
        !url ||
        !/^https?:\/\//i.test(url)
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ Send a direct media URL or reply to a message containing one.'
          },
          {
            quoted: msg
          }
        );
      }


      // ============================================================
      // DOWNLOAD
      // ============================================================

      console.log(
        `[TOMEDIA] Downloading: ${url}`
      );


      const res =
        await axios.get(
          url,
          {
            responseType:
              'arraybuffer',

            maxContentLength:
              50 * 1024 * 1024,

            maxBodyLength:
              50 * 1024 * 1024,

            timeout:
              60000,

            headers: {
              'User-Agent':
                'Mozilla/5.0'
            }
          }
        );


      const buffer =
        Buffer.from(
          res.data
        );


      const type =
        String(
          res.headers[
            'content-type'
          ] || ''
        ).toLowerCase();


      console.log(
        `[TOMEDIA] Type: ${type}`
      );


      // ============================================================
      // IMAGE
      // ============================================================

      if (
        type.startsWith(
          'image/'
        )
      ) {

        return sock.sendMessage(
          jid,
          {
            image: buffer
          },
          {
            quoted: msg
          }
        );
      }


      // ============================================================
      // VIDEO
      // ============================================================

      if (
        type.startsWith(
          'video/'
        )
      ) {

        return sock.sendMessage(
          jid,
          {
            video: buffer,
            mimetype: type
          },
          {
            quoted: msg
          }
        );
      }


      // ============================================================
      // AUDIO / VOICE
      // ============================================================

      if (
        type.startsWith(
          'audio/'
        )
      ) {

        return sock.sendMessage(
          jid,
          {
            audio: buffer,

            mimetype:
              type,

            ptt:
              /ogg|opus/i.test(
                type
              )
          },
          {
            quoted: msg
          }
        );
      }


      // ============================================================
      // TEXT
      // ============================================================

      if (
        type.startsWith(
          'text/'
        )
      ) {

        return sock.sendMessage(
          jid,
          {
            text:
              buffer.toString()
          },
          {
            quoted: msg
          }
        );
      }


      // ============================================================
      // OTHER FILES / DOCUMENTS
      // ============================================================

      const fileName =
        url
          .split('/')
          .pop()
          ?.split('?')[0]
          || 'file';


      return sock.sendMessage(
        jid,
        {
          document: buffer,

          mimetype:
            type ||
            'application/octet-stream',

          fileName
        },
        {
          quoted: msg
        }
      );


    } catch (error) {

      console.error(
        '[TOMEDIA ERROR]',
        error
      );


      return sock.sendMessage(
        jid,
        {
          text:
            `❌ Failed to download media.\n\n` +
            `Reason: ${error.message}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};