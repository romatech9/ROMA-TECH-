const {
  downloadContentFromMessage,
  getContentType
} = require('@whiskeysockets/baileys');

function getSettings(account,jid){
  if(!account.antiviewonce) account.antiviewonce={};
  if(!account.antiviewonce[jid]) account.antiviewonce[jid]={mode:'off'};
  return account.antiviewonce[jid];
}

async function handleAntiViewOnce(sock,msg,account){
  try{
    const jid=msg?.key?.remoteJid;
    if(typeof jid!=='string'||!jid.endsWith('@g.us')) return false;

    const settings=getSettings(account,jid);
    if(settings.mode!=='on') return false;

    let quoted=msg?.message;
    if(!quoted) return false;

    let unwrapped=true;
    while(unwrapped&&quoted){
      unwrapped=false;

      if(quoted.ephemeralMessage?.message){
        quoted=quoted.ephemeralMessage.message;
        unwrapped=true;
        continue;
      }

      if(quoted.viewOnceMessageV2?.message){
        quoted=quoted.viewOnceMessageV2.message;
        unwrapped=true;
        continue;
      }

      if(quoted.viewOnceMessageV2Extension?.message){
        quoted=quoted.viewOnceMessageV2Extension.message;
        unwrapped=true;
        continue;
      }

      if(quoted.viewOnceMessage?.message){
        quoted=quoted.viewOnceMessage.message;
        unwrapped=true;
      }
    }

    const type=getContentType(quoted);
    if(!['imageMessage','videoMessage','audioMessage'].includes(type)) return false;

    const media=quoted[type];
    if(!media) return false;

    const isViewOnce=media.viewOnce===true||quoted.viewOnce===true;
    if(!isViewOnce) return false;

    const downloadType=type==='imageMessage'?'image':type==='videoMessage'?'video':'audio';
    const stream=await downloadContentFromMessage(media,downloadType);
    const chunks=[];

    for await(const chunk of stream) chunks.push(chunk);

    const buffer=Buffer.concat(chunks);
    if(!buffer.length) return false;

    if(type==='imageMessage'){
      await sock.sendMessage(jid,{image:buffer,caption:'> 👁️ *VIEW ONCE OPENED BY MUFASER-X*'});
    }

    if(type==='videoMessage'){
      await sock.sendMessage(jid,{
        video:buffer,
        caption:'> 👁️ *VIEW ONCE OPENED BY MUFASER-X*',
        mimetype:media.mimetype||'video/mp4'
      });
    }

    if(type==='audioMessage'){
      await sock.sendMessage(jid,{
        audio:buffer,
        mimetype:media.mimetype||'audio/ogg; codecs=opus',
        ptt:media.ptt===true
      });
    }

    return true;
  }catch(e){
    console.error('[AntiViewOnce Error]',e.message);
    return false;
  }
}

module.exports={handleAntiViewOnce};
