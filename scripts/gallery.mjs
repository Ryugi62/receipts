// Render Devpost gallery images (1280x720) from docs/gallery/gallery.html + live app captures.
// Numbers on the "numbers" slide come from web/numbers.json inputs (docs/results), never typed by hand.
// Usage: npm run build && node scripts/gallery.mjs → docs/gallery/*.png
import { chromium } from 'playwright'
import { preview } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const naive = readFileSync('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md', 'utf8')
const cell = (name) => naive.split('\n').find((l) => l.startsWith(`| ${name}`)).split('|').map((c) => c.trim())
const raw = cell('plain checker')[8].match(/= ([\d.]+%)/)[1]
const gated = cell('Receipts as shipped')[8].match(/= ([\d.]+%)/)[1]
const nums = JSON.parse(readFileSync('web/numbers.json', 'utf8')).lines
const e2line = (nums.find((l) => l.includes('fresh held-out')) ?? '').replace(/<[^>]+>/g, '')
const stress = (nums.find((l) => l.includes('Balanced accuracy')) ?? '').replace(/<[^>]+>/g, '')
const nogate = cell('shipped thresholds, gate OFF')[8].match(/= ([\d.]+%)/)[1]
const trow = (file, name) => readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`| ${name}`)).split('|').map((c) => c.trim().replace(/ \[.*?\]/, '').replace(/ \(n=\d+\)/, ''))
const tr = trow('docs/results/triage-perplexity.md', 'Receipts'), tp = trow('docs/results/triage-perplexity.md', 'plain checker')
const h1r = trow('docs/results/h1-report.md', 'Receipts'), h1p = trow('docs/results/h1-report.md', 'plain checker')
const fill = { RAW: raw, GATED: gated, NOGATE: nogate, E2LINE: e2line, STRESS: stress, OURFC: tr[6], PLAINFC: tp[6], SKIP: tr[7], BPREC: tr[4], KEPT: tr[8], RAND: tr[9], H1R: h1r[2], H1P: h1p[2] }
const html = readFileSync('docs/gallery/gallery.html', 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => fill[k])
writeFileSync('docs/gallery/gallery.rendered.html', html)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
for (const [id, name] of [['thumb', '00-thumbnail'], ['numbers', '03-numbers'], ['arch', '04-architecture']]) {
  await page.goto('file://' + resolve('docs/gallery/gallery.rendered.html') + '#' + id)
  await page.waitForTimeout(200)
  await page.screenshot({ path: `docs/gallery/${name}.png` })
}
// live app: result + swap test
const server = await preview({ preview: { port: 4320, host: '127.0.0.1' }, logLevel: 'error' })
const app = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
await app.goto(server.resolvedUrls.local[0])
await app.addStyleTag({ content: '.cta-bar{display:none!important} main{padding-top:16px}' })
const run = async (sample) => {
  await app.goto(server.resolvedUrls.local[0])
  await app.addStyleTag({ content: '.cta-bar{display:none!important} main{padding-top:16px}' })
  await app.click(`.chip[data-sample="${sample}"]`)
  await app.evaluate(() => document.getElementById('check').click())
  await app.waitForSelector('#summary:not([hidden])', { timeout: 300000 })
}
await run('Eiffel Tower')
await app.locator('#summary').evaluate((el) => el.scrollIntoView({ block: 'start' }))
await app.screenshot({ path: 'docs/gallery/01-result.png' })
await run('Marianne McAndrew')
const note = app.locator('.naive').first()
if (await note.count()) {
  await note.evaluate((el) => el.closest('.claim').scrollIntoView({ block: 'center' }))
  await app.screenshot({ path: 'docs/gallery/02-plain-checker-note.png' })
}
await browser.close()
server.httpServer.close()
console.log('gallery written')
