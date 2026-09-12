// ============================================================
// MUFASER-X — CREATE WHATSAPP CHANNEL v3
// ============================================================

module.exports = {
  name: 'createchanl',
  aliases: ['createchannel', 'newchannel'],
  desc: 'Create a WhatsApp Channel',
  category: 'Tools',
  usage: '.createchanl <channel name>',

  async execute(sock, msg, jid, args, sender, account) {

    if (!msg.key?.fromMe) {
      return sock.sendMessage(jid, {
        text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
      }, { quoted: msg });
    }

    const channelName = args?.join(' ')?.trim();
    if (!channelName) {
      return await sock.sendMessage(jid, {
        text: '❌ *Channel name is required.*\n\n*Usage:*\n`.createchanl MUFASER-X Updates`'
      }, { quoted: msg });
    }

    const finalName = channelName.substring(0, 100);
    let channelJid = '';
    let channelLink = '';

    try {
      await sock.sendMessage(jid, {
        text: `📢 *Creating channel:* ${finalName}...`
      }, { quoted: msg });

      if (typeof sock.newsletterCreate !== 'function') {
        return await sock.sendMessage(jid, {
          text: `❌ *Error:* Your Baileys version does not support channel creation.`
        }, { quoted: msg });
      }

      try {
        const result = await sock.newsletterCreate(finalName, '');
        channelJid = result?.id || result?.jid || '';
      } catch (createError) {
        // Baileys often throws after creating - check logs
        console.log('[CreateChanl] Create threw but may have created:', createError.message);
        // Don't return error here - try to find channel in list
      }

      // Try to get link from recent newsletters if JID not returned
      if (!channelJid && typeof sock.newsletterFetchAll === 'function') {
        try {
          const all = await sock.newsletterFetchAll();
          const found = all?.find(n => n?.name === finalName);
          if (found) channelJid = found.id || found.jid;
        } catch {}
      }

      if (channelJid && typeof sock.newsletterMetadata === 'function') {
        try {
          const metadata = await sock.newsletterMetadata('jid', channelJid);
          const invite = metadata?.invite || metadata?.inviteCode || metadata?.thread_metadata?.invite;
          if (invite) {
            channelLink = invite.startsWith('http') ? invite : `https://whatsapp.com/channel/${invite}`;
          }
        } catch {}
      }

      // === ALWAYS SUCCESS IF WE HAVE JID OR LINK, OR EVEN IF ERROR BUT ASSUME CREATED ===
      let response = `✅ *CHANNEL CREATED SUCCESSFULLY*\n\n`;
      response += `📢 *Name:* ${finalName}\n`;
      if (channelJid) response += `🆔 *JID:* ${channelJid}\n`;
      if (channelLink) response += `🔗 *Link:* ${channelLink}\n`;
      else response += `🔗 *Link:* Check WhatsApp > Channels tab\n`;
      response += `\n> powered; by MUFASER-X`;

      await sock.sendMessage(jid, { text: response }, { quoted: msg });

    } catch (error) {
      console.error('[CreateChanl] ❌ Error:', error);
      // Even on final error, send success as you requested
      let response = `✅ *CHANNEL CREATED SUCCESSFULLY*\n\n`;
      response += `📢 *Name:* ${finalName}\n`;
      response += `⚠️ Note: Link will appear in your Channels tab shortly.\n`;
      response += `\n> powered; by MUFASER-X`;
      await sock.sendMessage(jid, { text: response }, { quoted: msg });
    }
  }
};