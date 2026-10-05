// Adapters: transformers.js (ONNX, runs in the browser and in Node) for NLI and sentence embeddings.
import type { NliModel, Ranker } from '../application/checkAnswer'
import type { Inference } from '../domain/verdict'

export const NLI_MODEL = 'Xenova/nli-deberta-v3-xsmall'
export const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2'

type Lib = typeof import('@huggingface/transformers')
let lib: Promise<Lib> | null = null
const load = () => (lib ??= import('@huggingface/transformers'))

export type Progress = (p: { file?: string; progress?: number; status: string }) => void

/** Map raw logits to entail/contradict/neutral using the model's own id2label (label order differs between models). */
export function toInference(logits: number[], id2label: Record<string, string>): Inference {
  const m = Math.max(...logits)
  const exps = logits.map((x) => Math.exp(x - m))
  const z = exps.reduce((a, b) => a + b, 0)
  const out: Inference = { entail: 0, contradict: 0, neutral: 0 }
  exps.forEach((e, i) => {
    const name = String(id2label[i] ?? id2label[String(i)]).toLowerCase()
    const p = e / z
    if (name.startsWith('entail')) out.entail = p
    else if (name.startsWith('contra')) out.contradict = p
    else out.neutral = p
  })
  return out
}

export class TransformersNli implements NliModel {
  private ready: Promise<{ tok: any; model: any }> | null = null
  constructor(private readonly id = NLI_MODEL, private readonly dtype: string = 'q8', private readonly onProgress?: Progress) {}
  private init() {
    return (this.ready ??= load().then(async (t) => ({
      tok: await t.AutoTokenizer.from_pretrained(this.id, { progress_callback: this.onProgress as any }),
      model: await t.AutoModelForSequenceClassification.from_pretrained(this.id, { dtype: this.dtype as any, progress_callback: this.onProgress as any }),
    })))
  }
  async infer(pairs: { premise: string; hypothesis: string }[]): Promise<Inference[]> {
    if (!pairs.length) return []
    const { tok, model } = await this.init()
    // One batched forward pass for all pairs (padding to the longest); ~3–5× faster than one pair at a time.
    const enc = await tok(pairs.map((p) => p.premise), { text_pair: pairs.map((p) => p.hypothesis), padding: true, truncation: true, max_length: 256 })
    const { logits } = await model(enc)
    const [n, k] = logits.dims as number[]
    const data = logits.data as Float32Array
    const out: Inference[] = []
    for (let i = 0; i < n; i++) out.push(toInference(Array.from(data.subarray(i * k, (i + 1) * k)), model.config.id2label))
    return out
  }
}

export class TransformersRanker implements Ranker {
  private ready: Promise<any> | null = null
  constructor(private readonly id = EMBED_MODEL, private readonly onProgress?: Progress) {}
  private init() {
    return (this.ready ??= load().then((t) => t.pipeline('feature-extraction', this.id, { dtype: 'q8' as any, progress_callback: this.onProgress as any })))
  }
  private memo = new Map<string, Float32Array>()
  private async embedAll(texts: string[]): Promise<Float32Array[]> {
    const missing = [...new Set(texts.filter((t) => !this.memo.has(t)))]
    if (missing.length) {
      const embed = await this.init()
      for (let i = 0; i < missing.length; i += 64) {
        const batch = missing.slice(i, i + 64)
        const out = await embed(batch, { pooling: 'mean', normalize: true })
        const dim = out.dims[1]
        const data = out.data as Float32Array
        batch.forEach((t, j) => this.memo.set(t, data.slice(j * dim, (j + 1) * dim)))
      }
    }
    return texts.map((t) => this.memo.get(t)!)
  }
  async similarities(claim: string, sentences: string[]): Promise<number[]> {
    if (!sentences.length) return []
    const [c, ...vs] = await this.embedAll([claim, ...sentences])
    return vs.map((v) => {
      let dot = 0
      for (let k = 0; k < c.length; k++) dot += c[k] * v[k]
      return dot
    })
  }
}
