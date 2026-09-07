// ============================================================
// MUFASER-X — ANTITAG — ONLY WARN & DELETE — NO KICK
// ============================================================

function getMessageText(msg){
  const m = msg?.message||{};
  return m.conversation||m.extendedTextMessage?.text||m.imageMessage?.caption||m.videoMessage?.caption||m.documentMessage?.caption||'';
}

function getSettings(account,jid){
  if(!account.antitag) account.antitag={};
  if(!account.antitag[jid]) account.antitag[jid]={mode:'off'};
  return account.antitag[jid];
}

function isTagMessage(msg){
  const m = msg?.message||{};
  const text = getMessageText(msg).toLowerCase();
  const mentions = m.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const groupMentions = m.extendedTextMessage?.contextInfo?.groupMentions || [];
  if (mentions.length >= 5) return true;
  if (groupMentions.length > 0) return true;
  if (text.includes('@all') || text.includes('@everyone') || text.includes('tagall') || text.includes('hidetag')) return true;
  return false;
}

async function handleAntiTag(sock, msg, account){
  try{
    const jid = msg?.key?.remoteJid;
    if(typeof jid!=='string'||!jid.endsWith('@g.us')) return false;
    if(msg?.message?.protocolMessage||msg?.message?.reactionMessage) return false;
    const settings = getSettings(account,jid);
    if(!['warn','delete','on'].includes(settings.mode)) return false;
    if(!isTagMessage(msg)) return false;

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

    if(settings.mode==='warn'){
      await sock.sendMessage(jid,{text:`📢 @${senderNumber} Tagging all members is not allowed!`,mentions:[senderJid]});
    }
    return true;
  }catch(e){ console.error('[AntiTag Error]',e.message); return false; }
}

module.exports={handleAntiTag};