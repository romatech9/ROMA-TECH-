module.exports={
  name:'antidemote',
  desc:'Block demotes in group',
  category:'Group',
  usage:'.antidemote on / off',
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
      if(!isBotAdmin) return sock.sendMessage(jid,{text:'❌ *I need to be a group admin to use the antidemote command.*'},{quoted:msg});

      if(!account.antidemote) account.antidemote={}; if(!account.antidemote[jid]) account.antidemote[jid]={mode:'off'};
      const s=account.antidemote[jid];
      const type=String(args[0]||'').toLowerCase(); const action=String(args[1]||'').toLowerCase();

      if(type==='on'||(type==='delete'&&action==='on')||(type==='warn'&&action==='on')){ s.mode='on'; return sock.sendMessage(jid,{text:'🚫 *ANTIDEMOTE ENABLED*\n🛡️ Any demote will be reversed (promote back).'},{quoted:msg}); }
      if(type==='off'||action==='off'){ s.mode='off'; return sock.sendMessage(jid,{text:'✅ *ANTIDEMOTE DISABLED*'},{quoted:msg}); }

      return sock.sendMessage(jid,{text:'🛡️ *ANTIDEMOTE*\n\n`.antidemote on` → block & reverse demotes\n`.antidemote off` → disable\n\nCurrent: *'+s.mode.toUpperCase()+'* '},{quoted:msg});
    }catch(e){ return sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:msg}); }
  }
};