// ============================================================
// MUFASER-X — LIB — ANTIPROMOTE + ANTIDEMOTE
// ============================================================

function getPromoteSettings(account, jid) {
  if (!account.antipromote) account.antipromote = {};
  if (!account.antipromote[jid]) {
    account.antipromote[jid] = { mode: 'off' };
  }
  return account.antipromote[jid];
}

function getDemoteSettings(account, jid) {
  if (!account.antidemote) account.antidemote = {};
  if (!account.antidemote[jid]) {
    account.antidemote[jid] = { mode: 'off' };
  }
  return account.antidemote[jid];
}


// ============================================================
// NORMALIZE JID
// ============================================================

function normalizeJid(jid) {
  if (!jid) return '';

  return String(jid)
    .trim()
    .toLowerCase()
    .split(':')[0];
}


// ============================================================
// GET NUMBER
// ============================================================

function getNumber(jid) {
  return normalizeJid(jid)
    .split('@')[0]
    .replace(/\D/g, '');
}


// ============================================================
// CHECK SAME USER
// ============================================================

function sameUser(a, b) {
  if (!a || !b) return false;

  const aa = normalizeJid(a);
  const bb = normalizeJid(b);

  if (aa === bb) return true;

  const na = getNumber(a);
  const nb = getNumber(b);

  return na && nb && na === nb;
}


// ============================================================
// CHECK BOT ADMIN
// ============================================================

async function isBotAdmin(sock, jid) {
  try {
    const botJid = sock?.user?.id;

    if (!botJid) return false;

    const metadata = await sock.groupMetadata(jid);

    const participants = metadata?.participants || [];

    const bot = participants.find(p =>
      sameUser(p.id, botJid) ||
      sameUser(p.phoneNumber, botJid)
    );

    return (
      bot?.admin === 'admin' ||
      bot?.admin === 'superadmin'
    );

  } catch (e) {
    console.log('[AntiPromote] Bot admin check error:', e.message);
    return false;
  }
}


// ============================================================
// ANTIPROMOTE
// ============================================================

async function handleAntiPromote(sock, update, account) {
  try {

    const jid = update?.id;

    if (!jid || !jid.endsWith('@g.us')) {
      return false;
    }

    if (update?.action !== 'promote') {
      return false;
    }

    const settings = getPromoteSettings(account, jid);

    if (settings.mode !== 'on') {
      return false;
    }

    console.log(
      '[AntiPromote] Promote detected:',
      jid,
      update?.participants,
      'by',
      update?.author
    );

    const botAdmin = await isBotAdmin(sock, jid);

    if (!botAdmin) {
      console.log('[AntiPromote] Bot is not admin.');
      return false;
    }

    const botJid = sock?.user?.id;

    // Don't reverse an action made by the bot itself
    if (sameUser(update?.author, botJid)) {
      return false;
    }

    const participants = update?.participants || [];

    for (const promoted of participants) {

      // Don't touch the bot
      if (sameUser(promoted, botJid)) {
        continue;
      }

      try {

        await sock.groupParticipantsUpdate(
          jid,
          [promoted],
          'demote'
        );

        console.log(
          '[AntiPromote] Reversed promote:',
          promoted
        );

        const authorNumber =
          getNumber(update?.author) || 'unknown';

        const promotedNumber =
          getNumber(promoted) || 'unknown';

        await sock.sendMessage(jid, {
          text:
`🚫 *ANTIPROMOTE*

@${authorNumber} tried to promote @${promotedNumber}.

🛡️ *Action reversed.*
👤 User was demoted back.`,
          mentions: [
            update?.author,
            promoted
          ].filter(Boolean)
        });

      } catch (e) {

        console.log(
          '[AntiPromote] Failed to reverse:',
          e.message
        );

      }
    }

    return true;

  } catch (e) {

    console.log(
      '[AntiPromote ERROR]',
      e.message
    );

    return false;
  }
}


// ============================================================
// ANTIDEMOTE
// ============================================================

async function handleAntiDemote(sock, update, account) {
  try {

    const jid = update?.id;

    if (!jid || !jid.endsWith('@g.us')) {
      return false;
    }

    if (update?.action !== 'demote') {
      return false;
    }

    const settings = getDemoteSettings(account, jid);

    if (settings.mode !== 'on') {
      return false;
    }

    console.log(
      '[AntiDemote] Demote detected:',
      jid,
      update?.participants,
      'by',
      update?.author
    );

    const botAdmin = await isBotAdmin(sock, jid);

    if (!botAdmin) {
      console.log('[AntiDemote] Bot is not admin.');
      return false;
    }

    const botJid = sock?.user?.id;

    // Don't reverse the bot's own action
    if (sameUser(update?.author, botJid)) {
      return false;
    }

    const participants = update?.participants || [];

    for (const demoted of participants) {

      // If the bot itself was demoted,
      // it may no longer have permission to promote itself.
      if (sameUser(demoted, botJid)) {
        console.log(
          '[AntiDemote] Bot itself was demoted.'
        );
        continue;
      }

      try {

        await sock.groupParticipantsUpdate(
          jid,
          [demoted],
          'promote'
        );

        console.log(
          '[AntiDemote] Reversed demote:',
          demoted
        );

        const authorNumber =
          getNumber(update?.author) || 'unknown';

        const demotedNumber =
          getNumber(demoted) || 'unknown';

        await sock.sendMessage(jid, {
          text:
`🚫 *ANTIDEMOTE*

@${authorNumber} tried to demote @${demotedNumber}.

🛡️ *Action reversed.*
👑 User was promoted back.`,
          mentions: [
            update?.author,
            demoted
          ].filter(Boolean)
        });

      } catch (e) {

        console.log(
          '[AntiDemote] Failed to reverse:',
          e.message
        );

      }
    }

    return true;

  } catch (e) {

    console.log(
      '[AntiDemote ERROR]',
      e.message
    );

    return false;
  }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  handleAntiPromote,
  handleAntiDemote,
  getPromoteSettings,
  getDemoteSettings
};