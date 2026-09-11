// ============================================================
// MUFASER-X — LIB — ANTIIMAGE — ADMIN SAFE
// ============================================================

function getImageSettings(account,jid){
  if(!account.antiimage) account.antiimage={};
  if(!account.antiimage[jid]) account.antiimage[jid]={mode:'off'};
  return account.antiimage[jid];
}

async function handleAntiImage(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(typeof jid!=='string'||!jid.endsWith('@g.us')) return false;
    if(msg?.message?.protocolMessage||msg?.message?.reactionMessage) return false;

    const s=getImageSettings(account,jid);
    if(!['warn','delete','on'].includes(s.mode)) return false;

    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;
    if(!m.imageMessage) return false;

    // ===== ADMIN CHECK =====
    const metadata = await sock.groupMetadata(jid);
    const participants = metadata.participants||[];
    const cleanJid=v=>{if(!v)return'';return String(v).trim().toLowerCase();};
    const getNumber=v=>{if(!v)return'';return String(v).split('@')[0].split(':')[0].replace(/\D/g,'');};
    const participantMatches=(p,tj,tn)=>{if(!p)return false; if(cleanJid(p.id)===cleanJid(tj))return true; if(getNumber(p.id)===tn)return true; if(getNumber(p.phoneNumber)===tn)return true; return false;};

    const botJid=sock?.user?.id||''; const botNumber=getNumber(botJid);
    const botParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
    if(!(botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin')) return false;

    const senderObj=account?.sender||msg?.sender||{};
    const senderJid=msg?.key?.participant||senderObj?.jid||msg?.participant||(msg?.key?.fromMe?botJid:'');
    const senderNumber=getNumber(senderObj?.number||senderJid);
    let senderParticipant=participants.find(p=>participantMatches(p,senderJid,senderNumber));
    if(!senderParticipant&&msg?.key?.fromMe) senderParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
    const isAdmin=msg?.key?.fromMe===true||senderParticipant?.admin==='admin'||senderParticipant?.admin==='superadmin';
    if(isAdmin) return false;

    try{ await sock.sendMessage(jid,{delete:msg.key}); }catch{}

    if(s.mode==='warn'){
      await sock.sendMessage(jid,{
        text:`🖼️ *ANTIIMAGE*\n\n@${senderNumber} Images not allowed.`,
        mentions:[senderJid]
      });
    }
    return true;
  }catch(e){ console.log('[AntiImage]',e.message); return false; }
}

module.exports={ handleAntiImage, getImageSettings };