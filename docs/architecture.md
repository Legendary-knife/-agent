# 技术架构与开发步骤

## 1. 架构分层

### Web 工作台

职责：

- 提供 Agent 对话、场景切换、知识库、工具中心、业务系统模拟和 trace 观测界面。
- 面试展示时突出“企业落地工作台”，避免被看成普通 Chat UI。

当前实现：

- React + TypeScript + Tailwind CSS
- Zustand 管理共享状态
- 本地 mock 数据模拟业务系统与知识库

### Agent 编排层

职责：

- 任务理解
- 任务拆解
- RAG 检索
- 工具选择
- 工具执行
- 审批校验
- 结果生成

真实化建议：

- 用 LangGraph 表达多步骤 workflow。
- 每个节点保留输入、输出、耗时、错误和证据。
- 高风险工具进入 human-in-the-loop，不直接执行写操作。

### 知识库层

职责：

- 文件上传
- 文档解析
- 文档切分
- 向量化
- 相似检索
- Rerank
- 引用溯源

真实化建议：

- 文件解析：unstructured / pymupdf / python-docx / pandas
- 向量库：Qdrant 或 pgvector
- Rerank：bge-reranker 或云模型 rerank
- 数据边界：按租户、部门、角色过滤 chunk

### 工具调用层

职责：

- 统一封装 CRM、ERP、WMS、邮件和报表生成能力。
- 提供参数 schema、权限校验、错误处理和审计日志。

真实化建议：

- 每个工具定义 name、description、input_schema、risk_level、timeout、permission。
- 读操作可直接调用，写操作默认需要二次确认。
- 后续可以升级为 MCP Server。

### 业务系统层

职责：

- 模拟企业系统数据。
- 展示 Agent 如何接入 CRM、ERP、WMS 等真实业务上下文。

当前实现：

- CRM 客户画像
- ERP 未交付订单
- WMS 库存水位

## 2. 开发步骤

### 第一阶段：本地可演示 MVP

- 完成工作台 UI。
- 完成三个业务场景。
- 完成 Agent run mock。
- 完成 trace、引用和工具调用展示。
- 完成 README 和架构说明。

### 第二阶段：接入真实后端

- 新增 FastAPI 服务。
- 新增 PostgreSQL 表结构。
- 新增文件上传和解析任务。
- 新增 pgvector/Qdrant 检索。
- 把前端 mock 数据替换为 API。

### 第三阶段：Agent 工程化

- 使用 LangGraph 改造 Agent 编排。
- 引入 Tool Registry。
- 增加工具超时、失败重试和降级策略。
- 增加运行日志、token 统计和调用成本统计。

### 第四阶段：企业级能力

- 多租户和角色权限。
- 敏感数据脱敏。
- 高风险动作人工确认。
- Agent 评测集和回归测试。
- MCP 工具市场。

## 3. 面试重点

讲项目时建议按下面顺序：

1. 我不是做了一个聊天框，而是做了企业 Agent 工作台。
2. 用户问题会被拆成检索、工具调用、审批校验和结果生成。
3. RAG 回答必须带引用，降低幻觉风险。
4. 工具调用有统一 schema 和 risk_level，高风险动作不直接执行。
5. 每次运行都有 trace，便于排查和审计。
6. 后续能自然扩展到 LangGraph、MCP、权限隔离和评测体系。
