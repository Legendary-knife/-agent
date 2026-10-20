import os

import httpx

from backend.app.config import Settings


class LLMNotConfiguredError(RuntimeError):
    pass


def build_system_prompt() -> str:
    return (
        "你是企业 AI Agent 工作台里的业务助手。"
        "只能根据给定知识片段和业务数据回答；如果资料不足，要明确说缺什么。"
        "回答必须包含：结论、依据、建议动作。不要编造未提供的数据。"
    )


async def generate_answer(settings: Settings, user_prompt: str, context_blocks: list[str]) -> str:
    if not settings.llm_configured:
        raise LLMNotConfiguredError("未配置 LLM。请在 .env 中设置 LLM_BASE_URL、LLM_API_KEY、LLM_MODEL。")

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": build_system_prompt()},
            {
                "role": "user",
                "content": (
                    f"业务问题：{user_prompt}\n\n"
                    f"可用资料：\n{chr(10).join(context_blocks)}\n\n"
                    "请给出可执行回答，并保留来源线索。"
                ),
            },
        ],
        "temperature": float(os.getenv("LLM_TEMPERATURE", "0.2")),
    }

    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        response = await client.post(
            f"{settings.llm_base_url}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.llm_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    try:
        return str(data["choices"][0]["message"]["content"]).strip()
    except (KeyError, IndexError, TypeError) as error:
        raise RuntimeError("LLM 返回格式不符合 OpenAI-compatible chat completions") from error
