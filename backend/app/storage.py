import json
import re
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import uuid4

from backend.app.config import (
    DATA_DIR,
    DB_PATH,
    REPO_KNOWLEDGE_DIR,
    REPO_MANIFEST_PATH,
    REPO_TEXT_DIR,
    REPO_UPLOAD_DIR,
    ROOT_DIR,
    UPLOAD_DIR,
)
from backend.app.data import KNOWLEDGE_DOCUMENTS
from backend.app.retrieval import chunk_text, cosine_similarity, embed_text, tokenize


DEMO_TEXT_BY_TITLE = {
    "海外渠道商账期政策": (
        "海外渠道商可申请账期，但必须满足渠道等级、历史回款、合同主体和财务风控要求。"
        "申请材料包括近 12 个月采购额、信用证明、预计回款周期、区域负责人意见和财务审核意见。"
        "高风险客户只能生成审批草稿，不能自动修改授信额度。"
    ),
    "A100 控制器产品手册": (
        "A100 控制器适用于供应链追踪、设备状态采集和工业数据采集场景。"
        "对外材料应包含核心参数、稳定性说明、欧盟合规说明、交付周期和售后支持边界。"
        "涉及产品参数的问题应引用产品手册，不应只给销售口径。"
    ),
    "欧洲客户开发话术库": (
        "德国汽车零部件客户通常关注可靠性、交付稳定性、合规文件和技术响应速度。"
        "开发信建议先提出技术交流邀约，不要首次触达就直接报价。"
        "CRM 跟进记录需要写明客户阶段、下一步动作和负责人。"
    ),
    "供应商交期与安全库存表": (
        "A100 控制器安全库存为 900 件。本周未交付订单 1280 件，华东仓现货 420 件，在途 300 件。"
        "当现货加在途仍低于安全库存和未交付需求时，应生成补采建议。"
        "采购审批材料需要包含订单金额、库存缺口、在途数量和供应商交期。"
    ),
}


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                scope TEXT NOT NULL,
                owner TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                source TEXT NOT NULL,
                file_path TEXT,
                text_path TEXT
            )
            """
        )
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(documents)").fetchall()
        }
        if "file_path" not in columns:
            connection.execute("ALTER TABLE documents ADD COLUMN file_path TEXT")
        if "text_path" not in columns:
            connection.execute("ALTER TABLE documents ADD COLUMN text_path TEXT")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                embedding TEXT NOT NULL,
                FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
            """
        )
        connection.commit()

    seed_demo_documents()


def seed_demo_documents() -> None:
    with get_connection() as connection:
        document_count = connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        if document_count > 0:
            return

    for document in KNOWLEDGE_DOCUMENTS:
        title = str(document["title"])
        save_document(
            title=title,
            file_type=str(document["type"]),
            scope=str(document["scope"]),
            owner=str(document["owner"]),
            source="demo",
            text=DEMO_TEXT_BY_TITLE.get(title, title),
            document_id=str(document["id"]),
            updated_at=str(document["updatedAt"]),
        )


def sanitize_filename(filename: str) -> str:
    basename = Path(filename).name or "uploaded.txt"
    return re.sub(r"[^0-9A-Za-z\u4e00-\u9fff._-]+", "_", basename)


def create_document_id() -> str:
    return f"doc-{uuid4().hex[:12]}"


def save_uploaded_file(filename: str, content: bytes) -> str:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex[:12]}_{sanitize_filename(filename)}"
    stored_path = UPLOAD_DIR / stored_name
    stored_path.write_bytes(content)
    return str(stored_path.relative_to(ROOT_DIR))


def save_repository_knowledge_files(
    document_id: str,
    filename: str,
    content: bytes,
    extracted_text: str,
) -> tuple[str, str]:
    REPO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    REPO_TEXT_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = sanitize_filename(filename)
    raw_path = REPO_UPLOAD_DIR / f"{document_id}_{safe_name}"
    text_stem = Path(safe_name).stem or document_id
    text_path = REPO_TEXT_DIR / f"{document_id}_{text_stem}.txt"

    raw_path.write_bytes(content)
    text_path.write_text(extracted_text, encoding="utf-8")

    return str(raw_path.relative_to(ROOT_DIR)), str(text_path.relative_to(ROOT_DIR))


def write_repository_manifest() -> None:
    REPO_KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, title, type, scope, owner, updated_at, source, file_path, text_path
            FROM documents
            ORDER BY updated_at DESC
            """
        ).fetchall()

    payload = [
        {
            "id": row["id"],
            "title": row["title"],
            "type": row["type"],
            "scope": row["scope"],
            "owner": row["owner"],
            "updatedAt": row["updated_at"],
            "source": row["source"],
            "filePath": row["file_path"],
            "textPath": row["text_path"],
        }
        for row in rows
        if row["source"] == "upload" and row["file_path"] and row["text_path"]
    ]

    REPO_MANIFEST_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def save_document(
    title: str,
    file_type: str,
    scope: str,
    owner: str,
    source: str,
    text: str,
    document_id: Optional[str] = None,
    updated_at: Optional[str] = None,
    file_path: Optional[str] = None,
    text_path: Optional[str] = None,
) -> dict:
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("文档没有可解析的文本内容")

    now = updated_at or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    resolved_document_id = document_id or create_document_id()
    normalized_type = Path(title).suffix.replace(".", "").upper() or file_type.upper()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT OR REPLACE INTO documents (id, title, type, scope, owner, updated_at, source, file_path, text_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (resolved_document_id, title, normalized_type, scope, owner, now, source, file_path, text_path),
        )
        connection.execute("DELETE FROM chunks WHERE document_id = ?", (resolved_document_id,))
        for index, chunk in enumerate(chunks):
            connection.execute(
                """
                INSERT INTO chunks (id, document_id, chunk_index, content, embedding)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    f"chunk-{uuid4().hex[:12]}",
                    resolved_document_id,
                    index,
                    chunk,
                    json.dumps(embed_text(chunk)),
                ),
            )
        connection.commit()

    return {
        "id": resolved_document_id,
        "title": title,
        "type": normalized_type,
        "scope": scope,
        "chunks": len(chunks),
        "owner": owner,
        "updatedAt": now,
        "source": source,
        "filePath": file_path,
        "textPath": text_path,
    }


