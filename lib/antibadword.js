function getMessageText(msg){
  const m=msg?.message||{};
  return m.conversation||m.extendedTextMessage?.text||m.imageMessage?.caption||m.videoMessage?.caption||m.documentMessage?.caption||'';
}

function getSettings(account,jid){
  if(!account.antibadword) account.antibadword={};
  if(!account.antibadword[jid]) account.antibadword[jid]={mode:'off'};
  return account.antibadword[jid];
}

const BAD_WORDS=[
  'fuck','fucking','motherfucker','shit','bitch','asshole','bastard',
  'dick','pussy','cock','cunt','whore','slut','sex','sexy','porn',
  'porno','nude','nudes','naked','horny','blowjob','handjob','cum',
  'sperm','penis','vagina','boobs','rape'
];

function hasBadWord(text){
  const t=String(text||'').toLowerCase();
  return BAD_WORDS.some(w=>new RegExp(`\\b${w}\\b`,'i').test(t));
}

async function handleAntiBadWord(sock,msg,account){
  try{
    const jid=msg?.key?.remoteJid;
    if(typeof jid!=='string'||!jid.endsWith('@g.us')) return false;
    if(msg?.message?.protocolMessage||msg?.message?.reactionMessage) return false;

    const settings=getSettings(account,jid);
    if(!['warn','delete','on'].includes(settings.mode)) return false;

    const text=getMessageText(msg);
    if(!text||!hasBadWord(text)) return false;

    const metadata=await sock.groupMetadata(jid);
    const participants=metadata.participants||[];

    const getNumber=v=>String(v||'').split('@')[0].split(':')[0].replace(/\D/g,'');
    const senderJid=msg?.key?.participant||msg?.participant||(msg?.key?.fromMe?sock?.user?.id:'');
    const senderNumber=getNumber(senderJid);

    const sender=participants.find(p=>getNumber(p.id)===senderNumber||getNumber(p.phoneNumber)===senderNumber);
    const isAdmin=msg?.key?.fromMe||sender?.admin==='admin'||sender?.admin==='superadmin';

    if(isAdmin) return false;

    const botNumber=getNumber(sock?.user?.id);
    const bot=participants.find(p=>getNumber(p.id)===botNumber||getNumber(p.phoneNumber)===botNumber);
    if(!(bot?.admin==='admin'||bot?.admin==='superadmin')) return false;

    try{ await sock.sendMessage(jid,{delete:msg.key}); }catch{}

    if(settings.mode==='warn'){
      await sock.sendMessage(jid,{
        text:`⚠️ @${senderNumber} Bad words are not allowed in this group!`,
        mentions:[senderJid]
      });
    }

    return true;
  }catch(e){
    console.error('[AntiBadWord Error]',e.message);
    return false;
  }
}

module.exports={handleAntiBadWord};