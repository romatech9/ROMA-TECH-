import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import readline from 'readline';
import 'dotenv/config';

const SESSION_BASE64 = process.env.SESSION_ID; // Paste Base64 here after first run
const SESSION_FOLDER = './session';
const PREFIX = '.';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((res) => rl.question(text, res));

async function startBot() {
  // 1. Decode Base64 if panel has it
  if (SESSION_BASE64 &&!fs.existsSync(SESSION_FOLDER)) {
    fs.mkdirSync(SESSION_FOLDER, { recursive: true });
    fs.writeFileSync(`${SESSION_FOLDER}/creds.json`, Buffer.from(SESSION_BASE64, 'base64'));
    console.log('✅ Session loaded from Base64');
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('MUFASER-X'),
    printQRInTerminal: false // We’ll use pairing code instead
  });

  sock.ev.on('creds.update', saveCreds);

  // 2. Ask for number on first run
  if (!sock.authState.creds.registered) {
    const phone = await question('👑 Enter your WhatsApp number with country code, ex: +256791480644: ');
    rl.close();
    const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
    console.log('🔑 Your Pairing Code:', code);
    console.log('Go to WhatsApp > Linked Devices > Link with phone number > Enter code');
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('👑 MUFASER-X is ONLINE');
      // 3. Print Base64 so you can copy it to panel
      const base64 = fs.readFileSync(`${SESSION_FOLDER}/creds.json`).toString('base64');
      console.log('\n====================================');
      console.log('COPY THIS TO PANEL SESSION_ID:');
      console.log(base64);
      console.log('====================================\n');
    }
    if (connection === 'close') {
      const code = lastDisconnect.error?.output?.statusCode;
      if (code!== DisconnectReason.loggedOut) startBot();
    }
  });

  // Commands
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if (!text.startsWith(PREFIX)) return;
    const [cmd] = text.slice(PREFIX.length).trim().split(/ +/);
    const command = cmd.toLowerCase();

    if (command === 'menu') {
      await sock.sendMessage(from, { text: `👑 *MUFASER-X*\n.menu\n.ping` });
    }
    if (command === 'ping') {
      const start = Date.now();
      await sock.sendMessage(from, { text: `🏓 Pong! ${Date.now() - start}ms` });
    }
  });
}
startBot();