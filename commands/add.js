// ============================================================
// MUFASER-X — ADD MEMBER
// ============================================================

module.exports = {
  name: 'add',

  aliases: [
    'invite'
  ],

  desc: 'Add a member to the group by number',

  category: 'Group',

  usage: '.add 2567xxxxxxxxx',

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
          text: '❌ *This command only works in groups.*'
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
        throw new Error('Group metadata unavailable.');
      }

      const participants =
        metadata.participants || [];

      // ======================================================
      // HELPER — NORMALIZE JID
      // ======================================================

      const cleanJid = (value) => {
        if (!value) return '';

        return String(value)
         .trim()
         .toLowerCase();
      };

      // ======================================================
      // HELPER — GET BASE NUMBER
      // ======================================================

      const getNumber = (value) => {
        if (!value) return '';

        return String(value)
         .split('@')[0]
         .split(':')[0]
         .replace(/\D/g, '');
      };

      // ======================================================
      // HELPER — CHECK PARTICIPANT MATCH
      // ======================================================

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
      // GET SENDER JID
      // ======================================================

      const senderJid =
        msg?.key?.participant ||
        sender?.jid ||
        msg?.participant ||
        (
          msg?.key?.fromMe
           ? sock?.user?.id
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
      // EXTRA FALLBACK FOR FROM-ME
      // ======================================================

      if (
       !senderParticipant &&
        msg?.key?.fromMe === true
      ) {

        const botJid =
          sock?.user?.id || '';

        const botNumber =
          getNumber(botJid);

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
      // CHECK USER ADMIN
      // ======================================================

      const isAdmin =
        msg?.key?.fromMe === true ||
        senderParticipant?.admin === 'admin' ||
        senderParticipant?.admin === 'superadmin';

      console.log(
        `[Add] 👤 Sender:`,
        {
          senderJid,
          senderNumber,
          found: senderParticipant?.id || null,
          admin: senderParticipant?.admin || null,
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
      // FIND BOT PARTICIPANT
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

      // ======================================================
      // CHECK BOT ADMIN
      // ======================================================

      const isBotAdmin =
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin';

      console.log(
        `[Add] 🤖 Bot:`,
        {
          botJid,
          botNumber,
          found: botParticipant?.id || null,
          admin: botParticipant?.admin || null,
          isBotAdmin
        }
      );

      if (!isBotAdmin) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I need to be a group admin to add members.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET NUMBER
      // ======================================================

      const number =
        String(args?.[0] || '')
         .replace(/\D/g, '');

      if (!number) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Phone number is required.*\n\n' +
              '*Usage:*\n' +
              '`.add 2567xxxxxxxxx`\n\n' +
              '*Example:*\n' +
              '`.add 256700000000`'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // BASIC VALIDATION
      // ======================================================

      if (number.length < 8) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Invalid phone number.*\n\n' +
              'Use international format without `+` or spaces.\n\n' +
              '*Example:* `256700000000`'
          },
          {
            quoted: msg
          }
        );
      }

      const memberJid =
        `${number}@s.whatsapp.net`;

      // ======================================================
      // CHECK IF ALREADY IN GROUP
      // ======================================================

      const alreadyMember =
        participants.some(
          participant =>
            participantMatches(
              participant,
              memberJid,
              number
            )
        );

      if (alreadyMember) {

        return await sock.sendMessage(
          jid,
          {
            text:
              `ℹ️ *@${number} is already a member of this group.*`,
            mentions: [
              memberJid
            ]
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // ADDING MESSAGE
      // ======================================================

      await sock.sendMessage(
        jid,
        {
          text:
            `⏳ *Adding @${number} to the group...*`,
          mentions: [
            memberJid
          ]
        },
        {
          quoted: msg
        }
      );

      // ======================================================
      // ADD MEMBER
      // ======================================================

      const result =
        await sock.groupParticipantsUpdate(
          jid,
          [memberJid],
          'add'
        );

      console.log(
        '[Add] 📥 WhatsApp response:',
        result
      );

      const response =
        Array.isArray(result)
         ? result[0]
          : result;

      const status =
        String(response?.status || '');

      // ======================================================
      // SUCCESS - FIXED RESPONSE
      // ======================================================

      if (
        status === '200' ||
        status === '201'
      ) {

        const addedBy =
          senderJid ||
          sock?.user?.id ||
          '';

        const addedByNumber =
          getNumber(addedBy);

        const mentions = [
          memberJid
        ];

        if (addedBy) {
          mentions.push(addedBy);
        }

        return await sock.sendMessage(
          jid,
          {
            text:
              `✅ *MEMBER ADDED SUCCESSFULLY!*\n\n` +
              `👤 *Member:* @${number}\n` +
              `👮 *Added by:* @${addedByNumber}\n\n` +
              `> 🎉*╔POWERED BY MUFASER-X╗*🌹 `,
            mentions
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // FAILED
      // ======================================================

      let reason =
        'WhatsApp rejected the request.';

      if (status === '403') {
        reason =
          'The user may have privacy restrictions preventing group additions.';
      } else if (status === '409') {
        reason =
          'The user is already in the group or WhatsApp could not add them.';
      } else if (status) {
        reason =
          `WhatsApp returned status ${status}.`;
      }

      return await sock.sendMessage(
        jid,
        {
          text:
            `❌ *FAILED TO ADD @${number}*\n\n` +
            `⚠️ ${reason}`,
          mentions: [
            memberJid
          ]
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[Add] ❌ Error:',
        error
      );

      const number =
        String(args?.[0] || '')
         .replace(/\D/g, '');

      return await sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to add ${
              number
               ? `@${number}`
                : 'member'
            }.*\n\n` +
            `⚠️ *Reason:* ${
              error?.message ||
              'Check the number format and try again.'
            }`,
         ...(number
           ? {
                mentions: [
                  `${number}@s.whatsapp.net`
                ]
              }
            : {})
        },
        {
          quoted: msg
        }
      );
    }
  }
};