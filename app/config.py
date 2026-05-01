from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    CHROMA_PERSIST_DIR: str = "./app/data/chroma"
    CHROMA_COLLECTION_NAME: str = "visora_documents"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    RAG_SIMILARITY_THRESHOLD: float = 0.35
    RAG_TOP_K: int = 12        # candidates fetched before re-ranking
    RAG_RERANK_TOP_K: int = 3  # chunks kept after re-ranking


settings = Settings()

PROJECT_ROOT = Path(__file__).parent.parent

# Maps machine IDs to their associated documents (manuals + reports).
# PDFs stay in assets/ — paths are relative to PROJECT_ROOT.
MACHINE_DOCUMENTS: dict[int, dict] = {
    1: {
        "manual": {
            "path": "assets/manuals/CNC-Milling-Machine-Manual-2023.pdf",
            "title": "CNC Milling Machine Manual",
            "source_type": "Manual",
        },
        "reports": [
            {
                "path": "assets/reports/CNC-Report-1.pdf",
                "title": "CNC Maintenance Report 1",
                "source_type": "Maintenance Report",
            },
            {
                "path": "assets/reports/CNC-Report-2.pdf",
                "title": "CNC Maintenance Report 2",
                "source_type": "Maintenance Report",
            },
        ],
    },
    2: {
        "manual": {
            "path": "assets/manuals/Belt-Conveyor-Manual-2022.pdf",
            "title": "Belt Conveyor System Manual",
            "source_type": "Manual",
        },
        "reports": [
            {
                "path": "assets/reports/Conveyer-belt-report-1.pdf",
                "title": "Conveyor Belt Maintenance Report",
                "source_type": "Maintenance Report",
            },
        ],
    },
}

ANSWER_DISCLAIMER = (
    "\n\n---\n"
    "*This answer is based on the available technical documentation. "
    "Always consult a qualified technician before performing maintenance.*"
)