def list_documents() -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT d.id, d.title, d.type, d.scope, d.owner, d.updated_at, d.source, d.file_path, d.text_path, COUNT(c.id) AS chunks
            FROM documents d
            LEFT JOIN chunks c ON c.document_id = d.id
            GROUP BY d.id
            ORDER BY d.updated_at DESC
            """
        ).fetchall()

    return [
        {
            "id": row["id"],
            "title": row["title"],
            "type": row["type"],
            "scope": row["scope"],
            "chunks": row["chunks"],
            "owner": row["owner"],
            "updatedAt": row["updated_at"],
            "source": row["source"],
            "filePath": row["file_path"],
            "textPath": row["text_path"],
        }
        for row in rows
    ]


def search_chunks(query: str, top_k: int) -> list[dict]:
    query_embedding = embed_text(query)
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT c.id, c.document_id, c.chunk_index, c.content, c.embedding,
                   d.title AS document_title, d.scope, d.type
            FROM chunks c
            JOIN documents d ON d.id = c.document_id
            """
        ).fetchall()

    scored_chunks: list[tuple[float, sqlite3.Row]] = []
    for row in rows:
        embedding = json.loads(row["embedding"])
        score = cosine_similarity(query_embedding, embedding)
        if score > 0:
            scored_chunks.append((score, row))

    return [
        {
            "id": row["id"],
            "documentId": row["document_id"],
            "documentTitle": row["document_title"],
            "chunkIndex": row["chunk_index"],
            "content": row["content"],
            "score": round(score, 4),
            "scope": row["scope"],
            "type": row["type"],
        }
        for score, row in sorted(scored_chunks, key=lambda item: item[0], reverse=True)[:top_k]
    ]


def inspect_retrieval(query: str, top_k: int = 5, scope: str = "all") -> dict:
    query_embedding = embed_text(query)
    query_terms = set(tokenize(query))
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT c.id, c.document_id, c.chunk_index, c.content, c.embedding,
                   d.title AS document_title, d.scope, d.type, d.owner, d.updated_at
            FROM chunks c
            JOIN documents d ON d.id = c.document_id
            """
        ).fetchall()

    scoped_rows = [row for row in rows if scope == "all" or row["scope"] == scope]
    inspected: list[dict] = []
    for row in scoped_rows:
        embedding = json.loads(row["embedding"])
        vector_score = cosine_similarity(query_embedding, embedding)
        chunk_terms = set(tokenize(row["content"]))
        matched_terms = sorted(query_terms & chunk_terms)
        keyword_coverage = len(matched_terms) / max(len(query_terms), 1)
        combined_score = (vector_score * 0.72) + (keyword_coverage * 0.28)
        if vector_score <= 0 and not matched_terms:
            continue
        inspected.append(
            {
                "id": row["id"],
                "documentId": row["document_id"],
                "documentTitle": row["document_title"],
                "chunkIndex": row["chunk_index"],
                "content": row["content"],
                "scope": row["scope"],
                "type": row["type"],
                "owner": row["owner"],
                "updatedAt": row["updated_at"],
                "vectorScore": round(vector_score, 4),
                "keywordCoverage": round(keyword_coverage, 4),
                "combinedScore": round(combined_score, 4),
                "matchedTerms": matched_terms[:12],
            }
        )

    unique_results: list[dict] = []
    seen_results: set[tuple[str, int, str]] = set()
    for item in sorted(inspected, key=lambda chunk: chunk["combinedScore"], reverse=True):
        key = (item["documentTitle"], item["chunkIndex"], item["content"])
        if key in seen_results:
            continue
        seen_results.add(key)
        unique_results.append(item)
        if len(unique_results) >= top_k:
            break

    results = unique_results
    top_score = results[0]["combinedScore"] if results else 0
    if not results:
        quality = "missing"
        recommendation = "没有命中知识片段。先上传相关资料，或把问题改得更接近文档里的关键词。"
    elif top_score >= 0.42 and len(results) >= 3:
        quality = "strong"
        recommendation = "召回质量较好。可以直接运行 Agent，并检查最终回答是否引用了前几条来源。"
    elif top_score >= 0.24:
        quality = "usable"
        recommendation = "召回可用但不算强。建议补充同义词、业务对象或限定资料范围，提高命中精度。"
    else:
        quality = "weak"
        recommendation = "召回偏弱。建议换更具体的问题，或补充结构更清晰的知识文件。"

    return {
        "query": query,
        "scope": scope,
        "topK": top_k,
        "candidateCount": len(scoped_rows),
        "quality": quality,
        "recommendation": recommendation,
        "results": results,
    }
