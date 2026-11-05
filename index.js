// dsh-litman, Host half. Runs in the DeepSeek Harness Node process.
//
// - Registers the `litman-setup` skill, which lets the agent install litman
//   when it is missing (with the user's consent).
// - Serves GET /litman/api/vaults for the browser half: the output of
//   `lit vault list --format json`.
//
// The plugin talks to litman only through the `lit` command; it never reads
// litman's files.

import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'dsh-litman'

const SKILL = {
  name: 'litman-setup',
  description:
    'Install litman, the local literature manager, and connect it to DeepSeek Harness. ' +
    'Use when the user mentions litman, `lit`, or their literature vault (文献库) and no ' +
    '`lit-library` skill is available, or when a `lit` command is not found.',
  source: 'bundled',
  content: readFileSync(new URL('./skills/litman-setup.md', import.meta.url), 'utf8'),
}

/**
 * Where to look for `lit`: the configured path, then PATH, then the
 * installer's default bin directory. DSH keeps the PATH it started with, so
 * a litman installed while DSH runs is found only through the bin directory.
 */
function litCandidates(config) {
  const exe = process.platform === 'win32' ? 'lit.exe' : 'lit'
  const dirs = [process.env.UV_TOOL_BIN_DIR, process.env.XDG_BIN_HOME, join(homedir(), '.local', 'bin')]
  return [config.litPath, 'lit', ...dirs.filter(Boolean).map(d => join(d, exe))].filter(Boolean)
}

function run(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, {
      timeout: 30_000,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
      // `lit` prints UTF-8 whatever the console code page is.
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
    }, (error, stdout, stderr) => {
      if (error) {
        error.stderr = String(stderr || '')
        reject(error)
      } else {
        resolve(String(stdout))
      }
    })
  })
}

async function listVaults(config) {
  for (const lit of litCandidates(config)) {
    let stdout
    try {
      stdout = await run(lit, ['vault', 'list', '--format', 'json'])
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EACCES') continue
      const detail = (error.stderr || error.message || '').trim().split('\n').pop()
      return { ok: false, code: 'lit-failed', lit, message: detail }
    }
    const rows = JSON.parse(stdout)
    return {
      ok: true,
      lit,
      vaults: rows.map(({ name, path, is_active, papers }) => ({ name, path, active: !!is_active, papers })),
    }
  }
  return { ok: false, code: 'lit-not-found' }
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

export function apply(ctx, config = {}) {
  ctx.inject(['skills'], (c) => {
    c.skills.register(SKILL)
  })

  // webServer / connection exist only in the Web and Desktop profiles.
  ctx.inject(['webServer', 'connection'], (c) => {
    c.effect(() => c.webServer.register({
      kind: 'prefix',
      path: '/litman',
      handler: (req, res) => {
        // Plugin routes sit outside the host's /api auth: check it here.
        const rejection = c.connection.requestRejection(req)
        if (rejection !== undefined) {
          json(res, rejection, { ok: false, code: rejection === 401 ? 'unauthorized' : 'forbidden' })
          return
        }
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname === '/litman/api/vaults' && req.method === 'GET') {
          listVaults(config).then(
            body => json(res, 200, body),
            error => json(res, 500, { ok: false, code: 'internal', message: String(error?.message ?? error) }),
          )
          return
        }
        json(res, 404, { ok: false, code: 'not-found' })
      },
    }))
  })
}
