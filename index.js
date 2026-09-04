// ============================================================
// MUFASER-X – ALL IN ONE index.js
// Express Server + Connection Manager + Session Helper
// WhatsApp Multi-Device Bot by ROMA-TECH
// ============================================================
require('dotenv').config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
  getDevice,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const express = require('express');
const zlib = require('zlib');

// ── CONFIG ───────────────────────────────────────────────────
const config = require('./config.js');
// ============================================================
// MUFASER-X — ANTI MESSAGE CACHE
// ==========================================================
const { saveAntiDeleteMessage, handleAntiDelete, handleAntiEdit, handleAntiCall } = require('./modules/anti');

//MUFASER-X — AUTO MESSAGE CACHE
const {handleAutoViewStatus, handleAutoLikeStatus, handleAutoReact, handleAutoReactChannel } = require('./modules/auto');
// ── SESSION STORAGE ─────────────────────────────────────────
// Each Session ID contains the complete Baileys auth folder, not only creds.json.
// This is required for reliable restoration with useMultiFileAuthState.

// ── LOAD COMMANDS ────────────────────────────────────────────

const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');

if (fs.existsSync(commandsDir)) {

  fs.readdirSync(commandsDir)
    .filter(file => file.endsWith('.js'))
    .forEach(file => {

      try {

        const cmd =
          require(path.join(commandsDir, file));

        if (!cmd || !cmd.name) {
          console.log(
            `[Bot] ⚠️ Skipped invalid command: ${file}`
          );
          return;
        }

        // ====================================================
        // REGISTER MAIN COMMAND
        // ====================================================

        const commandName =
          String(cmd.name)
            .toLowerCase()
            .trim();

        commands.set(
          commandName,
          cmd
        );

        // ====================================================
        // REGISTER ALIASES
        // ====================================================

        const aliases =
          Array.isArray(cmd.aliases)
            ? cmd.aliases
            : Array.isArray(cmd.alias)
              ? cmd.alias
              : [];

        for (const alias of aliases) {

          if (!alias) continue;

          const aliasName =
            String(alias)
              .toLowerCase()
              .trim();

          if (!aliasName) continue;

          commands.set(
            aliasName,
            cmd
          );
        }

        console.log(
          `[Bot] ✅ Loaded: ${commandName}` +
          (
            aliases.length
              ? ` | Aliases: ${aliases.join(', ')}`
              : ''
          )
        );

      } catch (error) {

        console.error(
          `[Bot] ❌ Failed to load ${file}:`,
          error
        );

      }

    });

  console.log(
    `[Bot] 📦 Registered ${commands.size} command name(s): ` +
    `${[...commands.keys()].join(', ')}`
  );

} else {

  console.log(
    '[Bot] ⚠️ Commands directory not found.'
  );
}
// ── MULTI-ACCOUNT STATE ─────────────────────────────────────
//
// Each WhatsApp number gets its own:
// - socket
// - pairing code
// - QR code
// - connection status
// - session directory
// - session-sent flag
//
// Example:
// 2567XXXXXXXX → its own account/session
// 2567YYYYYYYY → completely separate account/session

const accounts = new Map();

const logger = pino({ level: 'silent' });

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}
// ============================================================
// MUFASER-X — DEVICE DETECTION
// ============================================================

function normalizeJid(jid) {
  if (!jid) return '';

  return String(jid)
    .split(':')[0]
    .trim();
}

function normalizeNumber(value) {
  if (!value) return '';

  return String(value)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');
}

// ============================================================
// DETECT DEVICE INFORMATION
// ============================================================

function detectDeviceFromMessage(message) {

  let exactModel = null;
  let platform = 'Unknown';

  // ----------------------------------------------------------
  // NO MESSAGE
  // ----------------------------------------------------------

  if (!message) {
    return {
      model: 'Unknown Device',
      platform: 'Unknown'
    };
  }

  // ----------------------------------------------------------
  // TRY EXACT DEVICE MODEL
  //
  // This works if your Baileys build/patch exposes the
  // physical device model.
  // ----------------------------------------------------------

  try {

    const directDevice =
      message?.message?.deviceSentMessage?.device ||
      message?.message
        ?.extendedTextMessage
        ?.contextInfo
        ?.deviceSentMessage
        ?.device;

    if (directDevice) {

      if (typeof directDevice === 'string') {

        exactModel = directDevice;

      } else if (
        typeof directDevice === 'object'
      ) {

        exactModel =
          directDevice.model ||
          directDevice.deviceModel ||
          directDevice.name ||
          directDevice.device ||
          null;
      }
    }

  } catch (error) {

    console.log(
      '[Device] ⚠️ Exact model check failed:',
      error.message
    );
  }

  // ----------------------------------------------------------
  // TRY OTHER POSSIBLE DEVICE MODEL FIELDS
  // ----------------------------------------------------------

  if (!exactModel) {

    try {

      exactModel =
        message?.deviceModel ||
        message?.device?.model ||
        message?.device?.deviceModel ||
        message?.message?.deviceModel ||
        message?.message?.device?.model ||
        null;

    } catch (error) {

      console.log(
        '[Device] ⚠️ Device field check failed:',
        error.message
      );
    }
  }

  // ----------------------------------------------------------
  // GET WHATSAPP DEVICE TYPE
  // ----------------------------------------------------------

  try {

    if (
      typeof getDevice === 'function' &&
      message?.key
    ) {

      const device =
        getDevice(message.key);

      switch (device) {

        case 'android':
          platform = '📱 Android';
          break;

        case 'ios':
          platform = '🍎 iOS';
          break;

        case 'web':
          platform = '💻 WhatsApp Web';
          break;

        case 'desktop':
          platform = '🖥️ Desktop';
          break;

        case 'md':
          platform = '📲 Multi-Device';
          break;

        default:

          if (device) {
            platform =
              `📲 ${String(device)}`;
          }

          break;
      }
    }

  } catch (error) {

    console.log(
      '[Device] ⚠️ Device type detection failed:',
      error.message
    );
  }

  // ----------------------------------------------------------
  // DETECT PLATFORM FROM EXACT MODEL
  // ----------------------------------------------------------

  if (exactModel) {

    const modelText =
      String(exactModel)
        .toLowerCase();

    if (
      modelText.includes('iphone') ||
      modelText.includes('ipad') ||
      modelText.includes('ios')
    ) {

      platform = '🍎 iOS';

    } else if (
      modelText.includes('android') ||
      modelText.includes('samsung') ||
      modelText.includes('infinix') ||
      modelText.includes('tecno') ||
      modelText.includes('xiaomi') ||
      modelText.includes('redmi') ||
      modelText.includes('oppo') ||
      modelText.includes('vivo') ||
      modelText.includes('pixel') ||
      modelText.includes('oneplus') ||
      modelText.includes('realme') ||
      modelText.includes('huawei') ||
      modelText.includes('honor')
    ) {

      platform = '📱 Android';
    }
  }

  // ----------------------------------------------------------
  // CLEAN EXACT MODEL
  // ----------------------------------------------------------

  if (exactModel) {

    exactModel =
      String(exactModel)
        .trim();

    if (!exactModel.length) {
      exactModel = null;
    }
  }

  // ----------------------------------------------------------
  // RETURN RESULT
  // ----------------------------------------------------------

  return {

    model:
      exactModel ||
      'Model not exposed by WhatsApp',

    platform:
      platform || 'Unknown'
  };
}

