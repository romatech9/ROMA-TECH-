// ============================================================
// MUFASER-X — GETPP COMMAND
// For All: Get Profile Picture
// Usage:.getpp @tag or reply to someone or.getpp 2547xxxx
// ============================================================

module.exports = {
  name: 'getpp',
  aliases: ['pp', 'profilepic'],
  desc: 'Get someone profile picture',
  category: 'General',

  async execute(sock, msg, jid, args, sender, account) {

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
      // 3. If number was typed.getpp 2547xxxx
      else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '');
        targetJid = num + '@s.whatsapp.net';
      }
      // 4. Else get sender's own
      else {
        targetJid = sender;
      }

      // Try to get HD profile pic
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, 'image');
      } catch (e) {
        return sock.sendMessage(jid, {
          text: '*🥴This user has no profile picture or it is private*'
        }, { quoted: msg });
      }

      // Get name
      let name = targetJid.split('@')[0];

      // Send the profile picture
      await sock.sendMessage(jid, {
        image: { url: ppUrl },
        caption: `> powered by MUFASER-X`
      }, { quoted: msg });

    } catch (error) {
      console.log(error);
      await sock.sendMessage(jid, {
        text: `❌ Error: ${error.message}`
      }, { quoted: msg });
    }
  }
};