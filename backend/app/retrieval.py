import hashlib
import math
import re
from collections import Counter


VECTOR_DIMENSIONS = 384


def tokenize(text: str) -> list[str]:
    normalized = text.lower()
    words = re.findall(r"[a-z0-9_]+", normalized)
    chinese_chars = re.findall(r"[\u4e00-\u9fff]", normalized)
    chinese_bigrams = [
        "".join(chinese_chars[index : index + 2])
        for index in range(max(len(chinese_chars) - 1, 0))
    ]
    return words + chinese_chars + chinese_bigrams


def embed_text(text: str) -> list[float]:
    tokens = tokenize(text)
    if not tokens:
        return [0.0] * VECTOR_DIMENSIONS

    counts = Counter(tokens)
    vector = [0.0] * VECTOR_DIMENSIONS
    for token, count in counts.items():
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % VECTOR_DIMENSIONS
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[index] += sign * (1.0 + math.log(count))

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    return sum(a * b for a, b in zip(left, right))


def chunk_text(text: str, size: int = 900, overlap: int = 140) -> list[str]:
    compact_text = re.sub(r"\n{3,}", "\n\n", text.strip())
    if not compact_text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(compact_text):
        end = min(start + size, len(compact_text))
        slice_text = compact_text[start:end]
        if end < len(compact_text):
            split_at = max(slice_text.rfind("\n"), slice_text.rfind("。"), slice_text.rfind("."))
            if split_at > size * 0.55:
                end = start + split_at + 1
                slice_text = compact_text[start:end]
        chunks.append(slice_text.strip())
        if end >= len(compact_text):
            break
        start = max(end - overlap, start + 1)

    return [chunk for chunk in chunks if chunk]
