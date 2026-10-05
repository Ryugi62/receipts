import { WikipediaSource } from '../../src/adapters/wikipedia'
const w = new WikipediaSource()
const p = await w.page('Eiffel Tower')
console.log(p?.text.slice(0, 400))
