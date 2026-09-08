module.exports={
  name:'antipromote',
  desc:'Block promotes in group',
  category:'Group',
  usage:'.antipromote on / off',
  async execute(sock,msg,jid,args,sender,account){
    try{
      if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:'❌ *This command only works in groups.*'},{quoted:msg});
      const metadata=await sock.groupMetadata(jid); const participants=metadata.participants||[];
      const cleanJid=v=>String(v||'').trim().toLowerCase(); const getNumber=v=>String(v||'').split('@')[0].split(':')[0].replace(/\D/g,'');
      const participantMatches=(p,tj,tn)=>{if(!p)return false; if(cleanJid(p.id)===cleanJid(tj))return true; if(getNumber(p.id)===tn)return true; if(getNumber(p.phoneNumber)===tn)return true; return false;};
      const botJid=sock?.user?.id||''; const botNumber=getNumber(botJid);
      const botParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
      const isBotAdmin=botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin';
      const senderJid=msg?.key?.participant||sender?.jid||msg?.participant||(msg?.key?.fromMe?botJid:''); const senderNumber=getNumber(sender?.number||senderJid);
      let senderParticipant=participants.find(p=>participantMatches(p,senderJid,senderNumber)); if(!senderParticipant&&msg?.key?.fromMe) senderParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
      const isSenderAdmin=msg?.key?.fromMe||senderParticipant?.admin==='admin'||senderParticipant?.admin==='superadmin';
      if(!isSenderAdmin) return sock.sendMessage(jid,{text:'❌ *Only group admins can use this command.*'},{quoted:msg});
      if(!isBotAdmin) return sock.sendMessage(jid,{text:'❌ *I need to be a group admin to use the antipromote command.*'},{quoted:msg});

      if(!account.antipromote) account.antipromote={}; if(!account.antipromote[jid]) account.antipromote[jid]={mode:'off'};
      const s=account.antipromote[jid];
      const type=String(args[0]||'').toLowerCase(); const action=String(args[1]||'').toLowerCase();

      if(type==='on'||(type==='delete'&&action==='on')||(type==='warn'&&action==='on')){ s.mode='on'; return sock.sendMessage(jid,{text:'🚫 *ANTIPROMOTE ENABLED*\n🛡️ Any promote will be reversed (demote back).'},{quoted:msg}); }
      if(type==='off'||action==='off'){ s.mode='off'; return sock.sendMessage(jid,{text:'✅ *ANTIPROMOTE DISABLED*'},{quoted:msg}); }

      return sock.sendMessage(jid,{text:'🛡️ *ANTIPROMOTE*\n\n`.antipromote on` → block & reverse promotes\n`.antipromote off` → disable\n\nCurrent: *'+s.mode.toUpperCase()+'* '},{quoted:msg});
    }catch(e){ return sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:msg}); }
  }
};