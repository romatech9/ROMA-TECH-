// ============================================================
// MUFASER-X — PREMIUM GREETINGS
// Developer: ROMA-TECH 🇺🇬
// Commands:
// .gudmorning
// .gudafternoon
// .gudevening
// .gudnight
// .godbless
// ============================================================

module.exports = {

  name: 'gudmorning',

  aliases: [
    'gudafternoon',
    'gudevening',
    'gudnight',
    'godbless',

    'goodmorning',
    'goodafternoon',
    'goodevening',
    'goodnight'
  ],

  desc: 'Beautiful greetings and blessings',

  category: 'Fun',

  usage:
    '.gudmorning / .gudafternoon / .gudevening / .gudnight / .godbless',


  async execute(sock, msg, jid, args, sender) {

    try {

      // ========================================================
      // DETECT COMMAND
      // ========================================================

      const rawText =
        msg?.message?.conversation ||
        msg?.message?.extendedTextMessage?.text ||
        '';

      const cmd =
        rawText
          .trim()
          .split(/\s+/)[0]
          .replace(/^[.\/!#]/, '')
          .toLowerCase();


      // ========================================================
      // USER NAME
      // ========================================================

      const pushName =
        msg?.pushName ||
        sender?.split('@')[0] ||
        'Comrade';


      // ========================================================
      // GREETINGS
      // ========================================================

      const replies = {

        // ──────────────────────────────────────────────────────
        // MORNING
        // ──────────────────────────────────────────────────────

        gudmorning: {
          react: '🌅',

          text:
            `🌅 *GOOD MORNING, ${pushName}!*\n\n` +

            `☀️ A beautiful new day has arrived.\n` +
            `Leave yesterday behind and step into today ` +
            `with confidence, courage and a grateful heart. 💫\n\n` +

            `🌱 *May your efforts bring you success,*\n` +
            `❤️ *your heart find peace,*\n` +
            `🙏 *and your day be filled with blessings.*\n\n` +

            `✨ Keep believing. Keep pushing. Keep shining.\n\n` +

            `Have a beautiful day, Comrade! 🤝🇺🇬`
        },

        goodmorning: {
          react: '🌅',

          text:
            `🌅 *GOOD MORNING, ${pushName}!*\n\n` +

            `☀️ A beautiful new day has arrived.\n` +
            `Leave yesterday behind and step into today ` +
            `with confidence, courage and a grateful heart. 💫\n\n` +

            `🌱 *May your efforts bring you success,*\n` +
            `❤️ *your heart find peace,*\n` +
            `🙏 *and your day be filled with blessings.*\n\n` +

            `✨ Keep believing. Keep pushing. Keep shining.\n\n` +

            `Have a beautiful day, Comrade! 🤝🇺🇬`
        },


        // ──────────────────────────────────────────────────────
        // AFTERNOON
        // ──────────────────────────────────────────────────────

        gudafternoon: {
          react: '🌤️',

          text:
            `🌤️ *GOOD AFTERNOON, ${pushName}!*\n\n` +

            `💫 Half the day may be gone, but there is still ` +
            `plenty of time to make something amazing happen.\n\n` +

            `💪 Keep going.\n` +
            `🎯 Stay focused.\n` +
            `❤️ Don't forget to take care of yourself.\n\n` +

            `May the rest of your day bring you good news, ` +
            `peace of mind and reasons to smile. 😊\n\n` +

            `✨ Keep pushing, Comrade!`
        },

        goodafternoon: {
          react: '🌤️',

          text:
            `🌤️ *GOOD AFTERNOON, ${pushName}!*\n\n` +

            `💫 Half the day may be gone, but there is still ` +
            `plenty of time to make something amazing happen.\n\n` +

            `💪 Keep going.\n` +
            `🎯 Stay focused.\n` +
            `❤️ Don't forget to take care of yourself.\n\n` +

            `May the rest of your day bring you good news, ` +
            `peace of mind and reasons to smile. 😊\n\n` +

            `✨ Keep pushing, Comrade!`
        },


        // ──────────────────────────────────────────────────────
        // EVENING
        // ──────────────────────────────────────────────────────

        gudevening: {
          react: '🌆',

          text:
            `🌆 *GOOD EVENING, ${pushName}!*\n\n` +

            `✨ The day is slowly coming to an end.\n\n` +

            `Whatever happened today, be proud that you made it ` +
            `this far. Some battles were won, some lessons were learned, ` +
            `and tomorrow is another opportunity. 🌙\n\n` +

            `🕊️ Let your mind rest.\n` +
            `❤️ Let your heart breathe.\n` +
            `🙏 Be grateful for another day.\n\n` +

            `Enjoy your evening, Comrade. 🤝✨`
        },

        goodevening: {
          react: '🌆',

          text:
            `🌆 *GOOD EVENING, ${pushName}!*\n\n` +

            `✨ The day is slowly coming to an end.\n\n` +

            `Whatever happened today, be proud that you made it ` +
            `this far. Some battles were won, some lessons were learned, ` +
            `and tomorrow is another opportunity. 🌙\n\n` +

            `🕊️ Let your mind rest.\n` +
            `❤️ Let your heart breathe.\n` +
            `🙏 Be grateful for another day.\n\n` +

            `Enjoy your evening, Comrade. 🤝✨`
        },


        // ──────────────────────────────────────────────────────
        // NIGHT
        // ──────────────────────────────────────────────────────

        gudnight: {
          react: '🌙',

          text:
            `🌙 *GOOD NIGHT, ${pushName}!*\n\n` +

            `✨ The world can wait until tomorrow.\n` +
            `Tonight, give yourself permission to rest.\n\n` +

            `🕊️ May your worries become lighter,\n` +
            `❤️ your heart become peaceful,\n` +
            `😴 and your sleep be calm and refreshing.\n\n` +

            `🙏 May tomorrow bring you new strength, ` +
            `new opportunities and beautiful reasons to smile.\n\n` +

            `🌌 Sleep well, Comrade.\n` +
            `Tomorrow is another chance to shine. ✨`
        },

        goodnight: {
          react: '🌙',

          text:
            `🌙 *GOOD NIGHT, ${pushName}!*\n\n` +

            `✨ The world can wait until tomorrow.\n` +
            `Tonight, give yourself permission to rest.\n\n` +

            `🕊️ May your worries become lighter,\n` +
            `❤️ your heart become peaceful,\n` +
            `😴 and your sleep be calm and refreshing.\n\n` +

            `🙏 May tomorrow bring you new strength, ` +
            `new opportunities and beautiful reasons to smile.\n\n` +

            `🌌 Sleep well, Comrade.\n` +
            `Tomorrow is another chance to shine. ✨`
        },


        // ──────────────────────────────────────────────────────
        // GOD BLESS
        // ──────────────────────────────────────────────────────

        godbless: {
          react: '🙏',

          text:
            `🙏 *GOD BLESS YOU, ${pushName}!*\n\n` +

            `❤️ May God watch over you,\n` +
            `🛡️ protect you from every danger,\n` +
            `🧭 guide your steps,\n` +
            `🚪 open the right doors,\n` +
            `💪 give you strength when life gets difficult,\n` +
            `🌱 and bless the work of your hands.\n\n` +

            `✨ May peace live in your heart,\n` +
            `✨ hope stay in your soul,\n` +
            `✨ and blessings follow you wherever you go.\n\n` +

            `🤲 *May God bless you and your loved ones.*\n\n` +

            `❤️ *Amen.*`
        }

      };


      // ========================================================
      // GET RESPONSE
      // ========================================================

      const data =
        replies[cmd] ||
        replies.gudmorning;


      // ========================================================
      // REACTION
      // ========================================================

      try {

        await sock.sendMessage(
          jid,
          {
            react: {
              text: data.react,
              key: msg.key
            }
          }
        );

      } catch (_) {}


      // ========================================================
      // SEND GREETING
      // ========================================================

      return await sock.sendMessage(
        jid,
        {
          text: data.text
        },
        {
          quoted: msg
        }
      );


    } catch (error) {

      console.error(
        '[Greetings] Error:',
        error?.message || error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            `❌ *Something went wrong.*\n\n` +
            `Please try the greeting command again.`
        },
        {
          quoted: msg
        }
      );

    }

  }

};