# Reference: rag-advanced

Deep detail for `rag-advanced.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Chunking (where most quality is won/lost)
- Heading-aware/semantic chunking beats fixed-size; keep 10–20% overlap; chunk size tuned to content (dense docs 300–500 tokens, conversational 800+).
- Preserve metadata per chunk: source doc, section path, date, access level — filtering depends on it.
- Chunk IDs are stable and citable — answers cite chunk IDs, traceable to source.

## Retrieval quality ladder (climb only as needed)
1. Vector search alone → 2. **Hybrid** (BM25 + vector, fused with RRF — catches exact terms/SKUs/names vectors miss) → 3. **Reranking** (cross-encoder over top-20 → top-5) when precision matters → 4. Query rewriting (decompose multi-part questions) for complex asks.
Each rung adds latency + cost — justify with eval deltas, not vibes.

## Evaluation (two layers, never conflated)
- **Retrieval evals**: recall@k against a labeled set (question → relevant chunk IDs). If retrieval fails, no prompt fixes it.
- **Answer evals**: groundedness (claims traceable to retrieved chunks), refusal correctness on out-of-scope.
Run both on every chunking/model/prompt change; log deltas.

## Operations
- Embedding model version is pinned; changing it = re-embed EVERYTHING (mixed-model indexes silently degrade) = cost item for grooming.
- Index refresh: incremental upserts by doc hash; deletion propagates (stale chunks about deleted products are a client incident).
- Access control at retrieval time: filter by the requesting user's permissions BEFORE the LLM sees chunks — never rely on the prompt to hide data.
