// ============================================================
// MUFASER-X — DELETE MESSAGE
// ============================================================

module.exports = {
  name: 'del',

  aliases: [
    'delete',
    'd'
  ],

  desc: 'Delete a replied message',

  category: 'General',

  usage: '.del (reply to a message)',

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

    try {

      // ======================================================
      // GET GROUP METADATA
      // ======================================================

      let metadata = null;
      let participants = [];

      if (isGroup) {

        metadata =
          await sock.groupMetadata(jid);

        if (!metadata) {
          throw new Error(
            'Group metadata unavailable.'
          );
        }

        participants =
          metadata?.participants || [];
      }

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

      let botParticipant = null;

      if (isGroup) {

        botParticipant =
          participants.find(
            participant =>
              participantMatches(
                participant,
                botJid,
                botNumber
              )
          );
      }

      const isBotAdmin =
        !isGroup ||
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin';

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

      let senderParticipant = null;

      if (isGroup) {

        senderParticipant =
          participants.find(
            participant =>
              participantMatches(
                participant,
                senderJid,
                senderNumber
              )
          );

        // From-me fallback
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
      }

      // ======================================================
      // CHECK SENDER ADMIN
      // ======================================================

      const isAdmin =
        !isGroup ||
        msg?.key?.fromMe === true ||
        senderParticipant?.admin === 'admin' ||
        senderParticipant?.admin === 'superadmin';

      console.log(
        '[Del] 🔍 Permissions:',
        {
          jid,
          isGroup,
          botJid,
          botAdmin:
            botParticipant?.admin || null,
          isBotAdmin,
          senderJid,
          senderAdmin:
            senderParticipant?.admin || null,
          isAdmin
        }
      );

      // ======================================================
      // FIND REPLIED MESSAGE
      // ======================================================

      const contextInfo =
        msg?.message
          ?.extendedTextMessage
          ?.contextInfo;

      if (!contextInfo?.stanzaId) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to a message you want to delete.*\n\n' +
              '*Example:*\n' +
              'Reply to a message with `.del`'
          },
          {
            quoted: msg
          }
        );
      }

      // ======================================================
      // ORIGINAL MESSAGE INFORMATION
      // ======================================================

      const targetId =
        contextInfo.stanzaId;

      const targetParticipant =
        contextInfo.participant || '';

      const targetFromMe =
        contextInfo.fromMe === true;

      // ======================================================
      // LOG TARGET
      // ======================================================

      console.log(
        '[Del] 🎯 Target:',
        {
          targetId,
          targetParticipant,
          targetFromMe,
          remoteJid: jid
        }
      );

      // ======================================================
      // DETERMINE TARGET SENDER
      // ======================================================

      let targetSender =
        targetParticipant;

      // For a replied message sent by the bot
      if (
        !targetSender &&
        targetFromMe
      ) {
        targetSender =
          botJid;
      }

      // ======================================================
      // GROUP PERMISSION CHECK
      // ======================================================

      if (isGroup) {

        // -----------------------------------------------
        // BOT MUST BE ADMIN TO DELETE OTHER USERS' MSG
        // -----------------------------------------------

        if (
          !targetFromMe &&
          !isBotAdmin
        ) {

          return await sock.sendMessage(
            jid,
            {
              text:
                '❌ *I need to be a group admin to delete other members\' messages.*'
            },
            {
              quoted: msg
            }
          );
        }

        // -----------------------------------------------
        // COMMAND USER MUST BE ADMIN TO DELETE OTHERS
        // -----------------------------------------------

        if (
          !targetFromMe &&
          !isAdmin
        ) {

          return await sock.sendMessage(
            jid,
            {
              text:
                '❌ *Only group admins can delete other members\' messages.*'
            },
            {
              quoted: msg
            }
          );
        }
      }

      // ======================================================
      // BUILD CORRECT BAILEYS MESSAGE KEY
      // ======================================================

      const targetKey = {
        remoteJid: jid,
        id: targetId,
        fromMe: targetFromMe
      };

      // ======================================================
      // GROUP TARGET PARTICIPANT
      // ======================================================

      if (
        isGroup &&
        targetSender
      ) {

        targetKey.participant =
          targetSender;
      }

      // ======================================================
      // PRIVATE MESSAGE
      // ======================================================

      if (!isGroup) {

        // If target is our own message
        if (targetFromMe) {

          targetKey.fromMe = true;

        } else {

          targetKey.fromMe = false;
        }
      }

      // ======================================================
      // DELETE TARGET MESSAGE
      // ======================================================

      console.log(
        '[Del] 🗑️ Deleting:',
        targetKey
      );

      await sock.sendMessage(
        jid,
        {
          delete: targetKey
        }
      );

      // ======================================================
      // DELETE COMMAND MESSAGE
      // ======================================================

      try {

        if (msg?.key) {

          await sock.sendMessage(
            jid,
            {
              delete: msg.key
            }
          );
        }

      } catch (deleteCommandError) {

        console.log(
          '[Del] ⚠️ Could not delete command:',
          deleteCommandError?.message ||
          deleteCommandError
        );
      }

      console.log(
        '[Del] ✅ Message deleted successfully.'
      );

    } catch (error) {

      console.error(
        '[Del] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            '❌ *Failed to delete the message.*\n\n' +
            `⚠️ *Reason:* ${
              error?.message ||
              'WhatsApp rejected the deletion.'
            }`
        },
        {
          quoted: msg
        }
      );
    }
  }
};