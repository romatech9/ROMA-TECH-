// ============================================================
// MUFASER-X — TOGSTATUS
// ============================================================

const {
  downloadMediaMessage,
  generateWAMessageContent,
  generateWAMessageFromContent
} = require('@whiskeysockets/baileys');

const crypto = require('crypto');

const sessions = new Map();
const senders = new Map();

global.togStatusSessionCache = sessions;
global.togStatusSenderCache = senders;

async function getBuffer(message) {
  return downloadMediaMessage(
    { message },
    'buffer',
    {},
    {}
  );
}

function unwrap(message) {
  let m = message;
  while (m) {
    if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
    else if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
    else if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
    else if (m.viewOnceMessageV2Extension?.message) m = m.viewOnceMessageV2Extension.message;
    else if (m.documentWithCaptionMessage?.message) m = m.documentWithCaptionMessage.message;
    else break;
  }
  return m;
}

function quoted(msg) {
  const m = unwrap(msg.message);
  return m?.extendedTextMessage?.contextInfo?.quotedMessage ||
    m?.imageMessage?.contextInfo?.quotedMessage ||
    m?.videoMessage?.contextInfo?.quotedMessage ||
    m?.audioMessage?.contextInfo?.quotedMessage ||
    m?.stickerMessage?.contextInfo?.quotedMessage ||
    m?.documentMessage?.contextInfo?.quotedMessage ||
    null;
}

async function payload(m) {
  m = unwrap(m);
  if (!m) return null;

  if (m.imageMessage)
    return { image: await getBuffer({ imageMessage: m.imageMessage }), caption: m.imageMessage.caption || '' };

  if (m.videoMessage)
    return { video: await getBuffer({ videoMessage: m.videoMessage }), caption: m.videoMessage.caption || '', mimetype: m.videoMessage.mimetype || 'video/mp4' };

  if (m.audioMessage)
    return { audio: await getBuffer({ audioMessage: m.audioMessage }), mimetype: m.audioMessage.mimetype || 'audio/ogg; codecs=opus', ptt: !!m.audioMessage.ptt };

  if (m.stickerMessage)
    return { sticker: await getBuffer({ stickerMessage: m.stickerMessage }) };

  if (m.documentMessage)
    return {
      document: await getBuffer({ documentMessage: m.documentMessage }),
      mimetype: m.documentMessage.mimetype || 'application/octet-stream',
      fileName: m.documentMessage.fileName || 'file'
    };

  if (m.conversation)
    return { text: m.conversation };

  if (m.extendedTextMessage?.text)
    return { text: m.extendedTextMessage.text };

  return null;
}

async function sendStatus(sock, jid, content) {
  const message = await generateWAMessageContent(content, {
    upload: sock.waUploadToServer
  });

  const secret = crypto.randomBytes(32);

  const waMsg = generateWAMessageFromContent(jid, {
    messageContextInfo: { messageSecret: secret },
    groupStatusMessageV2: {
      message: {
        ...message,
        messageContextInfo: { messageSecret: secret }
      }
    }
  }, {});

  await sock.relayMessage(
    jid,
    waMsg.message,
    { messageId: waMsg.key.id }
  );
}

function mediaType(m) {
  m = unwrap(m);
  if (m?.imageMessage) return 'Image';
  if (m?.videoMessage) return 'Video';
  if (m?.audioMessage) return m.audioMessage.ptt ? 'Voice Note' : 'Audio';
  if (m?.stickerMessage) return 'Sticker';
  if (m?.documentMessage) return 'Document';
  return 'Text';
}

async function groupList(sock, jid, msg, data, type) {
  const groups = await sock.groupFetchAllParticipating();

  const list = Object.values(groups || {})
    .map(g => ({ id: g.id, name: g.subject || 'Unnamed Group' }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let text = `*SELECT A GROUP*\n\n${list.length} groups - posting ${type}\n\n`;

  list.slice(0, 20).forEach((g, i) => {
    text += `${i + 1}. ${g.name}\n`;
  });

  text += `\nReply with .togstatus <number> or .togstatus all`;

  const sent = await sock.sendMessage(
    jid,
    { text },
    { quoted: msg }
  );

  const session = {
    payload: data,
    groups: list,
    sender: (msg.key.participant || jid).split('@')[0]
  };

  if (sent?.key?.id) sessions.set(sent.key.id, session);

  senders.set(session.sender, session);

  while (sessions.size > 30)
    sessions.delete(sessions.keys().next().value);

  while (senders.size > 30)
    senders.delete(senders.keys().next().value);
}

module.exports = {
  name: 'togstatus',
  aliases: ['swgc', 'groupstatus', 'gs', 'gstatus'],

  desc: 'Post media to WhatsApp group status',

  category: 'Group',

  usage: '.togstatus',

  async execute(sock, msg, jid, args) {
    try {
      const isGroup = jid.endsWith('@g.us');
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      const commandText = text
        .replace(/^\s*\.?\s*(togstatus|swgc|groupstatus|tosgroup|gs|gstatus)\s*/i, '')
        .trim();

      const q = quoted(msg);

      // GROUP
      if (isGroup) {
        let data = q ? await payload(q) : null;

        if (!data && commandText)
          data = { text: commandText };

        if (!data)
          data = await payload(msg.message);

        if (!data)
          return sock.sendMessage(
            jid,
            { text: '❌ Reply to an image, video, audio, voice note, sticker, document or text.' },
            { quoted: msg }
          );

        if ((data.image || data.video) && commandText)
          data.caption = commandText;

        await sendStatus(sock, jid, data);

        return sock.sendMessage(
          jid,
          { text: '✅ *STATUS POSTED SUCCESSFULLY!*' },
          { quoted: msg }
        );
      }

      // DM SELECTION
      const number = commandText.match(/^\d+$/)?.[0];
      const selection = commandText.toLowerCase();

      if (number || selection === 'all') {
        const sender = (msg.key.participant || jid).split('@')[0];
        const session = senders.get(sender);

        if (!session)
          return sock.sendMessage(
            jid,
            { text: '❌ Status session expired. Send the media again.' },
            { quoted: msg }
          );

        const targets =
          selection === 'all'
            ? session.groups
            : [session.groups[Number(number) - 1]];

        if (!targets[0])
          return sock.sendMessage(
            jid,
            { text: '❌ Invalid group number.' },
            { quoted: msg }
          );

        for (const group of targets) {
          try {
            await sendStatus(sock, group.id, session.payload);
          } catch (e) {
            console.log(`[TogStatus] ${group.id}: ${e.message}`);
          }
        }

        senders.delete(sender);

        return sock.sendMessage(
          jid,
          { text: '✅ *STATUS POSTED SUCCESSFULLY!*' },
          { quoted: msg }
        );
      }

      // DM MEDIA / TEXT
      let data = q ? await payload(q) : await payload(msg.message);

      if (!data && commandText)
        data = { text: commandText };

      if (!data)
        return sock.sendMessage(
          jid,
          { text: '❌ Reply to media with .togstatus to choose a group.' },
          { quoted: msg }
        );

      await groupList(
        sock,
        jid,
        msg,
        data,
        mediaType(q || msg.message)
      );

    } catch (e) {
      console.error('[TogStatus]', e);
      await sock.sendMessage(
        jid,
        { text: `❌ Failed: ${e.message}` },
        { quoted: msg }
      );
    }
  }
};