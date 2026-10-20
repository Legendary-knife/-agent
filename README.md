# 企业 AI Agent 工作台

一个用于面试展示的企业级 AI Agent 落地 Demo。它不是普通聊天框，而是把 RAG、工具调用、工作流编排、业务系统模拟和执行链路观测串到一个工作台里。

如果你只想先跑起来，看这份：[快速使用指南](./docs/quickstart.md)。

## 这个项目给谁看

- 给招聘方看：证明你做过企业 Agent 落地 Demo。
- 给面试官讲：展示你理解 RAG、工具调用、业务系统集成和审计链路。
- 给自己练手：后续可以继续接 PostgreSQL、pgvector、LangGraph 和 MCP。

## 一句话演示路径

打开页面，选择“供应链 Agent”，点击“运行 Agent”，然后讲右侧 Trace。

这条链路会展示：

- 用户提出业务问题；
- Agent 拆解任务；
- 后端做 RAG 检索；
- 后端选择 ERP / WMS / 报表工具；
- 高风险动作进入审批校验；
- 页面展示最终结论和完整 Trace。

## 能展示什么

- 企业知识库 Agent：基于制度、合同、产品资料做 RAG 问答，并返回引用来源。
- 外贸销售 Agent：读取客户画像和产品资料，生成开发计划、开发信和 CRM 跟进动作。
- 供应链 Agent：查询模拟 ERP/WMS 数据，识别缺货风险并生成采购审批建议。
- 工具中心：把 CRM、ERP、WMS、邮件、报表生成封装成统一 schema。
- Trace 观测：每次运行保留任务拆解、RAG 命中、工具调用、审批校验和最终结论。

## 怎么使用

进入项目目录：

```bash
cd /Users/bytedance/Documents/traeSolo/enterprise-ai-agent-workbench
```

安装依赖：

```bash
npm install
python3 -m pip install -r requirements.txt
```

启动项目：

```bash
npm run dev
```

打开前端页面：

```text
http://localhost:5173
```

打开后端接口文档：

```text
http://127.0.0.1:8000/docs
```

页面操作顺序：

1. 左侧选择一个 Agent 场景。
2. 中间确认业务问题。
3. 点击“运行 Agent”。
4. 查看“Agent 输出”。
5. 查看右侧“执行 Trace”。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Vitest
- FastAPI
- Uvicorn
- Python unittest

`npm run dev` 会同时启动：

- Web: `http://localhost:5173`
- API: `http://127.0.0.1:8000`

## 验证

```bash
npm run check
npm run test
npm run test:api
npm run build
```

## 目录结构

```text
enterprise-ai-agent-workbench/
├── backend/              # FastAPI 后端
│   ├── app/
│   │   ├── main.py       # API 路由
│   │   ├── agent_service.py
│   │   ├── data.py       # Demo 数据
│   │   └── models.py
│   └── tests/
├── src/                  # React 前端
│   ├── components/       # 工作台组件
│   ├── pages/            # 页面入口
│   ├── services/         # API 客户端
│   ├── store/            # Zustand 状态
│   └── types/            # 类型定义
├── docs/
│   ├── architecture.md   # 技术架构
│   └── quickstart.md     # 快速使用指南
└── README.md
```

## 面试讲法

这个项目不是普通聊天机器人，而是一个企业 Agent 工作台原型。核心设计是把用户请求拆成可观测的执行链路：先做任务理解，再做 RAG 检索和 rerank，然后通过 Tool Registry 调用业务系统工具，最后输出带引用、带审批边界、可追踪的业务建议。

当前已经接入 FastAPI 后端：

- `/api/scenarios` 返回演示场景。
- `/api/knowledge` 返回知识库文档。
- `/api/tools` 返回工具中心定义。
- `/api/business-records` 返回 CRM / ERP / WMS 模拟数据。
- `/api/runs` 创建和读取 Agent 运行记录。

后续真实化路线可以继续扩展为：

- PostgreSQL 存用户、文档元数据、运行记录和权限数据。
- Redis 存运行状态、任务锁和短期缓存。
- Qdrant 或 pgvector 存向量索引。
- LangGraph 承担 Agent 编排、节点状态和失败重试。
- MCP Server 暴露企业内部工具，统一鉴权、参数 schema 和审计日志。

## 项目边界

当前版本已经具备前后端联调闭环，业务数据仍使用后端 demo 数据，不直接连接真实企业系统。它的目标是让招聘方面试时能看到完整产品结构、API 边界和工程思路。
