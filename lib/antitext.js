// ============================================================
// MUFASER-X — LIB — ANTITEXT
// ============================================================

function getTextSettings(account,jid){
  if(!account.antitext) account.antitext={};
  if(!account.antitext[jid]) account.antitext[jid]={mode:'off'};
  return account.antitext[jid];
}

async function handleAntiText(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getTextSettings(account,jid); if(s.mode==='off') return false;

    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;

    // Only plain text
    const isText =!!(m.conversation || m.extendedTextMessage?.text);
    if(!isText) return false;

    // Ignore bot and commands (.xxx)
    const text = m.conversation || m.extendedTextMessage?.text || '';
    if(!text.trim()) return false;
    if(text.trim().startsWith('.')) return false; // don't block commands
    if(msg.key.fromMe) return false;

    const sender=msg.key.participant;
    await sock.sendMessage(jid,{delete:msg.key});

    if(s.mode==='warn'){
      await sock.sendMessage(jid,{
        text:`⚠️ *ANTITEXT*\n\n@${sender.split('@')[0]} Text messages not allowed.`,
        mentions:[sender]
      });
    }
    return true;
  }catch(e){ console.log('[AntiText]',e.message); return false; }
}

module.exports={ handleAntiText, getTextSettings };