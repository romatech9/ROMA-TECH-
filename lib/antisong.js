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

// ===== ADMIN CHECK- =====
async function checkAdmin(sock, msg, account, jid){
  const metadata = await sock.groupMetadata(jid);
  const participants = metadata.participants||[];
  const cleanJid=v=>{if(!v)return'';return String(v).trim().toLowerCase();};
  const getNumber=v=>{if(!v)return'';return String(v).split('@')[0].split(':')[0].replace(/\D/g,'');};
  const participantMatches=(p,tj,tn)=>{if(!p)return false; if(cleanJid(p.id)===cleanJid(tj))return true; if(getNumber(p.id)===tn)return true; if(getNumber(p.phoneNumber)===tn)return true; return false;};

  const botJid=sock?.user?.id||''; const botNumber=getNumber(botJid);
  const botParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
  if(!(botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin')) return { isBotAdmin: false };

  const senderObj=account?.sender||msg?.sender||{};
  const senderJid=msg?.key?.participant||senderObj?.jid||msg?.participant||(msg?.key?.fromMe?botJid:'');
  const senderNumber=getNumber(senderObj?.number||senderJid);
  let senderParticipant=participants.find(p=>participantMatches(p,senderJid,senderNumber));
  if(!senderParticipant&&msg?.key?.fromMe) senderParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
  const isAdmin=msg?.key?.fromMe===true||senderParticipant?.admin==='admin'||senderParticipant?.admin==='superadmin';

  return { isBotAdmin: true, isAdmin, senderJid, senderNumber };
}

async function handleAntiAudio(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getAudioSettings(account,jid); if(!['warn','delete','on'].includes(s.mode)) return false;
    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;
    const aud=m.audioMessage; if(!aud||aud.ptt!==true) return false;

    const check = await checkAdmin(sock, msg, account, jid);
    if(!check.isBotAdmin) return false;
    if(check.isAdmin) return false;

    await sock.sendMessage(jid,{delete:msg.key});
    if(s.mode==='warn'){
      await sock.sendMessage(jid,{text:`🎙️ *ANTIAUDIO*\n\n@${check.senderNumber} Voice note not allowed.`,mentions:[check.senderJid]});
    }
    return true;
  }catch(e){ console.log('[AntiAudio]',e.message); return false; }
}

async function handleAntiSong(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getSongSettings(account,jid); if(!['warn','delete','on'].includes(s.mode)) return false;
    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;
    const aud=m.audioMessage; const doc=m.documentMessage;
    let isSong=false;
    if(aud&&aud.ptt!==true) isSong=true;
    if(doc&&doc.mimetype?.startsWith('audio/')) isSong=true;
    if(!isSong) return false;

    const check = await checkAdmin(sock, msg, account, jid);
    if(!check.isBotAdmin) return false;
    if(check.isAdmin) return false;

    await sock.sendMessage(jid,{delete:msg.key});
    if(s.mode==='warn'){
      await sock.sendMessage(jid,{text:`🎵 *ANTISONG*\n\n@${check.senderNumber} Song/audio file not allowed.`,mentions:[check.senderJid]});
    }
    return true;
  }catch(e){ console.log('[AntiSong]',e.message); return false; }
}

async function handleAntiVideo(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getVideoSettings(account,jid); if(!['warn','delete','on'].includes(s.mode)) return false;
    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;
    if(!m.videoMessage) return false;

    const check = await checkAdmin(sock, msg, account, jid);
    if(!check.isBotAdmin) return false;
    if(check.isAdmin) return false;

    await sock.sendMessage(jid,{delete:msg.key});
    if(s.mode==='warn'){
      await sock.sendMessage(jid,{text:`🎬 *ANTIVIDEO*\n\n@${check.senderNumber} Video not allowed.`,mentions:[check.senderJid]});
    }
    return true;
  }catch(e){ console.log('[AntiVideo]',e.message); return false; }
}

async function handleAntiForward(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getForwardSettings(account,jid); if(!['warn','delete','on'].includes(s.mode)) return false;
    const m=msg.message; if(!m) return false;
    const type=Object.keys(m)[0];
    const content=m[type];
    const ctx=content?.contextInfo||m.ephemeralMessage?.message?.[type]?.contextInfo;
    const isForward=ctx?.isForwarded||(ctx?.forwardingScore&&ctx.forwardingScore>0);
    if(!isForward) return false;

    const check = await checkAdmin(sock, msg, account, jid);
    if(!check.isBotAdmin) return false;
    if(check.isAdmin) return false;

    await sock.sendMessage(jid,{delete:msg.key});
    if(s.mode==='warn'){
      await sock.sendMessage(jid,{text:`↗️ *ANTIFORWARD*\n\n@${check.senderNumber} Forwarded messages not allowed.`,mentions:[check.senderJid]});
    }
    return true;
  }catch(e){ console.log('[AntiForward]',e.message); return false; }
}

module.exports={ handleAntiAudio, handleAntiSong, handleAntiVideo, handleAntiForward, getAudioSettings, getSongSettings, getVideoSettings, getForwardSettings };
