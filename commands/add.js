// ============================================================
// MUFASER-X — ADD MEMBER
// ============================================================

module.exports = {
  name: 'add',
  aliases: ['invite'],
  desc: 'Add a member to the group by number',
  category: 'Group',
  usage: '.add 2567xxxxxxxxx',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');
    if (!isGroup) {
      return await sock.sendMessage(jid, { text: '❌ *This command only works in groups.*' }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      if (!metadata) throw new Error('Group metadata unavailable.');
      const participants = metadata.participants || [];

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

      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || (msg?.key?.fromMe ? sock?.user?.id : '');
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));

      if (!senderParticipant && msg?.key?.fromMe === true) {
        const botJid = sock?.user?.id || '';
        const botNumber = getNumber(botJid);
        senderParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      }

      const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
      if (!isAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *Only group admins can use this command.*' }, { quoted: msg });
      }

      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);
      const botParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      if (!isBotAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *I need to be a group admin to add members.*' }, { quoted: msg });
      }

      const number = String(args?.[0] || '').replace(/\D/g, '');
      if (!number) {
        return await sock.sendMessage(jid, { text: '❌ *Phone number is required.*\n\n*Usage:*\n`.add 2567xxxxxxxxx`\n\n*Example:*\n`.add 256700000000`' }, { quoted: msg });
      }
      if (number.length < 8) {
        return await sock.sendMessage(jid, { text: '❌ *Invalid phone number.*\n\nUse international format without `+` or spaces.\n\n*Example:* `256700000000`' }, { quoted: msg });
      }

      const memberJid = `${number}@s.whatsapp.net`;
      const alreadyMember = participants.some(p => participantMatches(p, memberJid, number));

      if (alreadyMember) {
        return await sock.sendMessage(jid, { text: `ℹ️ *@${number} is already a member of this group.*`, mentions: [memberJid] }, { quoted: msg });
      }

      const result = await sock.groupParticipantsUpdate(jid, [memberJid], 'add');
      const response = Array.isArray(result) ? result[0] : result;
      const status = String(response?.status || '');

      if (status === '200' || status === '201') {
        const addedBy = senderJid || sock?.user?.id || '';
        const mentions = [memberJid];
        if (addedBy) mentions.push(addedBy);

        return await sock.sendMessage(
          jid,
          {
            text: `✅ *MEMBER ADDED SUCCESSFULLY!*\n👤 *Member:* @${number}\n`,
            mentions
          },
          { quoted: msg }
        );
      }

      let reason = 'WhatsApp rejected the request.';
      if (status === '403') reason = 'The user may have privacy restrictions preventing group additions.';
      else if (status === '409') reason = 'The user is already in the group or WhatsApp could not add them.';
      else if (status) reason = `WhatsApp returned status ${status}.`;

      return await sock.sendMessage(jid, { text: `❌ *FAILED TO ADD @${number}*\n\n⚠️ ${reason}`, mentions: [memberJid] }, { quoted: msg });

    } catch (error) {
      const number = String(args?.[0] || '').replace(/\D/g, '');
      return await sock.sendMessage(
        jid,
        {
          text: `❌ *Failed to add ${number ? `@${number}` : 'member'}.*\n\n⚠️ *Reason:* ${error?.message || 'Check the number format and try again.'}`,
          ...(number ? { mentions: [`${number}@s.whatsapp.net`] } : {})
        },
        { quoted: msg }
      );
    }
  }
};