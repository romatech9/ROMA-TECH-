// ============================================================
// MUFASER-X — LIB — ANTIGCMENTION
// ============================================================

function getGcMentionSettings(account,jid){
  if(!account.antigcmention) account.antigcmention={};
  if(!account.antigcmention[jid]) account.antigcmention[jid]={mode:'off'};
  return account.antigcmention[jid];
}

async function handleAntiGcMention(sock, msg, account){
  try{
    const jid=msg?.key?.remoteJid; if(!jid?.endsWith('@g.us')) return false;
    const s=getGcMentionSettings(account,jid); if(s.mode==='off') return false;

    const m=msg.message?.ephemeralMessage?.message||msg.message; if(!m) return false;

    const type=Object.keys(m)[0];
    const content=m[type];
    const ctx=content?.contextInfo;
    const mentioned=ctx?.mentionedJid||[];
    const hasGroupMention = mentioned.some(j=>String(j).endsWith('@g.us'));

    const text = content?.text || content?.caption || msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const hasGroupLink = /chat\.whatsapp\.com\/[A-Za-z0-9]+/i.test(text);
    const hasGroupInvite =!!m.groupInviteMessage;

    if(!hasGroupMention &&!hasGroupLink &&!hasGroupInvite) return false;

    const sender=msg.key.participant;
    await sock.sendMessage(jid,{delete:msg.key});

    if(s.mode==='warn'){
      await sock.sendMessage(jid,{
        text:`⚠️ *ANTIGCMENTION*\n\n@${sender.split('@')[0]} Group mention not allowed.`,
        mentions:[sender]
      });
    }
    return true;
  }catch(e){ console.log('[AntiGcMention]',e.message); return false; }
}

module.exports={ handleAntiGcMention, getGcMentionSettings };