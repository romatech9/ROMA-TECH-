const axios = require('axios');

// ============================================================
// MUFASER-X — SOUND COMMAND
// ROMA-TECH
// ============================================================
//
// .sound  → Show available sounds
// .sound1 → Send Sound 1
// .sound2 → Send Sound 2
// .sound3 → Send Sound 3
// .sound4 → Send Sound 4
// .sound5 → Send Sound 5
//
// ============================================================


// ============================================================
// SOUND SETTINGS
// ============================================================

const sounds = {

  sound1: {
    name: 'Sound 1',
    url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643779/wf3imagjeja0gdwpt8jb.mp4'
  },

  sound2: {
    name: 'Sound 2',
    url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788642940/lwil81mztdetzhic4hwm.mp3'
  },

  sound3: {
    name: 'Sound 3',
    url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643169/qgqb8eloumjdutseqdfj.mp4'
  },

  sound4: {
    name: 'Sound 4',
    url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788644510/tgckwpujhdyg6ndqt1mw.mp4'
  },

  sound5: {
    name: 'Sound 5',
    url: 'https://res.cloudinary.com/vaitzgwv/video/upload/v1788643123/hgnjzupuskd7f6wih9qd.mp4'
  }

};


// ============================================================
// SHOW SOUND MENU
// ============================================================

function soundMenu(sock, msg, jid) {

  return sock.sendMessage(
    jid,
    {
      text:
        `🎵 *MUFASER-X SOUNDS*\n\n` +

        `1️⃣ .sound1 — Sound 1\n` +
        `2️⃣ .sound2 — Sound 2\n` +
        `3️⃣ .sound3 — Sound 3\n` +
        `4️⃣ .sound4 — Sound 4\n` +
        `5️⃣ .sound5 — Sound 5\n\n` +

        `🎧 Choose any sound you want.`
    },
    {
      quoted: msg
    }
  );

}


// ============================================================
// CHECK URL
// ============================================================

function isConfigured(url) {

  if (!url) {
    return false;
  }

  if (
    url.includes(
      'PASTE_SOUND_'
    )
  ) {
    return false;
  }

  return true;

}


// ============================================================
// SEND SOUND
// ============================================================

async function sendSound(
  sock,
  msg,
  jid,
  sound
) {

  try {

    // --------------------------------------------------------
    // CHECK IF SOUND HAS BEEN CONFIGURED
    // --------------------------------------------------------

    if (
      !isConfigured(
        sound.url
      )
    ) {

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *${sound.name}* has not been configured yet.`
        },
        {
          quoted: msg
        }
      );

    }


    // --------------------------------------------------------
    // DOWNLOAD AUDIO
    // --------------------------------------------------------

    const response =
      await axios.get(
        sound.url,
        {
          responseType:
            'arraybuffer',

          maxContentLength:
            50 * 1024 * 1024,

          maxBodyLength:
            50 * 1024 * 1024,

          timeout:
            120000,

          headers: {
            'User-Agent':
              'Mozilla/5.0'
          }
        }
      );


    const buffer =
      Buffer.from(
        response.data
      );


    // --------------------------------------------------------
    // SEND AUDIO
    // --------------------------------------------------------

    return sock.sendMessage(
      jid,
      {
        audio: buffer,

        mimetype:
          response.headers[
            'content-type'
          ] ||
          'audio/mpeg',

        ptt: false
      },
      {
        quoted: msg
      }
    );


  } catch (error) {

    console.error(
      `[${sound.name} ERROR]`,
      error
    );

    return sock.sendMessage(
      jid,
      {
        text:
          `❌ Failed to send ${sound.name}.`
      },
      {
        quoted: msg
      }
    );

  }

}


// ============================================================
// COMMAND
// ============================================================

module.exports = {

  name: 'sound',

  aliases: [
    'sounds',
    'sound1',
    'sound2',
    'sound3',
    'sound4',
    'sound5',
    's1',
    's2',
    's3',
    's4',
    's5'
  ],

  desc:
    'Play MUFASER-X sounds',

  category:
    'Media',

  usage:
    '.sound',

  async execute(
    sock,
    msg,
    jid,
    args
  ) {

    try {

      // ======================================================
      // DETERMINE WHICH SOUND WAS REQUESTED
      // ======================================================

      let commandName =
        '';

      if (
        msg.message
      ) {

        commandName =
          Object.keys(
            msg.message
          ).length
            ? ''
            : '';

      }


      // ======================================================
      // GET COMMAND FROM MESSAGE TEXT
      // ======================================================

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';


      const command =
        text
          .trim()
          .split(/\s+/)[0]
          .toLowerCase()
          .replace(/^\./, '');


      // ======================================================
      // .sound
      // ======================================================

      if (
        command === 'sound' ||
        command === 'sounds'
      ) {

        return soundMenu(
          sock,
          msg,
          jid
        );

      }


      // ======================================================
      // SOUND 1
      // ======================================================

      if (
        command === 'sound1' ||
        command === 's1'
      ) {

        return sendSound(
          sock,
          msg,
          jid,
          sounds.sound1
        );

      }


      // ======================================================
      // SOUND 2
      // ======================================================

      if (
        command === 'sound2' ||
        command === 's2'
      ) {

        return sendSound(
          sock,
          msg,
          jid,
          sounds.sound2
        );

      }


      // ======================================================
      // SOUND 3
      // ======================================================

      if (
        command === 'sound3' ||
        command === 's3'
      ) {

        return sendSound(
          sock,
          msg,
          jid,
          sounds.sound3
        );

      }


      // ======================================================
      // SOUND 4
      // ======================================================

      if (
        command === 'sound4' ||
        command === 's4'
      ) {

        return sendSound(
          sock,
          msg,
          jid,
          sounds.sound4
        );

      }


      // ======================================================
      // SOUND 5
      // ======================================================

      if (
        command === 'sound5' ||
        command === 's5'
      ) {

        return sendSound(
          sock,
          msg,
          jid,
          sounds.sound5
        );

      }


      // ======================================================
      // FALLBACK
      // ======================================================

      return soundMenu(
        sock,
        msg,
        jid
      );


    } catch (error) {

      console.error(
        '[SOUND COMMAND ERROR]',
        error
      );

      return sock.sendMessage(
        jid,
        {
          text:
            '❌ Sound command failed.'
        },
        {
          quoted: msg
        }
      );

    }

  }

};