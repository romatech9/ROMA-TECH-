// ============================================================
// MUFASER-X — LIB — ANTIAUDIO + ANTISONG + ANTIVIDEO + ANTIFORWARD
// ============================================================

function getAudioSettings(account,jid){
  if(!account.antiaudio) account.antiaudio={};
  if(!account.antiaudio[jid]) account.antiaudio[jid]={mode:'off'};
  return account.antiaudio[jid];
}
function getSongSettings(account,jid){
  if(!account.antisong) account.antisong={};
  if(!account.antisong[jid]) account.antisong[jid]={mode:'off'};
  return account.antisong[jid];
}
function getVideoSettings(account,jid){
  if(!account.antivideo) account.antivideo={};
  if(!account.antivideo[jid]) account.antivideo[jid]={mode:'off'};
  return account.antivideo[jid];
}
function getForwardSettings(account,jid){
  if(!account.antiforward) account.antiforward={};
  if(!account.antiforward[jid]) account.antiforward[jid]={mode:'off'};
  return account.antiforward[jid];
}

async function handleAntiAudio(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getAudioSettings(account,jid); if(s.mode==='off') return false;
    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;
    const aud=m.audioMessage; if(!aud||aud.ptt!==true) return false;
    const sender=msg.key.participant;
    await sock.sendMessage(jid,{delete:msg.key});
    if(s.mode==='warn'){
      await sock.sendMessage(jid,{text:`⚠️ *ANTIAUDIO*\n\n@${sender.split('@')[0]} Voice note not allowed.`,mentions:[sender]});
    }
    return true;
  }catch(e){ console.log('[AntiAudio]',e.message); return false; }
}

async function handleAntiSong(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getSongSettings(account,jid); if(s.mode==='off') return false;
    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;
    const aud=m.audioMessage; const doc=m.documentMessage;
    let isSong=false;
    if(aud&&aud.ptt!==true) isSong=true;
    if(doc&&doc.mimetype?.startsWith('audio/')) isSong=true;
    if(!isSong) return false;
    const sender=msg.key.participant;
    await sock.sendMessage(jid,{delete:msg.key});
    if(s.mode==='warn'){
      await sock.sendMessage(jid,{text:`⚠️ *ANTISONG*\n\n@${sender.split('@')[0]} Song/audio file not allowed.`,mentions:[sender]});
    }
    return true;
  }catch(e){ console.log('[AntiSong]',e.message); return false; }
}

async function handleAntiVideo(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getVideoSettings(account,jid); if(s.mode==='off') return false;
    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;
    if(!m.videoMessage) return false;
    const sender=msg.key.participant;
    await sock.sendMessage(jid,{delete:msg.key});
    if(s.mode==='warn'){
      await sock.sendMessage(jid,{text:`⚠️ *ANTIVIDEO*\n\n@${sender.split('@')[0]} Video not allowed.`,mentions:[sender]});
    }
    return true;
  }catch(e){ console.log('[AntiVideo]',e.message); return false; }
}

async function handleAntiForward(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getForwardSettings(account,jid); if(s.mode==='off') return false;
    const m=msg.message; if(!m) return false;
    const type=Object.keys(m)[0];
    const content=m[type];
    const ctx=content?.contextInfo||m.ephemeralMessage?.message?.[type]?.contextInfo;
    const isForward=ctx?.isForwarded||(ctx?.forwardingScore&&ctx.forwardingScore>0);
    if(!isForward) return false;
    const sender=msg.key.participant;
    await sock.sendMessage(jid,{delete:msg.key});
    if(s.mode==='warn'){
      await sock.sendMessage(jid,{text:`⚠️ *ANTIFORWARD*\n\n@${sender.split('@')[0]} Forwarded messages not allowed.`,mentions:[sender]});
    }
    return true;
  }catch(e){ console.log('[AntiForward]',e.message); return false; }
}

module.exports={ handleAntiAudio, handleAntiSong, handleAntiVideo, handleAntiForward, getAudioSettings, getSongSettings, getVideoSettings, getForwardSettings };