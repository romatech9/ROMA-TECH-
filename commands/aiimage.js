// ============================================================
// MUFASER-X — AI IMAGE SUITE
// Developer: ROMA-TECH 🇺🇬
// Powered by Pollinations
// ============================================================

const {
  checkRateLimit,
  generateImage
} = require('../lib/aiimage');


// ============================================================
// IMAGE COMMAND CONFIGURATION
// ============================================================

const styles = {

  // ──────────────────────────────────────────────────────────
  // BASIC
  // ──────────────────────────────────────────────────────────

  image: {
    prefix: '',
    width: 1024,
    height: 1024,
    title: 'AI IMAGE'
  },

  wallpaper: {
    prefix: 'phone wallpaper, vertical composition, 4k, highly detailed, no text, no watermark',
    width: 1080,
    height: 1920,
    title: 'HD WALLPAPER'
  },

  logo: {
    prefix: 'professional logo design, clean vector style, modern branding, sharp details, clean background',
    width: 1024,
    height: 1024,
    title: 'LOGO'
  },

  avatar: {
    prefix: 'profile picture, avatar, centered portrait, highly detailed, clean composition',
    width: 1024,
    height: 1024,
    title: 'AVATAR'
  },

  portrait: {
    prefix: 'professional portrait, detailed face, cinematic lighting, beautiful composition',
    width: 1024,
    height: 1536,
    title: 'PORTRAIT'
  },

  landscape: {
    prefix: 'beautiful landscape photography, cinematic scenery, natural lighting, highly detailed',
    width: 1536,
    height: 1024,
    title: 'LANDSCAPE'
  },


  // ──────────────────────────────────────────────────────────
  // ART STYLES
  // ──────────────────────────────────────────────────────────

  anime: {
    prefix: 'anime artwork, detailed anime illustration, beautiful lighting, high quality',
    width: 1024,
    height: 1024,
    title: 'ANIME'
  },

  realistic: {
    prefix: 'photorealistic photography, realistic lighting, natural details, ultra detailed',
    width: 1024,
    height: 1024,
    title: 'REALISTIC'
  },

  cartoon: {
    prefix: 'professional cartoon artwork, colorful cartoon illustration, clean details',
    width: 1024,
    height: 1024,
    title: 'CARTOON'
  },

  manga: {
    prefix: 'Japanese manga artwork, detailed line art, dramatic composition',
    width: 1024,
    height: 1536,
    title: 'MANGA'
  },

  pixel: {
    prefix: 'pixel art, detailed pixel artwork, retro game aesthetic',
    width: 1024,
    height: 1024,
    title: 'PIXEL ART'
  },

  sketch: {
    prefix: 'detailed pencil sketch, hand drawn artwork, artistic line work',
    width: 1024,
    height: 1024,
    title: 'SKETCH'
  },

  watercolor: {
    prefix: 'beautiful watercolor painting, artistic brush strokes, soft colors',
    width: 1024,
    height: 1024,
    title: 'WATERCOLOR'
  },

  oilpaint: {
    prefix: 'oil painting, rich brush strokes, classical fine art',
    width: 1024,
    height: 1024,
    title: 'OIL PAINT'
  },

  graffiti: {
    prefix: 'urban graffiti artwork, street art, colorful spray paint, artistic wall',
    width: 1024,
    height: 1024,
    title: 'GRAFFITI'
  },

  neon: {
    prefix: 'neon artwork, glowing lights, vibrant futuristic atmosphere',
    width: 1024,
    height: 1024,
    title: 'NEON ART'
  },

  fantasy: {
    prefix: 'epic fantasy artwork, magical atmosphere, cinematic lighting, highly detailed',
    width: 1024,
    height: 1024,
    title: 'FANTASY'
  },

  scifi: {
    prefix: 'science fiction artwork, futuristic technology, cinematic lighting',
    width: 1024,
    height: 1024,
    title: 'SCI-FI'
  },

  cyber: {
    prefix: 'cyberpunk futuristic artwork, neon city, cinematic lighting, highly detailed',
    width: 1024,
    height: 1024,
    title: 'CYBERPUNK'
  },

  '3d': {
    prefix: 'high quality 3D render, realistic materials, cinematic lighting',
    width: 1024,
    height: 1024,
    title: '3D ART'
  },

  comic: {
    prefix: 'professional comic book artwork, dramatic panels, bold illustration',
    width: 1024,
    height: 1536,
    title: 'COMIC'
  },

  superhero: {
    prefix: 'superhero artwork, powerful heroic pose, cinematic lighting, comic-inspired',
    width: 1024,
    height: 1536,
    title: 'SUPERHERO'
  },

  villain: {
    prefix: 'dark villain character artwork, dramatic cinematic lighting, powerful atmosphere',
    width: 1024,
    height: 1536,
    title: 'VILLAIN'
  },


  // ──────────────────────────────────────────────────────────
  // DESIGN
  // ──────────────────────────────────────────────────────────

  poster: {
    prefix: 'professional poster design, cinematic composition, dramatic lighting',
    width: 1024,
    height: 1536,
    title: 'POSTER'
  },

  banner: {
    prefix: 'professional social media banner, wide composition, modern graphic design',
    width: 1536,
    height: 768,
    title: 'BANNER'
  },

  cover: {
    prefix: 'professional cover artwork, cinematic composition, premium graphic design',
    width: 1536,
    height: 1024,
    title: 'COVER'
  },

  icon: {
    prefix: 'professional app icon design, modern, clean, centered, polished',
    width: 1024,
    height: 1024,
    title: 'ICON'
  },

  sticker: {
    prefix: 'sticker design, clean illustration, isolated subject, simple background',
    width: 1024,
    height: 1024,
    title: 'STICKER'
  },

  thumbnail: {
    prefix: 'viral YouTube thumbnail, bold composition, eye-catching, high contrast',
    width: 1280,
    height: 720,
    title: 'THUMBNAIL'
  },

  youtube: {
    prefix: 'professional YouTube artwork, creator branding, eye-catching design',
    width: 1280,
    height: 720,
    title: 'YOUTUBE'
  },

  instagram: {
    prefix: 'Instagram post design, beautiful social media composition',
    width: 1080,
    height: 1080,
    title: 'INSTAGRAM'
  },

  facebook: {
    prefix: 'Facebook social media graphic, professional modern design',
    width: 1200,
    height: 630,
    title: 'FACEBOOK'
  },

  tiktok: {
    prefix: 'TikTok vertical social media artwork, trendy visual design',
    width: 1080,
    height: 1920,
    title: 'TIKTOK'
  },

  bookcover: {
    prefix: 'professional book cover design, cinematic typography area, premium artwork',
    width: 1024,
    height: 1536,
    title: 'BOOK COVER'
  },

  album: {
    prefix: 'professional music album cover, artistic cinematic composition',
    width: 1024,
    height: 1024,
    title: 'ALBUM COVER'
  },


  // ──────────────────────────────────────────────────────────
  // PEOPLE
  // ──────────────────────────────────────────────────────────

  selfie: {
    prefix: 'realistic smartphone selfie, natural lighting, detailed face',
    width: 1024,
    height: 1024,
    title: 'SELFIE'
  },

  fashion: {
    prefix: 'high fashion photography, stylish outfit, professional studio lighting',
    width: 1024,
    height: 1536,
    title: 'FASHION'
  },

  model: {
    prefix: 'professional fashion model photography, studio lighting, editorial quality',
    width: 1024,
    height: 1536,
    title: 'MODEL'
  },

  wedding: {
    prefix: 'beautiful wedding photography, romantic atmosphere, elegant lighting',
    width: 1024,
    height: 1536,
    title: 'WEDDING'
  },

  royal: {
    prefix: 'royal portrait, luxurious clothing, majestic atmosphere, cinematic lighting',
    width: 1024,
    height: 1536,
    title: 'ROYAL'
  },

  african: {
    prefix: 'beautiful African-inspired scene, authentic cultural atmosphere, cinematic photography',
    width: 1024,
    height: 1024,
    title: 'AFRICAN ART'
  },

  uganda: {
    prefix: 'beautiful Uganda-inspired scenery and atmosphere, natural realistic photography',
    width: 1536,
    height: 1024,
    title: 'UGANDA'
  },


  // ──────────────────────────────────────────────────────────
  // GAMING
  // ──────────────────────────────────────────────────────────

  gaming: {
    prefix: 'gaming artwork, powerful game character, cinematic action scene',
    width: 1536,
    height: 1024,
    title: 'GAMING'
  },

  gameart: {
    prefix: 'AAA video game concept art, cinematic environment, highly detailed',
    width: 1536,
    height: 1024,
    title: 'GAME ART'
  },

  gamer: {
    prefix: 'professional gaming setup, RGB lights, modern gaming room',
    width: 1536,
    height: 1024,
    title: 'GAMER'
  },


  // ──────────────────────────────────────────────────────────
  // TECHNOLOGY
  // ──────────────────────────────────────────────────────────

  hacker: {
    prefix: 'fictional cybersecurity-themed artwork, futuristic computer setup, neon atmosphere',
    width: 1536,
    height: 1024,
    title: 'HACKER ART'
  },

  robot: {
    prefix: 'futuristic robot, advanced robotics, cinematic lighting, highly detailed',
    width: 1024,
    height: 1024,
    title: 'ROBOT'
  },

  ai: {
    prefix: 'artificial intelligence concept art, futuristic technology, glowing digital interface',
    width: 1536,
    height: 1024,
    title: 'AI ART'
  },

  technology: {
    prefix: 'modern technology concept, futuristic devices, premium cinematic design',
    width: 1536,
    height: 1024,
    title: 'TECHNOLOGY'
  },

  futuristic: {
    prefix: 'futuristic world, advanced technology, cinematic science fiction atmosphere',
    width: 1536,
    height: 1024,
    title: 'FUTURISTIC'
  },


  // ──────────────────────────────────────────────────────────
  // VEHICLES
  // ──────────────────────────────────────────────────────────

  car: {
    prefix: 'luxury car photography, cinematic automotive photography, dramatic lighting',
    width: 1536,
    height: 1024,
    title: 'CAR'
  },

  bike: {
    prefix: 'professional motorcycle photography, cinematic lighting, dramatic environment',
    width: 1536,
    height: 1024,
    title: 'BIKE'
  },

  airplane: {
    prefix: 'cinematic aircraft photography, detailed airplane, dramatic sky',
    width: 1536,
    height: 1024,
    title: 'AIRPLANE'
  },

  ship: {
    prefix: 'cinematic ship photography, dramatic ocean, highly detailed',
    width: 1536,
    height: 1024,
    title: 'SHIP'
  },


  // ──────────────────────────────────────────────────────────
  // FOOD
  // ──────────────────────────────────────────────────────────

  food: {
    prefix: 'professional food photography, delicious presentation, studio lighting',
    width: 1024,
    height: 1024,
    title: 'FOOD'
  },

  restaurant: {
    prefix: 'luxury restaurant interior and food photography, premium atmosphere',
    width: 1536,
    height: 1024,
    title: 'RESTAURANT'
  },

  cake: {
    prefix: 'beautiful professional cake photography, elegant decoration',
    width: 1024,
    height: 1024,
    title: 'CAKE'
  },

  drink: {
    prefix: 'professional beverage photography, refreshing drink, studio lighting',
    width: 1024,
    height: 1024,
    title: 'DRINK'
  },


  // ──────────────────────────────────────────────────────────
  // PLACES / NATURE
  // ──────────────────────────────────────────────────────────

  city: {
    prefix: 'beautiful modern cityscape, cinematic architecture, dramatic lighting',
    width: 1536,
    height: 1024,
    title: 'CITY'
  },

  nature: {
    prefix: 'beautiful natural scenery, realistic photography, peaceful atmosphere',
    width: 1536,
    height: 1024,
    title: 'NATURE'
  },

  beach: {
    prefix: 'beautiful tropical beach, cinematic sunset, realistic photography',
    width: 1536,
    height: 1024,
    title: 'BEACH'
  },

  mountain: {
    prefix: 'majestic mountain landscape, cinematic scenery, realistic photography',
    width: 1536,
    height: 1024,
    title: 'MOUNTAIN'
  },

  forest: {
    prefix: 'mysterious beautiful forest, cinematic natural lighting, highly detailed',
    width: 1536,
    height: 1024,
    title: 'FOREST'
  },

  space: {
    prefix: 'epic outer space scene, planets, stars, cinematic cosmic lighting',
    width: 1536,
    height: 1024,
    title: 'SPACE'
  },


  // ──────────────────────────────────────────────────────────
  // ARCHITECTURE
  // ──────────────────────────────────────────────────────────

  architecture: {
    prefix: 'professional architectural visualization, modern building, realistic lighting',
    width: 1536,
    height: 1024,
    title: 'ARCHITECTURE'
  },

  interior: {
    prefix: 'luxury interior design, professional architectural photography',
    width: 1536,
    height: 1024,
    title: 'INTERIOR'
  },

  bedroom: {
    prefix: 'beautiful modern luxury bedroom interior, realistic design',
    width: 1536,
    height: 1024,
    title: 'BEDROOM'
  },

  office: {
    prefix: 'modern professional office interior, premium workspace design',
    width: 1536,
    height: 1024,
    title: 'OFFICE'
  },

  house: {
    prefix: 'beautiful modern luxury house exterior, architectural photography',
    width: 1536,
    height: 1024,
    title: 'HOUSE'
  },


  // ──────────────────────────────────────────────────────────
  // CREATIVE
  // ──────────────────────────────────────────────────────────

  tattoo: {
    prefix: 'professional tattoo design, clean detailed linework, artistic composition',
    width: 1024,
    height: 1024,
    title: 'TATTOO'
  },

  meme: {
    prefix: 'funny meme artwork, expressive characters, humorous composition',
    width: 1024,
    height: 1024,
    title: 'MEME'
  },

  cosplay: {
    prefix: 'professional cosplay photography, detailed costume, cinematic lighting',
    width: 1024,
    height: 1536,
    title: 'COSPLAY'
  },

  horror: {
    prefix: 'atmospheric horror artwork, dark cinematic lighting, eerie environment',
    width: 1024,
    height: 1536,
    title: 'HORROR'
  },

  magic: {
    prefix: 'magical fantasy artwork, glowing magical energy, cinematic atmosphere',
    width: 1024,
    height: 1024,
    title: 'MAGIC'
  },

  medieval: {
    prefix: 'medieval fantasy artwork, castles, warriors, cinematic atmosphere',
    width: 1536,
    height: 1024,
    title: 'MEDIEVAL'
  }

};


