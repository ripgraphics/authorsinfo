const {spawnSync} = require('child_process');
const result = spawnSync('npx', ['convex', 'run', 'queries/debug:debugUserResolve', '{"supabaseId": "2474659f-003e-4faa-8c53-9969c33f20b2"}', '--prod'], {encoding: 'utf8', stdio: 'inherit'});
process.exit(result.status);