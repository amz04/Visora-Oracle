from groq import Groq
from app.config import settings, ANSWER_DISCLAIMER

_groq_client: Groq | None = None


def _get_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
    return _groq_client


_SYSTEM_PROMPT = """You are a technical assistant for an industrial machinery knowledge platform called Visora.
Answer using the provided context. You may synthesize and infer from the context (e.g. symptoms described in a recovery procedure imply what to look for), but do not introduce facts that have no basis in the context.
If the context is genuinely insufficient to address the question at all, say so briefly — but if the context is partially relevant, extract and present what IS useful.
Include citations using [source, p. N] after claims that rely on retrieved context.
Be concise but technically precise."""


def generate_answer(query: str, chunks: list[dict]) -> str:
    if not chunks:
        return (
            "The available documents do not contain enough relevant information to answer this question."
            + ANSWER_DISCLAIMER
        )

    formatted_context = "\n\n".join(
        f"[{i + 1}] ({chunk['title']}, p. {chunk['page']})\n{chunk['text']}"
        for i, chunk in enumerate(chunks)
    )

    user_message = (
        f"Question:\n{query}\n\n"
        f"Context:\n{formatted_context}\n\n"
        "Answer:"
    )

    client = _get_client()
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.2,
        max_tokens=512,
    )

    answer = response.choices[0].message.content.strip()
    return answer + ANSWER_DISCLAIMER
