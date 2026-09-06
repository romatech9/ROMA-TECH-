// ============================================================
// MUFASER-X — TOVIDEO COMMAND
// Convert animated WhatsApp sticker to MP4
// Usage: Reply to an animated sticker with .tovideo
// ============================================================

const {
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const sharp = require('sharp');
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
      `mufaser_tovideo_${id}`
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
      '[ToVideo] ⚠️ Cleanup failed:',
      error?.message || error
    );

  }
}


// ============================================================
// CONVERT ANIMATED WEBP → PNG FRAMES
// ============================================================

async function extractAnimatedWebPFrames(
  inputBuffer,
  outputDir
) {

  console.log(
    '[ToVideo] 🔍 Reading animated WebP...'
  );

  const metadata =
    await sharp(
      inputBuffer,
      {
        animated: true
      }
    ).metadata();

  console.log(
    '[ToVideo] 📐 Metadata:',
    {
      width: metadata.width,
      height: metadata.height,
      pages: metadata.pages,
      pageHeight: metadata.pageHeight,
      delay: metadata.delay
    }
  );

  const pages =
    Number(metadata.pages || 1);

  const width =
    Number(metadata.width || 0);

  const pageHeight =
    Number(
      metadata.pageHeight ||
      (
        metadata.height &&
        pages > 1
          ? Math.floor(metadata.height / pages)
          : metadata.height
      ) ||
      0
    );

  if (
    !width ||
    !pageHeight
  ) {

    throw new Error(
      'Could not determine animated sticker dimensions.'
    );

  }


  // ==========================================================
  // GET ALL FRAMES AS RAW PIXELS
  // ==========================================================

  const rawResult =
    await sharp(
      inputBuffer,
      {
        animated: true
      }
    )
      .ensureAlpha()
      .raw()
      .toBuffer({
        resolveWithObject: true
      });


  const rawData =
    rawResult.data;

  const rawWidth =
    rawResult.info.width;

  const rawHeight =
    rawResult.info.height;

  const channels =
    rawResult.info.channels;


  console.log(
    '[ToVideo] 🖼️ Raw image:',
    {
      width: rawWidth,
      height: rawHeight,
      channels,
      frames: pages
    }
  );


  // ==========================================================
  // DETERMINE ACTUAL PAGE HEIGHT
  // ==========================================================

  let actualPageHeight =
    pageHeight;

  const expectedTotalHeight =
    pageHeight * pages;


  // Sharp/libvips may represent animated images
  // as vertically stacked frames.
  if (
    pages > 1 &&
    rawHeight === expectedTotalHeight
  ) {

    actualPageHeight =
      pageHeight;

  }

  else if (
    pages > 1 &&
    rawHeight % pages === 0
  ) {

    actualPageHeight =
      Math.floor(
        rawHeight / pages
      );

  }

  else {

    actualPageHeight =
      rawHeight;

  }


  const bytesPerRow =
    rawWidth * channels;

  const frameSize =
    bytesPerRow * actualPageHeight;


  // ==========================================================
  // EXTRACT EACH FRAME
  // ==========================================================

  const framePaths = [];


  for (
    let i = 0;
    i < pages;
    i++
  ) {

    const start =
      i * frameSize;

    const end =
      start + frameSize;


    let frameData =
      rawData.subarray(
        start,
        end
      );


    // --------------------------------------------------------
    // Safety check
    // --------------------------------------------------------

    if (
      frameData.length !== frameSize
    ) {

      console.log(
        `[ToVideo] ⚠️ Frame ${i + 1} size mismatch.`
      );

      break;

    }


    const framePath =
      path.join(
        outputDir,
        `frame_${String(i).padStart(4, '0')}.png`
      );


    await sharp(
      frameData,
      {
        raw: {
          width: rawWidth,
          height: actualPageHeight,
          channels
        }
      }
    )
      .png()
      .toFile(
        framePath
      );


    framePaths.push(
      framePath
    );


    console.log(
      `[ToVideo] 🖼️ Extracted frame ${i + 1}/${pages}`
    );

  }


  if (
    framePaths.length === 0
  ) {

    throw new Error(
      'No frames could be extracted from animated WebP.'
    );

  }


  return {
    framePaths,
    delays: metadata.delay || [],
    width: rawWidth,
    height: actualPageHeight
  };

}


// ============================================================
// CREATE FFMPEG CONCAT FILE
// ============================================================