// ============================================================
// MAKE FUNCTION AVAILABLE TO COMMANDS
// ============================================================

global.detectDeviceFromMessage =
  detectDeviceFromMessage;
  
function getAccount(phoneNumber) {
  const phone = normalizePhone(phoneNumber);

  if (!phone) return null;

  if (!accounts.has(phone)) {
    accounts.set(phone, {
      phone,

      // ── CONNECTION STATE ─────────────────────────────
      status: 'idle',
      isConnecting: false,

      // ── WHATSAPP SOCKET ─────────────────────────────
      sock: null,

      // ── PAIRING / QR ────────────────────────────────
      pairingCode: null,
      qrDataUrl: null,

      // ── BOT MODE ────────────────────────────────────
      // private = only owner can use commands
      // public  = everyone can use commands
      // dm      = commands only in private inbox
      // group   = commands only in groups
      mode: 'public',
     
 // ── AUTO TYPING 
autotyping: false,
// ── AUTO RECORDING 
autorecord: false,
// ── ANTIDELETE
antidelete: { dm: true, group: true, private: false }, 
antidm: false,
// ── AUTO VIEW STATUS
autoviewstatus: false,
// ── AUTO LIKE STATUS
autolikestatus: false,
// ── AUTO REACT GROUP 
autoreactgroup: true,
// ── AUTO REACT DM
autoreactdm: true,
// ── AUTO REACT CHANNEL
autoreactchannel: false,
      // ── ACCOUNT OWNER ───────────────────────────────
      ownerNumber: phone,

      // ── SESSION DIRECTORY ──────────────────────────
      sessionDir: path.join(
        __dirname,
        'sessions',
        phone
      ),

      credsPath: path.join(
        __dirname,
        'sessions',
        phone,
        'creds.json'
      ),
      // ── SESSION ID FLAG ────────────────────────────
      sessionSentFlag: path.join(
        __dirname,
        'sessions',
        phone,
        '.session_sent'
      )
    });
  }

  return accounts.get(phone);
}

// ── MUFASER-X SESSION ID HELPERS ────────────────────────────
// The Session ID contains the complete Baileys auth folder.
// This allows the session to be restored on another deployment.

function collectSessionFiles(dir, baseDir = dir) {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSessionFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push({
        path: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
        data: fs.readFileSync(fullPath).toString('base64')
      });
    }
  }

  return files;
}

function createSessionId(account) {
  if (!account || !account.sessionDir) {
    throw new Error('Account session directory is missing.');
  }

  if (!fs.existsSync(account.sessionDir)) {
    throw new Error('Session directory does not exist.');
  }

  const files = collectSessionFiles(account.sessionDir);

  if (!files.length) {
    throw new Error('No WhatsApp authentication files found.');
  }

  const payload = {
    format: 'MUFASER-X-SESSION',
    version: 1,
    phone: account.phone,
    files
  };

  const json = JSON.stringify(payload);

  const compressed = zlib.gzipSync(
    Buffer.from(json, 'utf8')
  );

  return `MUFASER-X:~${compressed.toString('base64')}`;
}

function restoreSessionId(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is empty.');
  }

  let raw = String(sessionId).trim();

  // Accept:
  // MUFASER-X:~BASE64
  // or just BASE64
  raw = raw.replace(/^MUFASER-X:~/i, '');

  if (!raw) {
    throw new Error('Invalid Session ID.');
  }

  let decoded;

  try {
    decoded = Buffer.from(raw, 'base64');
  } catch {
    throw new Error('Invalid Session ID encoding.');
  }

  let payloadText;

  // New compressed format
  try {
    payloadText = zlib
      .gunzipSync(decoded)
      .toString('utf8');
  } catch {
    // Compatibility with uncompressed Session IDs
    payloadText = decoded.toString('utf8');
  }

  let payload;

  try {
    payload = JSON.parse(payloadText);
  } catch {
    throw new Error('Session ID contains invalid data.');
  }

  if (
    !payload ||
    payload.format !== 'MUFASER-X-SESSION' ||
    !Array.isArray(payload.files)
  ) {
    throw new Error('Invalid MUFASER-X Session ID format.');
  }

  const phone = normalizePhone(payload.phone);

  if (!phone) {
    throw new Error(
      'Session ID does not contain a valid WhatsApp number.'
    );
  }

  const account = getAccount(phone);

  if (!account) {
    throw new Error(
      'Failed to create account for restored session.'
    );
  }

  fs.mkdirSync(
    account.sessionDir,
    { recursive: true }
  );

  for (const file of payload.files) {
    if (
      !file ||
      typeof file.path !== 'string' ||
      typeof file.data !== 'string'
    ) {
      continue;
    }

    // Security: prevent files escaping the session directory.
    const target = path.resolve(
      account.sessionDir,
      file.path
    );

    const root =
      path.resolve(account.sessionDir) + path.sep;

    if (!target.startsWith(root)) {
      console.warn(
        `[Session:${phone}] ⚠️ Skipping unsafe file: ${file.path}`
      );
      continue;
    }

    fs.mkdirSync(
      path.dirname(target),
      { recursive: true }
    );

    fs.writeFileSync(
      target,
      Buffer.from(file.data, 'base64')
    );
  }

  console.log(
    `[Session:${phone}] ✅ Session restored successfully.`
  );

  return phone;
}

