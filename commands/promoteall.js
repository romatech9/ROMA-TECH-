// ============================================================
// MUFASER-X — PROMOTE ALL MEMBERS
// ============================================================

module.exports = {
  name: 'promoteall',

  aliases: [
    'adminall',
    'makealladmin'
  ],

  desc: 'Promote all group members to admins',

  category: 'Group',

  usage: '.promoteall',

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
      // HELPERS
      // SAME METHOD AS WORKING .DEMOTEALL
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
        '[PromoteAll] 🤖 Bot:',
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
        '[PromoteAll] 👤 Sender:',
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
      // FIND NORMAL MEMBERS
      // ======================================================

      const members =
        participants.filter(
          participant => {

            if (!participant?.id) {
              return false;
            }

            const number =
              getNumber(
                participant.id
              );

            if (!number) {
              return false;
            }

            // Never promote bot again
            if (
              number === botNumber
            ) {
              return false;
            }

            const isAlreadyAdmin =
              participant?.admin === 'admin' ||
              participant?.admin === 'superadmin';

            // Already admin = skip
            if (isAlreadyAdmin) {
              return false;
            }

            return true;
          }
        );

      // ======================================================
      // NO MEMBERS TO PROMOTE
      // ======================================================

      if (members.length === 0) {

        return await sock.sendMessage(
          jid,
          {
            text:
              'ℹ️ *There are no normal members to promote.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // TARGET JIDS
      // ======================================================

      const targetJids =
        members
          .map(
            participant =>
              participant?.id
          )
          .filter(Boolean);

      if (targetJids.length === 0) {

        return await sock.sendMessage(
          jid,
          {
            text:
              'ℹ️ *No valid members were found to promote.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // PROCESSING MESSAGE
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            '⏳ *Promoting all members to admins...*'
        },
        {
          quoted: msg
        }
      );

      // ======================================================
      // PROMOTE MEMBERS
      // ======================================================

      const result =
        await sock.groupParticipantsUpdate(
          jid,
          targetJids,
          'promote'
        );

      console.log(
        '[PromoteAll] WhatsApp response:',
        result
      );

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================

      let text =
        `👑 *PROMOTE ALL COMPLETE*\n\n` +
        `👑 *Promoted:* ${targetJids.length}`;

      return await sock.sendMessage(jid, {
          text
        }, { quoted: msg }
      );

    } catch (error) {

      // ======================================================
      // ERROR
      // ======================================================

      console.error(
        '[PromoteAll] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to promote all members.*\n\n' +
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