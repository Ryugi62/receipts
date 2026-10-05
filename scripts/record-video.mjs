// Demo video without a human voice: per-scene neural TTS (edge-tts) → Playwright records the real build (vite preview) at
// 1280x720 with captions burned in → ffmpeg mux to H.264/AAC mp4 + .srt. Recorder pattern adapted from the author's earlier projects.
// neural TTS per scene (edge-tts) → Playwright records 1280x720 with captions burned in → ffmpeg mux to H.264/AAC mp4 + .srt.
// Usage: npm run build && FFMPEG=<ffmpeg> TTS_PY=<python with edge_tts> node scripts/record-video.mjs --scenes docs/video/scenes.json --name paypause-demo --max 240
// Scene: { "id": "s1", "url": "docs/video/slides.html#s1" | "http://localhost:5174/…", "en": "narration + caption",
//          "actions": ["click:#cta", "wait:800", "scroll:details"], "passkey": true }
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { preview } from 'vite'

const argv = process.argv.slice(2)
const opt = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d)
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg'
const TTS_PY = process.env.TTS_PY ?? 'python3'
const NAME = opt('name', 'receipts-demo')
const OUT = opt('out', 'docs/video')
const WORK = join(OUT, `work-${NAME}`)
const MAX_SECONDS = Number(opt('max', '240'))
const MIN_SECONDS = Number(opt('min', '120'))
const VOICE = ['--voice', opt('voice', 'en-US-AndrewMultilingualNeural'), `--rate=${opt('rate', '+4%')}`]
mkdirSync(WORK, { recursive: true })
const scenes = JSON.parse(readFileSync(opt('scenes', join(OUT, 'scenes.json')), 'utf8'))
const server = await preview({ preview: { port: 4319, host: '127.0.0.1' }, logLevel: 'error' })
const APP = server.resolvedUrls.local[0]
const abs = (u) => (u.startsWith('app:') ? APP + u.slice(4) : u.startsWith('http') || u.startsWith('file:') ? u : 'file://' + resolve(u))

function durationOf(file) {
  try { execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) {
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(e.stderr))
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
  }
  throw new Error(`no duration for ${file}`)
}

// 1) narration per scene
for (const s of scenes) {
  if (s.hidden) continue
  const mp3 = join(WORK, `${s.id}.mp3`)
  execFileSync(TTS_PY, ['-m', 'edge_tts', ...VOICE, '--text', s.en, '--write-media', mp3], { stdio: ['ignore', 'ignore', 'inherit'] })
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', mp3, '-af', 'areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse', '-ar', '48000', '-ac', '2', join(WORK, `${s.id}.wav`)])
  s.seconds = durationOf(join(WORK, `${s.id}.wav`))
}
const planned = scenes.filter((s) => !s.hidden).reduce((n, s) => n + s.seconds + 0.6, 0)
if (planned > MAX_SECONDS) throw new Error(`narration ${planned.toFixed(1)}s > limit ${MAX_SECONDS}s — cut text before recording`)

