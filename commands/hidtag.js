// ============================================================
// MUFASER-X — HIDDEN TAG
// ============================================================

module.exports = {
  name: 'hidtag',
  aliases: ['htag', 'hidden'],
  desc: 'Mention all group members without showing their names',
  category: 'Group',
  usage: '.hidtag <message>',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');

    if (!isGroup) {
      return await sock.sendMessage(
        jid,
        { text: '❌ *This command only works in groups.*' },
        { quoted: msg }
      );
    }

    try {

      // --------------------------------------------------------
      // GET GROUP PARTICIPANTS
      // --------------------------------------------------------

      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants || [];

      const cleanJid = (v) =>
        v ? String(v).trim().toLowerCase() : '';

      const getNumber = (v) =>
        v
          ? String(v)
              .split('@')[0]
              .split(':')[0]
              .replace(/\D/g, '')
          : '';

      const participantMatches = (p, tJid, tNum) => {

        if (!p) return false;

        if (cleanJid(p.id) === cleanJid(tJid)) {
          return true;
        }

        if (tNum && getNumber(p.id) === tNum) {
          return true;
        }

        if (tNum && getNumber(p.phoneNumber) === tNum) {
          return true;
        }

        return false;
      };

      // --------------------------------------------------------
      // CHECK BOT ADMIN
      // --------------------------------------------------------

      const botJid = sock?.user?.id || '';
      const botNumber = getNumber(botJid);

      const botParticipant = participants.find(
        p => participantMatches(p, botJid, botNumber)
      );

      const isBotAdmin =
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin';

      if (!isBotAdmin) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I need to be a group admin to use hidtag.*'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // CHECK SENDER ADMIN
      // --------------------------------------------------------

      const senderJid =
        msg?.key?.participant ||
        sender?.jid ||
        msg?.participant ||
        (msg?.key?.fromMe ? botJid : '');

      const senderNumber =
        getNumber(sender?.number || senderJid);

      let senderParticipant = participants.find(
        p => participantMatches(p, senderJid, senderNumber)
      );

      if (!senderParticipant && msg?.key?.fromMe === true) {
        senderParticipant = botParticipant;
      }

      const isAdmin =
        msg?.key?.fromMe === true ||
        senderParticipant?.admin === 'admin' ||
        senderParticipant?.admin === 'superadmin';

      if (!isAdmin) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Only group admins can use this command.*'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // GET REPLIED MESSAGE
      // --------------------------------------------------------

      const quotedMessage =
        msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      const quotedKey =
        msg?.message?.extendedTextMessage?.contextInfo?.stanzaId
          ? {
              remoteJid: jid,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant:
                msg.message.extendedTextMessage.contextInfo
                  .participant
            }
          : null;

      // --------------------------------------------------------
      // GET COMMAND TEXT
      // --------------------------------------------------------

      const commandText = args?.join(' ')?.trim();

      // --------------------------------------------------------
      // ALL GROUP MEMBERS
      // --------------------------------------------------------

      const mentions = participants
        .map(p => p.id)
        .filter(Boolean);

      // --------------------------------------------------------
      // IF REPLYING TO A MESSAGE
      // --------------------------------------------------------

      if (quotedMessage && quotedKey) {

        // If extra text was supplied, use it.
        // Otherwise use a simple hidden-tag message.

        const replyText =
          commandText ||
          '👀 *Hidden tag*';

        return await sock.sendMessage(
          jid,
          {
            text: replyText,
            mentions: mentions
          },
          {
            quoted: {
              key: quotedKey,
              message: quotedMessage
            }
          }
        );
      }

      // --------------------------------------------------------
      // NORMAL HIDTAG
      // --------------------------------------------------------

      if (!commandText) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Please provide a message or reply to a message.*\n\n' +
              '📌 *Examples:*\n\n' +
              '`.hidtag Hello everyone 👋`\n\n' +
              'Or reply to any message with:\n' +
              '`.hidtag`'
          },
          { quoted: msg }
        );
      }

      return await sock.sendMessage(
        jid,
        {
          text: commandText,
          mentions: mentions
        },
        { quoted: msg }
      );

    } catch (error) {

      console.error('[HIDTAG ERROR]', error);

      return await sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to send hidden tag.*\n\n` +
            `⚠️ *Reason:* ${error?.message || 'Unknown error'}`
        },
        { quoted: msg }
      );
    }
  }
};