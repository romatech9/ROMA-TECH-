// ============================================================
// MUFASER-X — LIB — ANTIVIEWONCE — FIXED AUTO
// ============================================================
const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');

function getSettings(account,jid){
  if(!account.antiviewonce) account.antiviewonce={};
  if(!account.antiviewonce[jid]) account.antiviewonce[jid]={mode:'off'};
  return account.antiviewonce[jid];
}

function unwrap(quoted){
  let q = quoted;
  let unwrapped = true;
  while(unwrapped && q){
    unwrapped = false;
    if(q.ephemeralMessage?.message){ q = q.ephemeralMessage.message; unwrapped=true; continue; }
    if(q.viewOnceMessageV2?.message){ q = q.viewOnceMessageV2.message; unwrapped=true; continue; }
    if(q.viewOnceMessageV2Extension?.message){ q = q.viewOnceMessageV2Extension.message; unwrapped=true; continue; }
    if(q.viewOnceMessage?.message){ q = q.viewOnceMessage.message; unwrapped=true; continue; }
    if(q.documentWithCaptionMessage?.message){ q = q.documentWithCaptionMessage.message; unwrapped=true; continue; }
  }
  return q;
}

async function handleAntiViewOnce(sock, msg, account){
  try{
    const jid = msg?.key?.remoteJid;
    if(typeof jid!=='string'||!jid.endsWith('@g.us')) return false;
    if(msg?.message?.protocolMessage) return false;

    const settings = getSettings(account,jid);
    // DEBUG LOG — remove later
    // console.log('[VV Auto] group:', jid, 'mode:', settings.mode);

    if(settings.mode!=='on') return false;

    // THIS IS THE FIX — get original wrapper
    let original = msg?.message;
    if(!original) return false;

    // Check if it's viewonce wrapper directly
    const isWrapper = !!(
  original.viewOnceMessage ||
  original.viewOnceMessageV2 ||
  original.viewOnceMessageV2Extension
);

    let quoted = unwrap(original);
    if(!quoted) return false;

    const type = getContentType(quoted);
    // console.log('[VV Auto] type:', type, 'wrapper:', isWrapper);

    if(!['imageMessage','videoMessage','audioMessage'].includes(type)) return false;

    const media = quoted[type];
    if(!media) return false;

    // FINAL CHECK — WhatsApp sometimes sets viewOnce on the wrapper, not media
    const isViewOnce = media.viewOnce===true || quoted.viewOnce===true || isWrapper;
    if(!isViewOnce) return false;

    const senderJid = msg?.key?.participant;
    const number = (senderJid||'').split('@')[0];

    const downloadType = type==='imageMessage'?'image': type==='videoMessage'?'video':'audio';
    const stream = await downloadContentFromMessage(media, downloadType);
    const chunks=[]; for await(const chunk of stream){ chunks.push(chunk); }
    const buffer = Buffer.concat(chunks);
    if(!buffer?.length) return false;

    console.log('[VV Auto] Revealing:', type, buffer.length);

    if(type==='imageMessage'){
      await sock.sendMessage(jid,{ image:buffer, caption:`👁️ *ViewOnce Auto-Revealed*\n👤 From: @${number}\n${media.caption||''}`, mentions:[senderJid] });
    } else if(type==='videoMessage'){
      await sock.sendMessage(jid,{ video:buffer, caption:`👁️ *ViewOnce Auto-Revealed*\n👤 From: @${number}\n${media.caption||''}`, mentions:[senderJid], mimetype:media.mimetype||'video/mp4' });
    } else if(type==='audioMessage'){
      await sock.sendMessage(jid,{ audio:buffer, mimetype:media.mimetype||'audio/ogg; codecs=opus', ptt:media.ptt===true });
      await sock.sendMessage(jid,{ text:`👁️ *Voice ViewOnce* from @${number}`, mentions:[senderJid] });
    }
    return false;
  }catch(e){
    console.log('[AntiViewOnce Error]', e.message, e.stack);
    return false;
  }
}

module.exports={ handleAntiViewOnce, getSettings, unwrap };