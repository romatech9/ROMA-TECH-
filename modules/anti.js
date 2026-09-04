// modules/anti.js - MUFASER-X SPLIT SYSTEM - FIXED DEFAULTS
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const antiDeleteCache = new Map();
const READMORE = String.fromCharCode(8206).repeat(4000);

function saveAntiDeleteMessage(msg) {
  if (!msg.message || msg.key.fromMe) return;
  antiDeleteCache.set(msg.key.id, {...msg });
  if (antiDeleteCache.size > 300) {
    const firstKey = antiDeleteCache.keys().next().value;
    antiDeleteCache.delete(firstKey);
  }
}

async function handleAntiDelete(sock, msg, account) {
  const proto = msg.message?.protocolMessage;
  if (!proto || (proto.type!== 0 && proto.type!== 5)) return false;
  const delId = proto.key?.id;
  const original = antiDeleteCache.get(delId);
  if (!original) return true;

  const jid = original.key.remoteJid;
  const isStatus = jid === 'status@broadcast';
  const isGroup = jid.endsWith('@g.us');

  if (isStatus) {
    let statusSettings = account.antideletestatus || { all: true, private: false };
    if (typeof statusSettings === 'string') statusSettings = { all: statusSettings === 'on', private: false };
    if (!statusSettings.all &&!statusSettings.private) return true;
    let targetJid = sock.user.id.split(':')[0]+'@s.whatsapp.net';
    return await sendRecovered(sock, original, targetJid, 'STATUS DELETED');
  }

  // FIXED DEFAULTS HERE - Group OFF, DM ON, Private ON
  let settings = account.antidelete || { dm: true, group: false, private: true };
  if (typeof settings === 'string') {
     settings = { dm: settings === 'on', group: false, private: true };
  }
  // Ensure missing keys get correct defaults
  if (settings.dm == null) settings.dm = true;
  if (settings.private == null) settings.private = true;
  if (settings.group == null) settings.group = false;

  const isEnabled = isGroup? settings.group : settings.dm;
  const isPrivateMode = settings.private;
  if (!isEnabled &&!isPrivateMode) return true;

  let targetJid = isPrivateMode? sock.user.id.split(':')[0]+'@s.whatsapp.net' : jid;
  return await sendRecovered(sock, original, targetJid, 'DELETED MESSAGE');
}

