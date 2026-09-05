// ============================================================
// MUFASER-X — PROFESSIONAL ANTILINK PROTECTION
// By ROMA-TECH
// ============================================================

const WARNING_LIMIT = 5;

// ------------------------------------------------------------
// LINK DETECTION
// ------------------------------------------------------------

const LINK_REGEX =
  /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|telegram\.me\/|facebook\.com\/|fb\.watch\/|instagram\.com\/|instagr\.am\/|tiktok\.com\/|youtube\.com\/|youtu\.be\/)[^\s]+/i;


// ------------------------------------------------------------
// GET MESSAGE TEXT
// ------------------------------------------------------------

function getMessageText(msg) {

  const message =
    msg.message || {};

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.buttonsResponseMessage?.selectedDisplayText ||
    message.listResponseMessage?.title ||
    ''
  );
}


// ------------------------------------------------------------
// GET BOT JID
// ------------------------------------------------------------

function getBotJid(sock) {

  const id = sock.user?.id;

  if (!id) return '';

  return id.split(':')[0].split('@')[0] +
    '@s.whatsapp.net';
}


// ------------------------------------------------------------
// GET SENDER JID
// ------------------------------------------------------------

function getSenderJid(msg) {

  return (
    msg.key?.participant ||
    msg.participant ||
    ''
  );
}


// ------------------------------------------------------------
// CHECK ADMIN
// ------------------------------------------------------------

function isAdmin(participant) {

  return (
    participant?.admin === 'admin' ||
    participant?.admin === 'superadmin'
  );
}


// ------------------------------------------------------------
// GET SETTINGS
// ------------------------------------------------------------

function getSettings(account, jid) {

  if (!account.antilink) {
    account.antilink = {};
  }

  if (!account.antilink[jid]) {

    account.antilink[jid] = {
      mode: 'off',
      warnings: {}
    };

  }

  if (
    !account.antilink[jid].warnings
  ) {
    account.antilink[jid].warnings = {};
  }

  return account.antilink[jid];
}


// ------------------------------------------------------------
// PUBLIC HANDLER
// ------------------------------------------------------------

