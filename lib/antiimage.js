// ============================================================
// MUFASER-X — LIB — ANTIIMAGE
// ============================================================

function getImageSettings(account,jid){
  if(!account.antiimage) account.antiimage={};
  if(!account.antiimage[jid]) account.antiimage[jid]={mode:'off'};
  return account.antiimage[jid];
}

async function handleAntiImage(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getImageSettings(account,jid); if(s.mode==='off') return false;

    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;
    if(!m.imageMessage) return false;

    const sender=msg.key.participant;
    await sock.sendMessage(jid,{delete:msg.key});

    if(s.mode==='warn'){
      await sock.sendMessage(jid,{
        text:`⚠️ *ANTIIMAGE*\n\n@${sender.split('@')[0]} Images not allowed.`,
        mentions:[sender]
      });
    }
    return true;
  }catch(e){ console.log('[AntiImage]',e.message); return false; }
}

module.exports={ handleAntiImage, getImageSettings };