async function sendRecovered(sock, original, targetJid, title) {
  try {
    const m = original.message;
    const jid = original.key.remoteJid;
    const sender = original.key.participant || original.key.remoteJid;
    const senderName = sender.split('@')[0];
    const type = m.imageMessage? 'Photo' : m.videoMessage? 'Video' : m.audioMessage? 'Voice Note' : m.stickerMessage? 'Sticker' : m.documentMessage? 'Document' : 'Text';
    const content = m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '';
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const chat = jid.endsWith('@g.us')? 'GROUP' : jid === 'status@broadcast'? 'STATUS' : 'DM';

    let text = `🗑️ *${title}* 🗑️${READMORE}\n\n`;
    text += `*CHAT:* ${chat}\n`;
    text += `*TYPE:* ${type}\n`;
    text += `*FROM:* @${senderName}\n`;
    text += `*TIME:* ${time}\n`;
    text += `*DATE:* ${date}\n`;
    if (content) text += `\n*Message:* ${content}\n`;
    text += `\n_Recovered ✅_`;

    await sock.sendMessage(targetJid, { text, mentions: [sender] });
    if (type!== 'Text') {
      try {
        const buf = await downloadMediaMessage(original, 'buffer', {});
        if (m.imageMessage) await sock.sendMessage(targetJid, { image: buf, caption: content || '' });
        if (m.videoMessage) await sock.sendMessage(targetJid, { video: buf, caption: content || '' });
        if (m.audioMessage) await sock.sendMessage(targetJid, { audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: true });
        if (m.stickerMessage) await sock.sendMessage(targetJid, { sticker: buf });
        if (m.documentMessage) await sock.sendMessage(targetJid, { document: buf, fileName: m.documentMessage.fileName || 'file' });
      } catch {}
    }
    return true;
  } catch (e) {
    console.log('[ANTIDELETE]', e.message);
    return true;
  }
}
// ANTI EDIT  FOR MORNING DM OR GROUP 
async function handleAntiEdit(sock, msg, account) {
  const proto = msg.message?.protocolMessage;
  if (!proto) return false;
  // maybe edit in some versions - we check both
  if (proto.type!== 14 && proto.type!== 21) return false;

  const editId = proto.key?.id;
  const original = antiDeleteCache.get(editId);
  if (!original) return true;

  let settings = account.antiedit || { dm: true, group: true, private: false };
  if (typeof settings === 'string') settings = { dm: settings === 'on', group: settings === 'on', private: false };

  const jid = original.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  if (isGroup &&!settings.group) return true;
  if (!isGroup &&!settings.dm) return true;

  const oldText = original.message?.conversation || original.message?.extendedTextMessage?.text || original.message?.imageMessage?.caption || original.message?.videoMessage?.caption || '';
  const newText = proto.editedMessage?.conversation || proto.editedMessage?.extendedTextMessage?.text || proto.editedMessage?.imageMessage?.caption || proto.editedMessage?.videoMessage?.caption || '';

  if (oldText === newText) return true;

  let targetJid = settings.private? sock.user.id.split(':')[0]+'@s.whatsapp.net' : jid;
  const sender = original.key.participant || original.key.remoteJid;

  let text = `✏️ *EDITED MESSAGE DETECTED*${READMORE}\n\n`;
  text += `*FROM:* @${sender.split('@')[0]}\n`;
  text += `*CHAT:* ${isGroup?'GROUP':'DM'}\n\n`;
  text += `*BEFORE:*\n${oldText}\n\n`;
  text += `*AFTER:*\n${newText}`;

  try {
    await sock.sendMessage(targetJid, { text, mentions:[sender] });
  } catch {}

  // update cache with new version
  antiDeleteCache.set(editId, {...original, message: {...original.message, conversation: newText } });
  return true;
}

// NOPE NO CALL ANY MORE 
async function handleAntiCall(sock, calls, account) {
  if (!account.anticall || account.anticall=== 'off') return;
  for (let call of calls) {
    if (call.status!== 'offer') continue;
    const callerJid = call.from;
    try {
      await sock.rejectCall(call.id, callerJid);
      await sock.sendMessage(callerJid, { text: `📵 *CALL REJECTED📵*\nthis call was rejected by 256791480644🛑 Please stop calling use text\nMy Owner does not accept calls right now🙅.` });
      if (account.anticall=== 'block') {
        await sock.updateBlockStatus(callerJid, 'block');
        await sock.sendMessage(sock.user.id, { text: `📵 BLOCKED ${callerJid}` });
      }
    } catch (e) { console.log('[ANTICALL]', e.message); }
  }
}

// ANTDM NO MORE DM MOTHER FUCK 
async function handleAntiDm(sock, msg, account) {
  if (!account.antidm) return false;
  const jid = msg.key.remoteJid;
  if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast' || msg.key.fromMe) return false;
  if (!account.antidmAllowed) account.antidmAllowed = [];
  if (account.antidmAllowed.includes(jid)) return false;
  
 // NEW STRANGER = SILENT BLOCK, NO MESSAGE
  try {
    await sock.updateBlockStatus(jid, 'block');
    console.log(`[ANTIDM] Silently blocked: ${jid}`);
  } catch(e) {}
  return true;
}

function addToAllowed(account, jid){
  if(!jid || jid.endsWith('@g.us') || jid==='status@broadcast') return;
  if(!account.antidmAllowed) account.antidmAllowed=[];
  if(!account.antidmAllowed.includes(jid)) account.antidmAllowed.push(jid);
}

module.exports = { saveAntiDeleteMessage, handleAntiDelete, handleAntiCall, handleAntiDm, addToAllowed, handleAntiEdit };