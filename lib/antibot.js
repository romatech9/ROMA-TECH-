// ============================================================
// MUFASER-X — ANTIBOT PROTECTION — SAME STRUCTURE AS ANTILINK/MUTE
// By ROMA-TECH
// ============================================================

const WARNING_LIMIT = 4;

// Detect bot commands / other bots
const BOT_COMMAND_REGEX = /^[\.\!\#\$\/\\%]\w+|^\w+bot|bot.*command|_bot|bot_/i;

// Detect message from another WhatsApp bot (Baileys ID pattern)
function isBotMessage(msg) {
  const id = msg?.key?.id || '';
  // Other bots usually have IDs starting with BAE, 3EB0, etc and long
  if (id.startsWith('3EB0') || id.startsWith('BAE') || id.length > 22) {
    // Check if it has bot-like content
    const m = msg?.message || {};
    if (m.buttonsMessage || m.listMessage || m.templateMessage || m.buttonsResponseMessage || m.listResponseMessage) return true;
  }
  const text = (msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '').trim();
  if (BOT_COMMAND_REGEX.test(text)) return true;
  return false;
}

function getSettings(account, jid) {
  if (!account.antibot) account.antibot = {};
  if (!account.antibot[jid]) {
    account.antibot[jid] = { mode: 'off', warnings: {} };
  }
  if (!account.antibot[jid].warnings) account.antibot[jid].warnings = {};
  return account.antibot[jid];
}

async function handleAntiBot(sock, msg, account) {
  try {
    const jid = msg?.key?.remoteJid;
    if (typeof jid!== 'string' ||!jid.endsWith('@g.us')) return false;
    if (msg?.message?.protocolMessage || msg?.message?.reactionMessage) return false;

    const settings = getSettings(account, jid);
    if (!['on', 'warn', 'delete', 'kick'].includes(settings.mode)) return false;

    if (!isBotMessage(msg)) return false;

    const metadata = await sock.groupMetadata(jid);
    const participants = metadata.participants || [];

    // HELPERS — SAME AS MUTE
    const cleanJid = (v) => { if (!v) return ''; return String(v).trim().toLowerCase(); };
    const getNumber = (v) => { if (!v) return ''; return String(v).split('@')[0].split(':')[0].replace(/\D/g, ''); };
    const participantMatches = (participant, targetJid, targetNumber) => {
      if (!participant) return false;
      const pid = cleanJid(participant.id);
      const target = cleanJid(targetJid);
      if (pid && target && pid === target) return true;
      const pNum = getNumber(participant.id);
      if (targetNumber && pNum && pNum === targetNumber) return true;
      const pPhone = getNumber(participant.phoneNumber);
      if (targetNumber && pPhone && pPhone === targetNumber) return true;
      return false;
    };

    const botJid = sock?.user?.id || '';
    const botNumber = getNumber(botJid);
    const botParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
    const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

    if (!isBotAdmin) return false;

    const senderObj = account?.sender || msg?.sender || {};
    const senderJid = msg?.key?.participant || senderObj?.jid || msg?.participant || (msg?.key?.fromMe? botJid : '');
    const senderNumber = getNumber(senderObj?.number || senderJid);

    let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
    if (!senderParticipant && msg?.key?.fromMe === true) {
      senderParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
    }

    const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
    if (isAdmin) return false;

    // DELETE
    try { await sock.sendMessage(jid, { delete: msg.key }); } catch {}

    if (settings.mode === 'on' || settings.mode === 'delete') {
      return true;
    }

    if (settings.mode === 'kick') {
      try {
        await sock.groupParticipantsUpdate(jid, [senderJid], 'remove');
        await sock.sendMessage(jid, { text: `🤖 @${senderNumber} removed — bot commands not allowed.`, mentions: [senderJid] });
      } catch {}
      return true;
    }

    if (settings.mode === 'warn') {
      if (!settings.warnings[senderJid]) settings.warnings[senderJid] = 0;
      settings.warnings[senderJid]++;
      const count = settings.warnings[senderJid];
      if (count >= WARNING_LIMIT) {
        try {
          await sock.groupParticipantsUpdate(jid, [senderJid], 'remove');
          await sock.sendMessage(jid, { text: `🤖 @${senderNumber} removed after ${WARNING_LIMIT}/${WARNING_LIMIT} bot warnings.`, mentions: [senderJid] });
          delete settings.warnings[senderJid];
        } catch {
          await sock.sendMessage(jid, { text: `⚠️ @${senderNumber} reached ${WARNING_LIMIT}/${WARNING_LIMIT} bot warnings but I couldn't kick.`, mentions: [senderJid] });
        }
        return true;
      }
      await sock.sendMessage(jid, { text: `🤖 @${senderNumber} Bot commands are not allowed.\n\n⚠️ Warning: ${count}/${WARNING_LIMIT}`, mentions: [senderJid] });
      return true;
    }

    return true;
  } catch (e) {
    console.error('[AntiBot Error]', e.message);
    return false;
  }
}

function resetAntiBotWarnings(account, jid, userJid) {
  const s = getSettings(account, jid);
  delete s.warnings[userJid];
}

module.exports = { handleAntiBot, resetAntiBotWarnings };