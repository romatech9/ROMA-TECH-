// ============================================================
// MUFASER-X — REJECT ALL JOIN REQUESTS
// ============================================================

module.exports = {
  name: 'rejectall',

  aliases: [
    'denyall',
    'rejectallreq'
  ],

  desc: 'Reject all pending members to join the group',

  category: 'Group',

  usage: '.rejectall',

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

        // Number fallback
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
        '[RejectAll] 🤖 Bot:',
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
              '❌ *I need to be a group admin to reject members.*'
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
        '[RejectAll] 👤 Sender:',
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
      // CHECKING REQUESTS
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

      // ======================================================
      // GET PENDING REQUESTS
      // ======================================================

      const requests =
        await sock.groupRequestParticipantsList(
          jid
        );

      if (
        !Array.isArray(requests) ||
        requests.length === 0
      ) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '✅ *No pending join requests.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET REQUEST JIDS
      // ======================================================

      const requestParticipants =
        requests
          .map(
            request =>
              request?.jid
          )
          .filter(Boolean);

      if (
        requestParticipants.length === 0
      ) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '✅ *No valid pending join requests found.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // REJECT ALL REQUESTS
      // ======================================================

      const result =
        await sock.groupRequestParticipantsUpdate(
          jid,
          requestParticipants,
          'reject'
        );

      console.log(
        '[RejectAll] WhatsApp response:',
        result
      );

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
            `❌ *ALL JOIN REQUESTS REJECTED*\n\n` +
            `👥 *Rejected:* ${requestParticipants.length} member(s)\n\n` +
            `🚫 All pending requests have been denied.` 
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
        '[RejectAll] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to reject members.*\n\n' +
            `⚠️ *Reason:* ${
              error?.message ||
              'Make sure group approval mode is enabled and try again.'
            }`
        },
        {
          quoted: msg
        }
      );
    }
  }
};