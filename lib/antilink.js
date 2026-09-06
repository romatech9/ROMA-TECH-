// ============================================================
// MUFASER-X — PROFESSIONAL ANTILINK PROTECTION
// By ROMA-TECH
// ============================================================

const WARNING_LIMIT = 5;

// ============================================================
// LINK DETECTION
// ============================================================

const LINK_REGEX =
  /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|telegram\.me\/|facebook\.com\/|fb\.watch\/|instagram\.com\/|instagr\.am\/|tiktok\.com\/|youtube\.com\/|youtu\.be\/)[^\s]+/i;


// ============================================================
// GET MESSAGE TEXT
// ============================================================

function getMessageText(msg) {

  const message =
    msg?.message || {};

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


// ============================================================
// JID HELPERS
// ============================================================

const cleanJid = (value) => {

  if (!value) return '';

  return String(value)
    .trim()
    .toLowerCase();

};


const getNumber = (value) => {

  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');

};


// ============================================================
// PARTICIPANT MATCH
// ============================================================

const participantMatches = (
  participant,
  targetJid,
  targetNumber
) => {

  if (!participant) return false;

  const participantId =
    cleanJid(participant.id);

  const target =
    cleanJid(targetJid);

  // Exact JID
  if (
    participantId &&
    target &&
    participantId === target
  ) {
    return true;
  }

  // Number
  const participantNumber =
    getNumber(participant.id);

  if (
    targetNumber &&
    participantNumber &&
    participantNumber === targetNumber
  ) {
    return true;
  }

  // phoneNumber fallback
  const participantPhone =
    getNumber(
      participant.phoneNumber
    );

  if (
    targetNumber &&
    participantPhone &&
    participantPhone === targetNumber
  ) {
    return true;
  }

  // LID fallback
  const participantLid =
    cleanJid(participant.lid);

  if (
    participantLid &&
    target &&
    participantLid === target
  ) {
    return true;
  }

  return false;
};


// ============================================================
// ADMIN CHECK
// ============================================================

function isAdmin(participant) {

  return (
    participant?.admin === 'admin' ||
    participant?.admin === 'superadmin'
  );

}


// ============================================================
// GET SETTINGS
// ============================================================

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


// ============================================================
// HANDLE ANTILINK
// ============================================================

async function handleAntiLink(
  sock,
  msg,
  account
) {

  try {

    const jid =
      msg?.key?.remoteJid;

    // --------------------------------------------------------
    // GROUP ONLY
    // --------------------------------------------------------

    if (
      typeof jid !== 'string' ||
      !jid.endsWith('@g.us')
    ) {
      return false;
    }

    // --------------------------------------------------------
    // IGNORE SYSTEM MESSAGES
    // --------------------------------------------------------

    if (
      msg?.message?.protocolMessage ||
      msg?.message?.reactionMessage
    ) {
      return false;
    }

    // --------------------------------------------------------
    // GET TEXT
    // --------------------------------------------------------

    const text =
      getMessageText(msg);

    if (
      !text ||
      !LINK_REGEX.test(text)
    ) {
      return false;
    }

    // --------------------------------------------------------
    // SETTINGS
    // --------------------------------------------------------

    const settings =
      getSettings(account, jid);

    if (
      !['warn', 'delete', 'kick']
        .includes(settings.mode)
    ) {
      return false;
    }

    // --------------------------------------------------------
    // GROUP METADATA
    // --------------------------------------------------------

    const metadata =
      await sock.groupMetadata(jid);

    if (!metadata) {
      return false;
    }

    const participants =
      metadata.participants || [];

    // ========================================================
    // FIND BOT
    // ========================================================

    const botJid =
      sock?.user?.id || '';

    const botNumber =
      getNumber(botJid);

    const botParticipant =
      participants.find(
        participant =>
          participantMatches(
            participant,
            botJid,
            botNumber
          )
      );

    const isBotAdmin =
      isAdmin(botParticipant);

    console.log(
      '[AntiLink] 🤖 Bot:',
      {
        botJid,
        botNumber,
        found:
          botParticipant?.id || null,
        admin:
          botParticipant?.admin || null,
        isBotAdmin
      }
    );

    // --------------------------------------------------------
    // BOT MUST BE ADMIN
    // --------------------------------------------------------

    if (!isBotAdmin) {

      await sock.sendMessage(
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

      return true;
    }

    // ========================================================
    // FIND COMMAND SENDER
    // SAME PATTERN AS WORKING .MUTE / .PROMOTE
    // ========================================================

    const senderJid =
      msg?.key?.participant ||
      account?.sender?.jid ||
      msg?.participant ||
      (
        msg?.key?.fromMe === true
          ? botJid
          : ''
      );

    // ========================================================
    // SENDER NUMBER
    // ========================================================

    const senderNumber =
      getNumber(
        account?.sender?.number ||
        senderJid ||
        botJid
      );

    // ========================================================
    // FIND SENDER PARTICIPANT
    // ========================================================

    let senderParticipant =
      participants.find(
        participant =>
          participantMatches(
            participant,
            senderJid,
            senderNumber
          )
      );

    // ========================================================
    // FROM-ME FALLBACK
    // ========================================================

    if (
      !senderParticipant &&
      msg?.key?.fromMe === true
    ) {

      senderParticipant =
        participants.find(
          participant =>
            participantMatches(
              participant,
              botJid,
              botNumber
            )
        );
    }

    // ========================================================
    // CHECK SENDER ADMIN
    // ========================================================

    const senderIsAdmin =
      msg?.key?.fromMe === true ||
      isAdmin(senderParticipant);

    console.log(
      '[AntiLink] 👤 Sender:',
      {
        senderJid,
        senderNumber,
        found:
          senderParticipant?.id || null,
        admin:
          senderParticipant?.admin || null,
        fromMe:
          msg?.key?.fromMe === true,
        isAdmin:
          senderIsAdmin
      }
    );

    // ========================================================
    // ADMINS ARE ALWAYS EXEMPT
    // ========================================================

    if (senderIsAdmin) {
      return false;
    }

    // ========================================================
    // DELETE LINK
    // ========================================================

    try {

      await sock.sendMessage(
        jid,
        {
          delete: msg.key
        }
      );

    } catch (error) {

      console.log(
        '[AntiLink Delete Error]',
        error.message
      );

    }

    // ========================================================
    // DELETE MODE
    // ========================================================

    if (
      settings.mode === 'delete'
    ) {

      console.log(
        `[AntiLink] 🗑️ Deleted link from ${senderJid}`
      );

      return true;
    }

    // ========================================================
    // KICK MODE
    // ========================================================

    if (
      settings.mode === 'kick'
    ) {

      try {

        await sock.groupParticipantsUpdate(
          jid,
          [senderJid],
          'remove'
        );

        await sock.sendMessage(
          jid,
          {
            text:
              `🚫 @${senderNumber} has been removed ` +
              `from the group for sending links.`,
            mentions: [
              senderJid
            ]
          }
        );

      } catch (error) {

        console.log(
          '[AntiLink Kick Error]',
          error.message
        );

        await sock.sendMessage(
          jid,
          {
            text:
              `❌ I couldn't remove @${senderNumber}.`,
            mentions: [
              senderJid
            ]
          }
        );

      }

      return true;
    }

    // ========================================================
    // WARNING MODE
    // ========================================================

    if (
      settings.mode === 'warn'
    ) {

      if (
        !settings.warnings[senderJid]
      ) {

        settings.warnings[senderJid] = 0;

      }

      settings.warnings[senderJid]++;

      const count =
        settings.warnings[senderJid];

      // ------------------------------------------------------
      // 5 WARNINGS = KICK
      // ------------------------------------------------------

      if (
        count >= WARNING_LIMIT
      ) {

        try {

          await sock.groupParticipantsUpdate(
            jid,
            [senderJid],
            'remove'
          );

          await sock.sendMessage(
            jid,
            {
              text:
                `🚫 @${senderNumber} has been removed ` +
                `from the group for sending links.`,
              mentions: [
                senderJid
              ]
            }
          );

          delete settings.warnings[
            senderJid
          ];

        } catch (error) {

          console.log(
            '[AntiLink Warning Kick Error]',
            error.message
          );

          await sock.sendMessage(
            jid,
            {
              text:
                `⚠️ @${senderNumber} reached ` +
                `${WARNING_LIMIT}/${WARNING_LIMIT} warnings, ` +
                `but I couldn't remove them.`,
              mentions: [
                senderJid
              ]
            }
          );

        }

        return true;
      }

      // ------------------------------------------------------
      // WARNING MESSAGE
      // ------------------------------------------------------

      await sock.sendMessage(
        jid,
        {
          text:
            `🚫 @${senderNumber} Links are not allowed ` +
            `in this group. Please stop.\n\n` +
            `⚠️ Warning: ${count}/${WARNING_LIMIT}`,
          mentions: [
            senderJid
          ]
        }
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


// ============================================================
// RESET WARNINGS
// ============================================================

function resetAntiLinkWarnings(
  account,
  jid,
  userJid
) {

  const settings =
    getSettings(account, jid);

  delete settings.warnings[
    userJid
  ];

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  handleAntiLink,
  resetAntiLinkWarnings
};