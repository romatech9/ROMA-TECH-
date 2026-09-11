// ============================================================
// MUFASER-X — LIB — ANTITEXT
// Members only — Admin Protection
// ============================================================

function getTextSettings(account, jid) {
  if (!account.antitext) account.antitext = {};
  if (!account.antitext[jid]) {
    account.antitext[jid] = { mode: 'off' };
  }
  return account.antitext[jid];
}


// ============================================================
// CHECK IF USER IS ADMIN
// ============================================================

async function isGroupAdmin(sock, jid, userJid) {
  try {
    if (!userJid) return false;

    const metadata = await sock.groupMetadata(jid);
    const participants = metadata?.participants || [];

    const clean = (v) =>
      String(v || '')
        .toLowerCase()
        .trim()
        .split(':')[0];

    const number = (v) =>
      clean(v)
        .split('@')[0]
        .replace(/\D/g, '');

    const userClean = clean(userJid);
    const userNumber = number(userJid);

    const participant = participants.find(p => {

      if (clean(p.id) === userClean) {
        return true;
      }

      if (number(p.id) === userNumber) {
        return true;
      }

      if (number(p.phoneNumber) === userNumber) {
        return true;
      }

      return false;
    });

    return (
      participant?.admin === 'admin' ||
      participant?.admin === 'superadmin'
    );

  } catch (e) {
    console.log('[AntiText Admin Check]', e.message);
    return false;
  }
}


// ============================================================
// ANTITEXT
// ============================================================

async function handleAntiText(sock, msg, account) {
  try {

    const jid = msg?.key?.remoteJid;

    if (!jid?.endsWith('@g.us')) {
      return false;
    }

    const s = getTextSettings(account, jid);

    if (s.mode === 'off') {
      return false;
    }


    // ========================================================
    // GET MESSAGE
    // ========================================================

    const m =
      msg.message?.ephemeralMessage?.message ||
      msg.message;

    if (!m) {
      return false;
    }


    // ========================================================
    // ONLY PLAIN TEXT
    // ========================================================

    const isText = !!(
      m.conversation ||
      m.extendedTextMessage?.text
    );

    if (!isText) {
      return false;
    }


    const text =
      m.conversation ||
      m.extendedTextMessage?.text ||
      '';

    if (!text.trim()) {
      return false;
    }


    // ========================================================
    // IGNORE COMMANDS
    // ========================================================

    if (text.trim().startsWith('.')) {
      return false;
    }


    // ========================================================
    // IGNORE BOT'S OWN MESSAGE
    // ========================================================

    if (msg.key?.fromMe) {
      return false;
    }


    // ========================================================
    // GET SENDER
    // ========================================================

    const sender =
      msg.key?.participant ||
      msg.key?.remoteJid;

    if (!sender) {
      return false;
    }


    // ========================================================
    // ADMIN PROTECTION
    // ========================================================

    const admin = await isGroupAdmin(
      sock,
      jid,
      sender
    );

    if (admin) {
      console.log(
        '[AntiText] Admin ignored:',
        sender
      );

      return false;
    }


    // ========================================================
    // DELETE MEMBER MESSAGE
    // ========================================================

    console.log(
      '[AntiText] Deleting member text:',
      sender
    );

    await sock.sendMessage(jid, {
      delete: msg.key
    });


    // ========================================================
    // WARNING
    // ========================================================

    if (s.mode === 'warn') {

      await sock.sendMessage(jid, {
        text:
`⚠️ *ANTITEXT*

@${sender.split('@')[0]}

Text messages are not allowed.
👑 *Admins are protected.*`,
        mentions: [sender]
      });

    }


    return true;

  } catch (e) {

    console.log(
      '[AntiText ERROR]',
      e.message
    );

    return false;
  }
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  handleAntiText,
  getTextSettings
};