// modules/commands/antideletestatus.js
// ============================================================
// MUFASER-X — ANTI-DELETE STATUS SYSTEM (ROMA)
// ============================================================

module.exports = {
  name: 'antideletestatus',
  aliases: ['antidelstatus','ads','antistatus'],
  desc: 'Enable or disable Anti-Delete Status',
  category: 'Owner',
  usage: '.antideletestatus on/off\n.antideletestatus private on/off',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!msg?.key?.fromMe) {
        return sock.sendMessage(jid, {
          text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
        }, { quoted: msg });
      }

      const mode = String(args?.[0] || '').toLowerCase().trim();
      const state = String(args?.[1] || '').toLowerCase().trim();

      let finalMode = 'all';
      let finalState = mode;

      // support:.antideletestatus on OR.antideletestatus private on
      if (['private', 'all', 'dm'].includes(mode)) {
        finalMode = mode;
        finalState = state;
      }

      // Show current settings if no on/off
      if (!['on','off'].includes(finalState)) {
        const cur = account.antideletestatus || { all: false, private: false };
        // normalize if it's boolean from old version
        if (typeof cur === 'boolean') {
          cur = { all: cur, private: false };
        }
        return sock.sendMessage(jid, {
          text: `⚙️ *ANTI-DELETE STATUS SETTINGS*\n\n👀 ALL STATUS: ${cur.all?'✅ ON':'❌ OFF'}\n🔐 PRIVATE LOG: ${cur.private?'✅ ON':'❌ OFF'}\n\n*Usage:*\n.antideletestatus on\n.antideletestatus off\n.antideletestatus private on\n.antideletestatus private off`
        }, { quoted: msg });
      }

      // Init object if not exists or is boolean
      if (!account.antideletestatus || typeof account.antideletestatus!== 'object') {
        account.antideletestatus = { all: false, private: false };
      }
      if (typeof account.antideletestatus.all!== 'boolean') account.antideletestatus.all = false;
      if (typeof account.antideletestatus.private!== 'boolean') account.antideletestatus.private = false;

      const isOn = finalState === 'on';

      if (finalMode === 'private') {
        account.antideletestatus.private = isOn;
        // if private ON, make sure all is also ON
        if (isOn) account.antideletestatus.all = true;
      } else {
        account.antideletestatus.all = isOn;
        if (!isOn) account.antideletestatus.private = false;
      }

      // --- SAVE TO DB ---
      // Use same save method you use in anticall/antidelete commands
      try {
        // try common save locations
        const manager = require('../../utils/accountManager');
        if (manager && typeof manager.saveAccount === 'function') {
          await manager.saveAccount(account);
        } else if (manager && typeof manager.save === 'function') {
          await manager.save(account);
        }
      } catch (e) {
        // if no manager, account is saved by reference in memory (will reset on restart)
        console.log('[AntiDeleteStatus] No saveAccount found, using memory only');
      }

      const status = isOn? '✅ ENABLED' : '❌ DISABLED';
      return sock.sendMessage(jid, {
        text: `🛡️ *ANTI-DELETE STATUS UPDATED*\n\n👀 Feature: Status Anti-Delete\n📌 Mode: ${finalMode.toUpperCase()}\n📌 Status: ${status}\n\n${isOn? 'I will now save and resend deleted statuses.' : 'I will no longer save deleted statuses.'}`
      }, { quoted: msg });

    } catch (error) {
      console.error('[AntiDeleteStatus] ❌', error);
      return sock.sendMessage(jid, { text: `❌ *Failed*\n${error?.message}` }, { quoted: msg });
    }
  }
};