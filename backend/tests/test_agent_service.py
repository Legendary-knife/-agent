import unittest

from backend.app.agent_service import create_agent_run
from backend.app.models import AgentRunRequest


class AgentServiceTest(unittest.TestCase):
    def test_supply_run_contains_trace_tools_and_citations(self) -> None:
        run = create_agent_run(
            AgentRunRequest(scenarioId="supply", prompt="本周 A100 控制器是否有缺货风险？")
        )

        self.assertEqual(run.scenarioId, "supply")
        self.assertGreaterEqual(len(run.citations), 1)
        self.assertIn("库存水位查询", run.usedTools)
        self.assertEqual([step.kind for step in run.trace], ["plan", "rag", "tool", "approval", "answer"])
        self.assertEqual(run.trace[3].status, "needs_approval")

    def test_answers_change_with_prompt_focus(self) -> None:
        credit_run = create_agent_run(
            AgentRunRequest(scenarioId="knowledge", prompt="海外渠道商能不能申请账期？")
        )
        product_run = create_agent_run(
            AgentRunRequest(scenarioId="knowledge", prompt="A100 控制器有哪些产品参数和合规限制？")
        )

        self.assertNotEqual(credit_run.answer, product_run.answer)
        self.assertIn("账期审批", credit_run.trace[0].detail)
        self.assertIn("产品资料", product_run.trace[0].detail)


if __name__ == "__main__":
    unittest.main()
