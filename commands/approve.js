// ============================================================
// MUFASER-X — MEMBERSHIP APPROVAL
// ============================================================

module.exports = {
  name: 'approve',

  aliases: [
    'approval',
    'requestapprove'
  ],

  desc: 'Turn group membership approval on/off',

  category: 'Group',

  usage: '.approve on/off',

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

      console.log(
        '[Approve] 🤖 Bot:',
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
              '❌ *I need to be a group admin to change approval settings.*'
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

      console.log(
        '[Approve] 👤 Sender:',
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
              '`.approve on`\n' +
              '`.approve off`'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // CHANGE MEMBERSHIP APPROVAL
      // ======================================================

      console.log(
        `[Approve] ⚙️ Setting membership approval: ${option}`
      );

      // IMPORTANT:
      // Use the dedicated Baileys method.
      await sock.groupJoinApprovalMode(
        jid,
        option
      );

      // ======================================================
      // VERIFY THE CHANGE
      // ======================================================

      const updatedMetadata =
        await sock.groupMetadata(jid);

      const approvalEnabled =
        updatedMetadata?.joinApprovalMode === true;

      console.log(
        '[Approve] ✅ Verification:',
        {
          requested: option,
          actual:
            approvalEnabled
              ? 'on'
              : 'off'
        }
      );

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================

      const actualStatus =
        approvalEnabled
          ? 'ON'
          : 'OFF';

      const description =
        approvalEnabled
          ? 'New members must request to join the group.'
          : 'Members can join without membership approval.';

      const senderDisplay =
        getNumber(senderJid) ||
        senderNumber ||
        'Admin';

      return await sock.sendMessage(
        jid,
        {
          text: `✅ MEMBERSHIP APPROVAL ${actualStatus}`,
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
        '[Approve] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to update membership approval.*\n\n' +
            `⚠️ *Reason:* ${
              error?.message ||
              'WhatsApp rejected the membership approval change.'
            }`
        },
        {
          quoted: msg
        }
      );
    }
  }
};