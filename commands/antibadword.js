module.exports={
  name:'antibadword',
  desc:'Block bad words',
  category:'Group',
  usage:'.antibadword delete on / warn on / off',

  async execute(sock,msg,jid,args,sender,account){
    try{
      if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:'❌ Group only.'},{quoted:msg});

      const metadata=await sock.groupMetadata(jid);
      const participants=metadata.participants||[];

      const getNumber=v=>String(v||'').split('@')[0].split(':')[0].replace(/\D/g,'');
      const botNumber=getNumber(sock?.user?.id);
      const bot=participants.find(p=>getNumber(p.id)===botNumber||getNumber(p.phoneNumber)===botNumber);
      const isBotAdmin=bot?.admin==='admin'||bot?.admin==='superadmin';

      const senderJid=msg?.key?.participant||sender?.jid||msg?.participant||(msg?.key?.fromMe?sock?.user?.id:'');
      const senderNumber=getNumber(sender?.number||senderJid);
      const senderParticipant=participants.find(p=>getNumber(p.id)===senderNumber||getNumber(p.phoneNumber)===senderNumber);
      const isSenderAdmin=msg?.key?.fromMe||senderParticipant?.admin==='admin'||senderParticipant?.admin==='superadmin';

      if(!isSenderAdmin) return sock.sendMessage(jid,{text:'❌ *Admin Only*'},{quoted:msg});
      if(!isBotAdmin) return sock.sendMessage(jid,{text:'❌ I need admin.'},{quoted:msg});

      if(!account.antibadword) account.antibadword={};
      if(!account.antibadword[jid]) account.antibadword[jid]={mode:'off'};
      const s=account.antibadword[jid];

      const type=String(args[0]||'').toLowerCase();
      const action=String(args[1]||'').toLowerCase();

      if(type==='delete'&&action==='on'){
        s.mode='delete';
        return sock.sendMessage(jid,{text:'🚫 *ANTIBADWORD ENABLED*\n🗑️ Bad-word messages will be deleted.'},{quoted:msg});
      }

      if(type==='warn'&&action==='on'){
        s.mode='warn';
        return sock.sendMessage(jid,{text:'⚠️ *ANTIBADWORD WARN ENABLED*\n🗑️ Delete + warn, no kick.'},{quoted:msg});
      }

      if(type==='off'||(type==='delete'&&action==='off')||(type==='warn'&&action==='off')){
        s.mode='off';
        return sock.sendMessage(jid,{text:'✅ *ANTIBADWORD DISABLED*'},{quoted:msg});
      }

      if(type==='on'){
        s.mode='delete';
        return sock.sendMessage(jid,{text:'🚫 *ANTIBADWORD ENABLED*\n🗑️ Bad-word messages will be deleted.'},{quoted:msg});
      }

      return sock.sendMessage(jid,{
        text:'🚫 *ANTIBADWORD*\n\n`.antibadword delete on` → just delete\n`.antibadword warn on` → delete + warn (no kick)\n`.antibadword off` → disable'
      },{quoted:msg});

    }catch(e){
      return sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:msg});
    }
  }
};