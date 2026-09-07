// ============================================================
// MUFASER-X — LIB — ANTIVIEWONCE — AUTO REVEAL
// ============================================================
const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');

function getSettings(account,jid){
  if(!account.antiviewonce) account.antiviewonce={};
  if(!account.antiviewonce[jid]) account.antiviewonce[jid]={mode:'off'};
  return account.antiviewonce[jid];
}

function unwrap(quoted){
  let unwrapped = true;
  while(unwrapped && quoted){
    unwrapped = false;
    if(quoted.ephemeralMessage?.message){ quoted = quoted.ephemeralMessage.message; unwrapped=true; continue; }
    if(quoted.viewOnceMessageV2?.message){ quoted = quoted.viewOnceMessageV2.message; unwrapped=true; continue; }
    if(quoted.viewOnceMessageV2Extension?.message){ quoted = quoted.viewOnceMessageV2Extension.message; unwrapped=true; continue; }
    if(quoted.viewOnceMessage?.message){ quoted = quoted.viewOnceMessage.message; unwrapped=true; continue; }
    if(quoted.documentWithCaptionMessage?.message){ quoted = quoted.documentWithCaptionMessage.message; unwrapped=true; continue; }
  }
  return quoted;
}

async function handleAntiViewOnce(sock, msg, account){
  try{
    const jid = msg?.key?.remoteJid;
    if(typeof jid!=='string'||!jid.endsWith('@g.us')) return false;
    if(msg?.message?.protocolMessage||msg?.message?.reactionMessage) return false;

    const settings = getSettings(account,jid);
    if(settings.mode!=='on') return false;

    let quoted = unwrap(msg?.message);
    if(!quoted) return false;
    const type = getContentType(quoted);
    if(!['imageMessage','videoMessage','audioMessage'].includes(type)) return false;
    const media = quoted[type];
    if(!media) return false;
    if(media.viewOnce!==true && quoted.viewOnce!==true) return false;

    const senderJid = msg?.key?.participant;
    const number = (senderJid||'').split('@')[0];

    const downloadType = type==='imageMessage'?'image': type==='videoMessage'?'video':'audio';
    const stream = await downloadContentFromMessage(media, downloadType);
    const chunks=[]; for await(const chunk of stream){ chunks.push(chunk); }
    const buffer = Buffer.concat(chunks);
    if(!buffer?.length) return false;

    if(type==='imageMessage'){
      await sock.sendMessage(jid,{ image:buffer, caption:`👁️ *ViewOnce Auto-Revealed*\n👤 From: @${number}\n\n${media.caption||''}`, mentions:[senderJid] });
    } else if(type==='videoMessage'){
      await sock.sendMessage(jid,{ video:buffer, caption:`👁️ *ViewOnce Auto-Revealed*\n👤 From: @${number}\n\n${media.caption||''}`, mentions:[senderJid], mimetype:media.mimetype||'video/mp4' });
    } else if(type==='audioMessage'){
      await sock.sendMessage(jid,{ audio:buffer, mimetype:media.mimetype||'audio/ogg; codecs=opus', ptt:media.ptt===true });
      await sock.sendMessage(jid,{ text:`👁️ *Voice ViewOnce Revealed* from @${number}`, mentions:[senderJid] });
    }
    return false; // don't delete, just reveal
  }catch(e){
    console.log('[AntiViewOnce]', e.message);
    return false;
  }
}

module.exports={ handleAntiViewOnce, getSettings, unwrap };