from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.agent_service import create_agent_run
from backend.app.data import BUSINESS_RECORDS, KNOWLEDGE_DOCUMENTS, SCENARIOS, TOOL_DEFINITIONS
from backend.app.models import AgentRun, AgentRunRequest, HealthResponse

app = FastAPI(
    title="Enterprise AI Agent Workbench API",
    version="0.1.0",
    description="Demo backend for RAG, tool calling, traceable enterprise Agent workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

RUN_HISTORY: list[AgentRun] = []


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="agent-workbench-api", version="0.1.0")


@app.get("/api/scenarios")
def list_scenarios() -> list[dict]:
    return SCENARIOS


@app.get("/api/knowledge")
def list_knowledge_documents() -> list[dict]:
    return [{key: value for key, value in document.items() if key != "keywords"} for document in KNOWLEDGE_DOCUMENTS]


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
def create_run(request: AgentRunRequest) -> AgentRun:
    try:
        run = create_agent_run(request)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    RUN_HISTORY.insert(0, run)
    del RUN_HISTORY[8:]
    return run
