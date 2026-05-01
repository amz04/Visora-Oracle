from pydantic import BaseModel, Field
from app.config import settings


class QueryRequest(BaseModel):
    query: str
    machine_id: int
    top_k: int = Field(default=settings.RAG_TOP_K, ge=1, le=20)
    similarity_threshold: float = Field(default=settings.RAG_SIMILARITY_THRESHOLD, ge=0.0, le=1.0)


class IngestRequest(BaseModel):
    machine_id: int
    force: bool = False


class Citation(BaseModel):
    source: str
    title: str
    source_type: str
    page: int
    chunk_index: int
    similarity: float
    snippet: str
    source_url: str


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation]
    retrieved_context_count: int
    insufficient_context: bool


class IngestResponse(BaseModel):
    machine_id: int
    documents_ingested: int
    chunks_created: int


class HealthResponse(BaseModel):
    status: str
    chroma_collection_count: int
    model_loaded: bool
