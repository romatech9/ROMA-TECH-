// ============================================================
// MUFASER-X — DEMOTE ALL ADMINS
// ============================================================

module.exports = {
  name: 'demoteall',

  aliases: [
    'unadminall',
    'removeadmins'
  ],

  desc: 'Demote all group admins',

  category: 'Group',

  usage: '.demoteall',

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
      // SAME METHOD AS WORKING .DEMOTE
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
        '[DemoteAll] 🤖 Bot:',
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
              '❌ *I need to be a group admin to demote members.*'
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
        '[DemoteAll] 👤 Sender:',
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
      // FIND ALL ADMINS
      // ======================================================

      const admins =
        participants.filter(
          participant =>
            participant?.admin === 'admin' ||
            participant?.admin === 'superadmin'
        );

      // ======================================================
      // PROTECT BOT + COMMAND SENDER
      // ======================================================

      const protectedNumbers =
        new Set([
          botNumber,
          senderNumber
        ].filter(Boolean));

      const targets =
        admins.filter(
          participant => {

            const number =
              getNumber(
                participant?.id
              );

            if (!number) {
              return false;
            }

            // Never demote bot
            if (
              number === botNumber
            ) {
              return false;
            }

            // Never demote command sender
            if (
              number === senderNumber
            ) {
              return false;
            }

            return !protectedNumbers.has(
              number
            );
          }
        );

      // ======================================================
      // NO TARGET ADMINS
      // ======================================================

      if (targets.length === 0) {

        return await sock.sendMessage(
          jid,
          {
            text:
              'ℹ️ *There are no other admins I can demote.*\n\n' +
              '🛡️ *The bot and the command sender were protected.*'
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
        targets
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
              'ℹ️ *No valid admin targets were found.*'
          },
          {
            quoted: msg
          }
        );
      }
      
      // ======================================================
      // DEMOTE ADMINS
      // ======================================================

      const result =
        await sock.groupParticipantsUpdate(
          jid,
          targetJids,
          'demote'
        );

      console.log(
        '[DemoteAll] WhatsApp response:',
        result
      );

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================
      let text =
        `📉 *DEMOTE ALL COMPLETE*\n\n` +
        `👥 *Admins found:* ${admins.length}\n` +
        `📉 *Demoted:* ${targetJids.length}\n\n`;

      return await sock.sendMessage(
        jid,
        {
          text,
          mentions: [
            ...targetJids,
            senderJid
          ].filter(Boolean)
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
        '[DemoteAll] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to demote all admins.*\n\n' +
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