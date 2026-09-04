// modules/commands/autoreactchannel.js
module.exports = {
  name: 'autoreactchannel',
  aliases: ['autoreactch','arch','areactchannel'],
  desc: 'Enable or disable Auto-React for WhatsApp Channels',
  category: 'Owner',
  usage: '.autoreactchannel on/off',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!msg?.key?.fromMe) {
        return sock.sendMessage(jid, {
          text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
        }, { quoted: msg });
      }

      let state = String(args?.[0] || '').toLowerCase().trim();

      if (!['on','off'].includes(state)) {
        const cur = account.autoreactchannel;
        return sock.sendMessage(jid, {
          text: `⚙️ *AUTO-REACT CHANNEL SETTINGS*\n\n📢 CHANNEL: ${cur? '✅ ON' : '❌ OFF'}\n\n*Usage:*\n.autoreactchannel on\n.autoreactchannel off`
        }, { quoted: msg });
      }

      account.autoreactchannel = state === 'on';
      
            try {
        const manager = require('../../utils/accountManager');
        if (manager.saveAccounts) await manager.saveAccounts();
        else if (manager.saveAccount) await manager.saveAccount(account);
        else if (manager.save) await manager.save(account);
      } catch (e) {
        console.log('[AutoReactChannel] save error', e.message);
      }

      return sock.sendMessage(jid, {
        text: `📢 *AUTO-REACT CHANNEL UPDATED*\n\n📌 Feature: Channel Auto-React\n📌 Status: ${account.autoreactchannel? '✅ ENABLED' : '❌ DISABLED'}\n\n${account.autoreactchannel? 'I will now auto-react to WhatsApp Channel posts.' : 'I will no longer react to Channel posts.'}`
      }, { quoted: msg });

    } catch (error) {
      console.error('[AutoReactChannel] ❌', error);
      return sock.sendMessage(jid, { text: `❌ *Failed*\n${error?.message}` }, { quoted: msg });
    }
  }
};