function clearAccountSession(account) {
  if (!account) return;

  try {
    if (fs.existsSync(account.sessionDir)) {
      fs.rmSync(
        account.sessionDir,
        {
          recursive: true,
          force: true
        }
      );
    }

    account.pairingCode = null;
    account.qrDataUrl = null;
    account.sock = null;
    account.status = 'session_not_found';
    account.isConnecting = false;

    console.log(
      `[Session:${account.phone}] 🗑️ Session cleared.`
    );

  } catch (error) {

    console.error(
      `[Session:${account.phone}] ❌ Failed to clear session:`,
      error.message
    );

  }
}

// ── MULTI-ACCOUNT CONNECTION MANAGER ────────────────────────
async function connect(phoneNumber) {

  const phone = normalizePhone(phoneNumber);

  if (!phone) {
    console.error('[Bot] ❌ Phone number is required.');
    return;
  }

  const account = getAccount(phone);

  if (!account) {
    console.error(`[Bot:${phone}] ❌ Failed to create account state.`);
    return;
  }

  // Prevent duplicate connection for this account
  if (account.isConnecting) {
    console.log(`[Bot:${phone}] ⚠️ Connection already in progress.`);
    return;
  }

  if (account.sock && account.status === 'connected') {
    console.log(`[Bot:${phone}] ✅ Account already connected.`);
    return;
  }

  account.isConnecting = true;

  try {
    // Create this account's session directory
    if (!fs.existsSync(account.sessionDir)) {
      fs.mkdirSync(account.sessionDir, { recursive: true });
    }

    // Load this account's credentials
    const { state, saveCreds } =
      await useMultiFileAuthState(account.sessionDir);

    // Get latest WhatsApp Web version
    let version;

    try {
      const { version: latestVersion } =
        await fetchLatestBaileysVersion();

      version = latestVersion;

      console.log(
        `[Bot:${phone}] WhatsApp version: ${version.join('.')}`
      );
    } catch (error) {
      console.log(
        `[Bot:${phone}] ⚠️ Using fallback WhatsApp version.`
      );

      version = [2, 3000, 1017546695];
    }

    console.log(
      `[Bot:${phone}] Registered: ${state.creds.registered}`
    );

    console.log(
      `[Bot:${phone}] 🔄 Starting WhatsApp connection...`
    );

    // Create WhatsApp socket
    const sock = makeWASocket({
  version,

  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      logger
    )
  },

  browser: [
    'Ubuntu',
    'Chrome',
    '120.0.0.0'
  ],

  printQRInTerminal: false,

  syncFullHistory: false,
  markOnlineOnConnect: true,

  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 30000,

  keepAliveIntervalMs: 25000,

  maxRetries: 5,

  fireInitQueries: false,
  emitOwnEvents: true,
  defaultCongestionControl: 1,

  logger
});

    account.sock = sock;

    account.status = state.creds.registered
      ? 'connecting'
      : 'generating_code';

    // ── SAVE BAILEYS CREDENTIALS ─────────────────────────────
sock.ev.on('creds.update', async () => {
  try {
    await saveCreds();

    console.log(
      `[Session:${phone}] 💾 Credentials saved.`
    );
  } catch (error) {
    console.error(
      `[Session:${phone}] ❌ Failed to save credentials:`,
      error.message
    );
  }
});

