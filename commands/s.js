// ============================================================
// MUFASER-X — STICKER COMMAND
//
// Usage:
//
// Reply to an image:
// .s
//
// Reply to a video:
// .s
//
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');


// ============================================================
// RUN FFMPEG
// ============================================================

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {

    execFile(
      'ffmpeg',
      args,
      {
        windowsHide: true
      },
      (error, stdout, stderr) => {

        if (error) {
          reject(
            new Error(
              stderr?.trim() ||
              error.message
            )
          );

          return;
        }

        resolve({
          stdout,
          stderr
        });
      }
    );
  });
}


// ============================================================
// DOWNLOAD MEDIA
// ============================================================

async function downloadMedia(message, type) {

  const stream =
    await downloadContentFromMessage(
      message,
      type
    );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}


// ============================================================
// COMMAND
// ============================================================

module.exports = {

  name: 's',

  desc: 'Create sticker from image or video',

  async execute(sock, msg, jid, args, sender, account) {

    let inputFile = '';
    let outputFile = '';

    try {
      // ======================================================
      // FIND MEDIA
      // ======================================================

      const message =
        msg.message;

      let mediaMessage = null;
      let mediaType = null;


      // ------------------------------------------------------
      // IMAGE
      // ------------------------------------------------------

      if (message?.imageMessage) {

        mediaMessage =
          message.imageMessage;

        mediaType =
          'image';
      }


      // ------------------------------------------------------
      // VIDEO
      // ------------------------------------------------------

      else if (message?.videoMessage) {

        mediaMessage =
          message.videoMessage;

        mediaType =
          'video';
      }


      // ------------------------------------------------------
      // REPLIED MESSAGE
      // ------------------------------------------------------

      else {

        const contextInfo =
          message?.extendedTextMessage?.contextInfo;

        const quotedMessage =
          contextInfo?.quotedMessage;

        if (quotedMessage?.imageMessage) {

          mediaMessage =
            quotedMessage.imageMessage;

          mediaType =
            'image';

        } else if (quotedMessage?.videoMessage) {

          mediaMessage =
            quotedMessage.videoMessage;

          mediaType =
            'video';
        }
      }


      // ======================================================
      // NO MEDIA
      // ======================================================

      if (!mediaMessage) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to an image or video with .s*'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // TEMP FILES
      // ======================================================

      const id =
        crypto.randomBytes(8).toString('hex');

      inputFile =
        path.join(
          os.tmpdir(),
          `mufaser_${id}_input`
        );

      outputFile =
        path.join(
          os.tmpdir(),
          `mufaser_${id}.webp`
        );


      // ======================================================
      // DOWNLOAD
      // ===================================================
      
           const buffer =
        await downloadMedia(
          mediaMessage,
          mediaType
        );

      await writeFile(
        inputFile,
        buffer
      );


      // ======================================================
      // IMAGE → WEBP STICKER
      // ======================================================

      if (mediaType === 'image') {

        await runFFmpeg([
          '-y',

          '-i',
          inputFile,

          '-vf',
          'scale=512:512:force_original_aspect_ratio=decrease,' +
          'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0',

          '-vcodec',
          'libwebp',

          '-lossless',
          '0',

          '-compression_level',
          '6',

          '-q:v',
          '70',

          '-preset',
          'picture',

          outputFile
        ]);
      }


      // ======================================================
      // VIDEO → ANIMATED WEBP
      // ======================================================

      if (mediaType === 'video') {

        await runFFmpeg([
          '-y',

          '-i',
          inputFile,

          '-t',
          '6',

          '-vf',
          'fps=15,' +
          'scale=512:512:force_original_aspect_ratio=decrease,' +
          'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0',

          '-c:v',
          'libwebp',

          '-loop',
          '0',

          '-preset',
          'default',

          '-an',

          outputFile
        ]);
      }


      // ======================================================
      // SEND STICKER
      // ======================================================

      const sticker =
        require('fs').readFileSync(
          outputFile
        );

      await sock.sendMessage(
        jid,
        {
          sticker
        },
        {
          quoted: msg
        }
      );


    } catch (error) {

      console.error(
        '[Sticker] ❌ Error:',
        error
      );

      await sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to create sticker.*\n\n` +
            `${error?.message || 'Unknown error'}`
        },
        {
          quoted: msg
        }
      );

    } finally {

      // ======================================================
      // CLEAN TEMP FILES
      // ======================================================

      const fs =
        require('fs');

      try {
        if (inputFile && fs.existsSync(inputFile)) {
          fs.unlinkSync(inputFile);
        }
      } catch {}

      try {
        if (outputFile && fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      } catch {}
    }
  }
};