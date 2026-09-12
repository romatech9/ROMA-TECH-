// ============================================================
// MUFASER-X — DELETE GROUP PROFILE PICTURE
// ============================================================

module.exports = {
  name: 'delgcpp',
  aliases: ['delppgc', 'delgpic', 'removegcpp'],
  desc: 'Delete group profile picture',
  category: 'Group',
  usage: '.delgcpp',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup =
      typeof jid === 'string' &&
      jid.endsWith('@g.us');

    if (!isGroup) {
      return await sock.sendMessage(
        jid,
        { text: '❌ *This command only works in groups.*' },
        { quoted: msg }
      );
    }

    try {
      const metadata = await sock.groupMetadata(jid);

      if (!metadata) {
        throw new Error('Group metadata unavailable.');
      }

      const participants = metadata?.participants || [];

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

      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);
      const botParticipant = participants.find(participant =>
        participantMatches(participant, botJid, botNumber)
      );

      const isBotAdmin =
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin';

      if (!isBotAdmin) {
        return await sock.sendMessage(
          jid,
          { text: '❌ *I need to be a group admin to delete the group profile.*' },
          { quoted: msg }
        );
      }

      const senderJid =
        msg?.key?.participant ||
        sender?.jid ||
        msg?.participant ||
        (msg?.key?.fromMe? botJid : '');

      const senderNumber = getNumber(sender?.number || senderJid);

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

      if (!isAdmin) {
        return await sock.sendMessage(
          jid,
          { text: '❌ *Only group admins can use this command.*' },
          { quoted: msg }
        );
      }

      await sock.removeProfilePicture(jid);

      // ======================================================
      // SUCCESS
      // ======================================================
      return await sock.sendMessage(
        jid,
        {
          text: `✅ GROUP PROFILE PICTURE DELETED`
        },
        {
          quoted: msg
        }
      );

    } catch (error) {
      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to delete group profile picture.*\n\n' +
            `⚠️ *Reason:* ${error?.message || 'WhatsApp rejected the request.'}`
        },
        { quoted: msg }
      );
    }
  }
};