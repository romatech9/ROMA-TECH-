// ============================================================
// MUFASER-X — GETPP2 COMMAND
// Owner Only: Get Profile Picture and send to Owner DM
// Usage:.getpp2 @tag or reply to someone or.getpp2 2547xxxx
// ============================================================

module.exports = {
  name: 'getpp2',
  aliases: ['pp2', 'profilepic2'],
  desc: 'Owner only: Get pp and send to owner DM',
  category: 'Owner',

  async execute(sock, msg, jid, args, sender, account) {

    // ── OWNER ONLY CHECK ───────────────────────────────────
    if (!msg.key.fromMe) {
      return sock.sendMessage(jid, {
        text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
      }, { quoted: msg }); // <-- FIXED HERE
    }

    try {
      let targetJid;

      // 1. If replied to someone
      if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      }
      // 2. If mentioned someone
      else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // 3. If number was typed.getpp2 2547xxxx
      else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '');
        targetJid = num + '@s.whatsapp.net';
      }
      // 4. Else get your own
      else {
        targetJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      }

      // Owner DM JID
      const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      // Try to get HD profile pic
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, 'image');
      } catch (e) {
        return sock.sendMessage(jid, {
          text: '🥴 This user has no profile picture or it is private'
        }, { quoted: msg });
      }

      // Get name
      let name = targetJid.split('@')[0];

      // ── SEND EVERYTHING TO OWNER DM ────────────────────────
      await sock.sendMessage(ownerJid, {
        image: { url: ppUrl },
        caption: `> powered; by MUFASER-X`
      });

      // Confirm to you in current chat
      await sock.sendMessage(jid, {
        text: ``,
        mentions: [targetJid]
      }, { quoted: msg });

    } catch (error) {
      console.log(error);
      await sock.sendMessage(jid, {
        text: `❌ Error: ${error.message}`
      }, { quoted: msg });
    }
  }
};