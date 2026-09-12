// ============================================================
// MUFASER-X — RESET / REVOKE GROUP LINK
// ============================================================

module.exports = {
  name: 'resetgclink',
  aliases: ['resetlink', 'revoke', 'newlink'],
  desc: 'Reset/Revoke group invite link',
  category: 'Group',
  usage: '.resetgclink',

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
        return await sock.sendMessage(jid, { text: '❌ *I need to be a group admin to reset the group link.*' }, { quoted: msg });
      }

      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || (msg?.key?.fromMe? botJid : '');
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
      if (!senderParticipant && msg?.key?.fromMe === true) senderParticipant = botParticipant;
      const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
      if (!isAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *Only group admins can reset the group link.*' }, { quoted: msg });
      }

      const newCode = await sock.groupRevokeInvite(jid);
      if (!newCode) throw new Error('WhatsApp did not return a new invite code.');
      const newLink = `https://chat.whatsapp.com/${newCode}`;

      const senderMention = senderJid || botJid;

      return await sock.sendMessage(jid, {
          text: `✅ *GROUP LINK RESET SUCCESSFULLY!*\n\n🔗 *New Link:*\n${newLink}\n\n⚠️ *The old link is now expired.*`,
          mentions: senderMention? [senderMention] : []
        }, { quoted: msg }
      );

    } catch (error) {
      return await sock.sendMessage(jid, { text: `❌ *Failed to reset group link.*\n\n⚠️ *Reason:* ${error?.message || 'WhatsApp rejected the request.'}` }, { quoted: msg });
    }
  }
};