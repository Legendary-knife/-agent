from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from backend.app.agent_service import create_agent_run
from backend.app.config import get_settings
from backend.app.data import BUSINESS_RECORDS, SCENARIOS, TOOL_DEFINITIONS
from backend.app.document_parser import extract_text
from backend.app.models import (
    AgentRun,
    AgentRunRequest,
    HealthResponse,
    KnowledgeDocumentResponse,
    RuntimeConfigResponse,
)
from backend.app.storage import init_database, list_documents, save_document, save_uploaded_file

app = FastAPI(
    title="Enterprise AI Agent Workbench API",
    version="0.1.0",
    description="Demo backend for RAG, tool calling, traceable enterprise Agent workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

RUN_HISTORY: list[AgentRun] = []


@app.on_event("startup")
def startup() -> None:
    init_database()


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="agent-workbench-api", version="0.1.0")


@app.get("/api/config", response_model=RuntimeConfigResponse)
def runtime_config() -> RuntimeConfigResponse:
    settings = get_settings()
    return RuntimeConfigResponse(
        llmConfigured=settings.llm_configured,
        llmBaseUrl=settings.llm_base_url,
        llmModel=settings.llm_model,
        ragTopK=settings.rag_top_k,
    )


@app.get("/api/scenarios")
def list_scenarios() -> list[dict]:
    return SCENARIOS


@app.get("/api/knowledge", response_model=list[KnowledgeDocumentResponse])
def list_knowledge_documents() -> list[dict]:
    return list_documents()


@app.post("/api/knowledge/upload", response_model=KnowledgeDocumentResponse)
async def upload_knowledge_document(
    file: UploadFile = File(...),
    scope: str = Form("product"),
    owner: str = Form("用户上传"),
) -> dict:
    try:
        content = await file.read()
        filename = file.filename or "uploaded.txt"
        text, file_type = extract_text(filename, content)
        file_path = save_uploaded_file(filename, content)
        return save_document(
            title=filename,
            file_type=file_type,
            scope=scope,
            owner=owner,
            source="upload",
            text=text,
            file_path=file_path,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/api/tools")
def list_tools() -> list[dict]:
    return TOOL_DEFINITIONS


@app.get("/api/business-records")
def list_business_records() -> list[dict]:
    return BUSINESS_RECORDS


@app.get("/api/runs", response_model=list[AgentRun])
def list_runs() -> list[AgentRun]:
    return RUN_HISTORY[:8]


@app.post("/api/runs", response_model=AgentRun)
async def create_run(request: AgentRunRequest) -> AgentRun:
    try:
        run = await create_agent_run(request)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    RUN_HISTORY.insert(0, run)
    del RUN_HISTORY[8:]
    return run