// ── CONNECTION UPDATE ─────────────────────────────────────
sock.ev.on('connection.update', async (update) => {
  const {
    connection,
    lastDisconnect,
    qr
  } = update;

  const statusCode =
    lastDisconnect?.error?.output?.statusCode;

  console.log(
    `[Bot:${phone}] connection.update →`,
    JSON.stringify({
      connection,
      hasQR: !!qr,
      statusCode
    })
  );

  // ── QR CODE ─────────────────────────────────────────────
  if (qr) {
    try {
      account.qrDataUrl =
        await QRCode.toDataURL(qr, {
          width: 300
        });

      account.pairingCode = null;
      account.status = 'qr_ready';

      console.log(
        `[Bot:${phone}] 📷 QR code ready.`
      );

    } catch (error) {
      console.error(
        `[Bot:${phone}] ❌ QR generation failed:`,
        error.message
      );
    }
  }

  // ── CONNECTING ──────────────────────────────────────────
  if (connection === 'connecting') {
    console.log(
      `[Bot:${phone}] 🔄 Connecting to WhatsApp...`
    );

    if (
      account.status !== 'waiting_approval' &&
      account.status !== 'pairing_code_ready' &&
      account.status !== 'qr_ready'
    ) {
      account.status = 'connecting';
    }
  }

  // ── CONNECTED ──────────────────────────────────────────
  if (connection === 'open') {

    console.log('');
    console.log(
      `[Bot:${phone}] ═════════════════════════════`
    );
    console.log(
      `[Bot:${phone}] ✅ WHATSAPP CONNECTED!`
    );
    console.log(
      `[Bot:${phone}] ═════════════════════════════`
    );
    console.log('');

    account.status = 'connected';
    account.isConnecting = false;

    account.pairingCode = null;
    account.qrDataUrl = null;

    // Allow the final authentication files
    // to finish saving before creating Session ID.
    await new Promise(resolve =>
      setTimeout(resolve, 3000)
    );

    // Generate and send this account's Session ID.
    await handlePostConnect(
      sock,
      account
    );
  }

  // ── DISCONNECTED ───────────────────────────────────────
  if (connection === 'close') {

    console.log(
      `[Bot:${phone}] ❌ WhatsApp connection closed.`
    );

    console.log(
      `[Bot:${phone}] Disconnect status: ${statusCode}`
    );

    account.sock = null;
    account.isConnecting = false;

    const loggedOut =
      statusCode === DisconnectReason.loggedOut;

    const badSession =
      statusCode === DisconnectReason.badSession;

    // ── LOGGED OUT ────────────────────────────────────────
    if (loggedOut) {

      console.log(
        `[Session:${phone}] 🚪 WhatsApp logged out.`
      );

      clearAccountSession(account);
      return;
    }

    // ── BAD SESSION ───────────────────────────────────────
    if (badSession) {

      console.log(
        `[Session:${phone}] ⚠️ Bad session.`
      );

      clearAccountSession(account);
      return;
    }

    // ── TEMPORARY DISCONNECT ──────────────────────────────
    account.status = 'disconnected';

    if (config.autoReconnect) {

      console.log(
        `[Bot:${phone}] 🔄 Reconnecting in 5 seconds...`
      );

      setTimeout(() => {

        const currentAccount =
          accounts.get(phone);

        if (!currentAccount) return;

        if (
          currentAccount.status === 'connected' ||
          currentAccount.isConnecting
        ) {
          return;
        }

        connect(phone).catch(error => {

          console.error(
            `[Bot:${phone}] ❌ Reconnect failed:`,
            error.message
          );

        });

      }, 5000);
    }
  }
});

// ── MESSAGE HANDLER ───────────────────────────────────  
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify' && type !== 'append') return;
  for (const msg of messages) {
    try {
      // 1. Save FIRST,
      saveAntiDeleteMessage(msg);

      // 2. Auto commands
      try {
        await handleAutoViewStatus(sock, msg, account);
        await handleAutoLikeStatus(sock, msg, account);
       await handleAutoReact(sock, msg, account);
       await handleAutoReactChannel(sock, msg, account);
      } catch (e) {
        console.log('[AutoView Error]', e.message);
      }

      // 3. Anti commands
      if (msg.message?.protocolMessage) {
        try {
          if (await handleAntiDelete(sock, msg, account)) continue;
          await handleAntiEdit(sock, msg, account);
        } catch (e) {
          console.log('[AntiDelete Error]', e.message);
        }
      }
      
      await handleMessage(sock, msg, account);

    } catch (e) { 
      console.error('[Upsert Error]', e.message); 
    }
  }
});
// ANTICALL
sock.ev.on('call', (calls) => {
  handleAntiCall(sock, calls, account);
});
// ── REQUEST PAIRING CODE ──────────────────────────────────
// Only request a pairing code for a brand-new WhatsApp session.

if (!state.creds.registered) {
  account.status = 'generating_code';

  try {
    console.log(
      `[Bot:${phone}] 📱 Waiting for WhatsApp socket...`
    );

    // Give the socket time to initialize.
    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    );

    console.log(
      `[Bot:${phone}] 🔑 Requesting WhatsApp pairing code...`
    );

    const code =
      await sock.requestPairingCode(phone);

    if (!code) {
      throw new Error(
        'WhatsApp did not return a pairing code.'
      );
    }

    // Format the code as XXXX-XXXX.
    const formatted =
      String(code)
        .replace(/[^A-Za-z0-9]/g, '')
        .match(/.{1,4}/g)
        ?.join('-') || String(code);

    account.pairingCode = formatted;
    account.qrDataUrl = null;
    account.status = 'waiting_approval';

    console.log('');
    console.log(
      `[Bot:${phone}] ═════════════════════════════`
    );
    console.log(
      `[Bot:${phone}] 🔑 PAIRING CODE: ${formatted}`
    );
    console.log(
      `[Bot:${phone}] 📱 WhatsApp → Linked Devices → Link with phone number`
    );
    console.log(
      `[Bot:${phone}] ═════════════════════════════`
    );
    console.log('');

  } catch (error) {

    console.error(
      `[Bot:${phone}] ❌ Failed to request pairing code:`,
      error.message
    );

    account.status = 'failed';
    account.pairingCode = null;
    account.isConnecting = false;

    try {
      if (sock && typeof sock.end === 'function') {
        sock.end(undefined);
      }
    } catch (_) {}

    account.sock = null;
  }
}
  } catch (error) {
    console.error(
      `[Bot:${phone}] ❌ Fatal connection error:`,
      error.message
    );

    account.status = 'failed';
    account.sock = null;
    account.isConnecting = false;
  }
}
// ── SEND SESSION ID AFTER WHATSAPP CONNECTS ────────────────
async function handlePostConnect(sock, account) {
  try {
    if (!sock || !account) {
      console.error(
        '[Session] ❌ Socket or account is missing.'
      );
      return;
    }

    // Don't send the same Session ID again after reconnecting.
    if (fs.existsSync(account.sessionSentFlag)) {
      console.log(
        `[Session:${account.phone}] ℹ️ Session ID already delivered.`
      );
      return;
    }

    console.log(
      `[Session:${account.phone}] ⏳ Waiting for credentials to finish saving...`
    );

    await new Promise(resolve =>
      setTimeout(resolve, 3000)
    );

    // Generate Session ID from this account's complete
    // Baileys authentication folder.
    const sessionId =
      createSessionId(account);

    console.log('');
    console.log(
      `[Session:${account.phone}] ═════════════════════════════`
    );
    console.log(
      `[Session:${account.phone}] 🔑 SESSION ID GENERATED`
    );
    console.log(sessionId);
    console.log(
      `[Session:${account.phone}] ═════════════════════════════`
    );
    console.log('');

    // Get the WhatsApp account that just connected.
    const selfJid =
      sock.user?.id;

    if (!selfJid) {
      console.error(
        `[Session:${account.phone}] ❌ WhatsApp JID not available.`
      );
      return;
    }

    const msg1 = `${sessionId}`;
    

await sock.sendMessage(selfJid, { text: msg1 });

// small delay so WhatsApp sends 2 separate bubbles
await new Promise(resolve => setTimeout(resolve, 1200));

// 2. SECOND MESSAGE: Info + Support
const msg2 =
`╭━━〔 MUFASER-X SESSION 〕━━╮

✅ *WhatsApp Connected Successfully!*

🔐 *Your Session ID is ready.*

📦 *Copy the Session ID below:*

▬▬ι══════════════════ι▬▬
📱 *Number:* ${account.phone}
🤖 *Bot:* MUFASER-X
👨‍💻 *Developer:* ROMA-TECH 
✅ *Status:* Connected
▬▬ι══════════════════ι▬▬
⚠️ *Keep this Session ID private.*
deploy the bot on any pannle you want.
▬▬ι══════════════════ι▬▬`;

    // Send to the account's own WhatsApp chat.
    await sock.sendMessage(
      selfJid,
      {
        text: msg2
      }
    );

    // Mark this account's Session ID as delivered.
    fs.mkdirSync(
      account.sessionDir,
      {
        recursive: true
      }
    );

    fs.writeFileSync(
      account.sessionSentFlag,
      new Date().toISOString(),
      'utf8'
    );

    console.log(
      `[Session:${account.phone}] ✅ Session ID sent to Message Yourself.`
    );

    console.log(
      `[Session:${account.phone}] 🏁 Session delivery completed.`
    );

  } catch (error) {

    console.error(
      `[Session:${account?.phone || 'unknown'}] ❌ Failed to send Session ID:`,
      error.message
    );
  }
}

