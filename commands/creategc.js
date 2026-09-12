// ============================================================
// MUFASER-X — CREATE GROUP COMMAND
//
// Usage:
// .creategc MUFASER-X FAMILY
// ============================================================

module.exports = {

  name: 'creategc',

  desc: 'Create a WhatsApp group',

  async execute(sock, msg, jid, args, sender, account) {

    try {

      // ======================================================
      // OWNER ONLY
      // ======================================================

      if (!msg.key?.fromMe) {
        return sock.sendMessage(
          jid,
          {
            text: `😅 *OWNER ONLY!*

Sorry Comrade, this command is reserved for my owner. 😌`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // GROUP NAME
      // ======================================================

      const groupName = args?.join(' ').trim();

      if (!groupName) {
        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Group name is required.*\n\n' +
              '*Example:*\n' +
              '.creategc MUFASER-X FAMILY'
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
              '❌ Could not detect the bot WhatsApp account.'
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // BOT NUMBER
      // ======================================================

      const botNumber =
        botJid
          .split('@')[0]
          .split(':')[0];


      const participant =
        `${botNumber}@s.whatsapp.net`;


      // ======================================================
      // CREATING MESSAGE
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            `⏳ *Creating group...*\n\n` +
            `👥 ${groupName}`
        },
        {
          quoted: msg
        }
      );


      console.log(
        `[CreateGC] 🏗️ Creating group: ${groupName}`
      );

      console.log(
        `[CreateGC] 👤 Participant: ${participant}`
      );


      // ======================================================
      // CREATE GROUP
      // ======================================================

      const group =
        await sock.groupCreate(
          groupName,
          [
            participant
          ]
        );


      // ======================================================
      // GROUP JID
      // ======================================================

      const groupJid =
        group?.id;


      console.log(
        `[CreateGC] ✅ Group created: ${groupJid}`
      );


      // ======================================================
      // SUCCESS
      // ======================================================

      return sock.sendMessage(
        jid,
        {
          text:
            `✅ *GROUP CREATED SUCCESSFULLY!*\n\n` +
            `👥 *Name:* ${groupName}\n` +
            `🆔 *Group ID:* ${groupJid || 'Unknown'}`
        },
        {
          quoted: msg
        }
      );


    } catch (error) {

      console.error(
        '[CreateGC] ❌ Failed:',
        error
      );


      // ======================================================
      // ERROR MESSAGE
      // ======================================================

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to create group.*\n\n` +
            `*Group:* ${args?.join(' ') || 'Unknown'}\n\n` +
            `*Reason:*\n${error?.message || 'Unknown error'}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};