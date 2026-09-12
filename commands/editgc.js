// ============================================================
// MUFASER-X — GROUP EDIT PERMISSION
// ============================================================

module.exports = {
  name: 'editgc',

  aliases: [
    'editgroup',
    'groupedit',
    'gcinfo'
  ],

  desc: 'Control who can edit group information',

  category: 'Group',

  usage: '.editgc on/off',

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

        // Phone number fallback
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
              '❌ *I need to be a group admin to change group edit settings.*'
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
              '❌ *Only group admins can use this command.*'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // GET OPTION
      // ======================================================

      const option =
        String(args?.[0] || '')
          .toLowerCase()
          .trim();

      if (
        !['on', 'off'].includes(option)
      ) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Invalid option.*\n\n' +
              '*Usage:*\n' +
              '`.editgc on`\n' +
              '`.editgc off`'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // CHANGE GROUP EDIT PERMISSION
      // ======================================================

      console.log(
        `[EditGC] ⚙️ Setting group edit permission: ${option}`
      );

      await sock.groupSettingUpdate(
        jid,
        option === 'on'
          ? 'locked'
          : 'unlocked'
      );

      // ======================================================
      // SUCCESS
      // ======================================================

      const senderDisplay =
        getNumber(senderJid) ||
        senderNumber ||
        'Admin';

      const status =
        option === 'on'
          ? 'ON'
          : 'OFF';

      const icon =
        option === 'on'
          ? '🔒'
          : '🔓';

      const description =
        option === 'on'
          ? 'Only group admins can edit group information.'
          : 'All group members can edit group information.';

      return await sock.sendMessage(
        jid,
        {
          text:
            `╭━━〔 ⚙️ *GROUP EDIT SETTINGS* 〕━━╮\n\n` +
            `📌 *Admin Only:* ${status}\n\n` +
            `${icon} ${description}\n\n` +
            `📝 *Members affected:*\n` +
            `• Group name\n` +
            `• Group description\n` +
            `• Group profile picture\n\n` +
            
            `> powered; by MUFASER-X\n` +
            ``,

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

      console.error(
        '[EditGC] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to change group edit settings.*\n\n' +
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