// ============================================================
// MUFASER-X — DELETE BOT PROFILE PICTURE
//
// Usage:
//
// .delpp
//
// Removes the bot's current WhatsApp profile picture.
//
// OWNER ONLY
// ============================================================

function normalizeNumber(value) {
  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

module.exports = {

  name: 'delpp',

  desc: 'Delete bot profile picture',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    try {

      // ======================================================
      // OWNER ONLY
      // ======================================================

      const senderNumber = normalizeNumber(
        sender?.number ||
        msg?.key?.participant ||
        msg?.key?.remoteJid
      );

      const ownerNumber = normalizeNumber(
        account?.ownerNumber ||
        account?.phone
      );

      const isOwner =
        msg?.key?.fromMe === true ||
        (
          ownerNumber &&
          senderNumber === ownerNumber
        );

      if (!isOwner) {

        return sock.sendMessage(
          jid,
          {
            text:
              `😅 *OWNER ONLY!*\n\nSorry Comrade, this command is reserved for my owner. 😌`
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET BOT JID
      // ======================================================

      const botJid = sock.user?.id;

      if (!botJid) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Bot WhatsApp ID could not be found.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // DELETE PROFILE PICTURE
      // ======================================================

      await sock.removeProfilePicture(botJid);

      console.log(
        `[DelPP:${account?.phone || 'unknown'}] ` +
        `✅ Bot profile picture deleted`
      );

      // ======================================================
      // SUCCESS
      // ======================================================

      return sock.sendMessage(
        jid,
        {
          text:
            '✅ *Bot Profile Picture Deleted!*\n\n' +
            '🗑️ MUFASER-X no longer has a profile picture.'
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[DelPP] ❌ Failed:',
        error
      );

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to delete profile picture.*\n\n` +
            `Reason: ${error?.message || 'Unknown error'}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};