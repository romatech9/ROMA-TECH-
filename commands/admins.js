// ============================================================
// MUFASER-X — GROUP ADMINS — TAG ONLY
// ============================================================

module.exports = {
  name: 'admins',
  aliases: ['listadmin','gadmins','adminlist'],
  desc: 'Tag all group admins',
  category: 'Group',
  usage: '.admins',
  async execute(sock, msg, jid, args, sender, account) {
    if(!jid.endsWith('@g.us')){
      return await sock.sendMessage(jid,{text:'❌ *This command only works in groups.*'},{quoted:msg});
    }
    try{
      const metadata = await sock.groupMetadata(jid);
      const admins = (metadata.participants||[]).filter(p=>p.admin==='admin'||p.admin==='superadmin');
      
      if(admins.length===0){
        return await sock.sendMessage(jid,{text:'❌ No admins found.'},{quoted:msg});
      }

      let text = `👑 *GROUP ADMINS* (${admins.length})\n\n`;
      const mentions = [];

      admins.forEach((p,i)=>{
        const adminJid = p.id;
        const number = String(adminJid).split('@')[0].split(':')[0];
        text += `*${i+1}.* @${number}\n`;
        mentions.push(adminJid);
      });

      return await sock.sendMessage(jid,{text, mentions},{quoted:msg});
    }catch(e){
      return await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:msg});
    }
  }
};