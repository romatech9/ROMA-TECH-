// ============================================================
// MUFASER-X — AI IMAGE GENERATOR
// Pollinations Image API
// ============================================================

const axios = require('axios');

const MAX_REQUESTS = 5;
const TIME_WINDOW = 60 * 1000;

const userRequests = new Map();

function checkRateLimit(userId) {
  const now = Date.now();

  let requests = userRequests.get(userId) || [];

  requests = requests.filter(
    time => now - time < TIME_WINDOW
  );

  if (requests.length >= MAX_REQUESTS) {
    const wait = Math.ceil(
      (TIME_WINDOW - (now - requests[0])) / 1000
    );

    userRequests.set(userId, requests);

    return {
      allowed: false,
      wait
    };
  }

  requests.push(now);
  userRequests.set(userId, requests);

  return {
    allowed: true,
    wait: 0
  };
}


// ============================================================
// GENERATE IMAGE
// ============================================================

async function generateImage(prompt, width = 1024, height = 1024) {

  const encodedPrompt = encodeURIComponent(prompt);

  const url =
    `https://image.pollinations.ai/prompt/${encodedPrompt}` +
    `?width=${width}` +
    `&height=${height}`;

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
    validateStatus: () => true
  });

  if (response.status !== 200) {
    throw new Error(
      `Image API returned status ${response.status}`
    );
  }

  return Buffer.from(response.data);
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  checkRateLimit,
  generateImage
};