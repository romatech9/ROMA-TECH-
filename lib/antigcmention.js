// ============================================================
// MUFASER-X 
// ============================================================

const WARNING_LIMIT = 5;

function getGcMentionSettings(account,jid){
  if(!account.antigcmention) account.antigcmention={};
  if(!account.antigcmention[jid]) account.antigcmention[jid]={mode:'off', warnings:{}};
  if(!account.antigcmention[jid].warnings) account.antigcmention[jid].warnings={};
  return account.antigcmention[jid];
}

function isGcMentionMessage(msg){
  try{
    const m = msg?.message?.ephemeralMessage?.message || msg?.message || {};
    const type = Object.keys(m)[0];
    const content = m[type] || {};
    const ctx = content?.contextInfo || m?.contextInfo || {};

    // Main detection for status
    const groupMentions = ctx?.groupMentions || [];
    if(groupMentions.length > 0) return true;

    // Backup detection
    const text = (content?.text || content?.caption || m?.conversation || '').toLowerCase();
    if(text.includes('this group was mentioned')) return true;

    // If it's a group invite forwarded from status
    if(m?.groupInviteMessage) return true;

    return false;
  }catch{ return false; }
}

async function handleAntiGcMention(sock, msg, account){
  try{
    const jid = msg?.key?.remoteJid;
    if(typeof jid!=='string' ||!jid.endsWith('@g.us')) return false;
    if(msg?.message?.protocolMessage || msg?.message?.reactionMessage) return false;

    const s = getGcMentionSettings(account,jid);
    if(!['on','delete','warn','kick'].includes(s.mode)) return false;
    if(!isGcMentionMessage(msg)) return false;

    const metadata = await sock.groupMetadata(jid);
    const participants = metadata.participants||[];

    const cleanJid=v=>{if(!v)return'';return String(v).trim().toLowerCase();};
    const getNumber=v=>{if(!v)return'';return String(v).split('@')[0].split(':')[0].replace(/\D/g,'');};
    const participantMatches=(p,tj,tn)=>{if(!p)return false; if(cleanJid(p.id)===cleanJid(tj))return true; if(getNumber(p.id)===tn)return true; if(getNumber(p.phoneNumber)===tn)return true; return false;};

    const botJid=sock?.user?.id||''; const botNumber=getNumber(botJid);
    const botParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
    const isBotAdmin = botParticipant?.admin==='admin' || botParticipant?.admin==='superadmin';
    if(!isBotAdmin) return false;

    const senderObj=account?.sender||msg?.sender||{};
    const senderJid=msg?.key?.participant||senderObj?.jid||msg?.participant||(msg?.key?.fromMe?botJid:'');
    const senderNumber=getNumber(senderObj?.number||senderJid);
    let senderParticipant=participants.find(p=>participantMatches(p,senderJid,senderNumber));
    if(!senderParticipant&&msg?.key?.fromMe) senderParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
    const isAdmin=msg?.key?.fromMe===true||senderParticipant?.admin==='admin'||senderParticipant?.admin==='superadmin';
    if(isAdmin) return false;

    try{ await sock.sendMessage(jid,{delete:msg.key}); }catch{}

    if(s.mode==='on' || s.mode==='delete'){
      return true;
    }

    if(s.mode==='warn'){
      if(!s.warnings[senderJid]) s.warnings[senderJid]=0;
      s.warnings[senderJid]++;
      const count=s.warnings[senderJid];

      if(count>=WARNING_LIMIT){
        try{
          await sock.groupParticipantsUpdate(jid,[senderJid],'remove');
          await sock.sendMessage(jid,{text:`🚫 @${senderNumber} removed after ${WARNING_LIMIT}/${WARNING_LIMIT} group mention warnings.`,mentions:[senderJid]});
          delete s.warnings[senderJid];
        }catch{
          await sock.sendMessage(jid,{text:`⚠️ @${senderNumber} reached ${WARNING_LIMIT}/${WARNING_LIMIT} warnings but I couldn't kick.`,mentions:[senderJid]});
        }
        return true;
      }
      await sock.sendMessage(jid,{text:`⚠️ @${senderNumber} Group mention / Status mention not allowed!\n\nWarning: ${count}/${WARNING_LIMIT}`,mentions:[senderJid]});
      return true;
    }

    return true;
  }catch(e){ console.log('[AntiGcMention Error]',e.message); return false; }
}

function resetAntiGcMentionWarnings(account,jid,userJid){
  const s=getGcMentionSettings(account,jid);
  delete s.warnings[userJid];
}

module.exports={ handleAntiGcMention, getGcMentionSettings, resetAntiGcMentionWarnings };