// ============================================================
// MUFASER-X — BLOCK COMMAND
// OWNER ONLY
// ============================================================

const config = require('../config.js');

function normalizeNumber(value) {
  if (!value) return '';
  return String(value).split('@')[0].split(':')[0].replace(/\D/g, '');
}

function getQuotedParticipant(msg) {
  const contextInfo =
    msg?.message?.extendedTextMessage?.contextInfo ||
    msg?.message?.imageMessage?.contextInfo ||
    msg?.message?.videoMessage?.contextInfo ||
    msg?.message?.documentMessage?.contextInfo ||
    msg?.message?.audioMessage?.contextInfo ||
    msg?.message?.stickerMessage?.contextInfo;
  return contextInfo?.participant || '';
}

function getTargetFromMessage(msg) {
  const quoted = getQuotedParticipant(msg);
  if (quoted) return quoted;

  const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (Array.isArray(mentioned) && mentioned.length > 0) {
    return mentioned[0];
  }
  return '';
}

function getBotNumber(sock) {
  return normalizeNumber(sock?.user?.id);
}

function getOwnerNumber(account) {
  return normalizeNumber(
    account?.ownerNumber ||
    account?.phone ||
    account?.number ||
    config?.ownerNumber ||
    process.env.OWNER_NUMBER
  );
}

module.exports = {
  name: 'block',
  desc: 'Block a WhatsApp user',
  category: 'Owner',
  usage: '.block 2567XXXXXXXX OR reply to a message',

  async execute(sock, msg, jid, args, sender, account) {
    let targetJid = '';
    let targetNumber = '';

    try {
      if (!msg?.key?.fromMe) {
        return sock.sendMessage(
          jid,
          { text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌` },
          { quoted: msg }
        );
      }

      if (String(jid).endsWith('@g.us')) {
        return sock.sendMessage(
          jid,
          { text: `❌ *This command works in a DM only.*\n\nUse:\n.block 2567XXXXXXXX` },
          { quoted: msg }
        );
      }

      if (Array.isArray(args) && args.length > 0) {
        targetNumber = args.join('').replace(/\D/g, '');
        if (!targetNumber) {
          return sock.sendMessage(
            jid,
            { text: `❌ *Invalid number.*\n\nExample:\n.block 2567XXXXXXXXX` },
            { quoted: msg }
          );
        }
        targetJid = `${targetNumber}@s.whatsapp.net`;
      }

      if (!targetJid) {
        const messageTarget = getTargetFromMessage(msg);
        if (messageTarget) {
          if (messageTarget.endsWith('@s.whatsapp.net')) {
            targetJid = messageTarget;
            targetNumber = normalizeNumber(targetJid);
          } else if (messageTarget.endsWith('@lid')) {
            let resolved = '';
            try {
              const mapping = sock?.signalRepository?.lidMapping;
              if (mapping && typeof mapping.getPNForLID === 'function') {
                resolved = await mapping.getPNForLID(messageTarget);
              }
            } catch {}
            if (resolved) {
              targetJid = String(resolved);
              if (!targetJid.includes('@')) targetJid += '@s.whatsapp.net';
              targetNumber = normalizeNumber(targetJid);
            } else {
              return sock.sendMessage(
                jid,
                { text: `❌ *Could not resolve this WhatsApp LID.*\n\nWhatsApp did not provide the real phone number.\n\nTry using:\n.block 2567XXXXXXXX` },
                { quoted: msg }
              );
            }
          }
        }
      }

      if (!targetJid) {
        const currentJid = String(jid || '');
        if (currentJid.endsWith('@s.whatsapp.net')) {
          targetJid = currentJid;
          targetNumber = normalizeNumber(targetJid);
        }
      }

      if (!targetJid ||!targetNumber) {
        return sock.sendMessage(
          jid,
          {
            text: `❌ *Could not identify the user to block.*\n\nUse:\n.block 2567XXXXXXXX\n\nOr reply to a user's message with:\n.block`
          },
          { quoted: msg }
        );
      }

      const ownerNumber = getOwnerNumber(account);
      if (ownerNumber && targetNumber === ownerNumber) {
        return sock.sendMessage(jid, { text: `❌ *I cannot block my owner.* 😌` }, { quoted: msg });
      }

      const botNumber = getBotNumber(sock);
      if (botNumber && targetNumber === botNumber) {
        return sock.sendMessage(jid, { text: `❌ *I cannot block myself.* 🤖` }, { quoted: msg });
      }

      // ======================================================
      // BLOCK USER - THIS WAS MISSING
      // ======================================================
      await sock.updateBlockStatus(targetJid, "block");

      return sock.sendMessage(
        jid,
        { text: `✅ *USER BLOCKED SUCCESSFULLY!*\n\n👤 *Number:* +${targetNumber}` },
        { quoted: msg }
      );

    } catch (error) {
      return sock.sendMessage(
        jid,
        {
          text: `❌ *Failed to block user.*\n\n👤 *Target:* ${targetNumber || targetJid || 'Unknown'}\n\n⚠️ *Reason:*\n${error?.message || 'Unknown error'}`
        },
        { quoted: msg }
      );
    }
  }
};