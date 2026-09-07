// ============================================================
// MUFASER-X — PROFESSIONAL ANTILINK PROTECTION — FIXED BY MUTE STRUCTURE
// By ROMA-TECH
// ============================================================

const WARNING_LIMIT = 5;

const LINK_REGEX = /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|telegram\.me\/|facebook\.com\/|fb\.watch\/|instagram\.com\/|instagr\.am\/|tiktok\.com\/|youtube\.com\/|youtu\.be\/)[^\s]+/i;

function getMessageText(msg) {
  const message = msg?.message || {};
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

function getSettings(account, jid) {
  if (!account.antilink) account.antilink = {};
  if (!account.antilink[jid]) {
    account.antilink[jid] = { mode: 'off', warnings: {} };
  }
  if (!account.antilink[jid].warnings) {
    account.antilink[jid].warnings = {};
  }
  return account.antilink[jid];
}

async function handleAntiLink(sock, msg, account) {
  try {
    const jid = msg?.key?.remoteJid;
    if (typeof jid!== 'string' ||!jid.endsWith('@g.us')) return false;
    if (msg?.message?.protocolMessage || msg?.message?.reactionMessage) return false;

    const text = getMessageText(msg);
    if (!text ||!LINK_REGEX.test(text)) return false;

    const settings = getSettings(account, jid);
    if (!['warn', 'delete', 'kick'].includes(settings.mode)) return false;

    // ======================================================
    // GET GROUP METADATA
    // ======================================================
    const metadata = await sock.groupMetadata(jid);
    if (!metadata) return false;
    const participants = metadata.participants || [];

    // ======================================================
    // HELPERS - SAME AS WORKING MUTE COMMAND
    // ======================================================
    const cleanJid = (value) => {
      if (!value) return '';
      return String(value).trim().toLowerCase();
    };
    const getNumber = (value) => {
      if (!value) return '';
      return String(value).split('@')[0].split(':')[0].replace(/\D/g, '');
    };
    const participantMatches = (participant, targetJid, targetNumber) => {
      if (!participant) return false;
      const participantId = cleanJid(participant.id);
      const target = cleanJid(targetJid);
      if (participantId && target && participantId === target) return true;
      const participantNumber = getNumber(participant.id);
      if (targetNumber && participantNumber && participantNumber === targetNumber) return true;
      const participantPhone = getNumber(participant.phoneNumber);
      if (targetNumber && participantPhone && participantPhone === targetNumber) return true;
      return false;
    };

    // ======================================================
    // FIND BOT - SAME AS MUTE
    // ======================================================
    const botJid = sock?.user?.id || '';
    const botNumber = getNumber(botJid);
    const botParticipant = participants.find(participant =>
      participantMatches(participant, botJid, botNumber)
    );
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

    console.log('[AntiLink] Bot:', { botJid, botNumber, found: botParticipant?.id || null, admin: botParticipant?.admin || null, isBotAdmin });

    if (!isBotAdmin) {
      await sock.sendMessage(jid, { text: '❌ *ANTILINK*\n\nI need to be a group admin to protect this group.' }, { quoted: msg });
      return true;
    }

    // ======================================================
    // FIND COMMAND SENDER - SAME AS MUTE
    // ======================================================
    // In your handler, 'sender' is inside account.sender, so we support both
    const senderObj = account?.sender || msg?.sender || {};

    const senderJid =
      msg?.key?.participant ||
      senderObj?.jid ||
      msg?.participant ||
      (msg?.key?.fromMe? botJid : '');

    const senderNumber = getNumber(senderObj?.number || senderJid);

    let senderParticipant = participants.find(participant =>
      participantMatches(participant, senderJid, senderNumber)
    );

    if (!senderParticipant && msg?.key?.fromMe === true) {
      senderParticipant = participants.find(participant =>
        participantMatches(participant, botJid, botNumber)
      );
    }

    const isAdmin =
      msg?.key?.fromMe === true ||
      senderParticipant?.admin === 'admin' ||
      senderParticipant?.admin === 'superadmin';

    console.log('[AntiLink] Sender:', { senderJid, senderNumber, found: senderParticipant?.id || null, admin: senderParticipant?.admin || null, isAdmin });

    if (isAdmin) return false;

    // ======================================================
    // DELETE + ACTIONS
    // ======================================================
    try { await sock.sendMessage(jid, { delete: msg.key }); } catch (e) { console.log('[AntiLink Delete Error]', e.message); }

    if (settings.mode === 'delete') return true;

    if (settings.mode === 'kick') {
      try {
        await sock.groupParticipantsUpdate(jid, [senderJid], 'remove');
        await sock.sendMessage(jid, { text: `🚫 @${senderNumber} has been removed for sending links.`, mentions: [senderJid] });
      } catch (e) { console.log('[AntiLink Kick Error]', e.message); }
      return true;
    }

    if (settings.mode === 'warn') {
      if (!settings.warnings[senderJid]) settings.warnings[senderJid] = 0;
      settings.warnings[senderJid]++;
      const count = settings.warnings[senderJid];
      if (count >= WARNING_LIMIT) {
        try {
          await sock.groupParticipantsUpdate(jid, [senderJid], 'remove');
          await sock.sendMessage(jid, { text: `🚫 @${senderNumber} has been removed for sending links.`, mentions: [senderJid] });
          delete settings.warnings[senderJid];
        } catch (e) {
          await sock.sendMessage(jid, { text: `⚠️ @${senderNumber} reached ${WARNING_LIMIT}/${WARNING_LIMIT} warnings, but I couldn't remove them.`, mentions: [senderJid] });
        }
        return true;
      }
      await sock.sendMessage(jid, {
        text: `🚫 @${senderNumber} Links are not allowed in this group.\n\n⚠️ Warning: ${count}/${WARNING_LIMIT}`,
        mentions: [senderJid]
      });
      return true;
    }

    return true;
  } catch (error) {
    console.error('[AntiLink Error]', error);
    return false;
  }
}

function resetAntiLinkWarnings(account, jid, userJid) {
  const settings = getSettings(account, jid);
  delete settings.warnings[userJid];
}

module.exports = { handleAntiLink, resetAntiLinkWarnings };