// ============================================================
// MUFASER-X — TAG ALL
//
// Usage:
//
// .tagall
//
// Features:
// • Group only
// • Gets group profile picture
// • Tags all group members
// • Shows member names when available
// • Numbers every member
// ============================================================

module.exports = {

  name: 'tagall',

  desc: 'Tag all group members with group profile picture',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    try {

      // ========================================================
      // GROUP ONLY
      // ========================================================

      if (!jid.endsWith('@g.us')) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *This command can only be used inside a group.*'
          },
          {
            quoted: msg
          }
        );
      }


      // ========================================================
      // GET GROUP METADATA
      // ========================================================

      const groupMetadata =
        await sock.groupMetadata(jid);

      const participants =
        groupMetadata?.participants || [];

      if (!participants.length) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Could not find group members.*'
          },
          {
            quoted: msg
          }
        );
      }


      // ========================================================
      // GROUP NAME
      // ========================================================

      const groupName =
        groupMetadata?.subject ||
        'GROUP';


      // ========================================================
      // CREATE MEMBER LIST
      // ========================================================

      const mentions = [];

      const memberLines = [];

      participants.forEach(
        (participant, index) => {

          const participantJid =
            participant?.jid ||
            participant?.id;

          if (!participantJid) {
            return;
          }

          mentions.push(
            participantJid
          );


          // ----------------------------------------------------
          // GET DISPLAY NAME
          // ----------------------------------------------------

          let name =
            participant?.notify ||
            participant?.name ||
            participant?.verifiedName ||
            '';


          name =
            String(name)
              .replace(/\n/g, ' ')
              .trim();


          // ----------------------------------------------------
          // MENTION TEXT
          //
          // We use the JID's local part as the mention token.
          // WhatsApp resolves it using the mentions array.
          // ----------------------------------------------------

          const mentionId =
            String(participantJid)
              .split('@')[0]
              .split(':')[0];


          memberLines.push(
            `${index + 1}. @${mentionId} ${name}`
          );
        }
      );


      // ========================================================
      // REMOVE EMPTY ENTRIES
      // ========================================================

      const validMentions =
        mentions.filter(Boolean);

      const validLines =
        memberLines.filter(Boolean);


      if (!validMentions.length) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *No members could be tagged.*'
          },
          {
            quoted: msg
          }
        );
      }


      // ========================================================
      // MESSAGE TEXT
      // ========================================================

      const text =
      
`  
 ▬▬ι══════════════════ι▬
         *ALL MEMBERS ATTENTION ⚠️*
         📢 *GROUP ANNOUNCEMENT*
         By ${sender?.name || 'Unknown'}
▬▬ι══════════════════ι▬

${validLines.join('\n')}

▬▬ι══════════════════ι▬▬
          👥 *Total Members:* ${validMentions.length}
          🏠 *Group:* ${groupName}`;
      // ========================================================
      // GET GROUP PROFILE PICTURE
      // ========================================================

      let profilePictureUrl = null;

      try {

        profilePictureUrl =
          await sock.profilePictureUrl(
            jid,
            'image'
          );

      } catch (error) {

        console.log(
          `[TagAll] ℹ️ Group has no accessible profile picture.`
        );

        profilePictureUrl = null;
      }


      // ========================================================
      // SEND GROUP PROFILE + TAG ALL
      // ========================================================

      if (profilePictureUrl) {

        await sock.sendMessage(
          jid,
          {
            image: {
              url: profilePictureUrl
            },

            caption: text,

            mentions: validMentions
          },
          {
            quoted: msg
          }
        );

      } else {

        await sock.sendMessage(
          jid,
          {
            text: text,
            mentions: validMentions
          },
          {
            quoted: msg
          }
        );
      }


      // ========================================================
      // LOG
      // ========================================================

      console.log(
        `[TagAll:${account?.phone || 'unknown'}] ` +
        `✅ Tagged ${validMentions.length} members ` +
        `in ${groupName}`
      );


    } catch (error) {

      console.error(
        '[TagAll] ❌ Failed:',
        error
      );

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ *Failed to tag all members.*\n\n` +
            `Reason: ${error?.message || 'Unknown error'}`
        },
        {
          quoted: msg
        }
      );
    }
  }
};


