// ============================================================
// MUFASER-X — TELEGRAM STICKER DOWNLOADER
// STATIC + VIDEO + ANIMATED
// ============================================================

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const TGS = require('tgs-to');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: 'telegramsticker',

  aliases: ['tgsticker', 'tgpack', 'telegrampack'],

  desc: 'Download stickers from a Telegram sticker pack',

  category: 'Downloader',

  usage: '.telegramsticker <Telegram sticker pack URL>',

  async execute(sock, msg, jid, args, sender, account) {

    let tempDir = null;

    try {

      // --------------------------------------------------------
      // TELEGRAM TOKEN
      // --------------------------------------------------------

      const token =
        process.env.TELEGRAM_BOT_TOKEN;

      if (!token) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Telegram Bot Token is not configured.*\n\n' +
              '⚙️ Add `TELEGRAM_BOT_TOKEN` to your `.env` file.'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // URL
      // --------------------------------------------------------

      const url =
        args?.join(' ')?.trim();

      if (!url) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Please provide a Telegram sticker pack URL.*\n\n' +
              '*Example:*\n' +
              '`.telegramsticker https://t.me/addstickers/xinzoruo_stickers`'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // EXTRACT PACK NAME
      // --------------------------------------------------------

      let packName = null;

      try {

        const parsed =
          new URL(url);

        const parts =
          parsed.pathname
            .split('/')
            .filter(Boolean);

        if (
          parts.length >= 2 &&
          parts[0].toLowerCase() === 'addstickers'
        ) {
          packName = parts[1];
        }

      } catch (e) {}

      if (!packName) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Invalid Telegram sticker pack URL.*\n\n' +
              '*Use:*\n' +
              '`https://t.me/addstickers/PACK_NAME`'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // REACTION
      // --------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          react: {
            text: '⏳',
            key: msg.key
          }
        }
      );

      // --------------------------------------------------------
      // TELEGRAM API
      // --------------------------------------------------------

      const api =
        `https://api.telegram.org/bot${token}`;

      const setResponse =
        await axios.get(
          `${api}/getStickerSet`,
          {
            params: {
              name: packName
            },
            timeout: 30000
          }
        );

      if (
        !setResponse.data?.ok ||
        !setResponse.data?.result
      ) {
        throw new Error(
          setResponse.data?.description ||
          'Telegram could not find this sticker pack.'
        );
      }

      const stickerSet =
        setResponse.data.result;

      const stickers =
        stickerSet.stickers || [];

      if (!stickers.length) {
        throw new Error(
          'This sticker pack contains no stickers.'
        );
      }

      // --------------------------------------------------------
      // LIMIT
      // --------------------------------------------------------

      const maxStickers = 30;

      const selected =
        stickers.slice(0, maxStickers);

      // --------------------------------------------------------
      // TEMP DIRECTORY
      // --------------------------------------------------------

      tempDir =
        fs.mkdtempSync(
          path.join(
            os.tmpdir(),
            'mufaser-tg-'
          )
        );

      // --------------------------------------------------------
      // PACK INFORMATION
      // --------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          text:
            `📦 *TELEGRAM STICKER PACK*\n\n` +
            `🎨 *Name:* ${stickerSet.title || packName}\n` +
            `🔢 *Total:* ${stickers.length}\n` +
            `📥 *Downloading:* ${selected.length}\n\n` +
            `🖼️ Static\n` +
            `🎥 Video\n` +
            `🎞️ Animated\n\n` +
            `⏳ *Please wait...*`
        },
        { quoted: msg }
      );

      let sent = 0;
      let skipped = 0;

      let staticCount = 0;
      let videoCount = 0;
      let animatedCount = 0;

      // --------------------------------------------------------
      // DOWNLOAD LOOP
      // --------------------------------------------------------

      for (
        let i = 0;
        i < selected.length;
        i++
      ) {

        const sticker =
          selected[i];

        try {

          if (!sticker.file_id) {
            skipped++;
            continue;
          }

          // ----------------------------------------------------
          // GET FILE PATH
          // ----------------------------------------------------

          const fileResponse =
            await axios.get(
              `${api}/getFile`,
              {
                params: {
                  file_id: sticker.file_id
                },
                timeout: 30000
              }
            );

          const filePath =
            fileResponse.data?.result?.file_path;

          if (!filePath) {
            skipped++;
            continue;
          }

          // ----------------------------------------------------
          // DOWNLOAD FILE
          // ----------------------------------------------------

          const downloadResponse =
            await axios.get(
              `https://api.telegram.org/file/bot${token}/${filePath}`,
              {
                responseType: 'arraybuffer',
                timeout: 60000
              }
            );

          // ====================================================
          // VIDEO STICKER
          // ====================================================

          if (sticker.is_video) {

            videoCount++;

            const webmPath =
              path.join(
                tempDir,
                `video_${i}.webm`
              );

            const mp4Path =
              path.join(
                tempDir,
                `video_${i}.mp4`
              );

            fs.writeFileSync(
              webmPath,
              downloadResponse.data
            );

            // --------------------------------------------------
            // CONVERT WEBM → MP4
            // --------------------------------------------------

            await new Promise(
              (resolve, reject) => {

                ffmpeg(webmPath)
                  .outputOptions([
                    '-movflags +faststart',
                    '-pix_fmt yuv420p'
                  ])
                  .videoCodec('libx264')
                  .noAudio()
                  .on(
                    'end',
                    resolve
                  )
                  .on(
                    'error',
                    reject
                  )
                  .save(mp4Path);

              }
            );

            // --------------------------------------------------
            // SEND VIDEO
            // --------------------------------------------------

            await sock.sendMessage(
              jid,
              {
                video: {
                  url: mp4Path
                },
                mimetype:
                  'video/mp4',
                gifPlayback: true
              }
            );

            sent++;

          }

          // ====================================================
          // ANIMATED TGS STICKER
          // ====================================================

          else if (sticker.is_animated) {

            animatedCount++;

            const tgsPath =
              path.join(
                tempDir,
                `animated_${i}.tgs`
              );

            const mp4Path =
              path.join(
                tempDir,
                `animated_${i}.mp4`
              );

            fs.writeFileSync(
              tgsPath,
              downloadResponse.data
            );

            // --------------------------------------------------
            // TGS → MP4
            // --------------------------------------------------

            const converter =
              new TGS(tgsPath);

            await converter.convertToMp4(
              mp4Path
            );

            // --------------------------------------------------
            // SEND ANIMATION
            // --------------------------------------------------

            await sock.sendMessage(
              jid,
              {
                video: {
                  url: mp4Path
                },
                mimetype:
                  'video/mp4',
                gifPlayback: true
              }
            );

            sent++;

          }

          // ====================================================
          // STATIC WEBP STICKER
          // ====================================================

          else {

            staticCount++;

            const inputPath =
              path.join(
                tempDir,
                `static_${i}.webp`
              );

            fs.writeFileSync(
              inputPath,
              downloadResponse.data
            );

            // --------------------------------------------------
            // SEND STICKER
            // --------------------------------------------------

            await sock.sendMessage(
              jid,
              {
                sticker: {
                  url: inputPath
                }
              }
            );

            sent++;

          }

          // ----------------------------------------------------
          // DELAY
          // ----------------------------------------------------

          await new Promise(
            resolve =>
              setTimeout(resolve, 400)
          );

        } catch (stickerError) {

          console.error(
            `[TelegramSticker] Sticker ${i + 1} error:`,
            stickerError?.message
          );

          skipped++;
        }
      }

      // --------------------------------------------------------
      // RESULT
      // --------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          text:
            `✅ *TELEGRAM STICKER PACK DONE*\n\n` +
            `📦 *Pack:* ${stickerSet.title || packName}\n\n` +
            `🖼️ *Static:* ${staticCount}\n` +
            `🎥 *Video:* ${videoCount}\n` +
            `🎞️ *Animated:* ${animatedCount}\n\n` +
            `📤 *Sent:* ${sent}\n` +
            `⏭️ *Skipped:* ${skipped}\n\n` +
            `⚡ *Powered By MUFASER-X*`
        },
        { quoted: msg }
      );

      // --------------------------------------------------------
      // SUCCESS REACTION
      // --------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          react: {
            text: '✅',
            key: msg.key
          }
        }
      );

    } catch (error) {

      console.error(
        '[TelegramSticker] ❌ Failed:',
        error?.response?.data ||
        error?.message ||
        error
      );

      await sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to download Telegram stickers.*\n\n` +
            `⚠️ *Reason:* ${
              error?.response?.data?.description ||
              error?.message ||
              'Unknown error.'
            }`
        },
        { quoted: msg }
      );

    } finally {

      // --------------------------------------------------------
      // CLEAN TEMP FILES
      // --------------------------------------------------------

      if (tempDir) {

        try {

          fs.rmSync(
            tempDir,
            {
              recursive: true,
              force: true
            }
          );

        } catch (cleanupError) {

          console.error(
            '[TelegramSticker] Cleanup error:',
            cleanupError?.message
          );
        }
      }
    }
  }
};