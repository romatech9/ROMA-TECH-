// ============================================================
// MUFASER-X — ANTIDELETE SYSTEM FIXED (ROMA)
// DEFAULT: DM ON, PRIVATE ON, GROUP OFF
// ============================================================

module.exports = {
  name: 'antidelete',
  aliases: ['antidel','antidelete'],
  desc: 'Enable or disable Anti-Delete',
  category: 'Owner',
  usage: '.antidelete dm on/off\n.antidelete group on/off\n.antidelete private on/off',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!msg?.key?.fromMe) {
        return sock.sendMessage(jid, { text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌` }, { quoted: msg });
      }

      const mode = String(args?.[0] || '').toLowerCase().trim();
      const state = String(args?.[1] || '').toLowerCase().trim();

      // FIXED DEFAULTS - Group OFF, DM ON, Private ON
      if (!account.antidelete || typeof account.antidelete!== 'object') {
        account.antidelete = { dm: true, group: false, private: true };
      } else {
        // ensure missing keys get correct defaults
        if (account.antidelete.dm == null) account.antidelete.dm = true;
        if (account.antidelete.private == null) account.antidelete.private = true;
        if (account.antidelete.group == null) account.antidelete.group = false;
      }

      if (!['dm','group','private','all'].includes(mode) || (mode!== 'all' &&!['on','off'].includes(state))) {
        const cur = account.antidelete;
        return sock.sendMessage(jid, {
          text: `⚙️ *ANTI-DELETE SETTINGS*\n\n🔐 PRIVATE LOG: ${cur.private?'✅ ON':'❌ OFF'}\n👥 GROUP: ${cur.group?'✅ ON':'❌ OFF'}\n💬 DM: ${cur.dm?'✅ ON':'❌ OFF'}\n\n*Usage:*\n.antidelete dm on\n.antidelete dm off\n.antidelete group on\n.antidelete group off\n.antidelete private on\n.antidelete private off`
        }, { quoted: msg });
      }

      if (mode === 'all') {
        //.antidelete all on/off
        const on = args[0] === 'all' && args[1] === 'on'? true : state === 'on';
        if (args[0] === 'all') {
          account.antidelete.dm = on;
          account.antidelete.private = on;
          account.antidelete.group = on;
        }
      } else {
        account.antidelete[mode] = state === 'on';
      }

      // SAVE
      try {
        const manager = require('../../utils/accountManager');
        if (manager.saveAccounts) await manager.saveAccounts();
        else if (manager.saveAccount) await manager.saveAccount(account);
        else if (manager.save) await manager.save(account);
      } catch (e) {
        console.log('[AntiDelete] save error', e.message);
      }

      let label = mode === 'dm'? '💬 DM Anti-Delete' : mode === 'group'? '👥 Group Anti-Delete' : mode === 'private'? '🔐 Private Log' : '🛡️ All Anti-Delete';
      const status = state === 'on' || (mode === 'all' && account.antidelete.dm)? '✅ ENABLED' : '❌ DISABLED';

      return sock.sendMessage(jid, { text: `🛡️ *ANTI-DELETE UPDATED*\n\n${label}\n📌 *Status:* ${status}\n\nCurrent:\nDM: ${account.antidelete.dm?'ON':'OFF'}\nGroup: ${account.antidelete.group?'ON':'OFF'}\nPrivate: ${account.antidelete.private?'ON':'OFF'}` }, { quoted: msg });

    } catch (error) {
      console.error('[AntiDelete Command] ❌', error);
      return sock.sendMessage(jid, { text: `❌ *Failed*\n${error?.message}` }, { quoted: msg });
    }
  }
};