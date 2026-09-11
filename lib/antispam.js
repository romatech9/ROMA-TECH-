// ============================================================
// MUFASER-X — LIB — ANTISPAM / ANTIFLOOD — ADMIN SAFE
// ============================================================

const spamMap = new Map();

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
    if (!['warn','delete','on'].includes(s.mode)) return false;
    if (msg.key.fromMe) return false;

    const senderJid = msg.key.participant;
    if (!senderJid) return false;

    // ===== ADMIN CHECK =====
    const metadata = await sock.groupMetadata(jid);
    const participants = metadata.participants||[];
    const cleanJid=v=>{if(!v)return'';return String(v).trim().toLowerCase();};
    const getNumber=v=>{if(!v)return'';return String(v).split('@')[0].split(':')[0].replace(/\D/g,'');};
    const participantMatches=(p,tj,tn)=>{if(!p)return false; if(cleanJid(p.id)===cleanJid(tj))return true; if(getNumber(p.id)===tn)return true; if(getNumber(p.phoneNumber)===tn)return true; return false;};

    const botJid=sock?.user?.id||''; const botNumber=getNumber(botJid);
    const botParticipant=participants.find(p=>participantMatches(p,botJid,botNumber));
    if(!(botParticipant?.admin==='admin'||botParticipant?.admin==='superadmin')) return false;

    const senderObj=account?.sender||msg?.sender||{};
    const actualSenderJid=msg?.key?.participant||senderObj?.jid||msg?.participant||'';
    const senderNumber=getNumber(senderObj?.number||actualSenderJid);
    let senderParticipant=participants.find(p=>participantMatches(p,actualSenderJid,senderNumber));
    const isAdmin=senderParticipant?.admin==='admin'||senderParticipant?.admin==='superadmin';
    if(isAdmin) return false;

    const now = Date.now();
    const key = `${jid}_${actualSenderJid}`;

    if (!spamMap.has(key)) spamMap.set(key, []);
    const times = spamMap.get(key);

    // keep only last 10 sec
    const recent = times.filter(t => now - t < s.time);
    recent.push(now);
    spamMap.set(key, recent);

    if (recent.length >= s.limit) {
      try{ await sock.sendMessage(jid, { delete: msg.key }); }catch{}

      if (s.mode === 'warn') {
        await sock.sendMessage(jid, {
          text: `⚠️ *ANTISPAM*\n\n@${senderNumber} Stop spamming! ${recent.length} msgs in ${s.time/1000}s`,
          mentions: [actualSenderJid]
        });
      }

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