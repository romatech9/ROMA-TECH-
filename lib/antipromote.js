// ============================================================
// MUFASER-X — ANTIPROMOTE + ANTIDEMOTE
// ============================================================

function getPromoteSettings(account, jid) {
  if (!account.antipromote) {
    account.antipromote = {};
  }

  if (!account.antipromote[jid]) {
    account.antipromote[jid] = {
      mode: 'off'
    };
  }

  return account.antipromote[jid];
}


function getDemoteSettings(account, jid) {
  if (!account.antidemote) {
    account.antidemote = {};
  }

  if (!account.antidemote[jid]) {
    account.antidemote[jid] = {
      mode: 'off'
    };
  }

  return account.antidemote[jid];
}


// ============================================================
// WARNINGS
// ============================================================

const promoteWarns = [
  "But why you promote like you own the group comrade? 🤔 Next time you will be the one to go down 😡",

  "Aye! Promotion without permission? You think this is your father's company? 😂 Be careful next time...",

  "Oya @%author% you promote @%target% like you be president? 🤔 Make we watch you...",

  "Comrade @%author% why you dey share admin like gala? 🥴 Calm down ooo!",

  "Hmm promotion party without informing MUFASER-X? Not good comrade 😒"
];


const demoteWarns = [
  "But why you demote your friends comrade 🤔🤔 if you repeat it you will be next......😡",

  "Ahh @%author% demoted @%target%? Why you dey pull your guy down? 😤 You want make we demote you too?",

  "Eish @%author% why you remove @%target% power? You jealous? 🤨 Be careful...",

  "Comrade @%author% so you hate @%target% like that? 🥴 Next na you ooo!",

  "Omo @%author% you wicked o! You demote @%target%? Why you do am like that? 😡",

  "So @%author% you think demoting @%target% makes you big man? 🤔 We dey watch you..."
];


function getRandom(arr) {
  return arr[
    Math.floor(Math.random() * arr.length)
  ];
}


// ============================================================
// JID / NUMBER HELPERS
// ============================================================

function cleanJid(value) {
  if (!value) return '';

  return String(value)
    .trim()
    .toLowerCase();
}


function getNumber(value) {
  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}


// ============================================================
// ANTIPROMOTE — WARNING ONLY
// ============================================================

async function handleAntiPromote(sock, update, account) {
  try {

    // ========================================================
    // CHECK UPDATE
    // ========================================================

    if (!update) {
      return;
    }

    const jid = update.id;

    if (
      !jid ||
      !jid.endsWith('@g.us')
    ) {
      return;
    }

    // Only promotion events
    if (update.action !== 'promote') {
      return;
    }

    console.log(
      '[AntiPromote] EVENT RECEIVED:',
      {
        jid: update.id,
        action: update.action,
        author: update.author,
        participants: update.participants
      }
    );


    // ========================================================
    // CHECK SETTING
    // ========================================================

    const settings =
      getPromoteSettings(account, jid);

    if (
      !settings ||
      settings.mode === 'off'
    ) {
      console.log(
        `[AntiPromote] Disabled in ${jid}`
      );

      return;
    }


    // ========================================================
    // FIND AUTHOR
    // ========================================================

    const author =
      update.author ||
      update.actor ||
      update.participant ||
      '';

    if (!author) {

      console.log(
        '[AntiPromote] ❌ Author not found'
      );

      return;
    }


    // ========================================================
    // FIND TARGETS
    // ========================================================

    const targets =
      Array.isArray(update.participants)
        ? update.participants.filter(Boolean)
        : [];

    if (targets.length === 0) {

      console.log(
        '[AntiPromote] ❌ No promoted participant found'
      );

      return;
    }


    // ========================================================
    // WARNING ONLY
    // NO DEMOTE
    // NO PROMOTE
    // ========================================================

    for (const target of targets) {

      const authorNumber =
        getNumber(author);

      const targetNumber =
        getNumber(target);

      let warning =
        getRandom(promoteWarns);

      warning =
        warning
          .replace(
            /%author%/g,
            authorNumber
          )
          .replace(
            /%target%/g,
            targetNumber
          );


      const text =
        `⬆️ @${authorNumber} promoted @${targetNumber}\n\n` +
        warning;


      console.log(
        '[AntiPromote] ⚠️ Sending warning:',
        {
          author,
          target,
          authorNumber,
          targetNumber
        }
      );


      await sock.sendMessage(
        jid,
        {
          text,
          mentions: [
            author,
            target
          ]
        }
      );
    }

  } catch (error) {

    console.log(
      '[AntiPromote] ❌ ERROR:',
      error?.message || error
    );

  }
}


// ============================================================
// ANTIDEMOTE — WARNING ONLY
// ============================================================

async function handleAntiDemote(sock, update, account) {
  try {

    // ========================================================
    // CHECK UPDATE
    // ========================================================

    if (!update) {
      return;
    }

    const jid = update.id;

    if (
      !jid ||
      !jid.endsWith('@g.us')
    ) {
      return;
    }

    // Only demotion events
    if (update.action !== 'demote') {
      return;
    }

    console.log(
      '[AntiDemote] EVENT RECEIVED:',
      {
        jid: update.id,
        action: update.action,
        author: update.author,
        participants: update.participants
      }
    );


    // ========================================================
    // CHECK SETTING
    // ========================================================

    const settings =
      getDemoteSettings(account, jid);

    if (
      !settings ||
      settings.mode === 'off'
    ) {
      console.log(
        `[AntiDemote] Disabled in ${jid}`
      );

      return;
    }


    // ========================================================
    // FIND AUTHOR
    // ========================================================

    const author =
      update.author ||
      update.actor ||
      update.participant ||
      '';

    if (!author) {

      console.log(
        '[AntiDemote] ❌ Author not found'
      );

      return;
    }


    // ========================================================
    // FIND TARGETS
    // ========================================================

    const targets =
      Array.isArray(update.participants)
        ? update.participants.filter(Boolean)
        : [];

    if (targets.length === 0) {

      console.log(
        '[AntiDemote] ❌ No demoted participant found'
      );

      return;
    }


    // ========================================================
    // WARNING ONLY
    // NO PROMOTE
    // NO DEMOTE
    // ========================================================

    for (const target of targets) {

      const authorNumber =
        getNumber(author);

      const targetNumber =
        getNumber(target);

      let warning =
        getRandom(demoteWarns);

      warning =
        warning
          .replace(
            /%author%/g,
            authorNumber
          )
          .replace(
            /%target%/g,
            targetNumber
          );


      const text =
        `⬇️ @${authorNumber} demoted @${targetNumber}\n\n` +
        warning;


      console.log(
        '[AntiDemote] ⚠️ Sending warning:',
        {
          author,
          target,
          authorNumber,
          targetNumber
        }
      );


      await sock.sendMessage(
        jid,
        {
          text,
          mentions: [
            author,
            target
          ]
        }
      );
    }

  } catch (error) {

    console.log(
      '[AntiDemote] ❌ ERROR:',
      error?.message || error
    );

  }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  handleAntiPromote,
  handleAntiDemote,
  getPromoteSettings,
  getDemoteSettings
};