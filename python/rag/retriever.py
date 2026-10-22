"""
RAG Retriever — TF-IDF based vector search over the knowledge base.
Uses scikit-learn (already a dependency) so no new packages needed.

Supports:
  - Semantic search over the knowledge base
  - Category-filtered retrieval
  - Relevance scoring with configurable threshold
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rag.knowledge_base import get_all_documents

# ── Singleton index ──
_vectorizer = None
_tfidf_matrix = None
_documents = None


def _ensure_index():
    """Build TF-IDF index on first use (lazy initialization)."""
    global _vectorizer, _tfidf_matrix, _documents

    if _tfidf_matrix is not None:
        return

    _documents = get_all_documents()
    corpus = [
        f"{d['category']} {d['source']} {d['text']}"
        for d in _documents
    ]

    _vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),     # unigrams + bigrams for better matching
        max_features=5000,
        sublinear_tf=True,      # apply log normalization
    )
    _tfidf_matrix = _vectorizer.fit_transform(corpus)


def retrieve(
    query: str,
    top_k: int = 5,
    category: str = None,
    threshold: float = 0.08,
) -> list[dict]:
    """
    Retrieve the most relevant knowledge base documents for a query.

    Args:
        query: The search query (user question, risk factor, etc.)
        top_k: Maximum number of results to return
        category: Optional filter (regulation, guideline, actuarial, platform, faq)
        threshold: Minimum similarity score to include (0-1)

    Returns:
        List of dicts with: id, text, source, category, score
    """
    _ensure_index()

    query_vec = _vectorizer.transform([query])
    similarities = cosine_similarity(query_vec, _tfidf_matrix).flatten()

    # Apply category filter if specified
    if category:
        for i, doc in enumerate(_documents):
            if doc["category"] != category:
                similarities[i] = 0.0

    # Get top-K above threshold
    top_indices = np.argsort(similarities)[::-1][:top_k * 2]  # over-fetch then filter

    results = []
    for idx in top_indices:
        score = float(similarities[idx])
        if score < threshold:
            continue
        doc = _documents[idx]
        results.append({
            "id": doc["id"],
            "text": doc["text"],
            "source": doc["source"],
            "category": doc["category"],
            "score": round(score, 4),
        })
        if len(results) >= top_k:
            break

    return results


def retrieve_for_adverse_action(risk_factors: list[str], policy_type: str) -> list[dict]:
    """
    Retrieve regulation-backed justifications for adverse action reasons.

    Args:
        risk_factors: List of factor names (e.g., ["smoking", "bmi", "age"])
        policy_type: health, auto, life, property

    Returns:
        List of relevant regulation/guideline documents
    """
    query = f"{policy_type} insurance adverse action decline reject {' '.join(risk_factors)} regulation IRDAI guidelines"
    return retrieve(query, top_k=4, category=None, threshold=0.05)


def retrieve_for_explanation(
    policy_type: str,
    risk_score: float,
    decision: str,
    top_factors: list[str],
) -> list[dict]:
    """
    Retrieve context for grounding LLM explanations.

    Args:
        policy_type: health, auto, life, property
        risk_score: 0-100 score
        decision: approve, refer, decline
        top_factors: List of top contributing factor names

    Returns:
        Relevant actuarial + guideline + regulation documents
    """
    query = f"{policy_type} insurance risk score {risk_score} {decision} {' '.join(top_factors)} premium actuarial underwriting"
    return retrieve(query, top_k=5, threshold=0.05)


def retrieve_for_chat(user_message: str, page: str = "", role: str = "") -> list[dict]:
    """
    Retrieve relevant knowledge for grounding chat responses.

    Args:
        user_message: The user's question
        page: Current page path (for context)
        role: User role (applicant, underwriter, admin)

    Returns:
        Top relevant documents across all categories
    """
    # Enrich query with page context
    context_hints = ""
    if "fairness" in page:
        context_hints = "fairness bias audit gender age income disparity"
    elif "assess" in page:
        context_hints = "assessment risk scoring underwriting"
    elif "history" in page:
        context_hints = "assessment history decisions"
    elif "analytics" in page:
        context_hints = "analytics metrics performance"

    query = f"{user_message} {context_hints} {role} insurance underwriting"
    return retrieve(query, top_k=4, threshold=0.06)


def format_rag_context(documents: list[dict]) -> str:
    """
    Format retrieved documents into a context block for LLM injection.

    Returns a formatted string that can be prepended to the LLM prompt.
    """
    if not documents:
        return ""

    lines = ["## Relevant Reference Documents (RAG Retrieved)"]
    lines.append("Use these as grounding — cite the source when referencing specific facts.\n")

    for i, doc in enumerate(documents, 1):
        lines.append(f"**[{i}] {doc['source']}** (relevance: {doc['score']:.0%})")
        lines.append(f"> {doc['text']}\n")

    return "\n".join(lines)
