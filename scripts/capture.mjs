// UI acceptance captures + live smoke (real models, real Wikipedia): 390 and 1280 px, input and result screens,
// plus a horizontal-overflow check and the swap test on the first claim.
// Usage: npm run build && node scripts/capture.mjs [sample]  → docs/screens/*.png
import { preview } from 'vite'
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
mkdirSync('docs/screens', { recursive: true })
const server = await preview({ preview: { port: 4318, host: '127.0.0.1' }, logLevel: 'error' })
const url = server.resolvedUrls.local[0]
const browser = await chromium.launch()
const sample = process.argv[2] ?? 'Julia Faye'
const problems = []
const log = []
for (const width of [1280, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 800 }, deviceScaleFactor: 2 })
  page.on('console', (m) => { if (m.type() === 'error') log.push(`${width} console: ${m.text()}`) })
  await page.goto(url)
  const shot = async (name, full = true) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (overflow > 0) problems.push(`${width}px ${name}: horizontal overflow ${overflow}px`)
    await page.screenshot({ path: `docs/screens/${width}-${name}.png`, fullPage: full })
  }
  await shot('1-input', false)
  await page.click(`.chip[data-sample="${sample}"]`)
  const t0 = Date.now()
  await page.click('#check')
  await page.waitForSelector('#summary:not([hidden])', { timeout: 300000 })
  const secs = ((Date.now() - t0) / 1000).toFixed(0)
  const summary = await page.textContent('#sum-big')
  const labels = await page.$$eval('.claim .pill', (els) => els.map((e) => e.textContent))
  log.push(`${width}px: ${summary} in ${secs} s — ${labels.join(' | ')}`)
  await page.click('.claim [data-swap]')
  await page.waitForFunction(() => document.querySelector('.claim .swap')?.textContent?.includes('Receipts:'), null, { timeout: 120000 })
  log.push(`${width}px swap: ${await page.textContent('.claim .swap')}`)
  await page.addStyleTag({ content: '.cta-bar{display:none!important}' })
  await shot(`2-result`)
  await page.close()
}
await browser.close()
server.httpServer.close()
writeFileSync('docs/screens/smoke.txt', [...log, ...problems].join('\n') + '\n')
console.log([...log, problems.length ? problems.join('\n') : 'captures OK, no horizontal overflow'].join('\n'))
process.exit(problems.length ? 1 : 0)
