// ============================================================
// MUFASER-X — TOCODE
// Convert screenshot/image of code → text/code
// NO API REQUIRED
// ============================================================

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const Tesseract = require('tesseract.js');

module.exports = {

  name: 'tocode',

  aliases: [
    'codefromimage',
    'imgcode'
  ],

  desc: 'Convert an image containing code into text',

  category: 'Tools',

  usage: '.tocode (reply to image)',

  async execute(sock, msg, jid) {

    let filePath = null;

    try {

      // --------------------------------------------------------
      // GET REPLIED MESSAGE
      // --------------------------------------------------------

      const quoted =
        msg.message?.extendedTextMessage?.contextInfo
          ?.quotedMessage;

      if (!quoted) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ Reply to an image containing code with .tocode'
          },
          { quoted: msg }
        );

      }

      // --------------------------------------------------------
      // CHECK IMAGE
      // --------------------------------------------------------

      if (!quoted.imageMessage) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ The replied message must be an image/screenshot.'
          },
          { quoted: msg }
        );

      }

      // --------------------------------------------------------
      // DOWNLOAD IMAGE
      // --------------------------------------------------------

      const imageMessage =
        quoted.imageMessage;

      const stream =
        await downloadContentFromMessage(
          imageMessage,
          'image'
        );

      filePath =
        path.join(
          os.tmpdir(),
          `mufaser_tocode_${Date.now()}.jpg`
        );

      const writeStream =
        fs.createWriteStream(filePath);

      for await (const chunk of stream) {

        writeStream.write(chunk);

      }

      writeStream.end();

      await new Promise(
        (resolve, reject) => {

          writeStream.on(
            'finish',
            resolve
          );

          writeStream.on(
            'error',
            reject
          );

        }
      );

      // --------------------------------------------------------
      // OCR
      // --------------------------------------------------------

      console.log(
        '[TOCODE] Starting local OCR...'
      );

      const result =
        await Tesseract.recognize(
          filePath,
          'eng',
          {
            logger: info => {

              if (
                info.status === 'recognizing text'
              ) {

                console.log(
                  `[TOCODE] OCR ${Math.round(
                    info.progress * 100
                  )}%`
                );

              }

            }
          }
        );

      // --------------------------------------------------------
      // GET TEXT
      // --------------------------------------------------------

      let code =
        result?.data?.text || '';

      code =
        code.trim();

      if (!code) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ I could not detect readable text in that image.'
          },
          { quoted: msg }
        );

      }

      // --------------------------------------------------------
      // CLEAN OCR OUTPUT
      // --------------------------------------------------------

      code =
        code
          .replace(/\r/g, '')
          .trim();

      // --------------------------------------------------------
      // DETECT CODE LANGUAGE
      // --------------------------------------------------------

      let language = 'text';

      const lower =
        code.toLowerCase();

      if (
        lower.includes('<!doctype html') ||
        lower.includes('<html') ||
        lower.includes('</html>')
      ) {

        language = 'html';

      }

      else if (
        lower.includes('function ') ||
        lower.includes('const ') ||
        lower.includes('let ') ||
        lower.includes('=>') ||
        lower.includes('require(')
      ) {

        language = 'javascript';

      }

      else if (
        lower.includes('<?php')
      ) {

        language = 'php';

      }

      else if (
        lower.includes('import ') &&
        lower.includes('def ')
      ) {

        language = 'python';

      }

      else if (
        lower.includes('{') &&
        lower.includes('}') &&
        (
          lower.includes('color:') ||
          lower.includes('display:') ||
          lower.includes('margin:')
        )
      ) {

        language = 'css';

      }

      // --------------------------------------------------------
      // SEND RESULT
      // --------------------------------------------------------

      const response =
`💻 CODE DETECTED

\`\`\`${language}
${code}
\`\`\`

> Powered by MUFASER-X`;

      // WhatsApp messages have practical size limits.
      // Split very large OCR results.

      const maxLength = 60000;

      if (response.length <= maxLength) {

        return await sock.sendMessage(
          jid,
          {
            text: response
          },
          { quoted: msg }
        );

      }

      // --------------------------------------------------------
      // LARGE CODE
      // --------------------------------------------------------

      const parts = [];

      for (
        let i = 0;
        i < code.length;
        i += 50000
      ) {

        parts.push(
          code.slice(i, i + 50000)
        );

      }

      for (
        let i = 0;
        i < parts.length;
        i++
      ) {

        await sock.sendMessage(
          jid,
          {
            text:
`💻 CODE DETECTED — PART ${i + 1}/${parts.length}

\`\`\`${language}
${parts[i]}
\`\`\``
          },
          { quoted: i === 0 ? msg : undefined }
        );

      }

    }

    catch (error) {

      console.error(
        '[TOCODE ERROR]',
        error
      );

      await sock.sendMessage(
        jid,
        {
          text:
`❌ OCR failed.

Reason:
${error.message}`
        },
        { quoted: msg }
      );

    }

    finally {

      // --------------------------------------------------------
      // CLEAN TEMP FILE
      // --------------------------------------------------------

      if (
        filePath &&
        fs.existsSync(filePath)
      ) {

        try {

          fs.unlinkSync(
            filePath
          );

        }

        catch (error) {

          console.error(
            '[TOCODE CLEANUP ERROR]',
            error
          );

        }

      }

    }

  }

};