// ============================================================
// ALIASES
// ============================================================

const aliases = Object.keys(styles).filter(
  command => command !== 'image'
);


// ============================================================
// EXECUTE
// ============================================================

async function execute(sock, msg, jid, args, sender, account) {

  try {

    // Detect the actual command used.
    const messageText =
      msg?.message?.conversation ||
      msg?.message?.extendedTextMessage?.text ||
      msg?.message?.imageMessage?.caption ||
      msg?.message?.videoMessage?.caption ||
      '';

    const commandUsed =
      messageText
        .trim()
        .split(/\s+/)[0]
        .replace(/^[.!#\/]/, '')
        .toLowerCase() || 'image';

    const config =
      styles[commandUsed] || styles.image;


    // ========================================================
    // RATE LIMIT
    // ========================================================

    const userId =
      sender?.jid ||
      msg?.key?.participant ||
      msg?.key?.remoteJid ||
      jid;

    const limit = checkRateLimit(userId);

    if (!limit.allowed) {

      return await sock.sendMessage(
        jid,
        {
          text:
            `⏰ *CHILL BRO 😂*\n\n` +
            `You can generate only *5 images per minute*.\n\n` +
            `Try again in *${limit.wait} seconds*.`
        },
        { quoted: msg }
      );

    }


    // ========================================================
    // PROMPT
    // ========================================================

    if (!args || args.length === 0) {

      return await sock.sendMessage(
        jid,
        {
          text:
            `🎨 *${config.title}*\n\n` +
            `Usage:\n` +
            `.${commandUsed} <prompt>\n\n` +
            `Example:\n` +
            `.${commandUsed} beautiful African sunset`
        },
        { quoted: msg }
      );

    }


    const userPrompt = args.join(' ');

    const finalPrompt =
      config.prefix
        ? `${userPrompt}, ${config.prefix}`
        : userPrompt;


    // ========================================================
    // STATUS
    // ========================================================

    const status = await sock.sendMessage(
      jid,
      {
        text:
          `🎨 *${config.title}*\n\n` +
          `Generating your image...\n\n` +
          `📝 ${userPrompt}\n\n` +
          `🤖 *MUFASER-X AI*`
      },
      { quoted: msg }
    );


    // ========================================================
    // GENERATE
    // ========================================================

    const imageBuffer = await generateImage(
      finalPrompt,
      config.width,
      config.height
    );


    // ========================================================
    // DELETE STATUS
    // ========================================================

    try {

      await sock.sendMessage(
        jid,
        {
          delete: status.key
        }
      );

    } catch (_) {}


    // ========================================================
    // SEND IMAGE
    // ========================================================

    await sock.sendMessage(
      jid,
      {
        image: imageBuffer,
        caption:
          `> *POWERED BY @MUFASER-X BOT*`
      },
      { quoted: msg }
    );


  } catch (error) {

    console.error(
      '[AI IMAGE ERROR]',
      error?.message || error
    );

    return await sock.sendMessage(
      jid,
      {
        text:
          `❌ *IMAGE GENERATION FAILED*\n\n` +
          `⚠️ ${error?.message || 'Unknown error'}\n\n` +
          `Please try again.`
      },
      { quoted: msg }
    );

  }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  name: 'image',

  aliases,

  desc: 'Generate AI images with different styles',

  category: 'AI',

  usage: '.image <prompt>',

  execute

};