// ============================================================
// MUFASER-X — ANTILINK COMMAND
// By ROMA-TECH
// ============================================================

module.exports = {

  name: 'antilink',

  aliases: [
    'antilink'
  ],

  desc: 'Group link protection',

  category: 'Group',

  usage:
    '.antilink on/off\n' +
    '.antilink warn on/off\n' +
    '.antilink delete on/off\n' +
    '.antilink kick on/off',

  async execute(
    sock,
    msg,
    jid,
    args,
    sender,
    account
  ) {

    try {

      // ------------------------------------------------------
      // GROUP ONLY
      // ------------------------------------------------------

      if (!jid.endsWith('@g.us')) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ This command can only be used in groups.'
          },
          {
            quoted: msg
          }
        );

      }

      // ------------------------------------------------------
      // GET GROUP METADATA
      // ------------------------------------------------------

      const metadata =
        await sock.groupMetadata(jid);

      const participants =
        metadata.participants || [];

      // ------------------------------------------------------
      // CHECK BOT ADMIN
      // ------------------------------------------------------

      const botJid =
        sock.user?.id
          ?.split(':')[0]
          ?.split('@')[0];

      const botParticipant =
        participants.find(p => {

          const id =
            p.id?.split(':')[0]
              ?.split('@')[0];

          const lid =
            p.lid?.split(':')[0]
              ?.split('@')[0];

          return (
            id === botJid ||
            lid === botJid
          );

        });

      const isBotAdmin =
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin';

      // ------------------------------------------------------
      // FIND COMMAND USER
      // ------------------------------------------------------

      const senderJid =
        msg.key?.participant ||
        sender ||
        '';

      const senderNumber =
        senderJid
          .split(':')[0]
          .split('@')[0];

      const senderParticipant =
        participants.find(p => {

          const id =
            p.id?.split(':')[0]
              ?.split('@')[0];

          const lid =
            p.lid?.split(':')[0]
              ?.split('@')[0];

          return (
            id === senderNumber ||
            lid === senderNumber
          );

        });

      // ------------------------------------------------------
      // ONLY GROUP ADMINS
      // ------------------------------------------------------

      const isSenderAdmin =
        senderParticipant?.admin === 'admin' ||
        senderParticipant?.admin === 'superadmin';

      if (!isSenderAdmin) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *Admin Only*\n\n' +
              'Only group admins can change Antilink settings.'
          },
          {
            quoted: msg
          }
        );

      }

      // ------------------------------------------------------
      // BOT MUST BE ADMIN
      // ------------------------------------------------------

      if (!isBotAdmin) {

        return sock.sendMessage(
          jid,
          {
            text:
              '❌ *ANTILINK*\n\n' +
              'I need to be a group admin to use Antilink.'
          },
          {
            quoted: msg
          }
        );

      }

      // ------------------------------------------------------
      // INITIALIZE SETTINGS
      // ------------------------------------------------------

      if (!account.antilink) {
        account.antilink = {};
      }

      if (!account.antilink[jid]) {

        account.antilink[jid] = {
          mode: 'off',
          warnings: {}
        };

      }

      const settings =
        account.antilink[jid];

      if (!settings.warnings) {
        settings.warnings = {};
      }

      // ------------------------------------------------------
      // ARGUMENTS
      // ------------------------------------------------------

      const type =
        String(args[0] || '')
          .toLowerCase();

      const action =
        String(args[1] || '')
          .toLowerCase();

      // ------------------------------------------------------
      // .ANTILINK ON
      // ------------------------------------------------------

      if (type === 'on') {

        settings.mode = 'warn';

        return sock.sendMessage(
          jid,
          {
            text:
              '🛡️ *ANTILINK ENABLED*\n\n' +
              '🚫 Links will be deleted.\n' +
              '⚠️ The sender will receive a warning.'
          },
          {
            quoted: msg
          }
        );

      }

      // ------------------------------------------------------
      // .ANTILINK OFF
      // ------------------------------------------------------

      if (type === 'off') {

        settings.mode = 'off';
        settings.warnings = {};

        return sock.sendMessage(
          jid,
          {
            text:
              '✅ *ANTILINK DISABLED*\n\n' +
              'Members can send links again.'
          },
          {
            quoted: msg
          }
        );

      }

      // ------------------------------------------------------
      // WARN
      // ------------------------------------------------------

      if (type === 'warn') {

        if (!['on', 'off'].includes(action)) {

          return sock.sendMessage(
            jid,
            {
              text:
                '❌ Use:\n' +
                '`.antilink warn on`\n' +
                '`.antilink warn off`'
            },
            {
              quoted: msg
            }
          );

        }

        if (action === 'on') {

          settings.mode = 'warn';

          return sock.sendMessage(
            jid,
            {
              text:
                '⚠️ *ANTILINK WARN ENABLED*\n\n' +
                'Links will be deleted and users will be warned.\n' +
                '5 warnings = removal from group.'
            },
            {
              quoted: msg
            }
          );

        }

        settings.mode = 'off';
        settings.warnings = {};

        return sock.sendMessage(
          jid,
          {
            text:
              '✅ *ANTILINK WARN DISABLED*'
          },
          {
            quoted: msg
          }
        );

      }

      // ------------------------------------------------------
      // DELETE
      // ------------------------------------------------------

      if (type === 'delete') {

        if (!['on', 'off'].includes(action)) {

          return sock.sendMessage(
            jid,
            {
              text:
                '❌ Use:\n' +
                '`.antilink delete on`\n' +
                '`.antilink delete off`'
            },
            {
              quoted: msg
            }
          );

        }

        if (action === 'on') {

          settings.mode = 'delete';

          return sock.sendMessage(
            jid,
            {
              text:
                '🗑️ *ANTILINK DELETE ENABLED*\n\n' +
                'Links will be deleted automatically.\n' +
                'No warning will be sent.'
            },
            {
              quoted: msg
            }
          );

        }

        settings.mode = 'off';

        return sock.sendMessage(
          jid,
          {
            text:
              '✅ *ANTILINK DELETE DISABLED*'
          },
          {
            quoted: msg
          }
        );

      }

      // ------------------------------------------------------
      // KICK
      // ------------------------------------------------------

      if (type === 'kick') {

        if (!['on', 'off'].includes(action)) {

          return sock.sendMessage(
            jid,
            {
              text:
                '❌ Use:\n' +
                '`.antilink kick on`\n' +
                '`.antilink kick off`'
            },
            {
              quoted: msg
            }
          );

        }

        if (action === 'on') {

          settings.mode = 'kick';

          return sock.sendMessage(
            jid,
            {
              text:
                '🔨 *ANTILINK KICK ENABLED*\n\n' +
                'Anyone who sends a link will be removed immediately.' 
            },
            {
              quoted: msg
            }
          );

        }

        settings.mode = 'off';

        return sock.sendMessage(
          jid,
          {
            text:
              '✅ *ANTILINK KICK DISABLED*'
          },
          {
            quoted: msg
          }
        );

      }

      // ------------------------------------------------------
      // HELP
      // ------------------------------------------------------

      return sock.sendMessage(
        jid,
        {
          text:
            '🛡️ *MUFASER-X ANTILINK*\n\n' +

            '`.antilink on`\n' +
            '→ Delete + warn\n\n' +

            '`.antilink off`\n' +
            '→ Disable protection\n\n' +

            '`.antilink warn on`\n' +
            '→ Warn users\n' +
            '→ 5 warnings = kick\n\n' +

            '`.antilink delete on`\n' +
            '→ Delete links only\n\n' +

            '`.antilink kick on`\n' +
            '→ Delete + immediately kick\n\n' +

            '👑 Admins are always allowed.'
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        '[AntiLink Command Error]',
        error
      );

      return sock.sendMessage(
        jid,
        {
          text:
            `❌ Antilink error: ${error.message}`
        },
        {
          quoted: msg
        }
      );

    }
  }
};