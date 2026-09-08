// ============================================================
// MUFASER-X — LIB — ANTISPAM / ANTIFLOOD
// ============================================================

const spamMap = new Map(); // jid -> { userId: [timestamps] }

function getSpamSettings(account, jid) {
  if (!account.antispam) account.antispam = {};
  if (!account.antispam[jid]) account.antispam[jid] = { mode: 'off', limit: 5, time: 10000 };
  return account.antispam[jid];
}

async function handleAntiSpam(sock, msg, account) {
  try {
    const jid = msg?.key?.remoteJid;
    if (!jid?.endsWith('@g.us')) return false;

    const s = getSpamSettings(account, jid);
    if (s.mode === 'off') return false;
    if (msg.key.fromMe) return false;

    const sender = msg.key.participant;
    if (!sender) return false;

    const now = Date.now();
    const key = `${jid}_${sender}`;

    if (!spamMap.has(key)) spamMap.set(key, []);
    const times = spamMap.get(key);

    // keep only last 10 sec
    const recent = times.filter(t => now - t < s.time);
    recent.push(now);
    spamMap.set(key, recent);

    if (recent.length >= s.limit) {
      // spam detected
      await sock.sendMessage(jid, { delete: msg.key });

      if (s.mode === 'warn') {
        await sock.sendMessage(jid, {
          text: `⚠️ *ANTISPAM*\n\n@${sender.split('@')[0]} Stop spamming! ${recent.length} msgs in ${s.time/1000}s`,
          mentions: [sender]
        });
      }

      // reset to avoid loop
      spamMap.set(key, []);
      return true;
    }

    return false;
  } catch (e) {
    console.log('[AntiSpam]', e.message);
    return false;
  }
}

module.exports = { handleAntiSpam, getSpamSettings };