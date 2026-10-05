// Live smoke against the deployed site (default: GitHub Pages): fresh browser profile = first-visit model download included.
// Usage: node scripts/smoke-live.mjs [url] [sample]
import { chromium } from 'playwright'
const url = process.argv[2] ?? 'https://ryugi62.github.io/receipts/'
const sample = process.argv[3] ?? 'Eiffel Tower'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const t0 = Date.now()
await page.goto(url)
await page.click(`.chip[data-sample="${sample}"]`)
await page.click('#check')
await page.waitForSelector('#summary:not([hidden])', { timeout: 300000 })
const secs = ((Date.now() - t0) / 1000).toFixed(0)
console.log(`${url} · ${sample}: ${await page.textContent('#sum-big')} — ${await page.textContent('#sum-line')} — first visit incl. model download ${secs} s`)
await browser.close()
