// ============================================================
// MUFASER-X — TOCODE
// Image / Screenshot → Code
// ============================================================

const fs = require('fs');
const path = require('path');
const os = require('os');

const sharp = require('sharp');

const {
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const Tesseract = require('tesseract.js');


// ============================================================
// COMMAND
// ============================================================

module.exports = {

  name: 'tocode',

  aliases: [
    'codefromimage',
    'imgcode'
  ],

  desc: 'Extract code from an image',

  category: 'Tools',

  usage: '.tocode — reply to a code screenshot',


  async execute(sock, msg, jid) {

    let originalPath = null;
    let processedPath = null;

    try {

      // ========================================================
      // FIND REPLIED MESSAGE
      // ========================================================

      const contextInfo =
        msg?.message?.extendedTextMessage
          ?.contextInfo;

      const quoted =
        contextInfo?.quotedMessage;


      if (!quoted) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ Reply to a screenshot/image containing code with .tocode'
          },
          {
            quoted: msg
          }
        );

      }


      // ========================================================
      // CHECK IMAGE
      // ========================================================

      if (!quoted.imageMessage) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ The message you replied to must be an image/screenshot.'
          },
          {
            quoted: msg
          }
        );

      }


      // ========================================================
      // TEMP FILES
      // ========================================================

      const timestamp =
        Date.now();

      originalPath =
        path.join(
          os.tmpdir(),
          `mufaser_tocode_${timestamp}.jpg`
        );

      processedPath =
        path.join(
          os.tmpdir(),
          `mufaser_tocode_processed_${timestamp}.png`
        );


      // ========================================================
      // DOWNLOAD IMAGE
      // ========================================================

      console.log(
        '[TOCODE] Downloading image...'
      );


      const stream =
        await downloadContentFromMessage(
          quoted.imageMessage,
          'image'
        );


      const writeStream =
        fs.createWriteStream(
          originalPath
        );


      for await (
        const chunk of stream
      ) {

        writeStream.write(
          chunk
        );

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


      // ========================================================
      // IMAGE PROCESSING
      //
      // Code screenshots normally have:
      // - small letters
      // - dark backgrounds
      // - syntax colors
      // - thin characters
      //
      // We convert it to a cleaner high-resolution image.
      // ========================================================

      console.log(
        '[TOCODE] Preparing image for OCR...'
      );


      const metadata =
        await sharp(
          originalPath
        ).metadata();


      let width =
        metadata.width || 1000;


      // Enlarge smaller screenshots.
      // This helps Tesseract recognize programming symbols.

      if (width < 1800) {

        width = 1800;

      }


      await sharp(
        originalPath
      )
        .resize({
          width,
          withoutEnlargement: false
        })

        // Convert to grayscale

        .grayscale()

        // Increase contrast

        .normalize()

        // Slight sharpening

        .sharpen()

        // PNG keeps text quality

        .png()

        .toFile(
          processedPath
        );


      // ========================================================
      // OCR
      // ========================================================

      console.log(
        '[TOCODE] Starting local OCR...'
      );


      const result =
        await Tesseract.recognize(
          processedPath,
          'eng',
          {

            logger: info => {

              if (
                info.status ===
                'recognizing text'
              ) {

                console.log(
                  `[TOCODE] OCR: ${Math.round(
                    info.progress * 100
                  )}%`
                );

              }

            }

          }
        );


      // ========================================================
      // GET OCR TEXT
      // ========================================================

      let code =
        result?.data?.text || '';


      code =
        code
          .replace(/\r/g, '')
          .trim();


      if (!code) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ I could not detect code in that image.'
          },
          {
            quoted: msg
          }
        );

      }


      // ========================================================
      // CLEAN COMMON OCR ERRORS
      //
      // We only perform safe cleanup here.
      // Aggressive replacements can destroy real code.
      // ========================================================

      code =
        code
          .replace(/[ \t]+$/gm, '')
          .replace(/\n{4,}/g, '\n\n\n');


      // ========================================================
      // LANGUAGE DETECTION
      // ========================================================

      const lower =
        code.toLowerCase();


      let language =
        'text';


      // HTML

      if (
        /<!doctype\s+html/i.test(code) ||
        /<html[\s>]/i.test(code) ||
        /<\/html>/i.test(code) ||
        /<head[\s>]/i.test(code) ||
        /<body[\s>]/i.test(code)
      ) {

        language =
          'html';

      }


      // JavaScript

      else if (
        /\b(const|let|var)\s+[A-Za-z_$]/.test(code) ||
        /\bfunction\s+[A-Za-z_$]/.test(code) ||
        /=>/.test(code) ||
        /\brequire\s*\(/.test(code) ||
        /\bconsole\.log\s*\(/.test(code)
      ) {

        language =
          'javascript';

      }


      // Python

      else if (
        /\bdef\s+[A-Za-z_]/.test(code) ||
        /\bimport\s+[A-Za-z_]/.test(code) ||
        /\bfrom\s+[A-Za-z_].*\s+import\s+/.test(code) ||
        /\bprint\s*\(/.test(code)
      ) {

        language =
          'python';

      }


      // PHP

      else if (
        /<\?php/i.test(code) ||
        /\$\w+\s*=/.test(code)
      ) {

        language =
          'php';

      }


      // CSS

      else if (
        /\b(color|display|margin|padding|font-size|background)\s*:/.test(
          lower
        ) &&
        /\{[\s\S]*\}/.test(code)
      ) {

        language =
          'css';

      }


      // JSON

      else if (
        /^[\s]*[\{\[]/.test(code) &&
        /["'][A-Za-z0-9_-]+["']\s*:/.test(code)
      ) {

        language =
          'json';

      }


      // ========================================================
      // REMOVE EXCESSIVE EMPTY LINES
      // ========================================================

      code =
        code
          .split('\n')
          .map(line =>
            line.replace(/[ \t]+$/g, '')
          )
          .join('\n')
          .trim();


      // ========================================================
      // WHATSAPP CODE MESSAGE
      // ========================================================

      const header =
        `💻 CODE DETECTED\n\n`;


      const footer =
        `\n\nPowered by MUFASER-X`;


      // ========================================================
      // SPLIT VERY LARGE CODE
      // ========================================================

      const maxCodeLength =
        45000;


      if (
        code.length <=
        maxCodeLength
      ) {

        const response =
`${header}\`\`\`${language}
${code}
\`\`\`${footer}`;


        return sock.sendMessage(
          jid,
          {
            text:
              response
          },
          {
            quoted: msg
          }
        );

      }


      // ========================================================
      // LARGE CODE
      // ========================================================

      const parts = [];


      for (
        let i = 0;
        i < code.length;
        i += maxCodeLength
      ) {

        parts.push(
          code.slice(
            i,
            i + maxCodeLength
          )
        );

      }


      for (
        let i = 0;
        i < parts.length;
        i++
      ) {

        const response =
`💻 CODE DETECTED — PART ${i + 1}/${parts.length}

\`\`\`${language}
${parts[i]}
\`\`\`

> Powered by MUFASER-X`;


        await sock.sendMessage(
          jid,
          {
            text:
              response
          },
          {
            quoted:
              i === 0
                ? msg
                : undefined
          }
        );

      }

    }

    // ==========================================================
    // ERROR
    // ==========================================================

    catch (error) {

      console.error(
        '[TOCODE ERROR]',
        error
      );


      try {

        await sock.sendMessage(
          jid,
          {
            text:
`❌ TOCODE FAILED

Reason:
${error.message}`
          },
          {
            quoted: msg
          }
        );

      }

      catch {}

    }


    // ==========================================================
    // CLEANUP
    // ==========================================================

    finally {

      if (
        originalPath &&
        fs.existsSync(
          originalPath
        )
      ) {

        try {

          fs.unlinkSync(
            originalPath
          );

        }

        catch {}

      }


      if (
        processedPath &&
        fs.existsSync(
          processedPath
        )
      ) {

        try {

          fs.unlinkSync(
            processedPath
          );

        }

        catch {}

      }

    }

  }

};