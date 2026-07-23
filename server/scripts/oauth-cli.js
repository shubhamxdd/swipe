/**
 * OAuth CLI — one-shot PKCE flow for SwipeMix.
 *
 * Usage:
 *   1. Add http://localhost:3456/callback to your Spotify Dashboard redirect URIs
 *   2. Make sure server/.env has your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
 *   3. node server/scripts/oauth-cli.js
 */

const crypto = require('crypto');
const http = require('http');
const path = require('path');

// ─── Load .env ───────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  const fs = require('fs');
  if (!fs.existsSync(envPath)) {
    console.error('server/.env not found. Create it from .env.example');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

loadEnv();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3456/callback';
const PORT = 3456;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in server/.env');
  process.exit(1);
}

// ─── PKCE ────────────────────────────────────────────────────
function base64URLEncode(buf) {
  return buf.toString('base64url');
}

function generateVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}

function generateChallenge(verifier) {
  return base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
}

// ─── Exchange code for tokens ────────────────────────────────
async function exchangeCode(code, verifier) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${err}`);
  }

  return res.json();
}

// ─── Auth URL ────────────────────────────────────────────────
function buildAuthUrl(challenge) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: 'playlist-read-private playlist-modify-public playlist-modify-private user-read-private',
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// ─── Open browser ────────────────────────────────────────────
function openBrowser(url) {
  const { execSync } = require('child_process');
  const platform = process.platform;
  try {
    if (platform === 'darwin') execSync(`open "${url}"`);
    else if (platform === 'win32') execSync(`start "" "${url}"`);
    else execSync(`xdg-open "${url}"`);
  } catch {
    console.log(`\nOpen this URL in your browser:\n${url}\n`);
  }
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  const verifier = generateVerifier();
  const challenge = generateChallenge(verifier);
  const authUrl = buildAuthUrl(challenge);

  console.log('1. Starting local server on http://localhost:3456 ...');

  const server = http.createServer((req, res) => {
    if (!req.url) return;

    const parsed = new URL(req.url, `http://localhost:${PORT}`);
    const code = parsed.searchParams.get('code');
    const error = parsed.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end(`Spotify auth error: ${error}`);
      server.close(() => process.exit(1));
      return;
    }

    if (code) {
      console.log('2. Authorization code received from Spotify');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>✓ Authorized! You can close this tab.</h1>');

      server.close();

      exchangeCode(code, verifier)
        .then((tokens) => {
          console.log('\n── Tokens ──────────────────────────────────────');
          console.log(`access_token:  ${tokens.access_token}`);
          console.log(`refresh_token: ${tokens.refresh_token}`);
          console.log(`expires_in:    ${tokens.expires_in}s`);
          console.log('─────────────────────────────────────────────────\n');
          console.log('Use the access_token as the Bearer token in Postman for:');
          console.log('  POST /api/theme');
          console.log('  POST /api/playlist\n');
        })
        .catch((err) => {
          console.error('Token exchange failed:', err.message);
          process.exit(1);
        });
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Waiting for Spotify auth...');
    }
  });

  server.listen(PORT, () => {
    console.log(`2. Opening browser for Spotify authorization...\n`);
    openBrowser(authUrl);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
