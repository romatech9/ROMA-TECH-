// ============================================================
// MUFASER-X — ANTIPROMOTE + ANTIDEMOTE — SAVAGE WARN ONLY
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

const promoteWarns = [
  "But why you promote like you own the group comrade? 🤔 Next time you will be the one to go down 😡",
  "Aye! Promotion without permission? You think this is your father's company? 😂 Be careful next time...",
  "Oya @%author% you promote @%target% like you be president? 🤔 Make we watch you...",
  "Comrade %author% why you dey share admin like gala? 🥴 Calm down ooo!",
  "Hmm promotion party without informing MUFASER-X? Not good comrade 😒"
];

const demoteWarns = [
  "But why you demote your friends comrade 🤔🤔 if you repeat it you will be next......😡",
  "Ahh @%author% demoted @%target%? Why you dey pull your guy down? 😤 You want make we demote you too?",
  "Eish @%author% why you remove @%target% power? You jealous? 🤨 Be careful...",
  "Comrade %author% so you hate @%target% like that? You demote am? 🥴 Next na you ooo!",
  "Omo @%author% you wicked o! You demote @%target%? Why you do am like that? 😡",
  "So @%author% you think demoting @%target% makes you big man? 🤔 We dey watch you..."
];

function getRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

async function handleAntiPromote(sock, update, account){
  try{
    const jid=update.id; if(!jid?.endsWith('@g.us')) return;
    if(update.action!=='promote') return;
    const s=getPromoteSettings(account,jid); if(s.mode==='off') return;

    const botJid=sock?.user?.id; if(!botJid) return;
    const metadata=await sock.groupMetadata(jid).catch(()=>null);
    const botParticipant=metadata?.participants?.find(p=>p.id===botJid || p.id.split('@')[0]===botJid.split('@')[0].split(':')[0]);
    if(!(botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin')) return;
    if(update.author===botJid || update.author?.split('@')[0]===botJid.split('@')[0]) return;

    for(const promoted of update.participants){
      let msg = getRandom(promoteWarns);
      msg = msg.replace(/%author%/g, promoted.split('@')[0]===update.author.split('@')[0]? 'yourself' : '').replace(/%target%/g, promoted.split('@')[0]);
      // fix placeholders
      const text = `⬆️ @${update.author.split('@')[0]} promoted @${promoted.split('@')[0]}\n\n${msg.replace('%author%', update.author.split('@')[0]).replace('%target%', promoted.split('@')[0])}`;

      await sock.sendMessage(jid,{ text, mentions:[update.author, promoted] }).catch(()=>{});
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
    if(!(botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin')) return;
    if(update.author===botJid || update.author?.split('@')[0]===botJid.split('@')[0]) return;

    for(const demoted of update.participants){
      if(demoted===botJid) continue;
      let msg = getRandom(demoteWarns);
      msg = msg.replace(/%author%/g, update.author.split('@')[0]).replace(/%target%/g, demoted.split('@')[0]);

      const text = `⬇️ @${update.author.split('@')[0]} demoted @${demoted.split('@')[0]}\n\n${msg}`;

      await sock.sendMessage(jid,{ text, mentions:[update.author, demoted] }).catch(()=>{});
    }
  }catch(e){ console.log('[AntiDemote]',e.message); }
}

module.exports={ handleAntiPromote, handleAntiDemote, getPromoteSettings, getDemoteSettings };