async function handleMessage(sock, msg, account) {
  if (!msg?.message) return;
  if (!msg?.key?.remoteJid) return;

  const jid = msg.key.remoteJid;

  // save for antidelete + antiedit
  saveAntiDeleteMessage(msg);
  await handleAntiEdit(sock, msg, account);
  await handleAntiDelete(sock, msg, account);

  // Ignore broadcasts/status
  if (typeof isJidBroadcast === 'function' && isJidBroadcast(jid)) return;
  if (jid === 'status@broadcast') return;
  
  // ============================================================
  // CHAT TYPE
  // ============================================================

  const isGroup = jid.endsWith('@g.us');

  // ============================================================
  // SENDER
  // ============================================================

  const senderJid =
    msg.key.participant ||
    msg.key.remoteJid;

  const senderNumber =
    String(senderJid)
      .split('@')[0]
      .split(':')[0]
      .replace(/\D/g, '');

  const ownerNumber =
    String(
      account?.ownerNumber ||
      account?.phone ||
      ''
    )
      .split('@')[0]
      .split(':')[0]
      .replace(/\D/g, '');

  const mode = account?.mode || 'public';

  // ============================================================
  // BOT MODE CHECK
  // ============================================================

  if (
    mode === 'private' &&
    !msg.key.fromMe &&
    senderNumber !== ownerNumber
  ) {
    return;
  }

  if (mode === 'dm' && isGroup) {
    return;
  }

  if (mode === 'group' && !isGroup) {
    return;
  }
// ANTI-DM SILENT BLOCK
if (!isGroup && jid !== 'status@broadcast' && !msg.key.fromMe && senderNumber !== ownerNumber && account?.antidm === true) {
  if (!account.antidmAllowed) account.antidmAllowed = [];
  // if you already chatted with him, allow
  if (!account.antidmAllowed.includes(jid)) {
    try { 
      await sock.updateBlockStatus(jid, 'block'); 
      console.log(`[ANTIDM] Blocked new: ${jid}`);
    } catch {}
    return;
  }
}
// AUTO-WHITELIST WHEN YOU SEND MESSAGE
if (msg.key.fromMe && !isGroup && jid !== 'status@broadcast') {
  if (!account.antidmAllowed) account.antidmAllowed = [];
  if (!account.antidmAllowed.includes(jid)) {
    account.antidmAllowed.push(jid);
  }
}
  // ============================================================
  // PRESENCE
  // ============================================================

  let presenceType = null;
  let presenceStarted = false;

  try {

    // ==========================================================
    // DETERMINE ACTIVE PRESENCE
    // ==========================================================

    if (account?.autotyping === true) {
      presenceType = 'composing';
    } else if (account?.autorecord === true) {
      presenceType = 'recording';
    }

    console.log(
      `[Presence:${account?.phone || 'unknown'}] ` +
      `typing=${account?.autotyping} ` +
      `recording=${account?.autorecord} ` +
      `selected=${presenceType || 'none'}`
    );

    // ==========================================================
    // START TYPING / RECORDING
    // ==========================================================

    if (presenceType) {
      try {
        await sock.sendPresenceUpdate(
          presenceType,
          jid
        );

        presenceStarted = true;

        console.log(
          `[Presence:${account?.phone || 'unknown'}] ` +
          `▶️ ${presenceType} → ${jid}`
        );

        await new Promise(resolve =>
          setTimeout(resolve, 500)
        );

      } catch (error) {
        console.error(
          `[Presence:${account?.phone || 'unknown'}] ` +
          `❌ Failed to start ${presenceType}:`,
          error?.message || error
        );
      }
    }

    // ==========================================================
    // GET MESSAGE TEXT
    // ==========================================================

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.documentMessage?.caption ||
      '';

    let commandText =
      String(body || '').trim();

    // ==========================================================
    // VV2 EMOJI TRIGGER
    //
    // Reply to View Once/media with ONLY an emoji:
    //
    // 😥
    // 🔥
    // 😆
    // 😂
    // ❤️
    // 👍
    //
    // This automatically executes .vv2
    // ==========================================================

    const isEmojiOnly = (text) => {

      if (!text) return false;

      const value =
        String(text)
          .trim()
          .replace(/\uFE0F/g, '')
          .replace(/\u200D/g, '');

      if (!value) return false;

      // Must contain at least one emoji/pictographic character
      if (
        !/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(
          value
        )
      ) {
        return false;
      }

      // Remove all emoji-related characters
      const remaining =
        value
          .replace(
            /[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji}\p{Mark}\p{Variation_Selector}\p{Regional_Indicator}\u200D]/gu,
            ''
          )
          .trim();

      return remaining === '';
    };

    // ==========================================================
    // CHECK WHETHER REPLIED MESSAGE IS MEDIA
    // ==========================================================

    const isRepliedMedia = (contextInfo) => {

      if (!contextInfo?.quotedMessage) {
        return false;
      }

      let quoted =
        contextInfo.quotedMessage;

      let changed = true;

      while (changed && quoted) {

        changed = false;

        // Ephemeral
        if (
          quoted.ephemeralMessage?.message
        ) {
          quoted =
            quoted.ephemeralMessage.message;

          changed = true;
          continue;
        }

        // View Once V2
        if (
          quoted.viewOnceMessageV2?.message
        ) {
          quoted =
            quoted.viewOnceMessageV2.message;

          changed = true;
          continue;
        }

        // View Once V2 Extension
        if (
          quoted.viewOnceMessageV2Extension?.message
        ) {
          quoted =
            quoted.viewOnceMessageV2Extension.message;

          changed = true;
          continue;
        }

        // Old View Once
        if (
          quoted.viewOnceMessage?.message
        ) {
          quoted =
            quoted.viewOnceMessage.message;

          changed = true;
          continue;
        }

        // Document with caption
        if (
          quoted.documentWithCaptionMessage?.message
        ) {
          quoted =
            quoted.documentWithCaptionMessage.message;

          changed = true;
          continue;
        }
      }

      const mediaTypes = [
        'imageMessage',
        'videoMessage',
        'audioMessage',
        'stickerMessage',
        'documentMessage'
      ];

      return mediaTypes.some(
        type => Boolean(quoted?.[type])
      );
    };

    // ==========================================================
    // AUTOMATIC VV2
    // ==========================================================

    if (
      commandText &&
      isEmojiOnly(commandText)
    ) {

      const contextInfo =
        msg?.message
          ?.extendedTextMessage
          ?.contextInfo;

      const repliedToMedia =
        isRepliedMedia(contextInfo);

      if (repliedToMedia) {

        console.log(
          `[VV2-EMOJI:${account?.phone || 'unknown'}] ` +
          `🎯 Emoji reply detected: ${commandText}`
        );

        // ------------------------------------------------------
        // FIND VV2 COMMAND
        // ------------------------------------------------------

        const vv2Command =
          commands.get('vv2');

        if (!vv2Command) {

          console.error(
            '[VV2-EMOJI] ❌ vv2 command is not loaded.'
          );

          return;
        }

        // ------------------------------------------------------
        // OWNER CHECK
        //
        // vv2 itself also checks fromMe.
        // This extra check prevents normal users from
        // triggering it with emojis.
        // ------------------------------------------------------

        if (!msg?.key?.fromMe) {

          console.log(
            `[VV2-EMOJI:${account?.phone || 'unknown'}] ` +
            `🚫 Non-owner emoji ignored.`
          );

          return;
        }

        const senderName =
          msg.pushName ||
          senderNumber ||
          'Unknown';

        const sender = {
          name: senderName,
          number: senderNumber,
          jid: senderJid
        };

        console.log(
          `[VV2-EMOJI:${account?.phone || 'unknown'}] ` +
          `🚀 Executing VV2 automatically`
        );

        // ------------------------------------------------------
        // EXECUTE VV2
        // ------------------------------------------------------

        await vv2Command.execute(
          sock,
          msg,
          jid,
          [],
          sender,
          account
        );

        return;
      }
    }

    // ==========================================================
    // NO TEXT / NO COMMAND
    // ==========================================================

    if (!commandText) {
      return;
    }

    // ==========================================================
    // PREFIX
    // ==========================================================

    if (config.prefix) {

      if (!commandText.startsWith(config.prefix)) {
        return;
      }

      commandText =
        commandText
          .slice(config.prefix.length)
          .trim();
    }

    if (!commandText) {
      return;
    }

    // ==========================================================
    // COMMAND + ARGUMENTS
    // ==========================================================

    const [
      rawCmd,
      ...args
    ] = commandText.split(/\s+/);

    const cmdName =
      String(rawCmd || '').toLowerCase();

    const command =
      commands.get(cmdName);

    // ==========================================================
    // UNKNOWN COMMAND
    // ==========================================================

    if (!command) {
      return;
    }

    // ==========================================================
    // SENDER INFORMATION
    // ==========================================================

    const senderName =
      msg.pushName ||
      senderNumber ||
      'Unknown';

    const sender = {
      name: senderName,
      number: senderNumber,
      jid: senderJid
    };

    console.log(
      `[Command:${account?.phone || 'unknown'}] ` +
      `${config.prefix}${cmdName} ` +
      `from ${sender.number} ` +
      `(${sender.name})`
    );

    // ==========================================================
    // KEEP PRESENCE ALIVE WHILE COMMAND IS RUNNING
    // ==========================================================

    let presenceInterval = null;

    if (presenceStarted && presenceType) {

      presenceInterval = setInterval(
        async () => {

          try {

            await sock.sendPresenceUpdate(
              presenceType,
              jid
            );

          } catch (error) {

            console.error(
              `[Presence] ❌ Refresh failed:`,
              error?.message || error
            );
          }

        },
        4000
      );
    }

    try {

      // ========================================================
      // EXECUTE COMMAND — ONLY ONCE
      // ========================================================

      await command.execute(
        sock,
        msg,
        jid,
        args,
        sender,
        account
      );

    } finally {

      // ========================================================
      // STOP PRESENCE REFRESH
      // ========================================================

      if (presenceInterval) {

        clearInterval(
          presenceInterval
        );

        presenceInterval = null;
      }
    }

  } catch (error) {

    console.error(
      `[MessageHandler:${account?.phone || 'unknown'}] ❌`,
      error
    );

  } finally {

    // ==========================================================
    // STOP TYPING / RECORDING
    // ==========================================================

    if (presenceStarted) {

      try {

        await sock.sendPresenceUpdate(
          'paused',
          jid
        );

        console.log(
          `[Presence:${account?.phone || 'unknown'}] ` +
          `⏹️ Presence stopped → ${jid}`
        );

      } catch (error) {

        console.error(
          `[Presence:${account?.phone || 'unknown'}] ` +
          `❌ Failed to stop presence:`,
          error?.message || error
        );
      }
    }
  }
}
// ── EXPRESS SERVER ───────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.send('MUFASER-X Bot Running Successfully'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── ACCOUNT STATUS ──────────────────────────────────────────
app.get('/api/status', (req, res) => {

  const phone = normalizePhone(req.query.phone);

  // No number entered yet
  if (!phone) {
    return res.json({
      status: 'idle',
      connected: false,
      pairingCode: null,
      qrDataUrl: null,
      phone: null,
      message: 'Enter your WhatsApp number to begin pairing.'
    });
  }

  const account = accounts.get(phone);

  // This number has not started pairing yet
  if (!account) {
    return res.json({
      status: 'session_not_found',
      connected: false,
      pairingCode: null,
      qrDataUrl: null,
      phone
    });
  }

  // Return ONLY this number's information
  return res.json({
    status: account.status,

    connected:
      account.status === 'connected',

    pairingCode:
      account.pairingCode || null,

    qrDataUrl:
      account.qrDataUrl || null,

    phone
  });
});

