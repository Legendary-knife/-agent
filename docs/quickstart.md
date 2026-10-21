# 快速使用指南

这份文档只解决一个问题：项目拿到手之后，怎么跑起来、点哪里、看什么。

## 你先记住它是什么

这是一个“企业 AI Agent 工作台”，不是单纯的 RAG 教程，也不是普通聊天框。

它要展示的是：

- 用户提一个业务问题；
- Agent 拆任务；
- 后端从 SQLite 知识库做 RAG 检索；
- 后端选择工具；
- 工具读取 CRM / ERP / WMS 模拟数据；
- 如果配置了模型，后端会把检索结果交给大模型生成回答；
- RAG 诊断台会提前展示召回质量、分数和命中片段；
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

配置模型：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=你的真实 Key
LLM_MODEL=deepseek-chat
WORKBENCH_DATA_DIR=./data
```

说明：如果你不配置模型，系统仍然能上传文档、切分文档、检索知识库，但不会假装生成模型回答。页面顶部会显示“LLM 未配置”，Agent 输出也会提示缺少模型配置。

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
2. 右侧“知识库”选择你的 txt、md、csv、html、pdf 或 docx 文件，选中后会自动上传。
3. 也可以把文件直接拖到上传区域，拖入后会自动上传。
4. 中间会自动填入一个业务问题。
5. 你可以直接用默认问题，也可以自己改。
6. 先点“RAG 诊断台”里的“诊断检索”，确认它能命中相关资料。
7. 点“运行 Agent”。
8. 看“Agent 输出”，这是最终业务结论。
9. 看右侧“执行 Trace”，这是最该检查的部分。

现在输入不同问题，输出会跟着变。比如在“企业知识库 Agent”里分别输入：

```text
海外渠道商能不能申请账期？
```

```text
A100 控制器有哪些产品参数和合规限制？
```

你会看到 Trace 里的任务重点分别变成“账期审批”和“产品资料”，引用资料、工具调用和最终回答也会变。如果配置了 LLM，最终回答由模型生成；如果没配置 LLM，系统只返回检索结果和配置提示。

## 如何补充知识库

页面上选择文件或拖拽文件后会自动上传并入库。

如果浏览器文件选择器不可用，可以把本地文件绝对路径粘贴到“从路径导入”输入框，比如：

```text
/Users/your-name/Documents/example.md
```

然后点击“从路径导入”。

上传后后端会做这些事：

1. 解析文本。
2. 按长度和段落切成 chunk。
3. 计算本地哈希向量。
4. 写入 `data/agent_workbench.sqlite3`。
5. 把原文件和解析文本写入 `knowledge-base/`。
6. 下一次运行 Agent 时参与检索。

## 如何判断 RAG 是否真的可用

上传文件后，先用“RAG 诊断台”测一下。

它会显示：

- 候选 chunk 数：当前范围内有多少可检索片段。
- 综合分：向量相似度和关键词覆盖合成后的排序分。
- 向量分：语义相似度。
- 关键词覆盖：问题里的关键词在片段里命中了多少。
- 改进建议：告诉你是资料不足、问题太泛，还是可以直接运行 Agent。

这一步不调用大模型，适合排查“为什么 Agent 没引用我上传的资料”。

本地运行数据会保存到：

```text
data/
├── agent_workbench.sqlite3
└── uploads/
```

准备提交到 GitHub 的知识库文件会保存到：

```text
knowledge-base/
├── uploads/        # 原始上传文件
├── extracted/      # 解析后的纯文本
└── manifest.json   # 文档清单
```

`data/` 已加入 `.gitignore`，只做本地运行索引。`knowledge-base/` 会进入项目 Git 仓库，上传成功后可以跟代码一起提交和推送。你也可以在 `.env` 里改本地运行数据目录：

```env
WORKBENCH_DATA_DIR=/absolute/path/to/your/knowledge-data
```

支持格式：

- txt
- md
- csv
- html
- pdf
- docx

如果你想重置本地知识库，停止服务后删除：

```bash
rm -rf data
```

下次启动会重新生成基础示例知识库。

## 如何同步到指定 GitHub 仓库

默认不会自动把知识库资料传到 GitHub，因为这些文件可能包含业务敏感信息。

确认目标仓库可以保存这些资料后，再执行：

```bash
CONFIRM_UPLOAD_KNOWLEDGE=YES bash scripts/sync_knowledge_to_github.sh \
  https://github.com/你的用户名/你的知识库仓库.git \
  main \
  knowledge-base
```

它会把这些内容推到目标仓库：

```text
knowledge-base/
├── uploads/        # 原始上传文件
├── extracted/      # 解析后的纯文本
└── manifest.json   # 文档元数据
```

不会上传 `.env`，也不会上传模型 Key。

## 使用人员怎么用

使用人员不用关心代码，把它当成一个业务工作台：

1. 先选场景：知识库、外贸销售或供应链。
2. 上传自己的知识文件。
3. 输入真实业务问题。
4. 点击“运行 Agent”。
5. 先看“Agent 输出”，判断结论能不能用。
6. 再看“执行 Trace”，确认它引用了哪些资料、调用了哪些工具。
7. 如果出现“需人审”，说明系统只生成建议，不会直接改业务系统。

## 开发人员怎么用

开发人员主要看这些位置：

- `backend/app/data.py`：加新的文档、工具、CRM/ERP/WMS 模拟数据。
- `backend/app/storage.py`：SQLite 文档和 chunk 存储。
- `backend/app/retrieval.py`：本地向量检索。
- `backend/app/llm_client.py`：OpenAI-compatible 模型调用。
- `backend/app/agent_service.py`：Agent 编排、工具选择、RAG 上下文组装。
- `backend/app/main.py`：加新的 API。
- `src/services/api.ts`：前端 API 客户端。
- `src/store/useWorkbenchStore.ts`：前端状态和接口调用。
- `src/components/`：页面组件。

如果要接真实系统，推荐顺序是：

1. 先把 CRM / ERP / WMS 的 demo 数据换成真实只读 API。
2. 再把 `retrieval.py` 换成 pgvector 或 Qdrant 检索。
3. 再把 `select_tools` 换成真正的 Tool Registry。
4. 最后用 LangGraph 替换现在的轻量 Agent service。

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
- `POST /api/knowledge/upload`：上传知识库文档；
- `GET /api/config`：查看模型是否配置；
- `GET /api/tools`：读取工具中心；
- `GET /api/business-records`：读取业务系统模拟数据；
- `POST /api/runs`：创建一次 Agent 运行。

如果你想证明“前端真的调了后端”，打开浏览器开发者工具，看 Network 里的 `/api/knowledge/upload` 和 `/api/runs` 请求。

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
