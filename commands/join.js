// ============================================================
// MUFASER-X — JOIN GROUP COMMAND
//
// Usage:
//
// Reply to a WhatsApp group invite/link:
//
//.join
//
// Example:
//
// https://chat.whatsapp.com/XXXXXXXXXXXX
// ↓
// reply.join
//
// The bot automatically extracts the invite code
// and joins the group.
//
// OWNER ONLY
// ============================================================

module.exports = {

  name: 'join',

  desc: 'Join a WhatsApp group from an invite link',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    // ======================================================
    // OWNER ONLY CHECK
    // ======================================================
    if (!msg.key?.fromMe) {
      return sock.sendMessage(
        jid,
        {
          text: `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
        },
        {
          quoted: msg
        }
      );
    }

    try {

      // ======================================================
      // FIND REPLIED MESSAGE
      // ======================================================

      const quotedMessage =
        msg?.message
         ?.extendedTextMessage
         ?.contextInfo
         ?.quotedMessage;

      if (!quotedMessage) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to a WhatsApp group invite link with.join*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // EXTRACT TEXT FROM REPLIED MESSAGE
      // ======================================================

      let quotedText =
        quotedMessage?.conversation ||
        quotedMessage
         ?.extendedTextMessage
         ?.text ||
        quotedMessage
         ?.imageMessage
         ?.caption ||
        quotedMessage
         ?.videoMessage
         ?.caption ||
        '';

      quotedText =
        String(quotedText).trim();

      // ======================================================
      // FIND WHATSAPP GROUP LINK
      // ======================================================

      const match =
        quotedText.match(
          /https?:\/\/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/i
        );

      if (!match) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *No WhatsApp group invite link found.*\n\n' +
              'Reply directly to a group link like:\n' +
              'https://chat.whatsapp.com/XXXXXXXXXXXX\n' +
              'Then type:\n' +
              '*.join*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET INVITE CODE
      // ======================================================

      const inviteCode =
        match[1];

      // ======================================================
      // INFORM USER
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            '⏳ *Joining group...*'
        },
        {
          quoted: msg
        }
      );

      // ======================================================
      // JOIN GROUP
      // ======================================================

      const groupJid =
        await sock.groupAcceptInvite(
          inviteCode
        );

      // ======================================================
      // SUCCESS
      // ======================================================

      console.log(
        `[Join] ✅ Joined group: ${groupJid}`
      );

      return sock.sendMessage(
        jid,
        {
          text:
            `✅ *Successfully joined the group!*\n\n` +
            `👥 *Group JID:* ${groupJid}`
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[Join] ❌ Failed:',
        error
      );

      let reason =
        error?.message ||
        'Unknown error';

      // ======================================================
      // FRIENDLY ERRORS
      // ======================================================

      if (
        reason.toLowerCase()
         .includes('not-authorized')
      ) {

        reason =
          'The invite link is invalid or expired.';
      }

      else if (
        reason.toLowerCase()
         .includes('forbidden')
      ) {

        reason =
          'The bot is not allowed to join this group.';
      }

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to join group.*\n\n` +
            `Reason: ${reason}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};