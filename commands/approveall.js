// ============================================================
// MUFASER-X — APPROVE ALL PENDING JOIN REQUESTS
// ============================================================

module.exports = {
  name: 'approveall',

  aliases: [
    'acceptall',
    'approveallreq',
    'acceptrequests'
  ],

  desc: 'Approve all pending group join requests',

  category: 'Group',

  usage: '.approveall',

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

      const participants =
        metadata?.participants || [];

      // ======================================================
      // HELPERS
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

        if (
          participantId &&
          target &&
          participantId === target
        ) {
          return true;
        }

        const participantNumber =
          getNumber(participant.id);

        if (
          targetNumber &&
          participantNumber &&
          participantNumber === targetNumber
        ) {
          return true;
        }

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

      // ======================================================
      // BOT ADMIN CHECK
      // ======================================================

      if (!isBotAdmin) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I need to be a group admin to approve members.*'
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

      if (!isAdmin) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Only group admins can approve members.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // FETCH PENDING REQUESTS
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            '⏳ *Checking pending join requests...*'
        },
        {
          quoted: msg
        }
      );

      const requests =
        await sock.groupRequestParticipantsList(
          jid
        );

      if (
        !requests ||
        requests.length === 0
      ) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '✅ *There are no pending join requests.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET REQUEST JIDS
      // ======================================================

      const requestJids =
        requests
          .map(request =>
            request?.jid
          )
          .filter(Boolean);

      if (requestJids.length === 0) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '✅ *There are no valid pending requests.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // APPROVING MESSAGE
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            `⏳ *Approving ${requestJids.length} pending member(s)...*`
        },
        {
          quoted: msg
        }
      );

      // ======================================================
      // APPROVE ALL REQUESTS
      // ======================================================

      const result =
        await sock.groupRequestParticipantsUpdate(
          jid,
          requestJids,
          'approve'
        );

      console.log(
        '[ApproveAll] WhatsApp response:',
        result
      );

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================
let text =
  `✅ *ALL REQUESTS APPROVED*\n\n` +
  `👥 Approved ${requestJids.length} members. Done.`;

return await sock.sendMessage(
  jid,
  { text },
  { quoted: msg }
);

      // ======================================================
      // ERROR
      // ======================================================

      console.error(
        '[ApproveAll] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to approve pending requests.*\n\n' +
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