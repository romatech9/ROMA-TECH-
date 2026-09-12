// ============================================================
// MUFASER-X — SET BOT PROFILE PICTURE
//
// Usage:
//
// Reply to any image:
// .setbotpp
//
// The replied image becomes the bot's profile picture.
//
// OWNER ONLY
// ============================================================

const {
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');


// ============================================================
// NORMALIZE NUMBER
// ============================================================

function normalizeNumber(value) {
  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}


// ============================================================
// GET QUOTED IMAGE
// ============================================================

function getQuotedImage(msg) {

  const quoted =
    msg?.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage;

  if (!quoted?.imageMessage) {
    return null;
  }

  return quoted.imageMessage;
}


// ============================================================
// DOWNLOAD IMAGE
// ============================================================

async function downloadImage(imageMessage) {

  const stream =
    await downloadContentFromMessage(
      imageMessage,
      'image'
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

  name: 'setbotpp',

  desc: 'Set bot profile picture',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    try {

      // ======================================================
      // OWNER ONLY
      // ======================================================

      const senderNumber =
        normalizeNumber(
          sender?.number ||
          msg?.key?.participant ||
          msg?.key?.remoteJid
        );

      const ownerNumber =
        normalizeNumber(
          account?.ownerNumber ||
          account?.phone
        );

      const isOwner =
        msg?.key?.fromMe === true ||
        (
          ownerNumber &&
          senderNumber === ownerNumber
        );

      if (!isOwner) {

        return sock.sendMessage(
          jid,
          {
            text:
              `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // GET IMAGE
      // ======================================================

      const imageMessage =
        getQuotedImage(msg);

      if (!imageMessage) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to an image with .setbotpp*'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // DOWNLOAD IMAGE
      // ======================================================

      const image =
        await downloadImage(
          imageMessage
        );


      // ======================================================
      // BOT JID
      // ======================================================

      const botJid =
        sock.user?.id;

      if (!botJid) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Bot WhatsApp ID could not be found.*'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // UPDATE PROFILE PICTURE
      // ======================================================

      await sock.updateProfilePicture(
        botJid,
        image
      );


      console.log(
        `[SetBotPP:${account?.phone || 'unknown'}] ` +
        `✅ Profile picture updated`
      );


      // ======================================================
      // SUCCESS
      // ======================================================

      return sock.sendMessage(
        jid,
        {
          text:
            '✅ *Bot Profile Picture Updated!*\n\n' +
            '🖼️ The replied image is now MUFASER-X profile picture.'
        },
        {
          quoted: msg
        }
      );


    } catch (error) {

      console.error(
        '[SetBotPP] ❌ Failed:',
        error
      );

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to change bot profile picture.*\n\n` +
            `Reason: ${error?.message || 'Unknown error'}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};