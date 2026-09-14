// ============================================================
// Command:.setprefix
// Change MUFASER-X command prefix
// ============================================================

const fs = require('fs');
const path = require('path');
const config = require('../config.js');

// ── Normalize WhatsApp number ───────────────────────────────
function normalizeNumber(value) {
  if (!value) return '';

  let number = String(value);

  // Remove WhatsApp JID part
  number = number.split('@')[0];

  // Remove device suffix such as :0, :1, :2
  number = number.split(':')[0];

  // Keep digits only
  return number.replace(/\D/g, '');
}

module.exports = {
  name: 'setprefix',
  description: 'Change the bot prefix',

  async execute(sock, msg, jid, args, sender) {

    // ── OWNER CHECK ─────────────────────────────────────────
    const senderNumber = normalizeNumber(
      sender?.number ||
      msg.key?.participant ||
      msg.key?.remoteJid
    );

    const ownerNumber = normalizeNumber(
      config.ownerNumber
    );

    // WhatsApp marks messages sent by the connected account as fromMe.
    const isOwner = msg.key?.fromMe === true;

    console.log(
      `[SetPrefix] Sender: ${senderNumber || 'UNKNOWN'} | ` +
      `Configured Owner: ${ownerNumber || 'NOT SET'} | ` +
      `fromMe: ${isOwner}`
    );

    if (!isOwner && (!ownerNumber || senderNumber !== ownerNumber)) {
      return sock.sendMessage(
        jid,
        {
          text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌\n\n👤 Your number: ${senderNumber || 'Unknown'}`
        },
        { quoted: msg }
      );
    }

    // ── GET NEW PREFIX ──────────────────────────────────────
    let newPrefix = args[0];

    if (!newPrefix) {
      return sock.sendMessage(
        jid,
        {
          text:
`╭━━━〔 SET PREFIX 〕━━━╮

❌ Please provide a new prefix.
Examples:
${config.prefix}setprefix !

╰━━━━━━━━━━━━━━━━━━━━╯`
        },
        { quoted: msg }
      );
    }

    const noPrefix = newPrefix.toLowerCase() === 'non';

    if (noPrefix) {
      newPrefix = '';
    }

    if (newPrefix.length > 3) {
      return sock.sendMessage(
        jid,
        {
          text: '❌ Prefix must be 1–3 characters long.'
        },
        { quoted: msg }
      );
    }

    if (newPrefix && /\s/.test(newPrefix)) {
      return sock.sendMessage(
        jid,
        {
          text: '❌ Prefix cannot contain spaces.'
        },
        { quoted: msg }
      );
    }

    // ── CHANGE PREFIX ───────────────────────────────────────
    const oldPrefix = config.prefix;

    config.prefix = newPrefix;

    // ── SAVE TO config.js ───────────────────────────────────
    try {
      const configPath = path.join(
        __dirname,
        '..',
        'config.js'
      );

      let configFile = fs.readFileSync(
        configPath,
        'utf8'
      );

      configFile = configFile.replace(
        /prefix:\s*(['"`]).*?\1/,
        `prefix: '${newPrefix}'`
      );

      fs.writeFileSync(
        configPath,
        configFile,
        'utf8'
      );

    } catch (err) {
      console.error(
        '[SetPrefix] Failed to save prefix:',
        err.message
      );

      return sock.sendMessage(
        jid,
        {
          text:
`✅ Prefix changed temporarily.

Old Prefix: ${oldPrefix}
New Prefix: ${newPrefix}
╰━━━━━━━━━━━━╯`
        },
        { quoted: msg }
      );
    }

    // ── SUCCESS ──────────────────────────────────────────────
    await sock.sendMessage(
      jid,
      {
        text:
`╭━━━〔 MUFASER-X 〕━━━╮

✅ *PREFIX UPDATED*

Old Prefix: ${oldPrefix}
New Prefix: ${newPrefix}

╰━━━━━━━━━━━━━━━━━━━━╯`
      },
      { quoted: msg }
    );

    console.log(
      `[SetPrefix] Prefix changed: ${oldPrefix} → ${newPrefix}`
    );
  }
};