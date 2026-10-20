# 快速使用指南

这份文档只解决一个问题：项目拿到手之后，怎么跑起来、点哪里、看什么。

## 你先记住它是什么

这是一个“企业 AI Agent 工作台”演示项目，不是单纯的 RAG 教程，也不是普通聊天框。

它要展示的是：

- 用户提一个业务问题；
- Agent 拆任务；
- 后端做 RAG 检索；
- 后端选择工具；
- 工具读取 CRM / ERP / WMS 模拟数据；
- 高风险动作进入审批校验；
- 页面展示最终结论和完整 Trace。

## 一分钟跑起来

进入项目目录：

```bash
cd /Users/bytedance/Documents/traeSolo/enterprise-ai-agent-workbench
```

安装前端依赖：

```bash
npm install
```

安装后端依赖：

```bash
python3 -m pip install -r requirements.txt
```

启动前后端：

```bash
npm run dev
```

看到下面两行就说明启动成功：

```text
Web: http://localhost:5173
API: http://127.0.0.1:8000
```

然后打开：

```text
http://localhost:5173
```

## 页面怎么用

打开页面后，按这个顺序操作：

1. 左侧选一个场景，比如“供应链 Agent”。
2. 中间会自动填入一个业务问题。
3. 你可以直接用默认问题，也可以自己改。
4. 点“运行 Agent”。
5. 看“Agent 输出”，这是最终业务结论。
6. 看右侧“执行 Trace”，这是面试时最该讲的部分。

现在输入不同问题，输出会跟着变。比如在“企业知识库 Agent”里分别输入：

```text
海外渠道商能不能申请账期？
```

```text
A100 控制器有哪些产品参数和合规限制？
```

你会看到 Trace 里的任务重点分别变成“账期审批”和“产品资料”，引用资料、工具调用和最终回答也会变。

## 使用人员怎么用

使用人员不用关心代码，把它当成一个业务工作台：

1. 先选场景：知识库、外贸销售或供应链。
2. 输入真实业务问题。
3. 点击“运行 Agent”。
4. 先看“Agent 输出”，判断结论能不能用。
5. 再看“执行 Trace”，确认它引用了哪些资料、调用了哪些工具。
6. 如果出现“需人审”，说明系统只生成建议，不会直接改业务系统。

## 开发人员怎么用

开发人员主要看这些位置：

- `backend/app/data.py`：加新的文档、工具、CRM/ERP/WMS 模拟数据。
- `backend/app/agent_service.py`：改 Agent 判断逻辑、工具选择和回答生成。
- `backend/app/main.py`：加新的 API。
- `src/services/api.ts`：前端 API 客户端。
- `src/store/useWorkbenchStore.ts`：前端状态和接口调用。
- `src/components/`：页面组件。

如果要接真实系统，推荐顺序是：

1. 先把 `backend/app/data.py` 的 demo 数据换成数据库。
2. 再把 `retrieve_documents` 换成 pgvector 或 Qdrant 检索。
3. 再把 `select_tools` 换成真正的 Tool Registry。
4. 最后用 LangGraph 替换现在的 deterministic agent service。

## 建议第一次演示用这个场景

选“供应链 Agent”，保留默认问题：

```text
本周 A100 控制器是否有缺货风险？如果有，给出采购建议和审批理由。
```

点“运行 Agent”后，页面会展示：

- 是否有缺货风险；
- 为什么缺货；
- 调用了哪些工具；
- 引用了哪些资料；
- 哪一步需要人工审批。

这条链路最像企业真实场景，比单纯知识库问答更好讲。

## 后端接口怎么看

FastAPI 自带接口文档：

```text
http://127.0.0.1:8000/docs
```

重点看这些接口：

- `GET /api/scenarios`：读取演示场景；
- `GET /api/knowledge`：读取知识库文档；
- `GET /api/tools`：读取工具中心；
- `GET /api/business-records`：读取业务系统模拟数据；
- `POST /api/runs`：创建一次 Agent 运行。

如果你想证明“前端真的调了后端”，打开浏览器开发者工具，看 Network 里的 `/api/runs` 请求。

## 面试时怎么讲

推荐讲法：

```text
这个项目不是聊天框，我把它设计成企业 Agent 工作台。
用户的问题进来后，后端会生成一次 Agent Run。
一次 Run 里包含任务拆解、RAG 检索、工具调用、审批校验和最终回答。
页面右侧的 Trace 会把每一步展开，所以它不是黑盒。
现在的 CRM / ERP / WMS 是 mock 数据，但 API 边界已经拆好了，后面可以替换成真实系统。
```

## 常见问题

### npm run dev 后页面打不开

先看终端有没有这行：

```text
Local: http://localhost:5173
```

如果端口不是 `5173`，以终端实际显示为准。

### 页面能打开，但运行 Agent 失败

先打开后端健康检查：

```text
http://127.0.0.1:8000/api/health
```

正常返回：

```json
{"status":"ok","service":"agent-workbench-api","version":"0.1.0"}
```

如果打不开，说明 FastAPI 没启动成功。重新执行：

```bash
npm run dev
```

### 这个项目和 all-in-rag 有什么区别

`all-in-rag` 是教程型项目，重点是按章节学习 RAG。

这个项目是作品型项目，重点是拿去面试展示“我做过企业 Agent 落地 Demo”。所以它更强调产品页面、业务场景、API 边界和执行链路。
