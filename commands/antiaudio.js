module.exports={
  name:'antiaudio',
  desc:'Block voice notes in group',
  category:'Group',
  usage:'.antiaudio delete on / warn on / off',
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
      if(!isBotAdmin) return sock.sendMessage(jid,{text:'❌ *I need to be a group admin to use the antiaudio command.*'},{quoted:msg});
      if(!account.antiaudio) account.antiaudio={}; if(!account.antiaudio[jid]) account.antiaudio[jid]={mode:'off'};
      const s=account.antiaudio[jid]; const type=String(args[0]||'').toLowerCase(); const action=String(args[1]||'').toLowerCase();
      if(type==='delete'&&action==='on'){ s.mode='delete'; return sock.sendMessage(jid,{text:'🚫 *ANTIAUDIO ENABLED*\n🗑️ Voice notes will be deleted.'},{quoted:msg}); }
      if(type==='warn'&&action==='on'){ s.mode='warn'; return sock.sendMessage(jid,{text:'⚠️ *ANTIAUDIO WARN ENABLED*\n⚠️ Will delete + warn, no kick.'},{quoted:msg}); }
      if(type==='off'||action==='off'){ s.mode='off'; return sock.sendMessage(jid,{text:'✅ *ANTIAUDIO DISABLED*'},{quoted:msg}); }
      if(type==='on'){ s.mode='delete'; return sock.sendMessage(jid,{text:'🚫 *ANTIAUDIO ENABLED*\n🗑️ Voice notes will be deleted.'},{quoted:msg}); }
      return sock.sendMessage(jid,{text:'🎙️ *ANTIAUDIO*\n\n`.antiaudio delete on` → just delete\n`.antiaudio warn on` → delete + warn (no kick)\n`.antiaudio off` → disable'},{quoted:msg});
    }catch(e){ return sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:msg}); }
  }
};