module.exports={
  name:'antitag',
  desc:'Block tagall',
  category:'Group',
  usage:'.antitag delete on / warn on / off',
  async execute(sock,msg,jid,args,sender,account){
    try{
      if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:'❌ Group only.'},{quoted:msg});
      const metadata=await sock.groupMetadata(jid); const participants=metadata.participants||[];
      const cleanJid=v=>String(v||'').trim().toLowerCase(); const getNumber=v=>String(v||'').split('@')[0].split(':')[0].replace(/\D/g,'');
      const participantMatches=(p,tj,tn)=>{if(!p)return false; if(cleanJid(p.id)===cleanJid(tj))return true; if(getNumber(p.id)===tn)return true; if(getNumber(p.phoneNumber)===tn)return true; return false;};
      const botJid=sock?.user?.id||''; const botNumber=getNumber(botJid);
      const botParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
      const isBotAdmin=botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin';
      const senderJid=msg?.key?.participant||sender?.jid||msg?.participant||(msg?.key?.fromMe?botJid:''); const senderNumber=getNumber(sender?.number||senderJid);
      let senderParticipant=participants.find(p=>participantMatches(p,senderJid,senderNumber)); if(!senderParticipant&&msg?.key?.fromMe) senderParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
      const isSenderAdmin=msg?.key?.fromMe||senderParticipant?.admin==='admin'||senderParticipant?.admin==='superadmin';
      if(!isSenderAdmin) return sock.sendMessage(jid,{text:'❌ *Admin Only*'},{quoted:msg});
      if(!isBotAdmin) return sock.sendMessage(jid,{text:'❌ I need admin.'},{quoted:msg});

      if(!account.antitag) account.antitag={}; if(!account.antitag[jid]) account.antitag[jid]={mode:'off'};
      const s=account.antitag[jid];
      const type=String(args[0]||'').toLowerCase(); const action=String(args[1]||'').toLowerCase();

      if(type==='delete'&&action==='on'){ s.mode='delete'; return sock.sendMessage(jid,{text:'📢 *ANTITAG ENABLED*\n🗑️ Tag messages will be deleted.'},{quoted:msg}); }
      if(type==='warn'&&action==='on'){ s.mode='warn'; return sock.sendMessage(jid,{text:'⚠️ *ANTITAG WARN ENABLED*\n⚠️ Will delete + warn, no kick.'},{quoted:msg}); }
      if(type==='off'||type==='delete'&&action==='off'||type==='warn'&&action==='off'){ s.mode='off'; return sock.sendMessage(jid,{text:'✅ *ANTITAG DISABLED*'},{quoted:msg}); }
      if(type==='on'){ s.mode='delete'; return sock.sendMessage(jid,{text:'📢 *ANTITAG ENABLED*\n🗑️ Tag messages will be deleted.'},{quoted:msg}); }

      return sock.sendMessage(jid,{text:'📢 *ANTITAG*\n\n`.antitag delete on` → just delete\n`.antitag warn on` → delete + warn (no kick)\n`.antitag off` → disable'},{quoted:msg});
    }catch(e){ return sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:msg}); }
  }
};