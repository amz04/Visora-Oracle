from app.config import settings
from app.services.db import collection, embed_model, rerank_model


def retrieve_chunks(
    query: str,
    machine_id: int,
    top_k: int,
    threshold: float,
) -> list[dict]:
    """Embed query, search ChromaDB, filter by threshold, then re-rank."""
    query_embedding = embed_model.encode([query]).tolist()[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"machine_id": machine_id},
        include=["documents", "metadatas", "distances"],
    )

    chunks: list[dict] = []
    if not results["ids"] or not results["ids"][0]:
        return chunks

    for doc, meta, distance in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        # ChromaDB cosine space: distance = 1 - cosine_similarity
        similarity = 1.0 - distance
        if similarity < threshold:
            continue
        chunks.append(
            {
                "text": doc,
                "source": meta.get("source", ""),
                "title": meta.get("title", ""),
                "source_type": meta.get("source_type", ""),
                "page": meta.get("page", 0),
                "chunk_index": meta.get("chunk_index", 0),
                "similarity": round(similarity, 4),
                "source_path": meta.get("source_path", ""),
            }
        )

    if len(chunks) <= 1:
        return chunks

    # Cross-encoder re-ranking: score every (query, chunk) pair and keep the best.
    pairs = [(query, c["text"]) for c in chunks]
    rerank_scores = rerank_model.predict(pairs)
    for chunk, score in zip(chunks, rerank_scores):
        chunk["rerank_score"] = float(score)

    chunks.sort(key=lambda x: x["rerank_score"], reverse=True)

    # Deduplicate by page — keep only the highest-scoring chunk per page
    # so the same page never appears twice in the references.
    seen_pages: set[tuple] = set()
    deduped: list[dict] = []
    for chunk in chunks:
        key = (chunk["source_path"], chunk["page"])
        if key not in seen_pages:
            seen_pages.add(key)
            deduped.append(chunk)

    return deduped[: settings.RAG_RERANK_TOP_K]
