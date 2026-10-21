---
title: "AI Agent MCP Prompt Faas 搭建实践"
aliases:
  - "AI Agent+MCP+prompt优化"
  - "FaaS AI Agent MCP 实践"
  - "Fornax Prompt 接入 FaaS Agent"
type: "workflow"
status: "active"
created: "2026-09-23"
updated: "2026-09-23"
tags:
  - "agent-workflow"
  - "mcp"
  - "prompt-engineering"
  - "faas"
  - "fornax"
  - "react"
sources:
  - "ByteTech article: AI Agent+MCP+prompt优化:从0到1搭建, 胡长峰, 2025-08-21, https://bytetech.info/articles/7540864627005980708#WjWXdHn8doMhFUx0p1XlZFpHgAc"
  - "Embedded Feishu Docx document_id: LFmKdqj10osxe1x5ywTlcGKcgS4"
  - "Local offline snapshot: raw/sources/agent-mcp-prompt-faas/"
source_project: "mzc-wiki"
---

# AI Agent MCP Prompt Faas 搭建实践

## 定位

这篇来源是一份从概念到 demo 的 Agent 落地记录：用 MCP 承接工具注册与发现，用多个 Prompt 做业务分流，用 FaaS AI Agent 模板承载 ReAct 执行循环，再从 Fornax 拉取已优化并发布的 Prompt。

它不是完整生产架构手册，更像一条最小闭环：

```text
业务场景
-> Prompt 描述角色 / 目标 / 约束 / 输出
-> 多 Prompt 按任务分流
-> FaaS Agent 模板接入 MCP 工具
-> Fornax 托管 Prompt 版本
-> FaaS 在线调试
-> 飞书机器人 / Web / App 集成
```

完整原文快照见 [[raw/sources/agent-mcp-prompt-faas/main-ai-agent-mcp-prompt-faas|AI Agent+MCP+prompt优化:从0到1搭建：脱敏离线快照]]；正文一跳链接见 [[raw/sources/agent-mcp-prompt-faas/_link-catalog|AI Agent+MCP+prompt优化：链接目录]]。

## MCP 与 Function Call 的取舍

来源把 MCP 和 Function Call 的差异放在“工具调度谁负责”上：

| 维度 | MCP | Function Call |
| --- | --- | --- |
| 编排方式 | 模型可根据用户请求选择工具，并组织调用顺序和数据流。 | 工具链路通常由开发者在代码中预设。 |
| 确定性 | 决策依赖 LLM，存在概率性和不稳定性。 | 相同输入下行为更可预测。 |
| 开发成本 | 注册工具并写清工具描述，适合快速扩展。 | 需要手动写调用顺序、参数和分支逻辑。 |
| 维护方式 | 工具增删改主要更新注册信息。 | 新工具常伴随代码逻辑变更。 |

来源的业务判断是：POP 爆品运营工作台里的查询孵化阶段、里程碑阶段、全明星阶段、商品是否爆品等任务边界清晰，且多为单工具调用，因此 MCP 的扩展速度比手写 Function Call 流程更符合预期。

这个结论应带边界阅读：当链路必须强确定、强审计或严格顺序执行时，Function Call / 固定工作流仍可能更合适。MCP 的价值更偏工具发现、低成本扩展和弱结构任务入口。

## Prompt 是业务能力入口

来源中的 Agent 本身不懂 POP 爆品运营，因此 Prompt 必须承担业务语义注入：

- 它是谁：爆品运营智能助手，服务国际化电商 AM。
- 要做什么：商品孵化、流失管理、活动报名、任务进度、周报生成。
- 有哪些能力：查询、分析、报告、解释平台功能、整合工具。
- 怎么工作：需求理解、工具调用、数据整理、输出建议、持续反馈。
- 不能做什么：不得泄露敏感信息，不得输出过时或错误数据。
- 怎么输出：Markdown、表格、分析与行动项。

来源把 Prompt 设计抽象为六项：

```text
身份定义
目标定义
能力列表
行动步骤
禁止事项
示例
```

这与 [[02-Agent 工作流/AI Agent 实践指北|AI Agent 实践指北]] 中“角色描述、任务描述、格式约束”的骨架一致，但这篇来源更强调业务系统接入后的工具能力、隐私约束和输出结构。

## 多 Prompt 分流

来源指出，一个 Prompt 同时管理大量接口会变得冗余，且容易出现输出不符合预期。对任务区分度高的业务场景，可以拆多个 Prompt：

| Prompt | 面向任务 | 输出重点 |
| --- | --- | --- |
| 基础查询 | 商品 / 商家基础信息查询 | 简洁准确的信息、无结果提示 |
| 平台功能解释 | 新平台功能、新 AM 任务说明 | 分步骤说明、规则与注意事项 |
| 专属周报 | 基于运营指标生成 AM 周报 | 关键指标、趋势洞察、优化建议 |

这个模式可复用为 Agent 产品中的“语义路由 + 专家 Prompt”：

```text
用户输入
-> 判断任务类型
-> 选择对应 Prompt
-> 调用对应工具
-> 用固定输出契约返回
```