// 2) record
const browser = await chromium.launch()
const tCtx = Date.now()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, acceptDownloads: true, locale: 'en-US', recordVideo: { dir: WORK, size: { width: 1280, height: 720 } } })
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept()) // organizer console prompts/confirms: accept the default text
if (scenes.some((s) => s.passkey)) {
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('WebAuthn.enable')
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } })
}
const CAP = `#cd-cap{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:rgba(10,14,20,.86);color:#fff;padding:10px 56px 12px;
font:600 20px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;text-align:center;pointer-events:none}.cta{bottom:58px!important}.cd-click{outline:4px solid #ffb020!important;outline-offset:3px}`
async function caption(text) {
  await page.evaluate(({ css, text }) => {
    if (!document.getElementById('cd-cap-style')) { const st = document.createElement('style'); st.id = 'cd-cap-style'; st.textContent = css; document.head.appendChild(st) }
    let el = document.getElementById('cd-cap')
    if (!el) { el = document.createElement('div'); el.id = 'cd-cap'; document.body.appendChild(el) }
    el.textContent = text
  }, { css: CAP, text })
}
let current = ''
async function act(s) {
  for (const a of s.actions ?? []) {
    const [kind, ...rest] = a.split(':')
    const arg = rest.join(':')
    if (kind === 'click') { const l = page.locator(arg).first(); await l.scrollIntoViewIfNeeded(); await l.click() }
    else if (kind === 'wait') await page.waitForTimeout(Number(arg))
    else if (kind === 'waitfor') await page.waitForSelector(arg, { timeout: 60000 })
    else if (kind === 'fill') { const [sel, ...v] = arg.split('='); await page.locator(sel).first().fill(v.join('=')) }
    else if (kind === 'goto') { await page.goto(abs(arg)); current = abs(arg) }
    else if (kind === 'zoom') await page.evaluate((z) => { document.body.style.zoom = z }, arg)
  }
}
// hidden set-up scenes run first and are trimmed from the video (no loading states on camera)
const hidden = scenes.filter((s) => s.hidden)
for (const s of hidden) { await page.goto(abs(s.url)); current = abs(s.url); await act(s) }
const visible = scenes.filter((s) => !s.hidden)
scenes.length = 0
scenes.push(...visible)
const t0 = Date.now()
const trimStart = (t0 - tCtx) / 1000
const starts = []
for (const s of scenes) {
  const start = (Date.now() - t0) / 1000
  starts.push(start)
  const url = abs(s.url)
  if (url !== current) {
    const sameDoc = current && url.split('#')[0] === current.split('#')[0] && url.startsWith('file:')
    if (sameDoc) await page.evaluate((h) => { location.hash = h }, url.split('#')[1] ?? '')
    else await page.goto(url)
    await page.waitForTimeout(300)
    current = url
  }
  await caption(s.en)
  for (const a of s.actions ?? []) {
    const [kind, ...rest] = a.split(':')
    const arg = rest.join(':')
    if (process.env.DEBUG_REC) console.error('ACT', s.id, a)
    if (kind === 'click') { const l = page.locator(arg).first(); await l.scrollIntoViewIfNeeded(); await l.evaluate((el) => el.classList.add('cd-click')); await page.waitForTimeout(350); await l.click(); await l.evaluate((el) => el.classList.remove('cd-click')).catch(() => {}) }
    else if (kind === 'scroll') await page.locator(arg).first().evaluate((el) => el.scrollIntoView({ block: 'center' }))
    else if (kind === 'wait') await page.waitForTimeout(Number(arg))
    else if (kind === 'waitfor') await page.waitForSelector(arg, { timeout: 120000 })
    else if (kind === 'open') await page.locator(arg).first().evaluate((el) => { el.open = true })
    else if (kind === 'fill') { const [sel, ...v] = arg.split('='); await page.locator(sel).first().fill(v.join('=')) }
    else if (kind === 'goto') { await page.goto(abs(arg)); current = abs(arg) }
    else if (kind === 'zoom') await page.evaluate((z) => { document.body.style.zoom = z }, arg)
    else if (kind === 'fillenv') { const [sel, name] = arg.split('='); await page.locator(sel).first().fill(process.env[name] ?? '') } // secrets are typed into password fields only
    else if (kind === 'select') await page.evaluate((needle) => {
      // highlight the key sentence of the pasted email so viewers see what the reader saw
      const t = document.querySelector('#answer'); const i = t.value.indexOf(needle)
      if (i < 0) throw new Error(`select: "${needle}" not in the email`)
      t.focus(); t.setSelectionRange(i, i + needle.length)
      const lines = t.value.slice(0, i).split('\n').length
      t.scrollTop = Math.max(0, (lines - 3) * parseFloat(getComputedStyle(t).lineHeight))
    }, arg)
    await caption(s.en)
  }
  const elapsed = (Date.now() - t0) / 1000 - start
  await page.waitForTimeout(Math.max(0, (s.seconds + 0.6 - elapsed) * 1000))
}
const total = (Date.now() - t0) / 1000
const recorded = await page.video().path()
await ctx.close()
await browser.close()
renameSync(recorded, join(WORK, 'raw.webm'))
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', trimStart.toFixed(2), '-i', join(WORK, 'raw.webm'), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-deadline', 'realtime', join(WORK, 'screen.webm')])

// 3) narration track + 4) mux
const inputs = scenes.flatMap((s) => ['-i', join(WORK, `${s.id}.wav`)])
const delays = scenes.map((s, i) => `[${i}:a]adelay=${Math.round(starts[i] * 1000)}|${Math.round(starts[i] * 1000)}[a${i}]`).join(';')
const mix = `${delays};${scenes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${scenes.length}:normalize=0,apad,atrim=0:${total.toFixed(2)}[aout]`
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', mix, '-map', '[aout]', join(WORK, 'narration.wav')])
const mp4 = join(OUT, `${NAME}.mp4`)
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', join(WORK, 'screen.webm'), '-i', join(WORK, 'narration.wav'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'medium', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4])
const ts = (x) => { const ms = Math.round(x * 1000); const p = (n, w = 2) => String(n).padStart(w, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))},${p(ms % 1000, 3)}` }
writeFileSync(join(OUT, `${NAME}.en.srt`), scenes.map((s, i) => `${i + 1}\n${ts(starts[i])} --> ${ts(starts[i] + s.seconds)}\n${s.en}\n`).join('\n'))
server.httpServer.close()
const seconds = durationOf(mp4)
if (seconds > MAX_SECONDS || seconds < MIN_SECONDS) throw new Error(`video ${seconds}s outside ${MIN_SECONDS}-${MAX_SECONDS}s`)
console.log(JSON.stringify({ seconds: Math.round(seconds * 10) / 10, scenes: scenes.length, out: mp4 }))
