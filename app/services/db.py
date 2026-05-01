import chromadb
from sentence_transformers import CrossEncoder, SentenceTransformer
from app.config import settings

# Module-level singletons — initialized once when this module is first imported.
# All services import from here to share the same model and collection handle.

embed_model: SentenceTransformer = SentenceTransformer(settings.EMBEDDING_MODEL)
rerank_model: CrossEncoder = CrossEncoder(settings.RERANKER_MODEL)

chroma_client: chromadb.PersistentClient = chromadb.PersistentClient(
    path=settings.CHROMA_PERSIST_DIR
)

collection: chromadb.Collection = chroma_client.get_or_create_collection(
    name=settings.CHROMA_COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"},
)
