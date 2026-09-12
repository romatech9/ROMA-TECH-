// ============================================================
// MUFASER-X — SET GROUP NAME
// ============================================================

module.exports = {
  name: 'setgcname',

  aliases: [
    'setname',
    'setgname',
    'gname'
  ],

  desc: 'Set group name',

  category: 'Group',

  usage: '.setgcname New Group Name',

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
        '[SetGCName] 🤖 Bot:',
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
              '❌ *I need to be a group admin to change the group name.*'
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
        '[SetGCName] 👤 Sender:',
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
      // GET GROUP NAME
      // ======================================================

      const text =
        Array.isArray(args)
          ? args.join(' ').trim()
          : '';

      if (!text) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Please provide a group name.*\n\n' +
              'Example:\n' +
              '`.setgcname MUFASER-X OFFICIAL`'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // NAME LENGTH
      // ======================================================

      if (text.length > 100) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Group name too long.*\n\n' +
              'Maximum: *100 characters*.'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // UPDATE GROUP NAME
      // ======================================================

      await sock.groupUpdateSubject(
        jid,
        text
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
            `✅ *GROUP NAME UPDATED!*` 
            
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
        '[SetGCName] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to update group name.*\n\n' +
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