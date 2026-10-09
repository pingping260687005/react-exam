# 运营报告 Agent MVP

一个使用 React、NestJS 与 OpenAI 兼容 API 的单 Agent 项目。用户选择报告周期和业务范围后，Agent 通过受控的只读工具查询指标、比较趋势、定位渠道或区域变化，最终生成 Markdown 运营报告。

## 架构

```text
React 报告页
  │ POST /reports/generate
  ▼
NestJS ReportAgentService
  ├─ 运行状态、重试、结构化日志
  ├─ Chat Completions 工具调用循环
  ├─ ReportToolsService（参数校验与工具分发）
  └─ MetricsService（唯一的数据访问入口）
       │
       ▼
  数据库 / ORM 聚合查询
```

模型不直接接触 SQL 或数据库连接。数据库口径、权限和聚合逻辑都由 `MetricsService` 控制，模型只能取得经过工具定义约束的指标结果。

## 目录

```text
src/                              # React 页面
server/src/reports/
  report-agent.service.ts          # Agent loop、重试、日志、结果截断
  report-tools.service.ts          # 三个 function tools 与 Zod 参数校验
  metrics.service.ts               # 数据库适配层（当前为确定性演示数据）
  report-run.store.ts              # 单次生成的运行状态与工具审计
  report-evaluator.service.ts      # 离线规则评测
  evaluation-cases.ts              # 版本化评测场景
```

## 启动

1. 前端：根目录运行 `npm run dev`。
2. 服务端：复制 `server/.env.example` 为 `server/.env`，填写**新生成且未泄露**的 `OPENAI_API_KEY`。
3. 进入 `server`，运行 `npm install` 与 `npm run start:dev`。
4. 浏览器打开前端后，选择周期和范围，点击“生成报告”。

默认模型配置为 SiliconFlow 的 `Qwen/Qwen2.5-7B-Instruct`，服务端使用 OpenAI 兼容的 `POST /chat/completions` 工具调用协议。

> 不要将 API 密钥提交到 Git、写入前端环境变量或发送到聊天中。密钥只应存在于本机的 `server/.env` 或部署环境的 Secret 管理服务中。

## 配置

| 变量                       | 作用                           | 默认值                          |
| -------------------------- | ------------------------------ | ------------------------------- |
| `OPENAI_API_KEY`           | OpenAI 兼容 API 密钥           | 必填                            |
| `OPENAI_BASE_URL`          | 模型服务地址                   | `https://api.siliconflow.cn/v1` |
| `OPENAI_MODEL`             | 支持工具调用的模型             | `Qwen/Qwen2.5-7B-Instruct`      |
| `PORT`                     | NestJS 端口                    | `3001`                          |
| `WEB_ORIGIN`               | 允许访问 API 的前端地址        | `http://localhost:5173`         |
| `REPORT_MAX_TOOL_TURNS`    | 最大工具调用轮次，限定为 1–8   | `6`                             |
| `REPORT_MODEL_RETRY_COUNT` | 可重试模型请求次数，限定为 0–4 | `2`                             |

## API

### 生成报告

```http
POST /reports/generate
Content-Type: application/json

{
  "period": "week",
  "scope": "全站"
}
```

- `period`：`week` 或 `month`
- `scope`：`全站`、`华东区域`、`App 渠道`

响应包含 `id`（运行 ID）、`report`、`sources`、`modelResponseId` 和 `evaluation`。`evaluation` 为匹配评测场景时的规则检查结果。

### 查询运行状态

```http
GET /reports/:id
```

返回运行状态（`running`、`completed` 或 `failed`）、模型尝试次数、工具耗时和结果大小。当前状态仓库为内存实现，服务重启后会丢失；生产环境应替换为 PostgreSQL 或 Redis。

### 获取评测场景

```http
GET /reports/evaluation/cases
```

## Agent 逻辑

系统提示词强制模型只根据工具返回的数据结论，并输出“执行摘要、核心指标、变化分析、风险与建议”。核心循环如下：

```ts
createRun(input);
messages = [systemInstructions, reportRequest(input)];

for (turn = 0; turn < maxToolTurns; turn += 1) {
  response = await retry(() =>
    model.chat.completions.create({
      messages,
      tools: reportTools,
      tool_choice: 'auto',
      parallel_tool_calls: false,
    })
  );

  if (!response.message.tool_calls) {
    return completeRun(truncate(response.message.content));
  }

  for (const call of response.message.tool_calls) {
    validateToolArguments(call.arguments);
    result = await executeAllowlistedTool(call.name, call.arguments);
    auditToolCall(call.name, duration, resultSize);
    messages.push(toolResult(call.id, result));
  }
}

failRun('工具调用超过上限');
```

