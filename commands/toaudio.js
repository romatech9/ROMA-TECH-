// ============================================================
// MUFASER-X — TOAUDIO COMMAND
// Convert WhatsApp video to normal MP3 audio
//
// Usage:
// Reply to a video with .toaudio
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
      `mufaser_toaudio_${id}`
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
      '[ToAudio] ⚠️ Cleanup failed:',
      error?.message || error
    );

  }

}


// ============================================================
// RUN FFMPEG
// ============================================================

function convertVideoToAudio(
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
        '[ToAudio] 🎵 Extracting audio...'
      );


      const ffmpeg =
        spawn(
          ffmpegPath,
          [

            '-y',

            // ------------------------------------------------
            // INPUT
            // ------------------------------------------------

            '-i',
            inputPath,

            // ------------------------------------------------
            // AUDIO
            // ------------------------------------------------

            '-vn',

            '-c:a',
            'libmp3lame',

            '-b:a',
            '192k',

            '-ar',
            '44100',

            '-ac',
            '2',

            // ------------------------------------------------
            // OUTPUT
            // ------------------------------------------------

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
                'FFmpeg completed but no audio file was created.'
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
                'Generated audio file is empty.'
              )
            );

          }


          console.log(
            '[ToAudio] ✅ MP3 created:',
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

  name: 'toaudio',

  aliases: [
    'tomp3',
    'videotoaudio',
    'v2a'
  ],

  desc:
    'Convert video to normal MP3 audio',

  category:
    'Tools',

  usage:
    '.toaudio [reply to video]',


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
              '❌ *Reply to a video with .toaudio*'
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
              'Reply to a video to extract its audio.'
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
        '[ToAudio] ⬇️ Downloading video...'
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
        '[ToAudio] 📦 Downloaded:',
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
          'MUFASER-X.mp3'
        );


      // ======================================================
      // SAVE VIDEO
      // ======================================================

      fs.writeFileSync(
        inputPath,
        videoBuffer
      );


      // ======================================================
      // CONVERT VIDEO → MP3
      // ======================================================

      const audioBuffer =
        await convertVideoToAudio(
          inputPath,
          outputPath
        );


      // ======================================================
      // SEND AUDIO
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          audio:
            audioBuffer,

          mimetype:
            'audio/mpeg',

          fileName:
            'MUFASER-X.mp3',

          ptt:
            false
        },
        {
          quoted: msg
        }
      );


      console.log(
        '[ToAudio] ✅ Audio sent successfully.'
      );


    } catch (error) {

      console.error(
        '[ToAudio] ❌ Error:',
        error
      );


      try {

        await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Failed to convert video to audio.*\n\n' +
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
          '[ToAudio] ❌ Error sending failure message:',
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