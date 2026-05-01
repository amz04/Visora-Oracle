from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import MACHINE_DOCUMENTS, PROJECT_ROOT
from app.models import (
    Citation,
    HealthResponse,
    IngestRequest,
    IngestResponse,
    QueryRequest,
    QueryResponse,
)
from app.services.db import collection, embed_model
from app.services.generation import generate_answer
from app.services.ingestion import check_already_indexed, ingest_document
from app.services.retrieval import retrieve_chunks

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health():
    try:
        count = collection.count()
        model_loaded = embed_model is not None
        return HealthResponse(
            status="ok",
            chroma_collection_count=count,
            model_loaded=model_loaded,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest", response_model=IngestResponse)
def ingest(body: IngestRequest):
    if body.machine_id not in MACHINE_DOCUMENTS:
        raise HTTPException(
            status_code=404,
            detail=f"No documents configured for machine_id {body.machine_id}",
        )

    doc_config = MACHINE_DOCUMENTS[body.machine_id]
    all_docs = [doc_config["manual"]] + doc_config.get("reports", [])

    total_chunks = 0
    docs_ingested = 0

    for doc_meta in all_docs:
        pdf_path = PROJECT_ROOT / doc_meta["path"]
        if not pdf_path.exists():
            raise HTTPException(
                status_code=500,
                detail=f"PDF not found on server: {doc_meta['path']}",
            )
        abs_path = str(pdf_path.resolve())
        if not body.force and check_already_indexed(abs_path):
            continue
        try:
            chunks_added = ingest_document(
                pdf_path=pdf_path,
                machine_id=body.machine_id,
                title=doc_meta["title"],
                source_type=doc_meta["source_type"],
            )
            total_chunks += chunks_added
            docs_ingested += 1
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ingestion failed for {pdf_path.name}: {e}")

    return IngestResponse(
        machine_id=body.machine_id,
        documents_ingested=docs_ingested,
        chunks_created=total_chunks,
    )


@router.post("/query", response_model=QueryResponse)
def query(body: QueryRequest):
    if body.machine_id not in MACHINE_DOCUMENTS:
        return QueryResponse(
            answer=(
                "I don't have any documentation loaded for this machine. "
                "Only machines with indexed manuals can be queried."
            ),
            citations=[],
            retrieved_context_count=0,
            insufficient_context=True,
        )

    try:
        chunks = retrieve_chunks(
            query=body.query,
            machine_id=body.machine_id,
            top_k=body.top_k,
            threshold=body.similarity_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval error: {e}")

    try:
        answer = generate_answer(query=body.query, chunks=chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {e}")

    citations = [
        Citation(
            source=c["source"],
            title=c["title"],
            source_type=c["source_type"],
            page=c["page"],
            chunk_index=c["chunk_index"],
            similarity=c["similarity"],
            snippet=c["text"][:500].strip(),
            source_url="/" + Path(c["source_path"]).relative_to(PROJECT_ROOT).as_posix(),
        )
        for c in chunks
    ]

    return QueryResponse(
        answer=answer,
        citations=citations,
        retrieved_context_count=len(chunks),
        insufficient_context=len(chunks) == 0,
    )
