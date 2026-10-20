from io import BytesIO

from docx import Document
from pypdf import PdfReader


def extract_text(filename: str, content: bytes) -> tuple[str, str]:
    suffix = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

    if suffix in {"txt", "md", "csv", "html"}:
        return content.decode("utf-8", errors="ignore"), suffix.upper()

    if suffix == "pdf":
        reader = PdfReader(BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages), "PDF"

    if suffix == "docx":
        document = Document(BytesIO(content))
        paragraphs = [paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()]
        return "\n".join(paragraphs), "DOCX"

    raise ValueError("暂时只支持 txt、md、csv、html、pdf、docx 文件")
