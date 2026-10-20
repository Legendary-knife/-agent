# 企业 AI Agent 工作台

一个用于面试展示的企业级 AI Agent 落地 Demo，覆盖 RAG 知识库、工具调用、工作流编排、业务系统模拟和执行链路观测。

## 能展示什么

- 企业知识库 Agent：基于制度、合同、产品资料做 RAG 问答，并返回引用来源。
- 外贸销售 Agent：读取客户画像和产品资料，生成开发计划、开发信和 CRM 跟进动作。
- 供应链 Agent：查询模拟 ERP/WMS 数据，识别缺货风险并生成采购审批建议。
- 工具中心：把 CRM、ERP、WMS、邮件、报表生成封装成统一 schema。
- Trace 观测：每次运行保留任务拆解、RAG 命中、工具调用、审批校验和最终结论。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Vitest

## 本地运行

```bash
npm install
npm run dev
```

## 验证

```bash
npm run check
npm run test
npm run build
```

## 面试讲法

这个项目不是普通聊天机器人，而是一个企业 Agent 工作台原型。核心设计是把用户请求拆成可观测的执行链路：先做任务理解，再做 RAG 检索和 rerank，然后通过 Tool Registry 调用业务系统工具，最后输出带引用、带审批边界、可追踪的业务建议。

后端真实化路线可以扩展为：

- FastAPI 提供 Agent、知识库、工具中心和审计 API。
- PostgreSQL 存用户、文档元数据、运行记录和权限数据。
- Redis 存运行状态、任务锁和短期缓存。
- Qdrant 或 pgvector 存向量索引。
- LangGraph 承担 Agent 编排、节点状态和失败重试。
- MCP Server 暴露企业内部工具，统一鉴权、参数 schema 和审计日志。

## 项目边界

当前版本是前端可演示 MVP，业务数据和 Agent 运行结果使用本地 mock。它的目标是让招聘方面试时能看到完整产品结构和工程思路，不直接连接真实企业系统。
