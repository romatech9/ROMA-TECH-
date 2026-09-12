// ============================================================
// MUFASER-X — GROUP LINK
// ============================================================

module.exports = {
  name: 'link',
  aliases: ['grouplink', 'invitelink', 'gclink'],
  desc: 'Get group invite link',
  category: 'Group',
  usage: '.link',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');
    if (!isGroup) {
      return await sock.sendMessage(jid, { text: '❌ *This command only works in groups.*' }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      if (!metadata) throw new Error('Group metadata was not returned.');

      let code = null;
      try {
        code = await sock.groupInviteCode(jid);
      } catch (inviteError) {
        return await sock.sendMessage(jid, { text: '🥴 *Sorry Comrade, this group link is locked*' }, { quoted: msg });
      }

      if (!code) {
        return await sock.sendMessage(jid, { text: '🥴 *Sorry Comrade, this group link is locked*' }, { quoted: msg });
      }

      const link = `https://chat.whatsapp.com/${code}`;

      const caption =
        `╭━━〔 🔗 *GROUP LINK* 〕━━╮\n\n` +
        `🔗 *Invite Link:*\n${link}\n\n` +
        
        `> powered; MUFASER-X`;

      return await sock.sendMessage(jid, { text: caption }, { quoted: msg });

    } catch (error) {
      return await sock.sendMessage(
        jid,
        { text: `❌ *Failed to get group link.*\n\n⚠️ *Reason:* ${error?.message || 'WhatsApp rejected the request.'}` },
        { quoted: msg }
      );
    }
  }
};