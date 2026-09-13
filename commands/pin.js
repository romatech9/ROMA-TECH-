// ============================================================
// MUFASER-X — PIN / UNPIN MESSAGE (FIXED)
// ============================================================

module.exports = {
  name: 'pin',

  aliases: ['unpin', 'pinmsg'],

  desc: 'Pin or unpin a replied message in group',

  category: 'Group',

  usage: '.pin (reply) |.unpin (reply) |.pin 7 (reply)',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');
    if (!isGroup) {
      return await sock.sendMessage(jid, { text: '❌ *This command is for groups only.*' }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata?.participants || [];

      const getNumber = (v) => String(v || '').split('@')[0].split(':')[0].replace(/\D/g, '');
      const cleanJid = (v) => String(v || '').trim().toLowerCase();
      const participantMatches = (p, targetJid, targetNumber) => {
        if (!p) return false;
        if (cleanJid(p.id) === cleanJid(targetJid)) return true;
        if (getNumber(p.id) === targetNumber) return true;
        if (getNumber(p.phoneNumber) === targetNumber) return true;
        return false;
      };

      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);
      const botParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || '';
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
      if (!senderParticipant && msg?.key?.fromMe) senderParticipant = botParticipant;
      const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

      if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ *I need to be admin to pin/unpin.*' }, { quoted: msg });
      if (!isAdmin) return await sock.sendMessage(jid, { text: '❌ *Only group admins can pin/unpin.*' }, { quoted: msg });

      // FIND REPLIED MESSAGE
      const contextInfo = msg?.message?.extendedTextMessage?.contextInfo;
      const quotedMsg = contextInfo?.quotedMessage;

      if (!contextInfo?.stanzaId ||!quotedMsg) {
        return await sock.sendMessage(jid, {
          text: '❌ *Reply to a message to pin it.*\n\n*Usage:*\n`.pin` - Pin 7 days\n`.pin 1` - Pin 1 day\n`.unpin` - Unpin replied msg'
        }, { quoted: msg });
      }

      const targetKey = {
        remoteJid: jid,
        id: contextInfo.stanzaId,
        fromMe: contextInfo.participant? false :!!contextInfo.fromMe,
      };
      // For groups, participant is required
      if (contextInfo.participant) {
        targetKey.participant = contextInfo.participant;
      } else if (!targetKey.fromMe) {
        // fallback if no participant but not fromMe, try to use sender
        targetKey.participant = contextInfo.participant || senderJid;
      }
      // If fromMe and it's bot, set botJid
      if (targetKey.fromMe) {
        targetKey.participant = botJid;
      }

      // DETECT COMMAND - use msg body + this.name
      const body = (msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '').toLowerCase();
      const isUnpin = body.startsWith('.unpin') || this.name === 'unpin';

      if (isUnpin) {
        console.log('[Pin] Unpinning:', targetKey);
        await sock.sendMessage(jid, {
          pin: { type: 2, time: 86400, key: targetKey }
        });
        return await sock.sendMessage(jid, { text: `✅ *Message unpinned.*` }, { quoted: msg });
      } else {
        let days = 7;
        const dayArg = args?.[0];
        if (dayArg &&!isNaN(dayArg)) {
          days = parseInt(dayArg);
          if (days > 30) days = 30;
          if (days < 1) days = 1;
        }
        console.log('[Pin] Pinning:', {...targetKey, days });
        await sock.sendMessage(jid, {
          pin: { type: 1, time: days * 24 * 60 * 60, key: targetKey }
        });
        return await sock.sendMessage(jid, {
          text: `✅ *Message pinned for ${days} day(s).*\n📌 By @${senderNumber}`,
          mentions: [senderJid]
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('[Pin] ❌ Failed:', error);
      return await sock.sendMessage(jid, {
        text: `❌ *Failed to pin/unpin.*\n⚠️ ${error?.message || 'WhatsApp rejected.'}`
      }, { quoted: msg });
    }
  }
};