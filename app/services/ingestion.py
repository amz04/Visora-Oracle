from pathlib import Path

import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.services.db import collection, embed_model


def check_already_indexed(abs_path: str) -> bool:
    results = collection.get(where={"source_path": abs_path}, limit=1)
    return len(results["ids"]) > 0


def ingest_document(
    pdf_path: Path,
    machine_id: int,
    title: str,
    source_type: str,
) -> int:
    """Extract, chunk, embed, and store a PDF. Returns number of chunks added."""
    doc = fitz.open(str(pdf_path))
    page_texts: list[dict] = []
    for page_num in range(len(doc)):
        text = doc[page_num].get_text()
        if text.strip():
            page_texts.append({"text": text, "page": page_num + 1})
    doc.close()

    if not page_texts:
        raise ValueError(f"No extractable text found in {pdf_path.name}")

    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=200)

    all_chunks: list[dict] = []
    for page_data in page_texts:
        splits = splitter.split_text(page_data["text"])
        for split_text in splits:
            if split_text.strip():
                all_chunks.append({"text": split_text, "page": page_data["page"]})

    if not all_chunks:
        raise ValueError(f"Chunking produced no usable chunks for {pdf_path.name}")

    texts = [c["text"] for c in all_chunks]
    embeddings = embed_model.encode(texts, batch_size=32, show_progress_bar=False).tolist()

    abs_path_str = str(pdf_path.resolve())
    ids = [f"{abs_path_str}__page{c['page']}__chunk{i}" for i, c in enumerate(all_chunks)]
    metadatas = [
        {
            "machine_id": machine_id,
            "source_path": abs_path_str,
            "source": pdf_path.name,
            "title": title,
            "source_type": source_type,
            "page": c["page"],
            "chunk_index": i,
        }
        for i, c in enumerate(all_chunks)
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )

    return len(all_chunks)
