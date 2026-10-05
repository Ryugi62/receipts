// Physical check of "What now?" in the built app: run a sample, press both copy buttons, read the clipboard, capture
// docs/gallery/05-what-now.png (1280x720) and check 390 px has no horizontal overflow. Usage: npm run build && node scripts/capture-next.mjs
import { chromium } from 'playwright'
import { preview } from 'vite'

const server = await preview({ preview: { port: 4321, host: '127.0.0.1' }, logLevel: 'error' })
const url = server.resolvedUrls.local[0]
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, permissions: ['clipboard-read', 'clipboard-write'] })
const app = await ctx.newPage()
await app.goto(url)
await app.addStyleTag({ content: '.cta-bar{display:none!important} main{padding-top:16px}' })
await app.click('.chip[data-sample="Eiffel Tower"]')
const t0 = Date.now()
await app.evaluate(() => document.getElementById('check').click())
await app.waitForSelector('#summary:not([hidden])', { timeout: 300000 })
const secs = ((Date.now() - t0) / 1000).toFixed(0)
await app.click('#copy-draft')
await app.waitForTimeout(300)
const draft = await app.evaluate(() => navigator.clipboard.readText())
await app.click('#copy-ask')
await app.waitForTimeout(300)
const ask = await app.evaluate(() => navigator.clipboard.readText())
await app.locator('#next').evaluate((el) => el.scrollIntoView({ block: 'center' }))
await app.screenshot({ path: 'docs/gallery/05-what-now.png' })
await app.setViewportSize({ width: 390, height: 844 })
const overflow = await app.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
await app.locator('#next').evaluate((el) => el.scrollIntoView({ block: 'start' }))
await app.screenshot({ path: 'docs/screens/what-now-390.png' })
console.log(JSON.stringify({ secs, summary: await app.textContent('#sum-big'), overflow390: overflow, draft, ask }, null, 1))
await browser.close()
server.httpServer.close()
