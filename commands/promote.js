// ============================================================
// MUFASER-X — PROMOTE MEMBER
// ============================================================

module.exports = {
  name: 'promote',

  aliases: [
    'makeadmin',
    'admin'
  ],

  desc: 'Promote a member to admin',

  category: 'Group',

  usage: '.promote @tag or reply',

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
        '[Promote] 🤖 Bot:',
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
      // BOT ADMIN CHECK
      // ======================================================

      if (!isBotAdmin) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I need to be a group admin to promote members.*'
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
        '[Promote] 👤 Sender:',
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
              '❌ *Only group admins can use this command.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET TARGET USERS
      // ======================================================

      let users = [];

      const contextInfo =
        msg?.message
          ?.extendedTextMessage
          ?.contextInfo;

      // ------------------------------------------------------
      // MENTIONED USERS
      // ------------------------------------------------------

      if (
        Array.isArray(
          contextInfo?.mentionedJid
        )
      ) {

        users.push(
          ...contextInfo.mentionedJid
        );
      }

      // ------------------------------------------------------
      // REPLIED USER
      // ------------------------------------------------------

      if (contextInfo?.participant) {

        users.push(
          contextInfo.participant
        );
      }

      // ======================================================
      // REMOVE DUPLICATES
      // ======================================================

      users = [
        ...new Set(
          users.filter(Boolean)
        )
      ];

      // ======================================================
      // NO TARGET
      // ======================================================

      if (users.length === 0) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *No member selected.*\n\n' +
              '*Usage:*\n' +
              '`.promote @tag`\n' +
              'or reply to a member.'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // PROTECT BOT
      // ======================================================

      const botNumberClean =
        getNumber(botJid);

      const removableUsers =
        users.filter(
          user =>
            getNumber(user) !==
            botNumberClean
        );

      if (removableUsers.length === 0) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I cannot promote myself.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // PROMOTE MEMBERS
      // ======================================================

      await sock.groupParticipantsUpdate(
        jid,
        removableUsers,
        'promote'
      );

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================
      let text = `👑 *PROMOTED ${removableUsers.length} MEMBER(S) TO ADMIN*\n\n`;

      return await sock.sendMessage(
        jid,
        {
          text
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[Promote] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to promote member.*\n\n' +
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