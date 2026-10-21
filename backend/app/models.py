from typing import Literal, Optional

from pydantic import BaseModel, Field


ScenarioId = Literal["knowledge", "sales", "supply"]
RunStatus = Literal["idle", "running", "done", "needs_approval"]
TraceKind = Literal["plan", "rag", "tool", "approval", "answer"]


class AgentRunRequest(BaseModel):
    scenario_id: ScenarioId = Field(alias="scenarioId")
    prompt: str = Field(min_length=1, max_length=1000)


class KnowledgeImportPathRequest(BaseModel):
    file_path: str = Field(alias="filePath", min_length=1, max_length=2000)
    scope: str = "product"
    owner: str = "用户上传"


class RagInspectRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    scope: str = "all"
    top_k: int = Field(default=5, alias="topK", ge=1, le=12)


class RagInspectResult(BaseModel):
    id: str
    documentId: str
    documentTitle: str
    chunkIndex: int
    content: str
    scope: str
    type: str
    owner: str
    updatedAt: str
    vectorScore: float
    keywordCoverage: float
    combinedScore: float
    matchedTerms: list[str]


class RagInspectResponse(BaseModel):
    query: str
    scope: str
    topK: int
    candidateCount: int
    quality: Literal["strong", "usable", "weak", "missing"]
    recommendation: str
    results: list[RagInspectResult]


class AgentTraceStep(BaseModel):
    id: str
    title: str
    detail: str
    kind: TraceKind
    status: RunStatus
    evidence: Optional[str] = None


class AgentRun(BaseModel):
    id: str
    scenarioId: ScenarioId
    userPrompt: str
    answer: str
    confidence: int
    citations: list[str]
    usedTools: list[str]
    trace: list[AgentTraceStep]
    createdAt: str


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str


class RuntimeConfigResponse(BaseModel):
    llmConfigured: bool
    llmBaseUrl: str
    llmModel: str
    ragTopK: int


class KnowledgeDocumentResponse(BaseModel):
    id: str
    title: str
    type: str
    scope: str
    chunks: int
    owner: str
    updatedAt: str
    source: str
    filePath: Optional[str] = None
    textPath: Optional[str] = None
