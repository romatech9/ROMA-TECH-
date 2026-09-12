// ============================================================
// MUFASER-X — RESET / REVOKE GROUP LINK
// ============================================================

module.exports = {
  name: 'resetgclink',

  aliases: [
    'resetlink',
    'revoke',
    'newlink'
  ],

  desc: 'Reset/Revoke group invite link',

  category: 'Group',

  usage: '.resetgclink',

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

      const participants =
        metadata?.participants || [];

      // ======================================================
      // ADMIN HELPERS
      // SAME METHOD USED BY WORKING .MUTE
      // ======================================================

      const cleanJid = (value) => {

        if (!value) return '';

        return String(value)
          .trim()
          .toLowerCase();
      };

      const getNumber = (value) => {

        if (!value) return '';

        return String(value)
          .split('@')[0]
          .split(':')[0]
          .replace(/\D/g, '');
      };

      const participantMatches = (
        participant,
        targetJid,
        targetNumber
      ) => {

        if (!participant) return false;

        const participantId =
          cleanJid(participant.id);

        const target =
          cleanJid(targetJid);

        // Exact JID
        if (
          participantId &&
          target &&
          participantId === target
        ) {
          return true;
        }

        // Base number
        const participantNumber =
          getNumber(participant.id);

        if (
          targetNumber &&
          participantNumber &&
          participantNumber === targetNumber
        ) {
          return true;
        }

        // phoneNumber fallback
        const participantPhone =
          getNumber(
            participant.phoneNumber
          );

        if (
          targetNumber &&
          participantPhone &&
          participantPhone === targetNumber
        ) {
          return true;
        }

        return false;
      };

      // ======================================================
      // FIND BOT
      // ======================================================

      const botJid =
        sock?.user?.id || '';

      const botNumber =
        getNumber(botJid);

      const botParticipant =
        participants.find(
          participant =>
            participantMatches(
              participant,
              botJid,
              botNumber
            )
        );

      const isBotAdmin =
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin';

      console.log(
        '[ResetGCLink] 🤖 Bot:',
        {
          botJid,
          botNumber,
          found:
            botParticipant?.id || null,
          admin:
            botParticipant?.admin || null,
          isBotAdmin
        }
      );

      // ======================================================
      // CHECK BOT ADMIN
      // ======================================================

      if (!isBotAdmin) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I need to be a group admin to reset the group link.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // FIND COMMAND SENDER
      // ======================================================

      const senderJid =
        msg?.key?.participant ||
        sender?.jid ||
        msg?.participant ||
        (
          msg?.key?.fromMe
            ? botJid
            : ''
        );

      const senderNumber =
        getNumber(
          sender?.number ||
          senderJid
        );

      // ======================================================
      // FIND SENDER PARTICIPANT
      // ======================================================

      let senderParticipant =
        participants.find(
          participant =>
            participantMatches(
              participant,
              senderJid,
              senderNumber
            )
        );

      // ======================================================
      // FROM-ME FALLBACK
      // ======================================================

      if (
        !senderParticipant &&
        msg?.key?.fromMe === true
      ) {

        senderParticipant =
          participants.find(
            participant =>
              participantMatches(
                participant,
                botJid,
                botNumber
              )
          );
      }

      // ======================================================
      // CHECK SENDER ADMIN
      // ======================================================

      const isAdmin =
        msg?.key?.fromMe === true ||
        senderParticipant?.admin === 'admin' ||
        senderParticipant?.admin === 'superadmin';

      console.log(
        '[ResetGCLink] 👤 Sender:',
        {
          senderJid,
          senderNumber,
          found:
            senderParticipant?.id || null,
          admin:
            senderParticipant?.admin || null,
          isAdmin
        }
      );

      if (!isAdmin) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Only group admins can reset the group link.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // RESET GROUP LINK
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            ''
        },
        {
          quoted: msg
        }
      );

      const newCode =
        await sock.groupRevokeInvite(jid);

      if (!newCode) {
        throw new Error(
          'WhatsApp did not return a new invite code.'
        );
      }

      const newLink =
        `https://chat.whatsapp.com/${newCode}`;

      // ======================================================
      // SUCCESS
      // ======================================================

      const senderMention =
        senderJid ||
        botJid;

      const senderDisplay =
        getNumber(senderMention) ||
        'Admin';

      return await sock.sendMessage(
        jid,
        {
          text:
            `✅ *GROUP LINK RESET SUCCESSFULLY!*\n\n` +
            `🔗 *New Link:*\n${newLink}\n\n` +
            `⚠️ *The old link is now expired.*`

          mentions:
            senderMention
              ? [senderMention]
              : []
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[ResetGCLink] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to reset group link.*\n\n' +
            `⚠️ *Reason:* ${
              error?.message ||
              'WhatsApp rejected the request.'
            }`
        },
        {
          quoted: msg
        }
      );
    }
  }
};