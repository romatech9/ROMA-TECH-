const config = require('../config.js');
function normalizeNumber(v){ return String(v||'').split('@')[0].split(':')[0].replace(/\D/g,''); }

module.exports = {
  name: 'antidm',
  async execute(sock, msg, jid, args, sender, account){
    const isOwner = msg.key?.fromMe === true;
    if(!isOwner) return sock.sendMessage(jid, {text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`});

    const state = String(args[0]||'').toLowerCase();
    if(!state){
      const count = (account.antidmAllowed||[]).length;
      return sock.sendMessage(jid, {text: `🛡️ *SMART ANTI-DM*\n\nStatus: ${account.antidm?'✅ ON':'❌ OFF'}\nAllowed Chats: ${count}\n\n.antidm on - block only NEW DMs\n.antidm off\n.antidm reset - clear allowed list`});
    }
    if(state==='reset'){
      account.antidmAllowed = [];
      return sock.sendMessage(jid, {text: `✅ Allowed list cleared`});
    }
    account.antidm = state === 'on';
    if(!account.antidmAllowed) account.antidmAllowed = [];
    return sock.sendMessage(jid, {text: `✅ Smart Anti-DM ${state==='on'?'ON - will block only NEW strangers':'OFF'}`});
  }
};