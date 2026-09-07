// ============================================================
// MUFASER-X — ANTIBOT COMMAND
// ============================================================
module.exports = {
  name: 'antibot',
  aliases: ['antibot'],
  desc: 'Block other bots in group',
  category: 'Group',
  usage: '.antibot on/off\n.antibot warn on/off\n.antibot delete on/off\n.antibot kick on/off',
  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Group only.' }, { quoted: msg });
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants || [];
      const cleanJid = (v) => String(v||'').trim().toLowerCase();
      const getNumber = (v) => String(v||'').split('@')[0].split(':')[0].replace(/\D/g,'');
      const participantMatches = (p, tj, tn) => {
        if (!p) return false;
        if (cleanJid(p.id) === cleanJid(tj)) return true;
        if (getNumber(p.id) === tn) return true;
        if (getNumber(p.phoneNumber) === tn) return true;
        return false;
      };
      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);
      const botParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      const senderJid = msg?.key?.participant || sender?.jid || msg?.participant || (msg?.key?.fromMe? botJid:'');
      const senderNumber = getNumber(sender?.number || senderJid);
      let senderParticipant = participants.find(p => participantMatches(p, senderJid, senderNumber));
      if (!senderParticipant && msg?.key?.fromMe) senderParticipant = participants.find(p => participantMatches(p, botJid, botNumber));
      const isSenderAdmin = msg?.key?.fromMe === true || senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
      if (!isSenderAdmin) return sock.sendMessage(jid, { text: '❌ *Admin Only*\nOnly group admins can change antibot.' }, { quoted: msg });
      if (!isBotAdmin) return sock.sendMessage(jid, { text: '❌ I need to be admin for antibot.' }, { quoted: msg });

      if (!account.antibot) account.antibot = {};
      if (!account.antibot[jid]) account.antibot[jid] = { mode: 'off', warnings: {} };
      const settings = account.antibot[jid];
      if (!settings.warnings) settings.warnings = {};
      const type = String(args[0]||'').toLowerCase();
      const action = String(args[1]||'').toLowerCase();

      if (type === 'on' || type === 'delete') { settings.mode = 'delete'; return sock.sendMessage(jid, { text: '🤖 *ANTIBOT ENABLED*\n\n🗑️ Bot commands will be deleted.' }, { quoted: msg }); }
      if (type === 'off') { settings.mode = 'off'; settings.warnings={}; return sock.sendMessage(jid, { text: '✅ *ANTIBOT DISABLED*' }, { quoted: msg }); }
      if (type === 'warn') {
        if (action === 'on') { settings.mode = 'warn'; return sock.sendMessage(jid, { text: '⚠️ *ANTIBOT WARN ENABLED*\n4 warnings = kick' }, { quoted: msg }); }
        settings.mode='off'; settings.warnings={}; return sock.sendMessage(jid, { text: '✅ *ANTIBOT WARN DISABLED*' }, { quoted: msg });
      }
      if (type === 'kick') {
        if (action === 'on') { settings.mode = 'kick'; return sock.sendMessage(jid, { text: '🔨 *ANTIBOT KICK ENABLED*\nAnyone using bot commands will be removed.' }, { quoted: msg }); }
        settings.mode='off'; return sock.sendMessage(jid, { text: '✅ *ANTIBOT KICK DISABLED*' }, { quoted: msg });
      }
      return sock.sendMessage(jid, { text: '🤖 *ANTIBOT*\n\n`.antibot on` → delete bot cmds\n`.antibot warn on` → 4 warn = kick\n`.antibot kick on` → instant kick\n`.antibot off` → disable\n\n👑 Admins allowed.' }, { quoted: msg });
    } catch (e) { return sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }, { quoted: msg }); }
  }
};