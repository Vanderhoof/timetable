/**
 * Playwright seed helper for the workload editor.
 *
 * Generates public/e2e-seed.json from the backup file, which vite dev/preview serves
 * as a static asset. Once generated, seeding in Playwright is one short browser_evaluate call.
 *
 * WORKFLOW:
 *   1. Generate seed file (run once, or after backup changes):
 *        cd workload && npx tsx e2e/seed.ts
 *
 *   2. Start the app (dev or preview):
 *        npm run dev          # dev server on :5174
 *        # OR
 *        npm run build && npx vite preview --port 5175
 *
 *   3. In Playwright: navigate to app, then seed + reload with this browser_evaluate:
 *        () => fetch('/e2e-seed.json').then(r=>r.json()).then(s=>{localStorage.setItem('rn-store',JSON.stringify(s));return 'seeded'})
 *
 *   4. browser_navigate again to reload — app now has full school data pre-loaded.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_PATH = resolve(__dirname, '../нагрузка-11-03-2026.json');
const OUTPUT_PATH = resolve(__dirname, '../public/e2e-seed.json');
const STORE_VERSION = 4;

interface BackupFile {
  version: number;
  curriculumPlan: unknown;
  teachers: unknown[];
  deptGroups: unknown[];
  assignments: unknown[];
  homeroomAssignments: unknown[];
}

/**
 * Converts the backup file format into the Zustand rn-store localStorage format.
 */
export function buildSeedState() {
  const backup = JSON.parse(readFileSync(BACKUP_PATH, 'utf8')) as BackupFile;
  return {
    state: {
      curriculumPlan: backup.curriculumPlan,
      teachers: backup.teachers,
      deptGroups: backup.deptGroups,
      assignments: backup.assignments,
      homeroomAssignments: backup.homeroomAssignments,
      subjectShortNames: {},
      activeTab: 'import',
      groupNameOverrides: {},
    },
    version: STORE_VERSION,
  };
}

// When run directly: write seed JSON to public/ so vite can serve it
const state = buildSeedState();
writeFileSync(OUTPUT_PATH, JSON.stringify(state));
console.log(`Seed written to public/e2e-seed.json (${(JSON.stringify(state).length / 1024).toFixed(1)} KB)`);
console.log('\nTo seed in Playwright, use browser_evaluate with:');
console.log("() => fetch('/e2e-seed.json').then(r=>r.json()).then(s=>{localStorage.setItem('rn-store',JSON.stringify(s));return 'seeded'})");
