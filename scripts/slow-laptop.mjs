// "School laptop" check: the built app in a fresh browser profile with the CPU slowed 4× (Chrome DevTools throttling), Eiffel
// sample: time to the first result including the model download, then a second check of a different sample (models cached).
// Usage: npm run build && node scripts/slow-laptop.mjs [rate]
import { chromium } from 'playwright'
import { preview } from 'vite'
import { writeFileSync } from 'node:fs'

const rate = Number(process.argv[2] ?? 4)
const server = await preview({ preview: { port: 4322, host: '127.0.0.1' }, logLevel: 'error' })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate })
await page.goto(server.resolvedUrls.local[0])
const check = async (sample) => {
  await page.click(`.chip[data-sample="${sample}"]`)
  const t0 = Date.now()
  await page.evaluate(() => document.getElementById('check').click())
  await page.waitForSelector('.claim:not(.skeleton)', { timeout: 900000 })
  const first = (Date.now() - t0) / 1000
  await page.waitForSelector('#summary:not([hidden])', { timeout: 900000 })
  return { sample, firstClaimS: +first.toFixed(1), allS: +((Date.now() - t0) / 1000).toFixed(1), summary: await page.textContent('#sum-big'), claims: await page.locator('.claim:not(.skeleton)').count() }
}
const cold = await check('Eiffel Tower')
const warm = await check('Julia Faye')
const res = { cpuSlowdown: rate, coldWithDownload: cold, warmCached: warm, when: new Date().toISOString(), note: 'fresh profile; network = this machine’s connection; laptop CPU slowed with Emulation.setCPUThrottlingRate' }
console.log(JSON.stringify(res, null, 1))
writeFileSync(`docs/results/slow-laptop-${rate}x.json`, JSON.stringify(res, null, 1) + '\n')
await browser.close()
server.httpServer.close()
