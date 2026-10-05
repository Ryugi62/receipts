import { TransformersNli } from '../../src/adapters/transformers'
const m = new TransformersNli()
const pairs = [
  { premise: 'Marie Curie won the Nobel Prize in Physics in 1903.', hypothesis: 'Marie Curie won a Nobel Prize.' },
  { premise: 'The river flows north.', hypothesis: 'Marie Curie won a Nobel Prize.' },
  { premise: 'Marie Curie was born in 1867 in Warsaw, the capital of Poland under Russian rule at that time.', hypothesis: 'Marie Curie was born in 1900.' },
]
const batched = await m.infer(pairs)
const single = [] as any[]
for (const p of pairs) single.push((await m.infer([p]))[0])
for (let i = 0; i < pairs.length; i++) console.log(i, batched[i].entail.toFixed(3), single[i].entail.toFixed(3), batched[i].contradict.toFixed(3), single[i].contradict.toFixed(3))
