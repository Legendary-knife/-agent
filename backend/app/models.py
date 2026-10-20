from typing import Literal, Optional

from pydantic import BaseModel, Field


ScenarioId = Literal["knowledge", "sales", "supply"]
RunStatus = Literal["idle", "running", "done", "needs_approval"]
TraceKind = Literal["plan", "rag", "tool", "approval", "answer"]


class AgentRunRequest(BaseModel):
    scenario_id: ScenarioId = Field(alias="scenarioId")
    prompt: str = Field(min_length=1, max_length=1000)


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
