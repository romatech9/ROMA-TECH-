// ============================================================
// MUFASER-X — GET GROUP PROFILE PICTURE
// ============================================================

module.exports = {
  name: 'getgcpp',

  aliases: [
    'getppgc',
    'getgpic',
    'gcpp'
  ],

  desc: 'Get the current group profile picture',

  category: 'Group',

  usage: '.getgcpp',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    // ========================================================
    // CHECK GROUP
    // ========================================================

    const isGroup =
      typeof jid === 'string' &&
      jid.endsWith('@g.us');

    if (!isGroup) {

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *This command only works in groups.*'
        },
        {
          quoted: msg
        }
      );
    }

    try {

      // ======================================================
      // GET GROUP METADATA
      // ======================================================

      const metadata =
        await sock.groupMetadata(jid);

      if (!metadata) {

        throw new Error(
          'Group metadata unavailable.'
        );
      }

      const groupName =
        metadata?.subject ||
        'WhatsApp Group';


      // ======================================================
      // GET GROUP PROFILE PICTURE
      // ======================================================

      let ppUrl = null;

      try {

        ppUrl =
          await sock.profilePictureUrl(
            jid,
            'image'
          );

      } catch (error) {

        console.log(
          '[GetGCPp] ⚠️ Group profile picture unavailable:',
          error?.message || error
        );

        ppUrl = null;
      }


      // ======================================================
      // NO PROFILE PICTURE
      // ======================================================

      if (!ppUrl) {

        return await sock.sendMessage(
          jid,
          {
            text:
              `❌ *This group does not have a profile picture.*\n\n` +
              `📛 *Group:* ${groupName}`
          },
          {
            quoted: msg
          }
        );
      }


      // ======================================================
      // FIND SENDER
      // ======================================================

      const senderJid =
        msg?.key?.participant ||
        sender?.jid ||
        msg?.participant ||
        (
          msg?.key?.fromMe === true
            ? sock?.user?.id
            : ''
        );

      const senderNumber =
        String(
          sender?.number ||
          senderJid ||
          ''
        )
          .split('@')[0]
          .split(':')[0]
          .replace(/\D/g, '');


      // ======================================================
      // SEND GROUP PROFILE PICTURE
      // ======================================================

      console.log(
        `[GetGCPp] 🖼️ Sending group profile picture: ${groupName}`
      );

      return await sock.sendMessage(
        jid,
        {
          image: {
            url: ppUrl
          },

          caption:
            `> 🖼️ *GROUP PROFILE*`

          mentions:
            senderJid
              ? [senderJid]
              : []
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      // ======================================================
      // ERROR
      // ======================================================

      console.error(
        '[GetGCPp] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to get the group profile picture.*\n\n' +
            `⚠️ *Reason:* ${
              error?.message ||
              'WhatsApp did not return the group picture.'
            }`
        },
        {
          quoted: msg
        }
      );
    }
  }
};