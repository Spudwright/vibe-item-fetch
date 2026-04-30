// Local sanity check for the Robot.com (Kiwibot) Jobs API.
//
// What it does:
//   1. Loads ../../.env.test (the sandbox credentials, which live in the
//      parent CanDo folder, NOT in this repo).
//   2. Creates a draft job between the two San Jose test points.
//   3. If the draft is created, calls /undraft to dispatch the bot.
//   4. Polls GET /:id every 5s for 60s, logging state changes.
//
// Usage (from repo root):
//   node scripts/test-robot-integration.mjs
//
// This is for sandbox use only. It hits the Robot.com sandbox account; do
// NOT run with production credentials.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.test lives in the parent CanDo folder (one level up from the repo).
const ENV_PATH = path.resolve(__dirname, '..', '..', '.env.test');

if (!fs.existsSync(ENV_PATH)) {
  console.error(`Could not find ${ENV_PATH}. Expected sandbox creds there.`);
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(ENV_PATH, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const eq = line.indexOf('=');
      if (eq === -1) return [line, ''];
      return [line.slice(0, eq).trim(), line.slice(eq + 1).trim().replace(/^"|"$/g, '')];
    }),
);

const {
  ROBOT_API_BASE_URL,
  ROBOT_API_KEY,
  ROBOT_PARTNER_ID,
  ROBOT_LOCATION_ID,
  ROBOT_TEST_POINT_1_LAT,
  ROBOT_TEST_POINT_1_LNG,
  ROBOT_TEST_POINT_2_LAT,
  ROBOT_TEST_POINT_2_LNG,
} = env;

for (const [k, v] of Object.entries({
  ROBOT_API_BASE_URL,
  ROBOT_API_KEY,
  ROBOT_PARTNER_ID,
  ROBOT_LOCATION_ID,
  ROBOT_TEST_POINT_1_LAT,
  ROBOT_TEST_POINT_1_LNG,
  ROBOT_TEST_POINT_2_LAT,
  ROBOT_TEST_POINT_2_LNG,
})) {
  if (!v) {
    console.error(`Missing ${k} in .env.test`);
    process.exit(1);
  }
}

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': ROBOT_API_KEY,
};

const externalId = `harness_${Date.now()}`;

const createBody = {
  partner_id: ROBOT_PARTNER_ID,
  location_id: ROBOT_LOCATION_ID,
  external_id: externalId,
  draft: true,
  points: [
    {
      external_id: 'pick',
      name: 'Test pickup',
      lat: Number(ROBOT_TEST_POINT_1_LAT),
      lng: Number(ROBOT_TEST_POINT_1_LNG),
      tags: ['pickup'],
    },
    {
      external_id: 'drop',
      name: 'Test dropoff',
      lat: Number(ROBOT_TEST_POINT_2_LAT),
      lng: Number(ROBOT_TEST_POINT_2_LNG),
      tags: ['dropoff'],
    },
  ],
  packages: [
    {
      name: 'Test recycling batch',
      dimensions: { length: 30, width: 20, height: 15 },
      items: [
        {
          quantity: 5,
          asset: {
            use: {
              name: 'Aluminum can',
              weight: 14,
              dimensions: { length: 12, width: 6, height: 6 },
            },
          },
        },
      ],
      meta: { price: 25 },
    },
  ],
  consumer: {
    name: 'Test User',
    email: 'test@cando.app',
    phone_number: '+1 213 555 5555',
  },
  tags: ['harness', 'sandbox'],
};

console.log(`>> Creating DRAFT job (external_id=${externalId})…`);
const createResp = await fetch(ROBOT_API_BASE_URL, {
  method: 'POST',
  headers,
  body: JSON.stringify(createBody),
});

const createPayload = await createResp.json().catch(() => ({}));
console.log(`<< ${createResp.status}`, JSON.stringify(createPayload, null, 2));

if (!createResp.ok || !createPayload.id) {
  console.error('Job creation failed; aborting.');
  process.exit(1);
}

const jobId = createPayload.id;

console.log(`\n>> Undrafting job ${jobId} (dispatch)…`);
const undraftResp = await fetch(`${ROBOT_API_BASE_URL}/${jobId}/undraft`, {
  method: 'POST',
  headers,
});
const undraftPayload = await undraftResp.json().catch(() => ({}));
console.log(`<< ${undraftResp.status}`, JSON.stringify(undraftPayload, null, 2));

if (!undraftResp.ok) {
  console.error('Undraft failed; the job exists but was not dispatched.');
  process.exit(1);
}

console.log(`\n>> Polling GET /${jobId} every 5s for 60s…`);
let lastState = null;
const start = Date.now();
while (Date.now() - start < 60_000) {
  await new Promise((r) => setTimeout(r, 5_000));
  const r = await fetch(`${ROBOT_API_BASE_URL}/${jobId}`, { headers });
  const j = await r.json().catch(() => ({}));
  const state = j.state ?? '<no-state>';
  const step = j.currentStep?.name ?? '-';
  const stepStatus = j.currentStep?.status ?? '-';
  if (state !== lastState) {
    console.log(`[${new Date().toISOString()}] state=${state} step=${step} (${stepStatus})`);
    lastState = state;
  } else {
    process.stdout.write('.');
  }
}
console.log('\n>> Done polling.');
