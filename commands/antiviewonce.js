// ============================================================
// MUFASER-X — COMMAND — ANTIVIEWONCE — ALL MEMBERS — GROUP ONLY
// ============================================================
const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const { getSettings, unwrap } = require('../lib/antiviewonce');

module.exports={
  name:'antiviewonce',
  aliases:['vv','viewonce','retrieve','antivv'],
  desc:'Auto reveal viewonce + manual vv',
  category:'Group',
  usage:'.antiviewonce on/off or.vv reply',

  async execute(sock,msg,jid,args,sender,account){
    try{
      // GROUP ONLY — but ALL MEMBERS allowed (no admin check)
      if(!jid.endsWith('@g.us')){
        return sock.sendMessage(jid,{text:'❌ *Group only command* — Use it in a group.'},{quoted:msg});
      }

      const settings = getSettings(account,jid);
      const action = String(args[0]||'').toLowerCase();

      // ON / OFF
      if(action==='on'){
        settings.mode='on';
        return sock.sendMessage(jid,{text:'✅ *ANTIVIEWONCE ENABLED*\n\n👁️ If anyone sends ViewOnce, I will automatically open it for everyone.\n\nTo disable: `.antiviewonce off`'},{quoted:msg});
      }
      if(action==='off'){
        settings.mode='off';
        return sock.sendMessage(jid,{text:'✅ *ANTIVIEWONCE DISABLED*\n\nNothing will happen when ViewOnce is sent.\n\nTo enable: `.antiviewonce on`'},{quoted:msg});
      }

      // MANUAL —.vv reply to viewonce
      const contextInfo = msg?.message?.extendedTextMessage?.contextInfo;
      if(contextInfo?.quotedMessage){
        let quoted = unwrap(contextInfo.quotedMessage);
        const type = getContentType(quoted);
        const media = quoted[type];
        if(!media || (media.viewOnce!==true && quoted.viewOnce!==true)){
          return sock.sendMessage(jid,{text:'❌ That is not a ViewOnce message.'},{quoted:msg});
        }
        const downloadType = type==='imageMessage'?'image': type==='videoMessage'?'video':'audio';
        const stream = await downloadContentFromMessage(media, downloadType);
        const chunks=[]; for await(const chunk of stream){ chunks.push(chunk); }
        const buffer = Buffer.concat(chunks);
        if(!buffer?.length) return sock.sendMessage(jid,{text:'❌ Failed to download.'},{quoted:msg});

        if(type==='imageMessage') return sock.sendMessage(jid,{ image:buffer, caption:media.caption||'👁️ *ViewOnce Opened*' },{quoted:msg});
        if(type==='videoMessage') return sock.sendMessage(jid,{ video:buffer, caption:media.caption||'👁️ *ViewOnce Opened*', mimetype:media.mimetype||'video/mp4' },{quoted:msg});
        if(type==='audioMessage') return sock.sendMessage(jid,{ audio:buffer, mimetype:media.mimetype||'audio/ogg; codecs=opus', ptt:media.ptt===true },{quoted:msg});
      }

      // HELP
      return sock.sendMessage(jid,{text:`👁️ *ANTIVIEWONCE*\n\nCurrent: *${settings.mode.toUpperCase()}*\n\n*Commands:*\n.antiviewonce on — Auto open ON\n.antiviewonce off — Auto open OFF\n.vv (reply to ViewOnce) — Manual open\n\n_All members can use it, group only._`},{quoted:msg});

    }catch(e){
      return sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:msg});
    }
  }
};