// Render Devpost gallery images (1280x720) from docs/gallery/gallery.html + live app captures.
// Numbers on the "numbers" slide come from web/numbers.json inputs (docs/results), never typed by hand.
// Usage: npm run build && node scripts/gallery.mjs → docs/gallery/*.png
import { chromium } from 'playwright'
import { preview } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const naive = readFileSync('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md', 'utf8')
const raw = naive.match(/raw model says "contradicted": \d+\/\d+ = ([\d.]+%)/)[1]
const gated = naive.match(/no_receipt WITH relevance gate: \d+\/\d+ = ([\d.]+%)/)[1]
const nums = JSON.parse(readFileSync('web/numbers.json', 'utf8')).lines
const e2line = (nums.find((l) => l.includes('real ChatGPT answers')) ?? '').replace(/<[^>]+>/g, '')
const html = readFileSync('docs/gallery/gallery.html', 'utf8').replace('{{RAW}}', raw).replace('{{GATED}}', gated).replace('{{E2LINE}}', e2line)
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
await app.click('.chip[data-sample="Julia Faye"]')
await app.click('#check')
await app.waitForSelector('#summary:not([hidden])', { timeout: 300000 })
await app.addStyleTag({ content: '.cta-bar{display:none!important} main{padding-top:16px}' })
await app.locator('#summary').scrollIntoViewIfNeeded()
await app.evaluate(() => window.scrollBy(0, -10))
await app.screenshot({ path: 'docs/gallery/01-result.png' })
await app.click('.claim [data-swap]')
await app.waitForSelector('.claim .swap b', { timeout: 120000 })
await app.locator('.claim [data-swap]').first().evaluate((el) => el.scrollIntoView({ block: 'center' }))
await app.screenshot({ path: 'docs/gallery/02-swap-test.png' })
await browser.close()
server.httpServer.close()
console.log('gallery written')
