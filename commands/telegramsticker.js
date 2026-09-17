// ============================================================
// MUFASER-X — TELEGRAM STICKER DOWNLOADER
// ============================================================

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
      // CHECK TELEGRAM TOKEN
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
      // GET URL
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
      // EXTRACT STICKER PACK NAME
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

      } catch (e) {
        // handled below
      }

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
      // GET STICKER SET
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
      // CREATE TEMP DIRECTORY
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
            `🔢 *Stickers:* ${stickers.length}\n` +
            `📥 *Downloading:* ${selected.length}\n\n` +
            `⏳ *Please wait...*`
        },
        { quoted: msg }
      );

      let sent = 0;
      let skipped = 0;

      // --------------------------------------------------------
      // DOWNLOAD STICKERS
      // --------------------------------------------------------

      for (const sticker of selected) {

        try {

          // Only static stickers for this version
          if (
            !sticker.file_id ||
            sticker.is_animated ||
            sticker.is_video
          ) {
            skipped++;
            continue;
          }

          // ----------------------------------------------------
          // GET TELEGRAM FILE
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
          // DOWNLOAD WEBP
          // ----------------------------------------------------

          const imageResponse =
            await axios.get(
              `https://api.telegram.org/file/bot${token}/${filePath}`,
              {
                responseType: 'arraybuffer',
                timeout: 60000
              }
            );

          const inputPath =
            path.join(
              tempDir,
              `${sent + 1}.webp`
            );

          fs.writeFileSync(
            inputPath,
            imageResponse.data
          );

          // ----------------------------------------------------
          // SEND AS WHATSAPP STICKER
          // ----------------------------------------------------

          await sock.sendMessage(
            jid,
            {
              sticker: {
                url: inputPath
              }
            }
          );

          sent++;

          // Small delay to avoid sending too fast
          await new Promise(
            resolve => setTimeout(resolve, 300)
          );

        } catch (stickerError) {

          console.error(
            '[TelegramSticker] Sticker error:',
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
            `📦 *Pack:* ${stickerSet.title || packName}\n` +
            `📥 *Sent:* ${sent}\n` +
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

      return await sock.sendMessage(
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