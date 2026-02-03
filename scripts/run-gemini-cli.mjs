#!/usr/bin/env node
/**
 * Run Gemini CLI with env from .env.local.
 * Uses GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY from .env.local
 * so you don't need to duplicate the key.
 *
 * If you see "You have exhausted your daily quota on this model":
 * - Free-tier API keys get very limited quota for Gemini 2.5 Pro.
 * - Use: npm run gemini:flash (forces gemini-2.5-flash, higher free quota).
 * - Or in the CLI run /model and choose Manual → gemini-2.5-flash.
 * - Check usage: https://aistudio.google.com/usage
 */
import { spawn } from 'child_process'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

config({ path: resolve(root, '.env.local') })

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY

if (!apiKey) {
  console.error(
    'Missing API key. Add GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY to .env.local'
  )
  process.exit(1)
}

const env = { ...process.env, GEMINI_API_KEY: apiKey }
const child = spawn('gemini', process.argv.slice(2), {
  stdio: 'inherit',
  shell: true,
  env,
})

child.on('exit', (code) => process.exit(code ?? 0))
