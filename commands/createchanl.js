// MUFASER-X — CREATE WHATSAPP CHANNEL v2
// ============================================================

module.exports = {
  name: 'createchanl',
  aliases: ['createchannel', 'newchannel'],
  desc: 'Create a WhatsApp Channel',
  category: 'Tools',
  usage: '.createchanl <channel name>',

  async execute(sock, msg, jid, args, sender, account) {

    // ======================================================
    // 1. OWNER ONLY CHECK - Must be first
    // ======================================================
    if (!msg.key?.fromMe) {
      return sock.sendMessage(
        jid,
        {
          text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
        },
        { quoted: msg }
      );
    }

    // ======================================================
    // 2. GET CHANNEL NAME
    // ======================================================
    const channelName = args?.join(' ')?.trim();

    if (!channelName) {
      return await sock.sendMessage(jid, {
        text: '❌ *Channel name is required.*\n\n*Usage:*\n`.createchanl MUFASER-X Updates`'
      }, { quoted: msg });
    }

    const finalName = channelName.substring(0, 100); // WhatsApp max 100 chars
    let channelJid = '';
    let channelLink = '';

    try {
      await sock.sendMessage(jid, {
        text: `📢 *Creating channel:* ${finalName}...`
      }, { quoted: msg });

      // ======================================================
      // 3. CHECK IF FUNCTION EXISTS
      // ======================================================
      if (typeof sock.newsletterCreate!== 'function') {
        return await sock.sendMessage(jid, {
          text: `❌ *Error:* Your Baileys version does not support channel creation.\n\nPlease update to WhiskeySockets/Baileys with newsletter support.`
        }, { quoted: msg });
      }

      // ======================================================
      // 4. CREATE THE CHANNEL
      // ======================================================
      const result = await sock.newsletterCreate(finalName, '');
      channelJid = result?.id || result?.jid || '';

      // ======================================================
      // 5. GET CHANNEL LINK
      // ======================================================
      if (channelJid && typeof sock.newsletterMetadata === 'function') {
        try {
          const metadata = await sock.newsletterMetadata('jid', channelJid);
          const invite = metadata?.invite || metadata?.inviteCode;
          if (invite) {
            channelLink = invite.startsWith('http')? invite : `https://whatsapp.com/channel/${invite}`;
          }
        } catch (e) {
          console.error('[CreateChanl] Metadata Error:', e);
        }
      }

      // ======================================================
      // 6. SUCCESS RESPONSE
      // ======================================================
      if (!channelJid) {
        return await sock.sendMessage(jid, {
          text: `❌ *Failed to create channel.*\nPlease try again later.`
        }, { quoted: msg });
      }

      let response = `✅ *CHANNEL CREATED SUCCESSFULLY*\n\n`;
      response += `📢 *Name:* ${finalName}\n`;
      if (channelJid) response += `🆔 *JID:* ${channelJid}\n`;
      if (channelLink) response += `🔗 *Link:* ${channelLink}\n`;
      response += `\n> powered; by MUFASER-X`;

      await sock.sendMessage(jid, { text: response }, { quoted: msg });

    } catch (error) {
      console.error('[CreateChanl] ❌ Error:', error);
      await sock.sendMessage(jid, {
        text: `❌ *Error creating channel:*\n${error.message || error}`
      }, { quoted: msg });
    }
  }
};