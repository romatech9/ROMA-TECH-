module.exports={
  name:'antiviewonce',
  desc:'Automatically open View Once media',
  category:'Group',
  usage:'.antiviewonce on / off',

  async execute(sock,msg,jid,args,sender,account){
    try{

      if(!jid.endsWith('@g.us'))
        return sock.sendMessage(jid,{text:'❌ *This command only works in groups.*'},{quoted:msg});

      if(!account.antiviewonce) account.antiviewonce={};
      if(!account.antiviewonce[jid]) account.antiviewonce[jid]={mode:'off'};

      const s=account.antiviewonce[jid];
      const type=String(args[0]||'').toLowerCase();

      if(type==='on'){
        s.mode='on';
        return sock.sendMessage(jid,{
          text:'👁️ *ANTIVIEWONCE ENABLED*\n\nView Once media will be automatically opened.'
        },{quoted:msg});
      }

      if(type==='off'){
        s.mode='off';
        return sock.sendMessage(jid,{
          text:'✅ *ANTIVIEWONCE DISABLED*'
        },{quoted:msg});
      }

      return sock.sendMessage(jid,{
        text:'👁️ *ANTIVIEWONCE*\n\n`.antiviewonce on` → automatically open\n`.antiviewonce off` → disable'
      },{quoted:msg});

    }catch(e){
      return sock.sendMessage(jid,{
        text:`❌ ${e.message}`
      },{quoted:msg});
    }
  }
};