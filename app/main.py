from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import MACHINE_DOCUMENTS, PROJECT_ROOT
from app.routers.rag import router as rag_router
from app.services.ingestion import check_already_indexed, ingest_document


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[visora] Loading embedding model and ChromaDB...")
    # db.py singletons are initialized on import — already done by the time lifespan runs.

    print("[visora] Running startup ingestion check...")
    for machine_id, doc_config in MACHINE_DOCUMENTS.items():
        all_docs = [doc_config["manual"]] + doc_config.get("reports", [])
        for doc_meta in all_docs:
            pdf_path: Path = PROJECT_ROOT / doc_meta["path"]
            if not pdf_path.exists():
                print(f"[visora] WARNING — PDF not found, skipping: {doc_meta['path']}")
                continue
            abs_path = str(pdf_path.resolve())
            if check_already_indexed(abs_path):
                print(f"[visora] Already indexed: {pdf_path.name}")
            else:
                print(f"[visora] Ingesting: {pdf_path.name} (machine {machine_id})...")
                try:
                    count = ingest_document(
                        pdf_path=pdf_path,
                        machine_id=machine_id,
                        title=doc_meta["title"],
                        source_type=doc_meta["source_type"],
                    )
                    print(f"[visora] Done — {count} chunks stored for {pdf_path.name}")
                except Exception as e:
                    print(f"[visora] ERROR ingesting {pdf_path.name}: {e}")

    print("[visora] Ready.")
    yield


app = FastAPI(title="Visora RAG API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag_router, prefix="/rag", tags=["RAG"])

# Serve the entire project root as static files.
# API routes registered above take priority over this catch-all mount.
app.mount("/", StaticFiles(directory=str(PROJECT_ROOT), html=True), name="static")
