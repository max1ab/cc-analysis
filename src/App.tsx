import { startTransition, useEffect, useState } from "react"
import {
  ArrowRightIcon,
  BotIcon,
  BugIcon,
  FileCode2Icon,
  InfoIcon,
  PuzzleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalSquareIcon,
  WandSparklesIcon,
  WorkflowIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const heroMetrics = [
  {
    title: "先判断",
    description: "先决定现在该直接回答，还是先去查、去读、去做。",
  },
  {
    title: "再执行",
    description: "需要动作时，它会进入工具阶段，而不是继续空口解释。",
  },
  {
    title: "继续循环",
    description: "结果回来后，它还能继续下一轮判断，而不是重新开始。",
  },
] as const

const quickFlow = [
  { step: "第一步", detail: "先了解当前环境、历史和可用能力。" },
  { step: "第二步", detail: "决定是直接回答，还是先调用工具。" },
  { step: "第三步", detail: "执行时由系统控制权限、顺序和风险。" },
  { step: "第四步", detail: "结果回来后，再继续下一轮思考。" },
] as const

const overviewCards = [
  {
    title: "它不是只会回答",
    description:
      "Claude Code 的核心特点，是它会在回答之前决定自己是否需要先去做事。这让它更像一个执行助手，而不是只会生成文字的模型界面。",
  },
  {
    title: "它有一套调度系统",
    description:
      "用户的一个请求，背后可能会拆成多步：读上下文、选择工具、执行工具、处理结果、继续推理。每一步都由系统层协调。",
  },
  {
    title: "它是开放的",
    description:
      "除了内建能力，它还能接入额外的工具和服务。这意味着它不是一个封闭产品，而是一套可以不断增长能力的框架。",
  },
] as const

const lifecycleSteps = [
  {
    id: "01",
    title: "先了解当前环境",
    description:
      "系统会先确认当前目录、会话状态、用户设置、历史内容和可用能力，避免在一个模糊场景里直接开始行动。",
  },
  {
    id: "02",
    title: "把规则和边界讲清楚",
    description:
      "系统会提前告诉模型应该遵守什么规则、如何表达、哪些动作要谨慎、现在有哪些能力可以调用。",
  },
  {
    id: "03",
    title: "判断要不要亲自去做",
    description:
      "如果单靠已有信息就能回答，它会直接输出；如果需要证据或操作，它就会切换到工具执行阶段。",
  },
  {
    id: "04",
    title: "执行前先控风险",
    description:
      "系统会区分哪些操作可以并行做，哪些要一个个来，也会在敏感动作前插入权限判断和其他保护机制。",
  },
  {
    id: "05",
    title: "把结果送回判断层",
    description:
      "工具做完事后，结果不会直接扔给用户，而是先回到模型这边，让它继续判断下一步要做什么。",
  },
  {
    id: "06",
    title: "在长任务里维持清醒",
    description:
      "对话太长时，它会压缩历史、提炼重点、补充摘要，尽量让后续回合还看得清任务脉络。",
  },
] as const

const capabilities = [
  {
    title: "1. 它准备得更充分",
    description: "开始回答之前，它会先把环境和上下文整理好。",
    points: ["所以更适合真实项目。", "也不容易在错误前提上跑偏。"],
  },
  {
    title: "2. 它规则更明确",
    description: "表达方式、动作边界和可用能力，都会在这一轮开始前讲清楚。",
    points: ["所以表现更稳定。", "也更容易切到执行模式。"],
  },
  {
    title: "3. 它真的会去做事",
    description: "当信息不够时，它不是继续猜，而是会进入工具和执行阶段。",
    points: ["这就是它更像 agent 的原因。", "不是更会说，而是更会推进任务。"],
  },
  {
    title: "4. 它能不断扩展能力",
    description: "系统可以接入更多工具和服务，所以功能边界不是固定不变的。",
    points: ["能越用越广。", "也更像一个平台。"],
  },
] as const

const closingPrinciples = [
  "会在回答前先判断",
  "会在需要时进入执行",
  "会把结果带回下一轮",
  "会为长任务做整理",
] as const

const appendix = [
  {
    title: "启动入口",
    description: "负责 CLI 启动编排，是整套系统的入口。",
    path: "claude-code/src/main.tsx",
  },
  {
    title: "环境与会话初始化",
    description: "负责环境、会话、目录与启动前准备。",
    path: "claude-code/src/setup.ts",
  },
  {
    title: "核心推理循环",
    description: "处理判断、工具调用、结果回填和继续执行。",
    path: "claude-code/src/query.ts",
  },
  {
    title: "工具调度",
    description: "控制工具执行顺序，以及哪些操作可以并行。",
    path: "claude-code/src/services/tools/toolOrchestration.ts",
  },
  {
    title: "工具执行",
    description: "负责权限、保护、执行细节和结果整理。",
    path: "claude-code/src/services/tools/toolExecution.ts",
  },
  {
    title: "系统 Prompt 组装",
    description: "把规则、语气、能力说明和环境信息组织成系统提示。",
    path: "claude-code/src/constants/prompts.ts",
  },
  {
    title: "MCP 客户端",
    description: "把外部服务接入 Claude Code 的能力体系。",
    path: "claude-code/src/services/mcp/client.ts",
  },
  {
    title: "插件模型",
    description: "描述插件能扩展哪些东西，以及边界有多宽。",
    path: "claude-code/src/types/plugin.ts",
  },
] as const

const scenarios = {
  bugfix: {
    label: "修一个 bug",
    kicker: "例如：修复登录页提交后白屏的问题",
    command: "修复登录页提交后白屏的问题",
    summary:
      "当用户要求修 bug 时，Claude Code 通常会走最完整的一条链：读源码、搜索相关文件、可能跑测试、必要时改文件，再把结果和验证情况总结回来。",
    refs: [
      "src/query.ts: 识别 tool_use 并继续 loop",
      "src/services/tools/toolOrchestration.ts: 搜索/读取工具批处理",
      "src/services/tools/toolExecution.ts: 权限、hooks、结果整理",
      "src/tools.ts: Bash、读写文件、Grep、Todo 等基础工具",
    ],
    terminal: [
      "$ claude",
      "> 修复登录页提交后白屏的问题",
    ],
    terminalEvents: [
      "$ load system prompt, tools, workspace context",
      "$ emit tool_use: Grep, Read",
      "$ batch run readonly tools in parallel",
      "$ request permission for bash/edit operations",
      "$ push tool_result back into the loop",
      "$ summarize fix, patch, and verification status",
    ],
    steps: [
      {
        time: "T+0s",
        title: "启动当前回合",
        text: "主线程已在启动阶段装好了工具和命令表，这一轮会先根据系统 prompt 与用户上下文构建请求。",
        ref: "main.tsx / setup.ts / constants/prompts.ts",
      },
      {
        time: "T+1s",
        title: "模型先判断要不要用工具",
        text: "在 query.ts 的流式输出里，如果模型发现单靠上下文不够，就会发出 tool_use，例如 Grep、Read、Bash 或 Edit。",
        ref: "query.ts",
      },
      {
        time: "T+2s",
        title: "只读工具先并发跑",
        text: "调度器会把连续的并发安全工具放进同一批次，比如先搜索相关文件、同时读取多个源码片段，加快定位问题。",
        ref: "services/tools/toolOrchestration.ts",
      },
      {
        time: "T+3s",
        title: "进入权限与执行层",
        text: "如果要跑命令、写文件或访问敏感路径，就会经过权限判断、hook、遥测、错误分类等治理逻辑，再真正执行。",
        ref: "services/tools/toolExecution.ts",
      },
      {
        time: "T+5s",
        title: "把工具结果喂回模型",
        text: "执行结果会被包装成 tool_result 回填到消息流里，模型据此决定下一步是继续读、直接修改，还是开始总结答案。",
        ref: "query.ts",
      },
      {
        time: "T+7s",
        title: "返回修复说明与验证状态",
        text: "如果有验证步骤，结果也会一起回报；如果历史过长，系统还能 compact 或生成工具摘要，保持对话可持续。",
        ref: "compact/* / toolUseSummary / SessionMemory",
      },
    ],
  },
  explain: {
    label: "解释原理",
    kicker: "例如：解释它是怎样循环调用工具的",
    command: "解释 query.ts 是如何循环调用工具的",
    summary:
      "当用户是在问原理，Claude Code 仍会走同一条 agent loop，只是这次大概率更多使用读文件和搜索，而不是写文件或执行修改命令。",
    refs: [
      "src/utils/processUserInput/processSlashCommand.tsx: 命令入口形态",
      "src/query.ts: 主循环本体",
      "src/Tool.ts: 工具上下文协议",
      "src/constants/prompts.ts: 系统提示中的工具使用规则",
    ],
    terminal: [
      "$ claude",
      "> 解释 query.ts 是如何循环调用工具的",
    ],
    terminalEvents: [
      "$ load current session and task rules",
      "$ emit tool_use: Read query.ts, Grep tool_result",
      "$ inspect query loop and tool protocol",
      "$ compress findings into a human explanation",
    ],
    steps: [
      {
        time: "T+0s",
        title: "收到解释型请求",
        text: "这类请求不一定要改代码，但系统仍会优先读源码而不是凭记忆回答，这是 Claude Code 一贯的工程风格。",
        ref: "constants/prompts.ts",
      },
      {
        time: "T+1s",
        title: "读文件并抽丝剥茧",
        text: "模型通常会调用 Read/Grep 等工具，找到 query()、queryLoop()、runTools()、tool_result 等关键节点。",
        ref: "query.ts / tools.ts",
      },
      {
        time: "T+2s",
        title: "结合工具协议解释行为",
        text: "它会把 Tool.ts 里的工具上下文、权限上下文和消息结构一起纳入解释，而不是孤立看一个文件。",
        ref: "Tool.ts",
      },
      {
        time: "T+3s",
        title: "把源码压缩成用户能理解的语言",
        text: "最终输出不是把代码复述一遍，而是把 loop、并发、安全控制和回填逻辑讲成一条用户能复用的心智模型。",
        ref: "assistant response layer",
      },
    ],
  },
  plugin: {
    label: "调用扩展能力",
    kicker: "例如：列出可用插件，看看 MCP 提供了什么工具",
    command: "列出可用插件，看看 MCP 提供了什么工具",
    summary:
      "当需求触及外部扩展时，Claude Code 的优势会更明显：它不是一个封闭盒子，而是会把插件、MCP server、资源和技能一起暴露给模型。",
    refs: [
      "src/commands.ts: 命令、技能、插件命令合流",
      "src/services/mcp/client.ts: MCP tools/resources 接入",
      "src/types/plugin.ts: 插件能力声明",
      "src/utils/messages/systemInit.ts: 把 tools/plugins/skills 发给 SDK 客户端",
    ],
    terminal: [
      "$ claude",
      "> 列出可用插件，看看 MCP 提供了什么工具",
    ],
    terminalEvents: [
      "$ inspect commands, skills, and MCP client state",
      "$ normalize MCP tools/resources into runtime objects",
      "$ merge plugin capabilities into visible command surface",
      "$ report what the model and UI can actually call",
    ],
    steps: [
      {
        time: "T+0s",
        title: "获取能力清单",
        text: "系统会先看当前命令表、技能表和 MCP 客户端状态，明确现在哪些能力对模型可见。",
        ref: "commands.ts / systemInit.ts",
      },
      {
        time: "T+1s",
        title: "MCP 被包装成统一工具",
        text: "在 services/mcp/client.ts 里，外部 server 提供的 tool/resource/prompt 会被转成 Claude Code 可消费的运行时对象。",
        ref: "services/mcp/client.ts",
      },
      {
        time: "T+2s",
        title: "Plugin 负责更大粒度扩展",
        text: "插件不仅能带命令，还能带技能、hook、MCP server、LSP server 和设置项，这使得扩展边界远大于普通 CLI 插件。",
        ref: "types/plugin.ts",
      },
      {
        time: "T+3s",
        title: "最后暴露给模型和 UI",
        text: "通过 system/init 消息，远端客户端也能知道当前有哪些 tools、slash commands、skills、plugins，可做选择器和状态显示。",
        ref: "utils/messages/systemInit.ts",
      },
    ],
  },
} as const

type ScenarioKey = keyof typeof scenarios

const scenarioIcons = {
  bugfix: BugIcon,
  explain: InfoIcon,
  plugin: PuzzleIcon,
} as const

function App() {
  const [scenario, setScenario] = useState<ScenarioKey>("bugfix")
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setActiveStep(0)
    const timers = scenarios[scenario].steps.map((_, index) =>
      window.setTimeout(() => {
        setActiveStep(index)
      }, index * 520)
    )

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer)
      }
    }
  }, [scenario])

  const terminalLines = getTerminalLines(scenario, activeStep)
  const isScenarioComplete =
    activeStep === scenarios[scenario].steps.length - 1

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(198,132,57,0.16),transparent_28%),radial-gradient(circle_at_85%_16%,rgba(34,88,122,0.22),transparent_20%),linear-gradient(180deg,rgba(248,245,238,0.95),rgba(240,234,226,0.96))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(66,55,38,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(66,55,38,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="sticky top-3 z-20 rounded-4xl border bg-background/85 px-4 py-4 shadow-sm backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl border bg-primary text-primary-foreground shadow-sm">
                <TerminalSquareIcon />
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="outline">Visual Source Tour</Badge>
                <div className="font-heading text-xl font-medium tracking-tight">
                  Claude Code 原理可视化导览
                </div>
                <p className="text-sm text-muted-foreground">
                  基于当前目录 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">claude-code</code> 源码抽样阅读整理
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => scrollToId("overview")}>
                <BotIcon data-icon="inline-start" />
                认识它
              </Button>
              <Button variant="outline" size="sm" onClick={() => scrollToId("layers")}>
                <WorkflowIcon data-icon="inline-start" />
                工作方式
              </Button>
              <Button variant="outline" size="sm" onClick={() => scrollToId("demo")}>
                <SparklesIcon data-icon="inline-start" />
                Demo
              </Button>
              <Button variant="outline" size="sm" onClick={() => scrollToId("sources")}>
                <FileCode2Icon data-icon="inline-start" />
                附录
              </Button>
            </div>
          </div>
        </header>

        <section
          id="overview"
          className="grid items-stretch gap-5 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <Card className="border-foreground/10 bg-background/88 shadow-sm">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge>先从整体理解，再看内部如何运转</Badge>
                <Badge variant="outline">Agent Loop</Badge>
                <Badge variant="outline">Tool Orchestration</Badge>
              </div>
              <CardTitle className="max-w-4xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Claude Code 到底在做什么？
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 sm:text-lg">
                从源码看，它不是一个只会聊天的界面，而是一套会
                <span className="font-medium text-foreground"> 判断、调用工具、执行动作、再继续思考 </span>
                的系统。你输入一句话，它内部往往会经历好几轮处理。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-3 md:grid-cols-3">
                {heroMetrics.map((item) => (
                  <Card key={item.title} size="sm" className="border bg-card/80">
                    <CardHeader>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <WandSparklesIcon />
                <AlertTitle>一句话理解</AlertTitle>
                <AlertDescription>
                  你看到的是对话框，源码里真正存在的是一条工作流：判断，执行，回看结果，再继续判断。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-foreground/10 bg-background/78 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">工作流速记</CardTitle>
              <CardDescription>
                用四个动作先记住 Claude Code 的基本节奏。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {quickFlow.map((item, index) => (
                <div
                  key={item.step}
                  className="rounded-2xl border bg-muted/40 px-4 py-4"
                >
                  <div className="mb-2 text-xs tracking-[0.24em] text-muted-foreground uppercase">
                    {item.step}
                  </div>
                  <p className="text-sm leading-6 text-foreground">
                    {item.detail}
                  </p>
                  {index < quickFlow.length - 1 ? (
                    <div className="mt-3 flex justify-end text-muted-foreground">
                      <ArrowRightIcon />
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <SectionIntro
          eyebrow="Chapter 1"
          title="先建立整体印象"
          description="如果先记住下面三点，后面的所有细节都会更容易理解。"
        />

        <section className="grid gap-4 md:grid-cols-3">
          {overviewCards.map((item) => (
            <Card key={item.title} className="border-foreground/10 bg-background/82 shadow-sm">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <SectionIntro
          eyebrow="Chapter 2"
          title="它是怎样工作的"
          description="下面这条流程，是理解 Claude Code 最重要的一段。它解释了为什么用户感觉它不是只会说，而是真的会推进任务。"
        />

        <section>
          <Card className="border-foreground/10 bg-background/86 shadow-sm">
            <CardHeader className="gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-2">
                <Badge variant="outline">Request Lifecycle</Badge>
                <CardTitle className="text-3xl">一次请求的生命旅程</CardTitle>
              </div>
              <CardDescription className="max-w-2xl leading-7">
                它不是收到问题后一次性吐出答案，而是会不断在判断和执行之间切换，直到任务足够清楚、结果足够完整。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {lifecycleSteps.map((step) => (
                <Card key={step.id} className="border bg-card/80">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">
                      {step.id}
                    </Badge>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-7 text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </section>

        <SectionIntro
          eyebrow="Chapter 3"
          title="它为什么能比普通聊天产品更能干"
          description="真正拉开差距的，不是某一个技巧，而是下面几类能力被同时做进了同一套系统里。"
          id="layers"
        />

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            {capabilities.slice(0, 3).map((item) => (
              <CapabilityCard key={item.title} item={item} />
            ))}
          </div>
          <div className="grid gap-4">
            <CapabilityCard item={capabilities[3]} />
            <Alert className="border-foreground/10 bg-background/80">
              <SparklesIcon />
              <AlertTitle>一句话总结</AlertTitle>
              <AlertDescription>
                Claude Code 的关键，不在于它更会聊天，而在于它把聊天、执行和控制做成了同一套系统。
              </AlertDescription>
            </Alert>
          </div>
        </section>

        <SectionIntro
          eyebrow="Chapter 4"
          title="把它放进一个真实场景里看"
          description="下面的交互 demo 用更贴近用户感受的方式，演示一句命令进入系统之后可能经历的阶段。"
        />

        <section id="demo">
          <Card className="overflow-hidden border-foreground/10 bg-background/86 shadow-sm">
            <CardHeader className="gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-2">
                <Badge variant="outline">Interactive Demo</Badge>
                <CardTitle className="text-3xl">
                  输入一句命令后，Claude Code 内部会做什么？
                </CardTitle>
              </div>
              <CardDescription className="max-w-2xl leading-7">
                切换不同命令，右侧会展示它大概会经历的阶段。这里只看流程，不讲太多实现。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={scenario}
                onValueChange={(value) => {
                  startTransition(() => {
                    setScenario(value as ScenarioKey)
                  })
                }}
                className="gap-6"
              >
                <TabsList
                  variant="line"
                  className="w-full justify-start overflow-x-auto"
                >
                  {(Object.keys(scenarios) as ScenarioKey[]).map((key) => {
                    const Icon = scenarioIcons[key]
                    return (
                      <TabsTrigger key={key} value={key}>
                        <Icon data-icon="inline-start" />
                        {scenarios[key].label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {(Object.keys(scenarios) as ScenarioKey[]).map((key) => {
                  const item = scenarios[key]

                  return (
                    <TabsContent key={key} value={key} className="outline-none">
                      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                        <Card className="border bg-card/70">
                          <CardHeader>
                            <Badge variant="secondary" className="w-fit">
                              模拟输入终端
                            </Badge>
                            <CardTitle>{item.label}</CardTitle>
                            <CardDescription>{item.kicker}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-4">
                            <div className="overflow-hidden rounded-3xl border bg-[linear-gradient(180deg,rgba(32,27,23,0.96),rgba(19,17,15,0.98))] text-primary-foreground shadow-sm">
                              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                                <div className="size-2.5 rounded-full bg-red-400" />
                                <div className="size-2.5 rounded-full bg-amber-300" />
                                <div className="size-2.5 rounded-full bg-emerald-400" />
                                <div className="ml-3 text-xs tracking-[0.2em] text-white/50 uppercase">
                                  claude session
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 px-4 py-5 font-mono text-sm leading-7">
                                {terminalLines.map((line, index) => (
                                  <div
                                    key={`${line}-${index}`}
                                    className={line ? "text-white/82" : "h-2"}
                                  >
                                    {renderTerminalLine(line)}
                                  </div>
                                ))}
                                <div className="flex items-center gap-2 text-white/55">
                                  <span className="inline-flex size-2 rounded-full bg-emerald-300/80 animate-pulse" />
                                  <span>
                                    {isScenarioComplete
                                      ? "流程完成，等待下一条指令..."
                                      : "正在推进当前步骤..."}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Alert className="border-foreground/10">
                              <BotIcon />
                              <AlertTitle>这个 demo 想说明什么</AlertTitle>
                              <AlertDescription>{item.summary}</AlertDescription>
                            </Alert>

                            <Card size="sm" className="border bg-background/80">
                              <CardHeader>
                                <CardTitle className="text-base">延伸阅读</CardTitle>
                              </CardHeader>
                              <CardContent className="flex flex-col gap-2">
                                {item.refs.map((ref) => (
                                  <div
                                    key={ref}
                                    className="rounded-xl border bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground"
                                  >
                                    {ref}
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          </CardContent>
                        </Card>

                        <div className="grid gap-4">
                          {item.steps.map((step, index) => (
                            <Card
                              key={step.title}
                              className={
                                index === activeStep && key === scenario
                                  ? "border-foreground/20 bg-background shadow-sm ring-1 ring-foreground/10"
                                  : "border-foreground/10 bg-background/76"
                              }
                            >
                              <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="flex flex-col gap-2">
                                  <Badge
                                    variant={index <= activeStep && key === scenario ? "default" : "outline"}
                                    className="w-fit"
                                  >
                                    {step.time}
                                  </Badge>
                                  <CardTitle>{step.title}</CardTitle>
                                </div>
                                <Badge variant="outline">{index + 1}</Badge>
                              </CardHeader>
                              <CardContent className="flex flex-col gap-3">
                                <p className="leading-7 text-muted-foreground">{step.text}</p>
                                <Separator />
                                <div className="font-mono text-xs text-muted-foreground">
                                  {step.ref}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>
        </section>

        <SectionIntro
          eyebrow="Chapter 5"
          title="最后收束一下"
          description="前面几章是在建立理解，这一章把核心判断再压缩成几句话。读完它，再决定要不要往技术附录继续。"
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {closingPrinciples.map((title, index) => (
            <Card key={title} className="border-foreground/10 bg-background/82 shadow-sm">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  {index + 1}
                </Badge>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">
                  {index === 0 && "这让它不容易在信息不足时硬答。"}
                  {index === 1 && "这让它更像助手，而不是旁观者。"}
                  {index === 2 && "所以它能沿着同一个任务继续往前走。"}
                  {index === 3 && "这让它比单轮聊天更适合复杂工作。"}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <SectionIntro
          eyebrow="Appendix"
          title="技术附录"
          description="下面开始进入源码定位区。这里更偏向已经理解主线、想回到工程实现里继续看的读者。"
        />

        <section id="sources" className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {appendix.map((item) => (
            <Card key={item.path} className="border-foreground/10 bg-background/84 shadow-sm">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border bg-muted/30 px-3 py-3 font-mono text-xs leading-6 text-muted-foreground">
                  {item.path}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Alert className="border-foreground/10 bg-background/82 shadow-sm">
          <ShieldCheckIcon />
          <AlertTitle>说明</AlertTitle>
          <AlertDescription>
            当前目录里的 <code className="rounded bg-muted px-1.5 py-0.5">claude-code</code> 是一个逆向重建版工程，README 已明确说明它并非官方上游源码，而是从 sourcemap 恢复整理出来的版本。因此这份页面展示的是该工程里已经呈现出的 Claude Code 设计思路与运行框架，对理解原理非常有价值，但不应被简单视为官方源码逐文件一比一映射。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

function CapabilityCard({
  item,
}: {
  item: { title: string; description: string; points: readonly string[] }
}) {
  return (
    <Card className="border-foreground/10 bg-background/82 shadow-sm">
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription className="leading-7">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {item.points.map((point) => (
          <div key={point} className="flex items-start gap-3 rounded-2xl border bg-muted/25 px-3 py-3">
            <div className="mt-1 text-foreground">
              <ShieldCheckIcon className="size-4" />
            </div>
            <p className="leading-6 text-muted-foreground">{point}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SectionIntro({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string
  title: string
  description: string
  id?: string
}) {
  return (
    <section id={id} className="flex flex-col gap-3 px-1">
      <Badge variant="outline" className="w-fit">
        {eyebrow}
      </Badge>
      <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="max-w-3xl leading-7 text-muted-foreground">{description}</p>
    </section>
  )
}

function renderTerminalLine(line: string) {
  if (!line) {
    return null
  }

  if (line.startsWith("$ ")) {
    return (
      <>
        <span className="text-emerald-300">$</span> {line.slice(2)}
      </>
    )
  }

  if (line.startsWith("> ")) {
    return (
      <>
        <span className="text-cyan-300">&gt;</span> {line.slice(2)}
      </>
    )
  }

  return line
}

function getTerminalLines(scenario: ScenarioKey, activeStep: number) {
  const current = scenarios[scenario]
  const lines = [...current.terminal, ""]
  const visibleEvents = current.terminalEvents.slice(0, activeStep + 1)

  if (visibleEvents.length === 0) {
    lines.push("等待输入解析...")
    return lines
  }

  lines.push("分析中...")

  for (const event of visibleEvents) {
    lines.push(event)
  }

  if (activeStep < current.steps.length - 1) {
    lines.push(`$ next: ${current.steps[activeStep + 1]?.title}`)
  }

  return lines
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export default App
