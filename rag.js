// Visora RAG — thin HTTP client
// Delegates all pipeline work to the FastAPI backend.
// RAG_API_BASE is defined in config.js (e.g. 'http://localhost:8000')

async function queryRAG(machineId, userQuery) {
  try {
    const res = await fetch(`${RAG_API_BASE}/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userQuery,
        machine_id: machineId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      return { answer: err.detail || `Server error (${res.status})`, citations: [] };
    }

    const data = await res.json();

    if (data.insufficient_context) {
      return { answer: data.answer, citations: [] };
    }

    // Map backend citation shape → shape machine.js expects:
    // machine.js reads citations[0].title and citations[0].excerpt
    const citations = (data.citations || []).map(c => ({
      title: c.title || c.source,
      excerpt: c.snippet,
      page: c.page,
      type: c.source_type || 'Manual',
      similarity: c.similarity,
      source_url: c.source_url || '',
    }));

    return { answer: data.answer, citations };
  } catch (err) {
    return {
      answer: `Could not reach the Visora backend at ${RAG_API_BASE}. Make sure the server is running (uvicorn app.main:app --reload).`,
      citations: [],
    };
  }
}
