// ============================================================
// MUFASER-X — MEMBER ADD PERMISSION (FIXED)
// ============================================================

module.exports = {
  name: 'addmember',

  alias: [
    'memberadd',
    'addmembers',
    'addmode'
  ],

  desc: 'Control who can add members to the group',

  category: 'Group',

  usage: '.addmember on/off',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');

    if (!isGroup) {
      return await sock.sendMessage(jid, { text: '❌ *This command only works in groups.*' }, { quoted: msg });
    }

    try {

      const metadata = await sock.groupMetadata(jid);
      if (!metadata) throw new Error('Group metadata unavailable.');
      const participants = metadata?.participants || [];

      const cleanJid = (value) => String(value || '').trim().toLowerCase();
      const getNumber = (value) => String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '');

      const participantMatches = (participant, targetJid, targetNumber) => {
        if (!participant) return false;
        if (cleanJid(participant.id) === cleanJid(targetJid)) return true;
        if (getNumber(participant.id) === targetNumber) return true;
        if (getNumber(participant.phoneNumber) === targetNumber) return true;
        return false;
      };

      // BOT CHECK
      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);
      const botParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      if (!isBotAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *I need to be a group admin to change member-add settings.*' }, { quoted: msg });
      }

      // SENDER CHECK
      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || (msg?.key?.fromMe? botJid : '');
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
      if (!senderParticipant && msg?.key?.fromMe === true) {
        senderParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      }
      const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

      if (!isAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *Only group admins can use this command.*' }, { quoted: msg });
      }

      // GET OPTION
      const option = String(args?.[0] || '').toLowerCase().trim();
      if (!['on', 'off'].includes(option)) {
        return await sock.sendMessage(jid, {
          text: '❌ *Invalid option.*\n\n*Usage:*\n`.addmember on` — Everyone can add members\n`.addmember off` — Only admins can add members'
        }, { quoted: msg });
      }

      console.log(`[AddMember] ⚙️ Setting member add mode: ${option}`);

      // CHANGE SETTING - CORRECT METHOD
      if (option === 'off') {
        // Only admins can add
        if (sock.groupMemberAddMode) {
          await sock.groupMemberAddMode(jid, 'admin_add');
        } else {
          await sock.groupSettingUpdate(jid, 'admin_add');
        }
      } else {
        // Everyone can add
        if (sock.groupMemberAddMode) {
          await sock.groupMemberAddMode(jid, 'all_member_add');
        } else {
          await sock.groupSettingUpdate(jid, 'all_member_add');
        }
      }

      // VERIFY
      const updatedMetadata = await sock.groupMetadata(jid);
      const addMode = updatedMetadata?.memberAddMode || (option === 'off'? 'admin_add' : 'all_member_add');
      const isRestricted = addMode === 'admin_add';

      console.log('[AddMember] ✅ Verification:', { requested: option, actual: addMode });

      const statusText = isRestricted? 'OFF' : 'ON';
      const descText = isRestricted? 'Only group admins can add members.' : 'All members can add other members.';

      return await sock.sendMessage(jid, {
        text: `✅ MEMBER ADDING ${statusText}\n${descText}`,
        mentions: senderJid? [senderJid] : []
      }, { quoted: msg });

    } catch (error) {
      console.error('[AddMember] ❌ Failed:', error);
      return await sock.sendMessage(jid, {
        text: '❌ *Failed to change member-add settings.*\n\n⚠️ *Reason:* ' + (error?.message || 'WhatsApp rejected the setting.')
      }, { quoted: msg });
    }
  }
};