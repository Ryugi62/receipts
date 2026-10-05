// Clean Architecture guard: domain imports only domain; application imports only domain/application. Exit 1 on violation.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const rules = { 'src/domain': ['./'], 'src/application': ['./', '../domain/'] }
let bad = 0
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
for (const [dir, allowed] of Object.entries(rules)) {
  for (const f of walk(dir).filter((x) => x.endsWith('.ts'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/from\s+'([^']+)'/g)) {
      if (!allowed.some((a) => m[1].startsWith(a))) { console.error(`LAYER x ${f} imports ${m[1]}`); bad++ }
    }
    if (/\bfetch\(|localStorage|document\./.test(readFileSync(f, 'utf8'))) { console.error(`LAYER x ${f} does I/O`); bad++ }
  }
}
console.log(bad ? `layers: ${bad} violation(s)` : 'layers: OK (domain <- application <- adapters <- infrastructure/web)')
process.exit(bad ? 1 : 0)
