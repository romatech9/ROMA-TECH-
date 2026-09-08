// ============================================================
// MUFASER-X — LIB — ANTIPROMOTE + ANTIDEMOTE
// ============================================================

function getPromoteSettings(account,jid){
  if(!account.antipromote) account.antipromote={};
  if(!account.antipromote[jid]) account.antipromote[jid]={mode:'off'};
  return account.antipromote[jid];
}
function getDemoteSettings(account,jid){
  if(!account.antidemote) account.antidemote={};
  if(!account.antidemote[jid]) account.antidemote[jid]={mode:'off'};
  return account.antidemote[jid];
}

// Call this inside sock.ev.on('group-participants.update')
async function handleAntiPromote(sock, update, account){
  try{
    const jid=update.id; if(!jid?.endsWith('@g.us')) return;
    if(update.action!=='promote') return;
    const s=getPromoteSettings(account,jid); if(s.mode==='off') return;

    const botJid=sock?.user?.id; if(!botJid) return;
    const metadata=await sock.groupMetadata(jid).catch(()=>null);
    const botParticipant=metadata?.participants?.find(p=>p.id===botJid || p.id.split('@')[0]===botJid.split('@')[0].split(':')[0]);
    const isBotAdmin=botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin';
    if(!isBotAdmin) return;

    // don't act if bot promoted someone
    if(update.author===botJid || update.author?.split('@')[0]===botJid.split('@')[0]) return;

    for(const promoted of update.participants){
      await sock.groupParticipantsUpdate(jid,[promoted],'demote').catch(()=>{});
      await sock.sendMessage(jid,{
        text:`🚫 *ANTIPROMOTE*\n\n@${update.author.split('@')[0]} tried to promote @${promoted.split('@')[0]} — reversed.\n\nDemoted back.`,
        mentions:[update.author, promoted]
      }).catch(()=>{});
    }
  }catch(e){ console.log('[AntiPromote]',e.message); }
}

async function handleAntiDemote(sock, update, account){
  try{
    const jid=update.id; if(!jid?.endsWith('@g.us')) return;
    if(update.action!=='demote') return;
    const s=getDemoteSettings(account,jid); if(s.mode==='off') return;

    const botJid=sock?.user?.id; if(!botJid) return;
    const metadata=await sock.groupMetadata(jid).catch(()=>null);
    const botParticipant=metadata?.participants?.find(p=>p.id===botJid || p.id.split('@')[0]===botJid.split('@')[0].split(':')[0]);
    const isBotAdmin=botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin';
    if(!isBotAdmin) return;

    if(update.author===botJid || update.author?.split('@')[0]===botJid.split('@')[0]) return;

    for(const demoted of update.participants){
      // don't re-promote if demoted was bot
      if(demoted===botJid) continue;
      await sock.groupParticipantsUpdate(jid,[demoted],'promote').catch(()=>{});
      await sock.sendMessage(jid,{
        text:`🚫 *ANTIDEMOTE*\n\n@${update.author.split('@')[0]} tried to demote @${demoted.split('@')[0]} — reversed.\n\nPromoted back.`,
        mentions:[update.author, demoted]
      }).catch(()=>{});
    }
  }catch(e){ console.log('[AntiDemote]',e.message); }
}

module.exports={ handleAntiPromote, handleAntiDemote, getPromoteSettings, getDemoteSettings };