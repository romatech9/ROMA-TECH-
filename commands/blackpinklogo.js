// ============================================================
// MUFASER-X — BLACKPINK LOGO
// EPHOTO360
// ============================================================

const axios = require('axios');

module.exports = {
  name: 'blackpinklogo',

  aliases: ['blackpink'],

  desc: 'Create a BlackPink style logo',

  category: 'Image',

  usage: '.blackpinklogo <text>',

  async execute(sock, msg, jid, args, sender, account) {

    try {

      // --------------------------------------------------------
      // GET TEXT
      // --------------------------------------------------------

      const text = args?.join(' ')?.trim();

      if (!text) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Please provide text.*\n\n' +
              '📌 *Example:*\n' +
              '`.blackpinklogo ROMA-TECH`'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // REACT / STATUS
      // --------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          react: {
            text: '🎨',
            key: msg.key
          }
        }
      );

      // --------------------------------------------------------
      // EPHOTO360 EFFECT
      // --------------------------------------------------------

      const effectUrl =
        'https://en.ephoto360.com/' +
        'create-a-blackpink-style-logo-with-members-signatures-810.html';

      console.log(
        `[BlackPink] Creating effect for: ${text}`
      );

      // --------------------------------------------------------
      // REQUEST EPHOTO360 API
      // --------------------------------------------------------

      const response = await axios.get(
        'https://api-pink-venom.vercel.app/api/logo',
        {
          params: {
            url: effectUrl,
            name: text
          },

          timeout: 60000
        }
      );

      const result =
        response?.data?.result;

      const imageUrl =
        result?.download_url;

      if (!imageUrl) {

        console.error(
          '[BlackPink] API response:',
          response?.data
        );

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Failed to create the BlackPink logo.*\n\n' +
              '⚠️ *The image service did not return an image.*'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // SEND IMAGE
      // --------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          image: {
            url: imageUrl
          },

          caption:
            `🎀 *BLACKPINK LOGO*\n\n` +
            `📝 *Text:* ${text}\n\n` +
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
        '[BlackPink] ❌ Error:',
        error?.response?.data ||
        error?.message ||
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to generate BlackPink logo.*\n\n' +
            `⚠️ *Reason:* ${
              error?.response?.data?.message ||
              error?.message ||
              'Image service unavailable.'
            }`
        },
        { quoted: msg }
      );
    }
  }
};