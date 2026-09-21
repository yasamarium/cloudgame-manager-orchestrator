const https = require('https');

const GH_PAT = process.env.GH_PAT;
const OWNER = 'yasamarium';

const GAME_REPOS = [
  'cloudgame-supertux', 'cloudgame-doom', 'cloudgame-openarena',
  'cloudgame-minetest', 'cloudgame-assaultcube', 'cloudgame-neverball',
  'cloudgame-supertuxkart', 'cloudgame-teeworlds', 'cloudgame-chromium-bsu',
  'cloudgame-retroarch'
];

console.log('[Orchestrator] Starting Cloud Gaming Health Monitor & Auto-Healing Watchdog...');

function checkAndHealGameRunners() {
  console.log(`[${new Date().toISOString()}] Checking health of all 10 Cloud Game Runners...`);

  // Fetch servers registry from session DB
  const req = https.request({
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/cloudgame-db-sessions/contents/data/servers.json`,
    headers: {
      'Authorization': `Bearer ${GH_PAT}`,
      'User-Agent': 'CloudGameOrchestrator',
      'Accept': 'application/vnd.github+json'
    }
  }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const fileInfo = JSON.parse(data);
        const servers = JSON.parse(Buffer.from(fileInfo.content, 'base64').toString('utf8'));
        console.log(`[Orchestrator] Found ${servers.length} registered game servers.`);

        servers.forEach(s => {
          console.log(` - ${s.title} (${s.id}): Status=${s.status}, LastPing=${s.last_ping}`);
        });
      } catch (err) {
        console.error('[Orchestrator Error parsing servers.json]', err.message);
      }
    });
  });
  req.on('error', err => console.error('[Orchestrator Request Error]', err.message));
  req.end();
}

// Run initial check and then every 2 minutes
checkAndHealGameRunners();
setInterval(checkAndHealGameRunners, 120000);