async function handleAntiLink(
  sock,
  msg,
  account
) {

  try {

    const jid =
      msg.key?.remoteJid;

    // Only groups
    if (!jid || !jid.endsWith('@g.us')) {
      return false;
    }

    // Ignore protocol/system messages
    if (
      msg.message?.protocolMessage ||
      msg.message?.reactionMessage
    ) {
      return false;
    }

    const text =
      getMessageText(msg);

    // No link
    if (!text || !LINK_REGEX.test(text)) {
      return false;
    }

    const settings =
      getSettings(account, jid);

    // Protection disabled
    if (settings.mode === 'off') {
      return false;
    }

    const sender =
      getSenderJid(msg);

    const botJid =
      getBotJid(sock);

    // Never punish the bot
    if (
      sender === botJid ||
      sender?.split(':')[0] ===
        botJid.split('@')[0]
    ) {
      return false;
    }

    // --------------------------------------------------------
    // GET GROUP INFORMATION
    // --------------------------------------------------------

    const metadata =
      await sock.groupMetadata(jid);

    const participants =
      metadata.participants || [];

    // --------------------------------------------------------
    // CHECK BOT ADMIN
    // --------------------------------------------------------

    const botNumber =
      botJid.split('@')[0];

    const botParticipant =
      participants.find(p => {

        const id =
          p.id?.split(':')[0]
            .split('@')[0];

        const lid =
          p.lid?.split(':')[0]
            .split('@')[0];

        return (
          id === botNumber ||
          lid === botNumber
        );

      });

    const isBotAdmin =
      isAdmin(botParticipant);

    // --------------------------------------------------------
    // BOT MUST BE ADMIN
    // --------------------------------------------------------

    if (!isBotAdmin) {

      console.log(
        `[AntiLink] Bot is not admin in ${jid}`
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *ANTILINK*\n\n' +
            'I need to be a group admin ' +
            'to protect this group.'
        },
        {
          quoted: msg
        }
      );

    }

    // --------------------------------------------------------
    // FIND SENDER
    // --------------------------------------------------------

    const senderNumber =
      sender
        ?.split(':')[0]
        ?.split('@')[0];

    const senderParticipant =
      participants.find(p => {

        const id =
          p.id?.split(':')[0]
            .split('@')[0];

        const lid =
          p.lid?.split(':')[0]
            .split('@')[0];

        return (
          id === senderNumber ||
          lid === senderNumber
        );

      });

    // --------------------------------------------------------
    // ADMINS ARE EXEMPT
    // --------------------------------------------------------

    if (isAdmin(senderParticipant)) {
      return false;
    }

    // --------------------------------------------------------
    // DELETE LINK MESSAGE
    // --------------------------------------------------------

    try {

      await sock.sendMessage(
        jid,
        {
          delete: msg.key
        }
      );

    } catch (deleteError) {

      console.log(
        '[AntiLink Delete Error]',
        deleteError.message
      );

    }

    // --------------------------------------------------------
    // DELETE-ONLY MODE
    // --------------------------------------------------------

    if (settings.mode === 'delete') {

      console.log(
        `[AntiLink] Deleted link from ${sender}`
      );

      return true;
    }

    // --------------------------------------------------------
    // KICK MODE
    // --------------------------------------------------------

    if (settings.mode === 'kick') {

      try {

        await sock.groupParticipantsUpdate(
          jid,
          [sender],
          'remove'
        );

        await sock.sendMessage(
          jid,
          {
            text:
              `🚫 @${senderNumber} has been removed ` +
              `from the group for sending links.`,
            mentions: [sender]
          }
        );

        console.log(
          `[AntiLink] Kicked ${sender}`
        );

      } catch (kickError) {

        console.log(
          '[AntiLink Kick Error]',
          kickError.message
        );

        await sock.sendMessage(
          jid,
          {
            text:
              `❌ I couldn't remove @${senderNumber}.\n` +
              `Please make sure I have admin permission.`,
            mentions: [sender]
          }
        );

      }

      return true;
    }

    // --------------------------------------------------------
    // WARNING MODE
    // --------------------------------------------------------

    if (settings.mode === 'warn') {

      if (!settings.warnings[sender]) {
        settings.warnings[sender] = 0;
      }

      settings.warnings[sender]++;

      const count =
        settings.warnings[sender];

      // ------------------------------------------------------
      // 5TH WARNING = KICK
      // ------------------------------------------------------

      if (count >= WARNING_LIMIT) {

        try {

          await sock.groupParticipantsUpdate(
            jid,
            [sender],
            'remove'
          );

          await sock.sendMessage(
            jid,
            {
              text:
                `🚫 @${senderNumber} has been removed ` +
                `from the group for sending links.\n\n` +
                `⚠️ Warnings: ${WARNING_LIMIT}/${WARNING_LIMIT}`,
              mentions: [sender]
            }
          );

          delete settings.warnings[sender];

          console.log(
            `[AntiLink] ${sender} removed after ${WARNING_LIMIT} warnings`
          );

        } catch (kickError) {

          console.log(
            '[AntiLink Warning Kick Error]',
            kickError.message
          );

          await sock.sendMessage(
            jid,
            {
              text:
                `⚠️ @${senderNumber} reached ` +
                `${WARNING_LIMIT}/${WARNING_LIMIT} warnings, ` +
                `but I couldn't remove them.\n\n` +
                `Please make sure I am a group admin.`,
              mentions: [sender]
            }
          );

        }

        return true;
      }

      // ------------------------------------------------------
      // NORMAL WARNING
      // ------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          text:
            `🚫 @${senderNumber} Links are not allowed ` +
            `in this group. Please stop.\n\n` +
            `⚠️ Warning: ${count}/${WARNING_LIMIT}`,
          mentions: [sender]
        }
      );

      console.log(
        `[AntiLink] Warning ${count}/${WARNING_LIMIT} for ${sender}`
      );

      return true;
    }

    return true;

  } catch (error) {

    console.error(
      '[AntiLink Error]',
      error
    );

    return false;
  }
}


// ------------------------------------------------------------
// RESET USER WARNINGS
// ------------------------------------------------------------

function resetAntiLinkWarnings(
  account,
  jid,
  userJid
) {

  const settings =
    getSettings(account, jid);

  delete settings.warnings[userJid];
}


// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------

module.exports = {
  handleAntiLink,
  resetAntiLinkWarnings
};