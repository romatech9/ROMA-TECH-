// ============================================================
// MUFASER-X — SET GROUP DESCRIPTION
// ============================================================

module.exports = {
  name: 'setgcdesc',
  aliases: ['setdesc', 'setgdesc'],
  desc: 'Set group description',
  category: 'Group',
  usage: '.setgcdesc your description here',

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
        return await sock.sendMessage(jid, { text: '❌ *I need to be a group admin to change the group description.*' }, { quoted: msg });
      }

      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || (msg?.key?.fromMe? botJid : '');
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
      if (!senderParticipant && msg?.key?.fromMe === true) senderParticipant = botParticipant;
      const isAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
      if (!isAdmin) {
        return await sock.sendMessage(jid, { text: '❌ *Only group admins can use this command.*' }, { quoted: msg });
      }

      // GET DESC - supports reply
      let text = Array.isArray(args)? args.join(' ').trim() : '';
      if (!text) {
        const quotedMsg = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
          text = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || quotedMsg?.imageMessage?.caption || quotedMsg?.videoMessage?.caption || '';
          text = String(text).trim();
        }
      }

      if (!text) {
        return await sock.sendMessage(jid, { text: '❌ *Please provide a description or reply to a message.*\n\nExample:\n`.setgcdesc Welcome to MUFASER-X Group`' }, { quoted: msg });
      }

      if (text.length > 512) {
        return await sock.sendMessage(jid, { text: '❌ *Description too long.*\n\nMaximum: *512 characters*.' }, { quoted: msg });
      }

      await sock.groupUpdateDescription(jid, text);

      // SUCCESS MESSAGE
      return await sock.sendMessage(jid, { text: `✅ *GROUP DESCRIPTION UPDATED!*\n` }, { quoted: msg });

    } catch (error) {
      return await sock.sendMessage(jid, { text: `❌ *Failed to update group description.*\n\n⚠️ *Reason:* ${error?.message || 'WhatsApp rejected the request.'}` }, { quoted: msg });
    }
  }
};