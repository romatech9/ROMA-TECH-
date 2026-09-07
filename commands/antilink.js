// ============================================================
// MUFASER-X — ANTILINK COMMAND — FIXED BY MUTE STRUCTURE
// By ROMA-TECH
// ============================================================

module.exports = {
  name: 'antilink',
  aliases: ['antilink'],
  desc: 'Group link protection',
  category: 'Group',
  usage:
    '.antilink on/off\n' +
    '.antilink warn on/off\n' +
    '.antilink delete on/off\n' +
    '.antilink kick on/off',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!jid.endsWith('@g.us')) {
        return sock.sendMessage(jid, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
      }

      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants || [];

      // ======================================================
      // HELPERS — SAME AS WORKING MUTE COMMAND
      // ======================================================
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

      // ======================================================
      // FIND BOT — SAME AS MUTE
      // ======================================================
      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);
      const botParticipant = participants.find(p =>
        participantMatches(p, botJid, botNumber)
      );
      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      // ======================================================
      // FIND COMMAND SENDER — SAME AS MUTE
      // ======================================================
      const senderJid =
        msg?.key?.participant ||
        sender?.jid ||
        msg?.participant ||
        (msg?.key?.fromMe? botJid : '');

      const senderNumber = getNumber(sender?.number || senderJid);

      let senderParticipant = participants.find(p =>
        participantMatches(p, senderJid, senderNumber)
      );

      if (!senderParticipant && msg?.key?.fromMe === true) {
        senderParticipant = participants.find(p =>
          participantMatches(p, botJid, botNumber)
        );
      }

      const isSenderAdmin =
        msg?.key?.fromMe === true ||
        senderParticipant?.admin === 'admin' ||
        senderParticipant?.admin === 'superadmin';

      console.log('[Antilink CMD] Bot:', { botJid, isBotAdmin, found: botParticipant?.id });
      console.log('[Antilink CMD] Sender:', { senderJid, senderNumber, found: senderParticipant?.id, isSenderAdmin });

      if (!isSenderAdmin) {
        return sock.sendMessage(jid, { text: '❌ *Admin Only*\n\nOnly group admins can change Antilink settings.' }, { quoted: msg });
      }
      if (!isBotAdmin) {
        return sock.sendMessage(jid, { text: '❌ *ANTILINK*\n\nI need to be a group admin to use Antilink.' }, { quoted: msg });
      }

      // ------------------------------------------------------
      // INITIALIZE SETTINGS
      // ------------------------------------------------------
      if (!account.antilink) account.antilink = {};
      if (!account.antilink[jid]) {
        account.antilink[jid] = { mode: 'off', warnings: {} };
      }
      const settings = account.antilink[jid];
      if (!settings.warnings) settings.warnings = {};

      const type = String(args[0] || '').toLowerCase();
      const action = String(args[1] || '').toLowerCase();

      if (type === 'on') {
        settings.mode = 'warn';
        return sock.sendMessage(jid, { text: '🛡️ *ANTILINK ENABLED*\n\n🚫 Links will be deleted.\n⚠️ The sender will receive a warning.' }, { quoted: msg });
      }
      if (type === 'off') {
        settings.mode = 'off';
        settings.warnings = {};
        return sock.sendMessage(jid, { text: '✅ *ANTILINK DISABLED*\n\nMembers can send links again.' }, { quoted: msg });
      }
      if (type === 'warn') {
        if (!['on', 'off'].includes(action)) {
          return sock.sendMessage(jid, { text: '❌ Use:\n`.antilink warn on`\n`.antilink warn off`' }, { quoted: msg });
        }
        if (action === 'on') {
          settings.mode = 'warn';
          return sock.sendMessage(jid, { text: '⚠️ *ANTILINK WARN ENABLED*\n\nLinks will be deleted and users will be warned.\n5 warnings = removal from group.' }, { quoted: msg });
        }
        settings.mode = 'off';
        settings.warnings = {};
        return sock.sendMessage(jid, { text: '✅ *ANTILINK WARN DISABLED*' }, { quoted: msg });
      }
      if (type === 'delete') {
        if (!['on', 'off'].includes(action)) {
          return sock.sendMessage(jid, { text: '❌ Use:\n`.antilink delete on`\n`.antilink delete off`' }, { quoted: msg });
        }
        if (action === 'on') {
          settings.mode = 'delete';
          return sock.sendMessage(jid, { text: '🗑️ *ANTILINK DELETE ENABLED*\n\nLinks will be deleted automatically.' }, { quoted: msg });
        }
        settings.mode = 'off';
        return sock.sendMessage(jid, { text: '✅ *ANTILINK DELETE DISABLED*' }, { quoted: msg });
      }
      if (type === 'kick') {
        if (!['on', 'off'].includes(action)) {
          return sock.sendMessage(jid, { text: '❌ Use:\n`.antilink kick on`\n`.antilink kick off`' }, { quoted: msg });
        }
        if (action === 'on') {
          settings.mode = 'kick';
          return sock.sendMessage(jid, { text: '🔨 *ANTILINK KICK ENABLED*\n\nAnyone who sends a link will be removed immediately.' }, { quoted: msg });
        }
        settings.mode = 'off';
        return sock.sendMessage(jid, { text: '✅ *ANTILINK KICK DISABLED*' }, { quoted: msg });
      }

      return sock.sendMessage(jid, {
        text:
          '🛡️ *MUFASER-X ANTILINK*\n\n' +
          '`.antilink on` → Delete + warn\n\n' +
          '`.antilink off` → Disable\n\n' +
          '`.antilink warn on` → Warn (5 = kick)\n\n' +
          '`.antilink delete on` → Delete only\n\n' +
          '`.antilink kick on` → Delete + kick\n\n' +
          '👑 Admins are always allowed.'
      }, { quoted: msg });

    } catch (error) {
      console.error('[AntiLink Command Error]', error);
      return sock.sendMessage(jid, { text: `❌ Antilink error: ${error.message}` }, { quoted: msg });
    }
  }
};