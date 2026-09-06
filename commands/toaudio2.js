// ============================================================
// MUFASER-X — TOAUDIO2 COMMAND
// Convert WhatsApp video to voice note
//
// Usage:
// Reply to a video with .toaudio2
// ============================================================

const {
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const ffmpegPath = require('ffmpeg-static');

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');


// ============================================================
// CREATE TEMP DIRECTORY
// ============================================================

function createTempDir() {

  const id =
    crypto.randomBytes(8).toString('hex');

  const dir =
    path.join(
      os.tmpdir(),
      `mufaser_toaudio2_${id}`
    );

  fs.mkdirSync(
    dir,
    {
      recursive: true
    }
  );

  return dir;
}


// ============================================================
// REMOVE TEMP DIRECTORY
// ============================================================

function removeTempDir(dir) {

  try {

    if (
      dir &&
      fs.existsSync(dir)
    ) {

      fs.rmSync(
        dir,
        {
          recursive: true,
          force: true
        }
      );

    }

  } catch (error) {

    console.error(
      '[ToAudio2] ⚠️ Cleanup failed:',
      error?.message || error
    );

  }

}


// ============================================================
// CONVERT VIDEO → OGG OPUS
// ============================================================

function convertVideoToVoiceNote(
  inputPath,
  outputPath
) {

  return new Promise(
    (resolve, reject) => {

      if (!ffmpegPath) {

        return reject(
          new Error(
            'FFmpeg binary was not found.'
          )
        );

      }


      console.log(
        '[ToAudio2] 🎙️ Creating voice note...'
      );


      const ffmpeg =
        spawn(
          ffmpegPath,
          [

            '-y',

            // ------------------------------------------------
            // INPUT VIDEO
            // ------------------------------------------------

            '-i',
            inputPath,

            // ------------------------------------------------
            // REMOVE VIDEO
            // ------------------------------------------------

            '-vn',

            // ------------------------------------------------
            // OPUS AUDIO
            // ------------------------------------------------

            '-c:a',
            'libopus',

            '-b:a',
            '64k',

            '-vbr',
            'on',

            '-compression_level',
            '10',

            '-application',
            'voip',

            // ------------------------------------------------
            // VOICE NOTE FORMAT
            // ------------------------------------------------

            '-ar',
            '48000',

            '-ac',
            '1',

            // ------------------------------------------------
            // OUTPUT OGG
            // ------------------------------------------------

            '-f',
            'ogg',

            outputPath

          ]
        );


      let stderr = '';


      ffmpeg.stderr.on(
        'data',
        data => {

          stderr +=
            data.toString();

        }
      );


      ffmpeg.on(
        'error',
        error => {

          reject(error);

        }
      );


      ffmpeg.on(
        'close',
        code => {

          if (
            code !== 0
          ) {

            return reject(
              new Error(
                `FFmpeg failed with code ${code}\n` +
                stderr.slice(-3000)
              )
            );

          }


          if (
            !fs.existsSync(outputPath)
          ) {

            return reject(
              new Error(
                'FFmpeg completed but no voice note was created.'
              )
            );

          }


          const stats =
            fs.statSync(
              outputPath
            );


          if (
            stats.size === 0
          ) {

            return reject(
              new Error(
                'Generated voice note is empty.'
              )
            );

          }


          console.log(
            '[ToAudio2] ✅ Voice note created:',
            stats.size,
            'bytes'
          );


          resolve(
            fs.readFileSync(
              outputPath
            )
          );

        }
      );

    }
  );

}


// ============================================================
// COMMAND
// ============================================================

module.exports = {

  name: 'toaudio2',

  aliases: [
    'tovn',
    'videotovn',
    'v2vn'
  ],

  desc:
    'Convert video to WhatsApp voice note',

  category:
    'Tools',

  usage:
    '.toaudio2 [reply to video]',


  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    let tempDir = null;


    try {

      // ======================================================
      // CHECK REPLY
      // ======================================================

      const quoted =
        msg?.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.quotedMessage;


      if (!quoted) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to a video with .toaudio2*'
          },
          {
            quoted: msg
          }
        );

      }


      // ======================================================
      // GET VIDEO
      // ======================================================

      const videoMsg =
        quoted.videoMessage;


      if (!videoMsg) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *This is not a video.*\n\n' +
              'Reply to a video to create a voice note.'
          },
          {
            quoted: msg
          }
        );

      }


      // ======================================================
      // DOWNLOAD VIDEO
      // ======================================================

      console.log(
        '[ToAudio2] ⬇️ Downloading video...'
      );


      const stream =
        await downloadContentFromMessage(
          videoMsg,
          'video'
        );


      const chunks = [];


      for await (
        const chunk of stream
      ) {

        chunks.push(chunk);

      }


      const videoBuffer =
        Buffer.concat(
          chunks
        );


      if (
        !videoBuffer.length
      ) {

        throw new Error(
          'Downloaded video is empty.'
        );

      }


      console.log(
        '[ToAudio2] 📦 Downloaded:',
        videoBuffer.length,
        'bytes'
      );


      // ======================================================
      // TEMP DIRECTORY
      // ======================================================

      tempDir =
        createTempDir();


      const inputPath =
        path.join(
          tempDir,
          'input_video'
        );


      const outputPath =
        path.join(
          tempDir,
          'MUFASER-X.ogg'
        );


      // ======================================================
      // SAVE VIDEO
      // ======================================================

      fs.writeFileSync(
        inputPath,
        videoBuffer
      );


      // ======================================================
      // CONVERT VIDEO → VOICE NOTE
      // ======================================================

      const voiceNoteBuffer =
        await convertVideoToVoiceNote(
          inputPath,
          outputPath
        );


      // ======================================================
      // SEND VOICE NOTE
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          audio:
            voiceNoteBuffer,

          mimetype:
            'audio/ogg; codecs=opus',

          ptt:
            true
        },
        {
          quoted: msg
        }
      );


      console.log(
        '[ToAudio2] ✅ Voice note sent successfully.'
      );


    } catch (error) {

      console.error(
        '[ToAudio2] ❌ Error:',
        error
      );


      try {

        await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Failed to convert video to voice note.*\n\n' +
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
          '[ToAudio2] ❌ Error sending failure message:',
          sendError
        );

      }


    } finally {

      // ======================================================
      // CLEAN TEMP FILES
      // ======================================================

      if (tempDir) {

        removeTempDir(
          tempDir
        );

      }

    }

  }

};