// ============================================================
// MUFASER-X — KICK ALL EXCEPT BOT
// ============================================================

const confirmKick = new Map();

module.exports = {
  name: 'kickall',
  aliases: ['outall', 'killall', 'yeskick'],
  desc: 'Remove all members except bot',
  category: 'Group',
  usage: '.kickall',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');
    if (!isGroup) {
      return await sock.sendMessage(jid, { text: '❌ *This command only works in groups.*' }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata?.participants || [];

      const cleanJid = (v) => v? String(v).trim().toLowerCase() : '';
      const getNumber = (v) => v? String(v).split('@')[0].split(':')[0].replace(/\D/g, '') : '';
      const participantMatches = (p, tJid, tNum) => {
        if (!p) return false;
        if (cleanJid(p.id) === cleanJid(tJid)) return true;
        if (tNum && getNumber(p.id) === tNum) return true;
        if (tNum && getNumber(p.phoneNumber) === tNum) return true;
        return false;
      };

      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);
      const botParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      if (!isBotAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *I need to be a group admin to kick members.*' }, { quoted: msg });
      }

      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || (msg?.key?.fromMe? botJid : '');
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
      if (!senderParticipant && msg?.key?.fromMe === true) senderParticipant = botParticipant;
      const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
      if (!isAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *Only group admins can use this command.*' }, { quoted: msg });
      }

      // CHECK IF YESKICK
      const messageText = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '';
      const isConfirmKick = messageText.trim().toLowerCase().startsWith('.yeskick') || messageText.trim().toLowerCase().startsWith('.confirmkick');

      // === CONFIRMATION MODE ===
      if (isConfirmKick) {
        if (!confirmKick.has(jid)) {
          return await sock.sendMessage(jid, { text: '❌ *No pending KICKALL request.*\n\nUse `.kickall` first.' }, { quoted: msg });
        }

        const pending = confirmKick.get(jid);
        confirmKick.delete(jid);
        const toKick = Array.isArray(pending)? pending : [];
        if (toKick.length === 0) {
          return await sock.sendMessage(jid, { text: '❌ *No members are waiting to be removed.*' }, { quoted: msg });
        }

        const currentNumbers = new Set(participants.map(p => getNumber(p.id)));
        const validTargets = toKick.filter(user => currentNumbers.has(getNumber(user)));
        if (validTargets.length === 0) {
          return await sock.sendMessage(jid, { text: '❌ *No pending members are currently in the group.*' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { text: `🚪 *Removing ${validTargets.length} member(s)...*`, mentions: validTargets }, { quoted: msg });

        const result = await sock.groupParticipantsUpdate(jid, validTargets, 'remove');
        console.log('[KickAll] WhatsApp response:', result);

        let text = `✅ *KICKALL COMPLETED*\n\n🚪 *Removed:* ${validTargets.length} member(s)\n\n`;
        validTargets.forEach((user, index) => { text += `*${index + 1}.* @${getNumber(user)}\n`; });
        text += `\n👮 *Removed by:* @${senderNumber}`;

        return await sock.sendMessage(jid, { text, mentions: [...validTargets, senderJid].filter(Boolean) }, { quoted: msg });
      }

      // === FIND ALL MEMBERS EXCEPT BOT ONLY ===
      const members = participants
       .filter(p => getNumber(p.id)!== botNumber)
       .map(p => p.id)
       .filter(Boolean);

      if (members.length === 0) {
        return await sock.sendMessage(jid, { text: '❌ *Only bot is left in group.*' }, { quoted: msg });
      }

      confirmKick.set(jid, members);
      setTimeout(() => { if (confirmKick.has(jid)) confirmKick.delete(jid); }, 60000);

      // NEW WARNING FORMAT YOU WANTED
      return await sock.sendMessage(jid, {
          text: `⚠️ *KICKALL WARNING*\n\n` +
                `⚠️ *This action cannot be easily undone*\n` +
                `This will remove *${members.length}* members.\n\n` +
                `Type \`.yeskick\` within 60 seconds to confirm.`,
          mentions: [senderJid].filter(Boolean)
        }, { quoted: msg }
      );

    } catch (error) {
      console.error('[KickAll] ❌ Failed:', error);
      confirmKick.delete(jid);
      return await sock.sendMessage(jid, { text: `❌ *Failed to kick members.*\n\n⚠️ *Reason:* ${error?.message || 'WhatsApp rejected the request.'}` }, { quoted: msg });
    }
  }
};