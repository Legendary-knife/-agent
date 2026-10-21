import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]

load_dotenv(ROOT_DIR / ".env")

DATA_DIR = Path(os.getenv("WORKBENCH_DATA_DIR", str(ROOT_DIR / "data"))).expanduser()
DB_PATH = DATA_DIR / "agent_workbench.sqlite3"
UPLOAD_DIR = DATA_DIR / "uploads"
REPO_KNOWLEDGE_DIR = ROOT_DIR / "knowledge-base"
REPO_UPLOAD_DIR = REPO_KNOWLEDGE_DIR / "uploads"
REPO_TEXT_DIR = REPO_KNOWLEDGE_DIR / "extracted"
REPO_MANIFEST_PATH = REPO_KNOWLEDGE_DIR / "manifest.json"


@dataclass(frozen=True)
class Settings:
    llm_base_url: str
    llm_api_key: str
    llm_model: str
    llm_timeout_seconds: float
    rag_top_k: int

    @property
    def llm_configured(self) -> bool:
        return bool(self.llm_base_url and self.llm_api_key and self.llm_model)


def get_settings() -> Settings:
    return Settings(
        llm_base_url=os.getenv("LLM_BASE_URL", "").rstrip("/"),
        llm_api_key=os.getenv("LLM_API_KEY", ""),
        llm_model=os.getenv("LLM_MODEL", ""),
        llm_timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "45")),
        rag_top_k=int(os.getenv("RAG_TOP_K", "5")),
    )