// ── REQUEST PAIRING CODE ────────────────────────────────────
app.post('/api/pair', async (req, res) => {

  console.log('[API] 📥 /api/pair request:', req.body);

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Phone number is required.'
    });
  }

  const clean = normalizePhone(phone);

  if (!clean || clean.length < 7) {
    return res.status(400).json({
      success: false,
      error: 'Enter a valid international WhatsApp number.'
    });
  }

  const account = getAccount(clean);

  if (!account) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create account.'
    });
  }

  // Already connected
  if (account.status === 'connected') {
    return res.status(400).json({
      success: false,
      error: 'This WhatsApp number is already connected.',
      phone: clean
    });
  }

  // Pairing code already generated
  if (
    account.pairingCode &&
    (
      account.status === 'waiting_approval' ||
      account.status === 'pairing_code_ready'
    )
  ) {

    return res.json({
      success: true,
      phone: clean,
      pairingCode: account.pairingCode,
      status: 'waiting_approval',
      message:
        'Enter this code in WhatsApp → Linked Devices.'
    });
  }

  // Connection already being created
  if (account.isConnecting) {

    const existingCode = await waitFor(
      () => {
        const current =
          accounts.get(clean);

        return current?.pairingCode || null;
      },
      30_000,
      250
    );

    if (!existingCode) {

      return res.status(408).json({
        success: false,
        error:
          'Timed out waiting for pairing code. Please try again.',
        phone: clean,
        status:
          accounts.get(clean)?.status || 'failed'
      });
    }

    return res.json({
      success: true,
      phone: clean,
      pairingCode: existingCode,
      status: 'waiting_approval',
      message:
        'Enter this code in WhatsApp → Linked Devices.'
    });
  }

  // Reset temporary pairing information
  account.pairingCode = null;
  account.qrDataUrl = null;
  account.status = 'generating_code';

  console.log(
    `[API:${clean}] 📱 Starting WhatsApp pairing...`
  );

  // Start WhatsApp connection
  connect(clean).catch(error => {

    console.error(
      `[API:${clean}] ❌ Pairing connection error:`,
      error.message
    );

    const current =
      accounts.get(clean);

    if (current) {
      current.status = 'failed';
      current.isConnecting = false;
    }

  });

  // Wait for the pairing code
  const code = await waitFor(
    () => {

      const current =
        accounts.get(clean);

      return current?.pairingCode || null;

    },
    30_000,
    250
  );

  // No code generated
  if (!code) {

    const current =
      accounts.get(clean);

    return res.status(408).json({
      success: false,
      error:
        'Timed out generating pairing code. Please try again.',
      phone: clean,
      status:
        current?.status || 'failed'
    });
  }

  console.log(
    `[API:${clean}] ✅ Pairing code ready: ${code}`
  );

  return res.json({
    success: true,
    phone: clean,
    pairingCode: code,
    status: 'waiting_approval',
    message:
      'Open WhatsApp → Linked Devices → Link with phone number instead, then enter this code.'
  });

});

