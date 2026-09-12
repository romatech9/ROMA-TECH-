// ============================================================
// MUFASER-X — REJECT ALL JOIN REQUESTS
// ============================================================

module.exports = {
  name: 'rejectall',
  aliases: ['denyall', 'rejectallreq'],
  desc: 'Reject all pending members to join the group',
  category: 'Group',
  usage: '.rejectall',

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
        return await sock.sendMessage(jid, { text: '❌ *I need to be a group admin to reject members.*' }, { quoted: msg });
      }

      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || (msg?.key?.fromMe? botJid : '');
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
      if (!senderParticipant && msg?.key?.fromMe === true) senderParticipant = botParticipant;
      const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
      if (!isAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *Only group admins can use this command.*' }, { quoted: msg });
      }

      const requests = await sock.groupRequestParticipantsList(jid);
      if (!Array.isArray(requests) || requests.length === 0) {
        return await sock.sendMessage(jid, { text: '✅ *No pending join requests.*' }, { quoted: msg });
      }

      const requestParticipants = requests.map(r => r?.jid).filter(Boolean);
      if (requestParticipants.length === 0) {
        return await sock.sendMessage(jid, { text: '✅ *No valid pending join requests found.*' }, { quoted: msg });
      }

      await sock.groupRequestParticipantsUpdate(jid, requestParticipants, 'reject');

      const senderMention = senderJid || botJid;

      return await sock.sendMessage(jid, {
          text: `❌ *ALL JOIN REQUESTS REJECTED*\n\n👥 *Rejected:* ${requestParticipants.length} member(s)\n\n🚫 All pending requests have been denied.`,
          mentions: senderMention? [senderMention] : []
        }, { quoted: msg }
      );

    } catch (error) {
      return await sock.sendMessage(jid, { text: `❌ *Failed to reject members.*\n\n⚠️ *Reason:* ${error?.message || 'Make sure group approval mode is enabled and try again.'}` }, { quoted: msg });
    }
  }
};