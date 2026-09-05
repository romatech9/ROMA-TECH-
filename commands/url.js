// ============================================================
// MUFASER-X — URL COMMAND
// Upload replied media/files to Cloudinary
// ROMA-TECH
// ============================================================

const fs = require('fs');
const path = require('path');
const os = require('os');

const cloudinary =
  require('cloudinary').v2;


// ============================================================
// CLOUDINARY CONFIG
// ============================================================

cloudinary.config({

  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET

});


// ============================================================
// COMMAND
// ============================================================

module.exports = {

  name: 'url',

  aliases: [
    'geturl',
    'uploadurl'
  ],

  desc:
    'Upload replied media or file to Cloudinary',

  category:
    'Media',

  usage:
    '.url',

  async execute(
    sock,
    msg,
    jid
  ) {

    let filePath = null;

    try {

      // ========================================================
      // CHECK REPLIED MESSAGE
      // ========================================================

      const quoted =
        msg.message?.extendedTextMessage
          ?.contextInfo?.quotedMessage;

      if (!quoted) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ Reply to an image, video, audio or file with .url'
          },
          {
            quoted: msg
          }
        );

      }


      // ========================================================
      // DETERMINE MEDIA TYPE
      // ========================================================

      let messageType = null;
      let extension = 'bin';


      if (quoted.imageMessage) {

        messageType =
          'imageMessage';

        extension =
          'jpg';

      }

      else if (quoted.videoMessage) {

        messageType =
          'videoMessage';

        extension =
          'mp4';

      }

      else if (quoted.audioMessage) {

        messageType =
          'audioMessage';

        extension =
          'mp3';

      }

      else if (quoted.documentMessage) {

        messageType =
          'documentMessage';


        const fileName =
          quoted.documentMessage.fileName;


        if (fileName) {

          const ext =
            path.extname(
              fileName
            );

          if (ext) {

            extension =
              ext.replace(
                '.',
                ''
              );

          }

        }

      }

      else {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ Unsupported file type.'
          },
          {
            quoted: msg
          }
        );

      }


      // ========================================================
      // GET MEDIA MESSAGE
      // ========================================================

      const mediaMessage =
        quoted[
          messageType
        ];


      // ========================================================
      // CREATE TEMP FILE
      // ========================================================

      const fileName =
        `mufaser_${Date.now()}.${extension}`;


      filePath =
        path.join(
          os.tmpdir(),
          fileName
        );


      // ========================================================
      // DOWNLOAD MEDIA
      // ========================================================

      const {
        downloadContentFromMessage
      } =
        require(
          '@whiskeysockets/baileys'
        );


      const stream =
        await downloadContentFromMessage(
          mediaMessage,
          messageType.replace(
            'Message',
            ''
          )
        );


      const writeStream =
        fs.createWriteStream(
          filePath
        );


      await new Promise(
        async (
          resolve,
          reject
        ) => {

          try {

            for await (
              const chunk of stream
            ) {

              writeStream.write(
                chunk
              );

            }

            writeStream.end();

            writeStream.on(
              'finish',
              resolve
            );

            writeStream.on(
              'error',
              reject
            );

          }

          catch (error) {

            reject(
              error
            );

          }

        }
      );


      // ========================================================
      // UPLOAD TO CLOUDINARY
      // ========================================================

      const result =
        await cloudinary.uploader.upload(
          filePath,
          {
            resource_type:
              'auto'
          }
        );


      const url =
        result.secure_url;


      // ========================================================
      // SEND RESULT
      // ========================================================

      return sock.sendMessage(
        jid,
        {
          text:
            `✅ Upload complete\n\n` +
            `🔗 Link:\n${url}\n\n` +
            `Powered: By\n` +
            `MUFASER-X`
        },
        {
          quoted: msg
        }
      );


    }

    catch (error) {

      console.error(
        '[URL COMMAND ERROR]',
        error
      );


      return sock.sendMessage(
        jid,
        {
          text:
            `❌ Upload error:\n${error.message}`
        },
        {
          quoted: msg
        }
      );

    }


    finally {

      // ========================================================
      // DELETE TEMP FILE
      // ========================================================

      if (
        filePath &&
        fs.existsSync(
          filePath
        )
      ) {

        try {

          fs.unlinkSync(
            filePath
          );

        }

        catch (error) {

          console.error(
            '[URL CLEANUP ERROR]',
            error
          );

        }

      }

    }

  }

};