// modules/commands/autoreact.js - MUFASER-X — GROUP SPECIFIC FIXED

module.exports = {
  name: 'autoreact',
  aliases: ['autoreaction','autorea','ar'],
  desc: 'Enable or disable Auto-React for DM/Group/All - Group specific',
  category: 'Owner',
  usage: '.autoreact group on/off (inside group) |.autoreact all on/off/emoji',

  async execute(sock, msg, jid, args, sender, account) {
    try {
      if (!msg?.key?.fromMe) {
        return sock.sendMessage(jid, {
          text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
        }, { quoted: msg });
      }

      let mode = String(args?.[0] || '').toLowerCase().trim();
      let value = args?.[1]? String(args?.[1]).trim() : '';
      if (mode === 'gc') mode = 'group';
      if (mode === 'private') mode = 'dm';

      // init list
      account.autoreactGroups = account.autoreactGroups || [];
      account.autoreactgroup = account.autoreactgroup || false;
      account.autoreactdm = account.autoreactdm || false;

      // === NEW: GROUP SPECIFIC ===
      //.autoreact group on/off INSIDE a group
      if (mode === 'group' && jid.endsWith('@g.us')) {
        if (value === 'on' || mode === 'group' &&!value) {
          // if.autoreact group on OR just.autoreact group on (value = on)
          // For your usage:.autoreact group on
          let state = (value || 'on').toLowerCase();
          // Actually your args are ["group","on"] so mode=group value=on
          if (value === 'on' || args[0] === 'group' && args[1] === 'on') {
            if (!account.autoreactGroups.includes(jid)) account.autoreactGroups.push(jid);
            account.autoreactgroup = true; // keep compat
          } else if (value === 'off') {
            account.autoreactGroups = account.autoreactGroups.filter(g => g!== jid);
            if (account.autoreactGroups.length === 0) account.autoreactgroup = false;
          }

          // SAVE
          try {
            const manager = require('../../utils/accountManager');
            if (manager.saveAccounts) await manager.saveAccounts();
            else if (manager.saveAccount) await manager.saveAccount(account);
            else if (manager.save) await manager.save(account);
          } catch (e) {}

          const isEnabled = account.autoreactGroups.includes(jid);
          return sock.sendMessage(jid, {
            text: `💫 *AUTO-REACT GROUP*\n\n📌 This group: ${isEnabled? '✅ ENABLED' : '❌ DISABLED'}\n📌 Total groups enabled: ${account.autoreactGroups.length}\n\nBot will ${isEnabled? 'now react ONLY in groups you enabled' : 'no longer react in this group'}.`
          }, { quoted: msg });
        }

        // handle off case when value is off
        if (value === 'off') {
          account.autoreactGroups = account.autoreactGroups.filter(g => g!== jid);
          if (account.autoreactGroups.length === 0) account.autoreactgroup = false;
          try {
            const manager = require('../../utils/accountManager');
            if (manager.saveAccounts) await manager.saveAccounts();
            else if (manager.saveAccount) await manager.saveAccount(account);
            else if (manager.save) await manager.save(account);
          } catch (e) {}
          return sock.sendMessage(jid, {
            text: `❌ *DISABLED IN THIS GROUP*\nTotal enabled: ${account.autoreactGroups.length}`
          }, { quoted: msg });
        }
      }

      // === OLD LOGIC FOR all/dm/global ===
      if (['on','off'].includes(mode) ||!['group','dm','all'].includes(mode)) {
        if (['on','off','true','false','random'].includes(mode) || mode.length <= 4) {
           if (!['on','off','true','false'].includes(mode)) {
              value = args[0];
              mode = 'all';
           } else {
              value = mode;
              mode = 'all';
           }
        }
      }
      if (!mode) mode = 'all';

      if (!value && ['group','dm','all'].includes(mode)) {
        const fmt = (v) =>!v? '❌ OFF' : (typeof v === 'string' && v!== 'true'? `${v}` : 'ON random');
        return sock.sendMessage(jid, {
          text: `⚙️ *AUTO-REACT SETTINGS*\n\n👥 GROUP: ${fmt(account.autoreactgroup)} (${account.autoreactGroups.length} specific groups)\n💬 DM: ${fmt(account.autoreactdm)}\n\n*Usage:*\n.autoreact group on - enable in THIS group only\n.autoreact group off - disable in THIS group\n.autoreact all on/off/🔥\n.autoreact dm on/off/❤️`
        }, { quoted: msg });
      }

      let finalValue = value.toLowerCase();
      let isOff = ['off','false'].includes(finalValue);
      let isOn = ['on','true','random'].includes(finalValue);
      let isEmoji =!isOff &&!isOn;

      let toSave;
      if (isOff) toSave = false;
      else if (isOn) toSave = true;
      else toSave = value;

      if (mode === 'all') {
        account.autoreactgroup = toSave;
        account.autoreactdm = toSave;
        if (isOff) account.autoreactGroups = []; // clear all groups if all off
      } else if (mode === 'group') {
        // global group on/off (all groups)
        account.autoreactgroup = toSave;
        if (isOff) account.autoreactGroups = [];
      } else if (mode === 'dm') {
        account.autoreactdm = toSave;
      }

      try {
        const manager = require('../../utils/accountManager');
        if (manager.saveAccounts) await manager.saveAccounts();
        else if (manager.saveAccount) await manager.saveAccount(account);
        else if (manager.save) await manager.save(account);
      } catch (e) {}

      let statusText = isOff? '❌ DISABLED' : isEmoji? `✅ SET TO ${toSave}` : '✅ ENABLED';
      return sock.sendMessage(jid, {
        text: `💫 *AUTO-REACT UPDATED*\n\n📌 Mode: ${mode.toUpperCase()}\n📌 Status: ${statusText}\n📌 Specific groups: ${account.autoreactGroups.length}`
      }, { quoted: msg });

    } catch (error) {
      console.error('[AutoReact] ❌', error);
      return sock.sendMessage(jid, { text: `❌ *Failed*\n${error?.message}` }, { quoted: msg });
    }
  }
};