function createConcatFile(
  framePaths,
  delays,
  outputDir
) {

  const concatPath =
    path.join(
      outputDir,
      'frames.txt'
    );


  let content = '';


  for (
    let i = 0;
    i < framePaths.length;
    i++
  ) {

    const frame =
      framePaths[i];

    // --------------------------------------------------------
    // FFmpeg concat requires escaped paths.
    // --------------------------------------------------------

    const safePath =
      frame
        .replace(/\\/g, '/')
        .replace(/'/g, "'\\''");


    content +=
      `file '${safePath}'\n`;


    // --------------------------------------------------------
    // WhatsApp sticker frame delay is milliseconds.
    // --------------------------------------------------------

    let delay =
      Number(
        delays[i] || 100
      );


    if (
      !Number.isFinite(delay) ||
      delay <= 0
    ) {

      delay = 100;

    }


    // Prevent extremely tiny durations.
    const duration =
      Math.max(
        delay / 1000,
        0.04
      );


    content +=
      `duration ${duration}\n`;

  }


  // ----------------------------------------------------------
  // FFmpeg concat needs the final frame repeated.
  // ----------------------------------------------------------

  if (
    framePaths.length > 0
  ) {

    const last =
      framePaths[
        framePaths.length - 1
      ]
        .replace(/\\/g, '/')
        .replace(/'/g, "'\\''");


    content +=
      `file '${last}'\n`;

  }


  fs.writeFileSync(
    concatPath,
    content
  );


  return concatPath;

}


// ============================================================
// RUN FFMPEG
// ============================================================

function createMp4(
  concatPath,
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
        '[ToVideo] 🎬 Creating MP4...'
      );


      const ffmpeg =
        spawn(
          ffmpegPath,
          [

            '-y',

            '-f',
            'concat',

            '-safe',
            '0',

            '-i',
            concatPath,

            // ------------------------------------------------
            // H.264 video
            // ------------------------------------------------

            '-c:v',
            'libx264',

            '-pix_fmt',
            'yuv420p',

            '-preset',
            'veryfast',

            '-crf',
            '23',

            // ------------------------------------------------
            // MP4 compatibility
            // ------------------------------------------------

            '-movflags',
            '+faststart',

            // ------------------------------------------------
            // No audio
            // ------------------------------------------------

            '-an',

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
                'FFmpeg completed but no MP4 was created.'
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
                'Generated MP4 is empty.'
              )
            );

          }


          console.log(
            '[ToVideo] ✅ MP4 created:',
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

  name: 'tovideo',

  aliases: [
    'stickertovideo',
    's2video'
  ],

  desc:
    'Convert animated sticker to video',

  category:
    'Tools',

  usage:
    '.tovideo [reply to animated sticker]',


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
              '❌ *Reply to an animated sticker with .tovideo*'
          },
          {
            quoted: msg
          }
        );

      }


      // ======================================================
      // GET STICKER
      // ======================================================

      const stickerMsg =
        quoted.stickerMessage;


      if (!stickerMsg) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *This is not a sticker.*\n\n' +
              'Reply to an animated sticker to convert it to video.'
          },
          {
            quoted: msg
          }
        );

      }


      // ======================================================
      // CHECK ANIMATED
      // ======================================================

      if (
        stickerMsg.isAnimated !== true
      ) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *This sticker is not animated.*\n\n' +
              'Use .toimage for static stickers.'
          },
          {
            quoted: msg
          }
        );

      }
      // ======================================================
      // DOWNLOAD STICKER
      // ======================================================

      console.log(
        '[ToVideo] ⬇️ Downloading sticker...'
      );


      const stream =
        await downloadContentFromMessage(
          stickerMsg,
          'sticker'
        );


      const chunks = [];


      for await (
        const chunk of stream
      ) {

        chunks.push(chunk);

      }


      const stickerBuffer =
        Buffer.concat(
          chunks
        );


      if (
        !stickerBuffer.length
      ) {

        throw new Error(
          'Downloaded sticker is empty.'
        );

      }


      console.log(
        '[ToVideo] 📦 Downloaded:',
        stickerBuffer.length,
        'bytes'
      );


      // ======================================================
      // TEMP DIRECTORY
      // ======================================================

      tempDir =
        createTempDir();


      // ======================================================
      // EXTRACT FRAMES WITH SHARP
      // ======================================================

      const result =
        await extractAnimatedWebPFrames(
          stickerBuffer,
          tempDir
        );


      console.log(
        '[ToVideo] ✅ Frames extracted:',
        result.framePaths.length
      );


      // ======================================================
      // CREATE CONCAT FILE
      // ======================================================

      const concatPath =
        createConcatFile(
          result.framePaths,
          result.delays,
          tempDir
        );


      // ======================================================
      // OUTPUT
      // ======================================================

      const outputPath =
        path.join(
          tempDir,
          'MUFASER-X.mp4'
        );


      // ======================================================
      // CREATE MP4
      // ======================================================

      const videoBuffer =
        await createMp4(
          concatPath,
          outputPath
        );


      // ======================================================
      // SEND VIDEO
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          video:
            videoBuffer,

          mimetype:
            'video/mp4',

          fileName:
            'MUFASER-X.mp4',

          caption:
            '✅ *Converted to Video*\n\n' +
            '> 🎉*╔POWERED BY MUFASER-X╗*🌹'
        },
        {
          quoted: msg
        }
      );


      console.log(
        '[ToVideo] ✅ Video sent successfully.'
      );


    } catch (error) {

      console.error(
        '[ToVideo] ❌ Error:',
        error
      );


      try {

        await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Failed to convert sticker to video.*\n\n' +
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
          '[ToVideo] ❌ Error sending failure message:',
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