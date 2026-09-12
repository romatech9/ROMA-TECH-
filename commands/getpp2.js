// ============================================================
// MUFASER-X — GETPP2 COMMAND
// Owner Only: Get Profile Picture and send to Owner DM
// ============================================================

module.exports = {
  name: 'getpp2',
  aliases: ['pp2', 'profilepic2'],
  desc: 'Owner only: Get pp and send to owner DM',
  category: 'Owner',

  async execute(sock, msg, jid, args, sender, account) {

    if (!msg.key.fromMe) {
      return sock.sendMessage(jid, {
        text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
      }, { quoted: msg });
    }

    try {
      let targetJid;

      if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      }
      else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '');
        targetJid = num + '@s.whatsapp.net';
      }
      else {
        targetJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      }

      const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, 'image');
      } catch (e) {
        return sock.sendMessage(jid, {
          text: '🥴 This user has no profile picture or it is private'
        }, { quoted: msg });
      }

      await sock.sendMessage(ownerJid, {
        image: { url: ppUrl },
        caption: `> powered; by MUFASER-X`
      });

      // no progress message here - silent

    } catch (error) {
      await sock.sendMessage(jid, {
        text: `❌ Error: ${error.message}`
      }, { quoted: msg });
    }
  }
};