// ── START QR FOR ONE ACCOUNT ────────────────────────────────
app.post('/api/start-qr', async (req, res) => {

  console.log('[API] 📥 /api/start-qr request:', req.body);

  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required for QR pairing.' });
  }

  const clean = normalizePhone(phone);
  if (!clean || clean.length < 7) {
    return res.status(400).json({ success: false, error: 'Enter a valid international phone number.' });
  }

  const account = getAccount(clean);
  if (!account) {
    return res.status(500).json({ success: false, error: 'Failed to create account.' });
  }

  if (account.status === 'connected') {
    return res.status(400).json({ success: false, error: 'This WhatsApp number is already connected.', phone: clean });
  }

  // If a connection is already running, wait for its QR instead of creating a second socket.
  if (account.isConnecting && (account.status === 'connecting' || account.status === 'qr_ready')) {
    const existingQr = await waitFor(() => accounts.get(clean)?.qrDataUrl || null, 15000, 300);
    if (!existingQr) {
      return res.status(408).json({ success: false, error: 'Timed out waiting for QR code. Please try again.', phone: clean, status: account.status });
    }
    return res.json({ success: true, phone: clean, qrDataUrl: existingQr, status: 'qr_ready' });
  }

  account.pairingCode = null;
  account.qrDataUrl = null;
  account.status = 'connecting';

  connect(clean).catch(err => {
    console.error(`[API:${clean}] ❌ QR connection error:`, err.message);
    const current = accounts.get(clean);
    if (current) { current.status = 'failed'; current.isConnecting = false; }
  });

  const qr = await waitFor(() => accounts.get(clean)?.qrDataUrl || null, 15000, 300);
  if (!qr) {
    const current = accounts.get(clean);
    return res.status(408).json({ success: false, error: 'Timed out waiting for QR code. Please try again.', phone: clean, status: current?.status || 'failed' });
  }

  return res.json({ success: true, phone: clean, qrDataUrl: qr, status: 'qr_ready' });
});

