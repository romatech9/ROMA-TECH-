// ============================================================
// MUFASER-X — PIN / UNPIN MESSAGE (FIXED)
// ============================================================

module.exports = {
  name: 'pin',

  aliases: ['unpin', 'pinmsg'],

  desc: 'Pin or unpin a replied message in group',

  category: 'Group',

  usage: '.pin (reply) | .unpin (reply) | .pin 7 (reply)',

  async execute(sock, msg, jid, args, sender, account) {

    const isGroup =
      typeof jid === 'string' &&
      jid.endsWith('@g.us');

    if (!isGroup) {
      return await sock.sendMessage(
        jid,
        {
          text: '❌ *This command is for groups only.*'
        },
        { quoted: msg }
      );
    }

    try {

      // --------------------------------------------------------
      // GROUP METADATA
      // --------------------------------------------------------

      const metadata =
        await sock.groupMetadata(jid);

      const participants =
        metadata?.participants || [];

      const getNumber = (v) =>
        String(v || '')
          .split('@')[0]
          .split(':')[0]
          .replace(/\D/g, '');

      const cleanJid = (v) =>
        String(v || '')
          .trim()
          .toLowerCase();

      const participantMatches =
        (p, targetJid, targetNumber) => {

          if (!p) return false;

          if (
            cleanJid(p.id) ===
            cleanJid(targetJid)
          ) {
            return true;
          }

          if (
            targetNumber &&
            getNumber(p.id) === targetNumber
          ) {
            return true;
          }

          if (
            targetNumber &&
            getNumber(p.phoneNumber) === targetNumber
          ) {
            return true;
          }

          return false;
        };

      // --------------------------------------------------------
      // BOT ADMIN CHECK
      // --------------------------------------------------------

      const botJid =
        sock?.user?.id || '';

      const botNumber =
        getNumber(botJid);

      const botParticipant =
        participants.find(
          p =>
            participantMatches(
              p,
              botJid,
              botNumber
            )
        );

      const isBotAdmin =
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin';

      // --------------------------------------------------------
      // SENDER ADMIN CHECK
      // --------------------------------------------------------

      const senderJid =
        msg?.key?.participant ||
        sender?.jid ||
        msg?.participant ||
        (msg?.key?.fromMe ? botJid : '');

      const senderNumber =
        getNumber(
          sender?.number ||
          senderJid
        );

      let senderParticipant =
        participants.find(
          p =>
            participantMatches(
              p,
              senderJid,
              senderNumber
            )
        );

      if (
        !senderParticipant &&
        msg?.key?.fromMe === true
      ) {
        senderParticipant =
          botParticipant;
      }

      const isAdmin =
        msg?.key?.fromMe === true ||
        senderParticipant?.admin === 'admin' ||
        senderParticipant?.admin === 'superadmin';

      if (!isBotAdmin) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *I need to be admin to pin/unpin.*'
          },
          { quoted: msg }
        );
      }

      if (!isAdmin) {
        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Only group admins can pin/unpin.*'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // FIND QUOTED MESSAGE
      // --------------------------------------------------------

      const getContextInfo = (message) => {

        if (!message) return null;

        if (message.extendedTextMessage?.contextInfo) {
          return message.extendedTextMessage.contextInfo;
        }

        if (message.ephemeralMessage?.message) {
          return getContextInfo(
            message.ephemeralMessage.message
          );
        }

        if (message.viewOnceMessage?.message) {
          return getContextInfo(
            message.viewOnceMessage.message
          );
        }

        if (message.viewOnceMessageV2?.message) {
          return getContextInfo(
            message.viewOnceMessageV2.message
          );
        }

        if (message.viewOnceMessageV2Extension?.message) {
          return getContextInfo(
            message.viewOnceMessageV2Extension.message
          );
        }

        return null;
      };

      const contextInfo =
        getContextInfo(msg?.message);

      const quotedMsg =
        contextInfo?.quotedMessage;

      const stanzaId =
        contextInfo?.stanzaId;

      if (!stanzaId || !quotedMsg) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Reply to a message to pin it.*\n\n' +
              '*Usage:*\n' +
              '`.pin` - Pin 7 days\n' +
              '`.pin 1` - Pin 1 day\n' +
              '`.unpin` - Unpin replied msg'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // FIND ORIGINAL MESSAGE SENDER
      // --------------------------------------------------------

      let quotedParticipant =
        contextInfo?.participant || '';

      const quotedFromMe =
        contextInfo?.fromMe === true;

      if (!quotedParticipant && quotedFromMe) {
        quotedParticipant = botJid;
      }

      if (!quotedParticipant) {

        return await sock.sendMessage(
          jid,
          {
            text:
              '❌ *Could not identify the replied message sender.*\n\n' +
              'Please try replying to the message again.'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // BUILD CORRECT MESSAGE KEY
      // --------------------------------------------------------

      const targetKey = {
        remoteJid: jid,
        fromMe: quotedFromMe,
        id: stanzaId,
        participant: quotedParticipant
      };

      console.log(
        '[Pin] Target message key:',
        targetKey
      );

      // --------------------------------------------------------
      // DETECT .PIN / .UNPIN
      // --------------------------------------------------------

      const commandText =
        (
          msg?.message?.conversation ||
          msg?.message?.extendedTextMessage?.text ||
          msg?.message?.ephemeralMessage?.message
            ?.extendedTextMessage?.text ||
          ''
        )
          .trim()
          .toLowerCase();

      const commandName =
        commandText
          .split(/\s+/)[0]
          .replace(/^[.]/, '');

      const isUnpin =
        commandName === 'unpin';

      // --------------------------------------------------------
      // UNPIN
      // --------------------------------------------------------

      if (isUnpin) {

        console.log(
          '[Pin] Unpinning:',
          targetKey
        );

        await sock.sendMessage(
          jid,
          {
            pin: {
              type: 2,
              time: 0,
              key: targetKey
            }
          }
        );

        return await sock.sendMessage(
          jid,
          {
            text:
              '✅ *Message unpinned.*'
          },
          { quoted: msg }
        );
      }

      // --------------------------------------------------------
      // PIN
      // --------------------------------------------------------

      let days = 7;

      const dayArg =
        args?.[0];

      if (
        dayArg &&
        !isNaN(dayArg)
      ) {

        days =
          parseInt(dayArg);

        if (days > 30) {
          days = 30;
        }

        if (days < 1) {
          days = 1;
        }
      }

      const pinTime =
        days *
        24 *
        60 *
        60;

      console.log(
        '[Pin] Pinning:',
        {
          ...targetKey,
          days,
          pinTime
        }
      );

      await sock.sendMessage(
        jid,
        {
          pin: {
            type: 1,
            time: pinTime,
            key: targetKey
          }
        }
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            `✅ *Message pinned for ${days} day(s).*\n` +
            `📌 By @${senderNumber}`,
          mentions:
            senderJid
              ? [senderJid]
              : []
        },
        { quoted: msg }
      );

    } catch (error) {

      console.error(
        '[Pin] ❌ Failed:',
        error
      );

      return await sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to pin/unpin.*\n\n` +
            `⚠️ *Reason:* ${
              error?.message ||
              'WhatsApp rejected the request.'
            }`
        },
        { quoted: msg }
      );
    }
  }
};