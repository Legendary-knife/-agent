import asyncio
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

import backend.app.storage as storage
from backend.app.agent_service import create_agent_run
from backend.app.models import AgentRunRequest
from backend.app.storage import init_database, save_document, search_chunks


class AgentServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.original_paths = {
            "DATA_DIR": storage.DATA_DIR,
            "DB_PATH": storage.DB_PATH,
            "UPLOAD_DIR": storage.UPLOAD_DIR,
            "REPO_KNOWLEDGE_DIR": storage.REPO_KNOWLEDGE_DIR,
            "REPO_UPLOAD_DIR": storage.REPO_UPLOAD_DIR,
            "REPO_TEXT_DIR": storage.REPO_TEXT_DIR,
            "REPO_MANIFEST_PATH": storage.REPO_MANIFEST_PATH,
        }
        temp_root = Path(self.temp_dir.name)
        storage.DATA_DIR = temp_root / "data"
        storage.DB_PATH = storage.DATA_DIR / "agent_workbench.sqlite3"
        storage.UPLOAD_DIR = storage.DATA_DIR / "uploads"
        storage.REPO_KNOWLEDGE_DIR = temp_root / "knowledge-base"
        storage.REPO_UPLOAD_DIR = storage.REPO_KNOWLEDGE_DIR / "uploads"
        storage.REPO_TEXT_DIR = storage.REPO_KNOWLEDGE_DIR / "extracted"
        storage.REPO_MANIFEST_PATH = storage.REPO_KNOWLEDGE_DIR / "manifest.json"
        self.env_patcher = patch.dict(
            "os.environ",
            {
                "LLM_BASE_URL": "",
                "LLM_API_KEY": "",
                "LLM_MODEL": "",
            },
        )
        self.env_patcher.start()
        init_database()

    def tearDown(self) -> None:
        self.env_patcher.stop()
        for key, value in self.original_paths.items():
            setattr(storage, key, value)
        self.temp_dir.cleanup()

    def test_supply_run_contains_trace_tools_and_citations(self) -> None:
        run = asyncio.run(
            create_agent_run(
                AgentRunRequest(scenarioId="supply", prompt="本周 A100 控制器是否有缺货风险？")
            )
        )

        self.assertEqual(run.scenarioId, "supply")
        self.assertGreaterEqual(len(run.citations), 1)
        self.assertIn("库存水位查询", run.usedTools)
        self.assertEqual([step.kind for step in run.trace], ["plan", "rag", "tool", "approval", "answer"])
        self.assertEqual(run.trace[3].status, "needs_approval")
        self.assertIn("未配置 LLM", run.answer)

    def test_answers_change_with_prompt_focus(self) -> None:
        credit_run = asyncio.run(
            create_agent_run(
                AgentRunRequest(scenarioId="knowledge", prompt="海外渠道商能不能申请账期？")
            )
        )
        product_run = asyncio.run(
            create_agent_run(
                AgentRunRequest(scenarioId="knowledge", prompt="A100 控制器有哪些产品参数和合规限制？")
            )
        )

        self.assertNotEqual(credit_run.citations, product_run.citations)
        self.assertIn("账期审批", credit_run.trace[0].detail)
        self.assertIn("产品资料", product_run.trace[0].detail)

    def test_uploaded_document_is_searchable(self) -> None:
        save_document(
            title="售后服务政策.md",
            file_type="MD",
            scope="policy",
            owner="测试",
            source="upload",
            text="售后服务要求：客户提交工单后，技术支持需要在 24 小时内响应，并在 72 小时内给出处理方案。",
        )

        chunks = search_chunks("客户工单多久响应", top_k=3)

        self.assertTrue(any("售后服务政策" in chunk["documentTitle"] for chunk in chunks))


if __name__ == "__main__":
    unittest.main()
