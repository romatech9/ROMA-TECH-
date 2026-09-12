// ============================================================
// MUFASER-X — KICK / REMOVE MEMBER - KICKS ADMINS TOO
// ============================================================

module.exports = {
  name: 'kick',
  aliases: ['out', 'kill', 'remove'],
  desc: 'Remove a member from the group (even admins)',
  category: 'Group',
  usage: '.kick @tag or reply',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');
    if (!isGroup) {
      return await sock.sendMessage(jid, { text: '❌ *This command only works in groups.*' }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      if (!metadata) throw new Error('Group metadata unavailable.');
      const participants = metadata?.participants || [];

      const cleanJid = (value) => value? String(value).trim().toLowerCase() : '';
      const getNumber = (value) => value? String(value).split('@')[0].split(':')[0].replace(/\D/g, '') : '';
      const participantMatches = (participant, targetJid, targetNumber) => {
        if (!participant) return false;
        if (cleanJid(participant.id) === cleanJid(targetJid)) return true;
        if (targetNumber && getNumber(participant.id) === targetNumber) return true;
        if (targetNumber && getNumber(participant.phoneNumber) === targetNumber) return true;
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

      let users = [];
      const contextInfo = msg?.message?.extendedTextMessage?.contextInfo;

      if (Array.isArray(contextInfo?.mentionedJid)) {
        users.push(...contextInfo.mentionedJid);
      }
      if (contextInfo?.participant) {
        users.push(contextInfo.participant);
      }

      users = [...new Set(users.filter(Boolean))];

      if (users.length === 0) {
        return await sock.sendMessage(jid, { text: '❌ *No member selected.*\n\n*Usage:*\n`.kick @tag`\nor reply to a member with `.kick`' }, { quoted: msg });
      }

      const botNumberClean = getNumber(botJid);
      const senderNumberClean = getNumber(senderJid);

      // ONLY BOT AND YOU ARE PROTECTED - ADMINS CAN BE KICKED
      const protectedUsers = new Set([botNumberClean, senderNumberClean]);

      const removableUsers = users.filter(user => {
        const number = getNumber(user);
        return number &&!protectedUsers.has(number);
      });

      if (removableUsers.length === 0) {
        return await sock.sendMessage(jid, { text: '❌ *Cannot kick yourself or the bot.*' }, { quoted: msg });
      }

      await sock.groupParticipantsUpdate(jid, removableUsers, 'remove');

      let text = `✅ *MEMBER(S) REMOVED SUCCESSFULLY*\n\n`;
      removableUsers.forEach((user, index) => {
        const number = getNumber(user);
        text += `*${index + 1}.* @${number}\n`;
      });

      return await sock.sendMessage(jid, { text, mentions: [...removableUsers, senderJid].filter(Boolean) }, { quoted: msg });

    } catch (error) {
      return await sock.sendMessage(jid, { text: `❌ *Failed to kick member.*\n\n⚠️ *Reason:* ${error?.message || 'WhatsApp rejected the request.'}` }, { quoted: msg });
    }
  }
};