多 Prompt 的收益是让每个 Prompt 更短、更具体、更可测；代价是需要维护路由规则、版本和回归用例。

## FaaS、Coze、Fornax 的分工

来源比较了三种实现方式：

| 平台 | 适合 | 优点 | 限制 |
| --- | --- | --- | --- |
| FaaS | 高代码 Agent、内部服务对接、复杂业务逻辑编排 | 底层接口丰富，可直接对接内部服务；AI Agent 模板基于 ReAct | 上手成本高，鉴权需要手动处理 |
| Coze | 低代码 / 无代码快速构建 | 上手快、插件生态丰富、多模型 | 权限管理较粗放，需要数据安全评估 |
| Fornax | Prompt 调优、Prompt as a Service、在线测试 | Prompt 优化能力强，调试与发布流程方便，SDK 可拉取 Prompt | 对底层服务、MCP、自有 RPC 集成支持较弱 |

来源实际选择：

```text
FaaS 承载 Agent 执行与内部服务集成
Fornax 承载 Prompt 优化、版本发布和在线测试
MCP 承载工具注册与发现
```

这个组合的意义在于把“业务编排代码”和“Prompt 版本”拆开。Prompt 不再写死在 FaaS 模板函数里，而是通过 Fornax 按 key 和 version 拉取。

## 从硬编码 Prompt 到 PaaS Prompt

来源先展示 FaaS 模板函数中硬编码 system prompt，再改为从 Fornax 获取 Prompt：

```text
agent.go
-> 初始化 fornax client
-> GetPrompt(key, version)
-> 读取 system prompt 内容
-> 作为 system message 注入 input 前
```

工程注意：

- 原文示例中 AK/SK 写在代码里，离线快照已脱敏；真实实现必须改为环境变量或密钥管理。
- 原文提醒同一个 AK/SK 应只初始化一个 Fornax client，多次请求复用。
- `key` 和 `version` 应进入配置或发布元数据，而不是散落在业务代码。
- Prompt 发布环境有 BOE、PPE、ONLINE；Agent 侧应能明确当前环境使用的 Prompt 版本。

这与 [[02-Agent 工作流/Harness Engineering|Harness Engineering]] 的原则一致：Agent 行为依赖的上下文、配置和版本应可追踪，而不是隐含在一次对话或临时代码里。

## 调试与集成问题

来源的 FaaS 在线调试结果：

- 当前返回约 3 秒。
- 作者认为不符合应用预期，仍在排查慢速原因。

可沉淀的验证点：

- Agent demo 不能只看是否能回答，还要看延迟是否满足交互场景。
- MCP 工具调用、Fornax Prompt 拉取、FaaS 函数执行、下游 API 都可能贡献延迟。
- 对线上调试应保留请求路径、耗时分解、错误分类和失败样本。

飞书机器人集成问题：

- 原文遇到机器人多次收到同一消息并生成多次回答。
- 临时方案是用本地内存记录历史 `messageID`，5 分钟内重复消息跳过。
- 原文也指出这不是长期解决方案。

生产化替代：

- 用持久化幂等表或 Redis 记录消息 ID。
- 按事件 ID / message ID 做幂等，而不是仅按文本内容。
- 多实例部署时避免本地内存状态。
- 日志不要打印敏感请求体、响应体或用户隐私数据。

## 可复用模式

### 1. 工具选择前先定义边界

来源的 MCP 选择基于任务特征：边界清晰、单工具调用居多、工具扩展频繁。如果任务需要强确定编排，应考虑固定工作流或 Function Call。

### 2. Prompt 需要按业务任务拆分

当一个业务 Agent 同时服务查询、解释、报告等不同任务时，不应把所有需求塞进一个巨大 Prompt。按任务拆 Prompt 更容易测试、优化和替换。

### 3. Prompt 版本应从代码中解耦

Fornax PaaS 让 Prompt 可以在线优化、测试、发布，再由 Agent 运行时拉取。这样 Prompt 迭代不必每次改 FaaS 代码，但必须补版本、环境和回归约束。

### 4. Demo 能跑不等于可上线

来源中 3 秒延迟、MCP Server 连接失败、机器人重复消息都说明：从 demo 到产品还需要性能、幂等、鉴权、日志、安全和多实例状态治理。

## 与现有 Wiki 的关系

- [[02-Agent 工作流/AI Agent 实践指北|AI Agent 实践指北]]：提供更通用的 Prompt、Workflow、RAG/FT 和评估框架；本页是 FaaS + MCP + Fornax 的具体 demo 路径。
- [[03-Skill/Skill 构建完全指南|Skill 构建完全指南]]：同样强调把可复用经验从 Prompt 中抽出来；本页更偏业务 Agent Prompt 与平台实现。
- [[02-Agent 工作流/Harness Engineering|Harness Engineering]]：本页的 Prompt 版本、工具注册、调试和幂等问题，都属于 Agent Harness 的工程化约束。

## 边界

- 本页严格基于来源文章，不代表 FaaS、Fornax、Coze 当前最新功能状态。
- 来源中平台功能变化快，实际使用前应重新检查平台文档。
- 原文中的敏感凭据示例已脱敏，不能作为可运行代码直接复制。