模型调用仅对 HTTP `408`、`409`、`429` 与 `5xx` 使用指数退避重试（300ms、600ms…）；其他错误立即失败。报告正文截断为最多 12,000 个字符，避免异常模型输出无限膨胀。

## 工具与数据口径

| 工具                     | 用途                                                  |
| ------------------------ | ----------------------------------------------------- |
| `get_metric_snapshot`    | 返回 GMV、支付订单、新用户和退款率等核心指标          |
| `compare_metric_periods` | 返回相对上一同周期的指标变化率                        |
| `get_metric_breakdown`   | 按 `channel` 或 `region` 返回分布及变化，用于定位原因 |

工具参数使用严格 JSON Schema 和 Zod 双重校验。接入真实数据库时，仅替换 `server/src/reports/metrics.service.ts` 的三个聚合方法；不要开放“执行任意 SQL”工具。

## 安全与可观测性

- DTO 只接受白名单周期和业务范围，未知字段会被拒绝。
- CORS 只允许配置的前端来源，以及 `GET`、`POST` 方法。
- 模型工具仅允许预注册的三个只读工具；每轮最多一个工具调用，最大轮次可配置。
- 结构化日志包含运行 ID、工具名、耗时、结果字节数和重试信息；不记录密钥、完整提示词或完整工具参数。
- 工具异常、未知工具、自定义工具调用、超过调用轮次都会使运行标记为 `failed`。

## 评测

`server/src/reports/evaluation-cases.ts` 定义了可版本控制的场景，包括输入、期望工具和必需章节。每次报告生成后，`ReportEvaluatorService` 会检查：

1. 是否调用了场景要求的工具；
2. 报告是否出现“执行摘要、核心指标、变化分析、风险与建议”；
3. 结果是否通过，并列出缺失项目。

这是不消耗模型费用的基础回归检查。生产环境建议增加固定数据快照、人工标注的高质量报告，以及数字正确性、建议可执行性、延迟和成本等指标。

## 验证

服务端构建：

```bash
cd server
npm run build
```

前端构建：

```bash
npm run build
```


## 学习顺序
学习顺序上，我会建议：先写一个“模型可调用 2～3 个工具”的单 agent；再加入状态、重试和日志；然后做人工审批；最后才考虑多 agent、长期记忆和复杂规划

首选路线：
- 应用层：Next.js（全栈 UI + API）或 NestJS / Fastify（后端服务）
- 模型调用：OpenAI 官方 JS SDK + Responses API
- Agent 框架：先用 @openai/agents（OpenAI Agents SDK for TypeScript）或直接自己写一个小型 agent loop
- 工作流编排：复杂、可暂停/恢复的任务可选 LangGraph.js
- Schema 与工具：zod，让每个工具的输入、模型结构化输出都严格校验
- 数据库：PostgreSQL + Prisma 或 Drizzle
- 队列/异步任务：BullMQ + Redis；长期任务别放在一次 HTTP 请求里执行
- 可观测性：OpenTelemetry + 结构化日志；需要专用平台再接 Langfuse
- 执行隔离：代码执行、文件处理、爬取等高风险工具放独立 worker / Docker 容器

已加入 Agent harness 的可靠性与可观测性能力。
- 状态：每次生成创建运行记录，可通过 GET /reports/:id 查询状态、模型尝试次数和工具审计；当前为内存实现，后续可替换为 PostgreSQL。E:\src\git\react-exam\server\src\reports\report-run.store.ts:19
- 重试与日志：对 408/409/429/5xx 指数退避重试；日志不会记录密钥、完整 prompt 或工具参数。E:\src\git\react-exam\server\src\reports\report-agent.service.ts:13
- 安全：限定报告范围白名单、拒绝 DTO 多余字段、限制工具轮次为最多 8 次、限制模型报告输出长度。E:\src\git\react-exam\server\src\main.ts:12
- 评测：新增场景集与离线评分器，检查报告必需章节和预期工具调用；生成结果会带 evaluation。E:\src\git\react-exam\server\src\reports\report-evaluator.service.ts:6
- 配置：重试次数与轮次可在 .env 配置。E:\src\git\react-exam\server\.env.example:7