// ── GET QR FOR ONE ACCOUNT ────────────────────────────────

app.get('/api/qr', (req, res) => {

  const phone =
    normalizePhone(req.query.phone);

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Phone number is required.'
    });
  }

  const account =
    accounts.get(phone);

  if (!account) {
    return res.status(404).json({
      success: false,
      error: 'Account not found.',
      phone
    });
  }

  if (!account.qrDataUrl) {
    return res.status(404).json({
      success: false,
      error: 'No QR code available for this number.',
      phone,
      status: account.status
    });
  }

  return res.json({
    success: true,
    phone,
    qrDataUrl: account.qrDataUrl,
    status: account.status
  });
});


// ── WAIT FOR ASYNC CONDITION ───────────────────────────────

function waitFor(
  condition,
  timeoutMs = 30_000,
  intervalMs = 300
) {

  return new Promise(resolve => {

    const start = Date.now();

    const interval = setInterval(() => {

      try {

        const value = condition();

        if (value) {
          clearInterval(interval);
          return resolve(value);
        }

        if (
          Date.now() - start >= timeoutMs
        ) {
          clearInterval(interval);
          return resolve(null);
        }

      } catch (err) {

        clearInterval(interval);
        return resolve(null);

      }

    }, intervalMs);

  });

}

// ── START MUFASER-X ─────────────────────────────────────────
async function start() {

  console.log(`
╔════════════════════════════════════╗
║        MUFASER-X BOT v${config.version}       ║
║          Developer: ROMA-TECH      ║
║      Multi-Account WhatsApp Bot    ║
╚════════════════════════════════════╝
`);

  // ── MAIN SESSIONS DIRECTORY ─────────────────────────────
  const sessionsDir = path.join(
    __dirname,
    'sessions'
  );

  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(
      sessionsDir,
      {
        recursive: true
      }
    );
  }

  // ── RESTORE SESSION_ID FROM ENVIRONMENT ──────────────────
  if (config.sessionId) {
    try {
      const restoredPhone = restoreSessionId(config.sessionId);
      if (restoredPhone) {
        const restoredAccount = getAccount(restoredPhone);
        restoredAccount.status = 'connecting';

        console.log(`[Bot:${restoredPhone}] 🔄 Connecting from SESSION_ID...`);

        connect(restoredPhone).catch(error => {
          console.error(
            `[Bot:${restoredPhone}] ❌ SESSION_ID connect failed:`,
            error.message
          );
        });
      }
    } catch (error) {
      console.error('[Session] ❌ Failed to restore SESSION_ID:', error.message);
    }
  }

  // ── FIND SAVED WHATSAPP ACCOUNTS ───────────────────────
  try {

    const folders = fs.readdirSync(
      sessionsDir,
      {
        withFileTypes: true
      }
    );

    const savedAccounts = folders
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .filter(name => /^\d{7,}$/.test(name));

    console.log(
      `[Bot] 📂 Found ${savedAccounts.length} saved account(s).`
    );

    // ── RECONNECT SAVED ACCOUNTS ──────────────────────────
    for (const phone of savedAccounts) {

      const account = getAccount(phone);

      if (!account) {
        continue;
      }

      console.log(
        `[Bot:${phone}] 🔄 Restoring saved session...`
      );

      account.status = 'connecting';

      connect(phone).catch(error => {

        console.error(
          `[Bot:${phone}] ❌ Auto-connect failed:`,
          error.message
        );

        const currentAccount =
          accounts.get(phone);

        if (currentAccount) {

          currentAccount.status = 'failed';

          currentAccount.isConnecting = false;

        }

      });

      // Small delay between accounts
      await new Promise(resolve =>
        setTimeout(resolve, 1000)
      );
    }

  } catch (error) {

    console.error(
      '[Bot] ❌ Failed to load saved accounts:',
      error.message
    );

  }

  // ── START EXPRESS SERVER ────────────────────────────────
  app.listen(
    config.port,
    () => {

      console.log(
        `[Server] 🌐 Running on port ${config.port}`
      );

      console.log(
        `[Server] 📲 Pairing panel: http://localhost:${config.port}/`
      );

      console.log(
        `[Server] 👥 Multi-account mode enabled.`
      );

    }
  );
}
process.on(
  'uncaughtException',
  err => console.error(
    '[Bot] Uncaught exception:',
    err.message
  )
);

process.on(
  'unhandledRejection',
  reason => console.error(
    '[Bot] Unhandled rejection:',
    reason
  )
);

start();