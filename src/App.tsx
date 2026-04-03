import { useEffect, useMemo, useState } from "react"
import {
  BinaryIcon,
  BotIcon,
  BrainCircuitIcon,
  ChevronDownIcon,
  CirclePauseIcon,
  CirclePlayIcon,
  EyeIcon,
  HandIcon,
  LineChartIcon,
  Layers2Icon,
  LockIcon,
  PuzzleIcon,
  RefreshCcwIcon,
  SparklesIcon,
  TerminalSquareIcon,
  WandSparklesIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const demoStages = [
  {
    id: "01",
    title: "用户命令",
  },
  {
    id: "02",
    title: "Prompt / Context 注入",
  },
  {
    id: "03",
    title: "模型判断",
  },
  {
    id: "04",
    title: "批次编排",
  },
  {
    id: "05",
    title: "工具执行",
  },
  {
    id: "06",
    title: "结果回填",
  },
  {
    id: "07",
    title: "验证与总结",
  },
] as const

const demoCommand = "修复登录页提交后白屏的问题"
const stageDurations = [28, 24, 28, 26, 28, 26, 30] as const
const totalDemoTicks = stageDurations.reduce((sum, value) => sum + value, 0)
const postPauseTicks = 8

const dataCards = [
  { label: "代码行数", value: "513,955", note: "源码与文本文件总行数，排除图片和锁文件。" },
  { label: "文件数", value: "1,911", note: "统计范围是 claude-code 仓库，网页工程不计入这里。" },
  { label: "模块数", value: "35 / 14", note: "前者是 src 顶层目录，后者是业务归并模块。" },
  { label: "工具数", value: "42+", note: "42 个工具目录，另有 18 个稳态核心工具和大量条件能力。" },
] as const

const organViews = {
  brain: {
    title: "大脑",
    icon: BrainCircuitIcon,
    blurb: "负责判断、循环、续航。",
    bullets: [
      "入口在 main.tsx、setup.ts、query.ts。",
      "先组装 system prompt、messages、上下文，再发起模型采样。",
      "收到 tool_result 之后会回到判断层，继续推进下一步。",
      "靠 compact、summary、token budget 管理长任务续航。",
    ],
  },
  eyes: {
    title: "眼睛",
    icon: EyeIcon,
    blurb: "负责看代码、看目录、看网络、看外部资源。",
    bullets: [
      "本地观察靠 FileRead、Glob、Grep。",
      "外部观察靠 WebFetch、WebSearch、MCP Resource。",
      "先看再答是它的默认习惯，不靠猜。",
      "只读工具会被编排成可并发批次，加快定位问题。",
    ],
  },
  hands: {
    title: "手",
    icon: HandIcon,
    blurb: "负责执行命令、编辑文件、真正推进任务。",
    bullets: [
      "执行层核心是 Bash、FileEdit、FileWrite、NotebookEdit。",
      "再往上还有 Task、Agent、Team、Cron、RemoteTrigger。",
      "非只读动作必须经过 hooks、permission 和执行治理层。",
      "写操作通常串行，优先保证正确性和可控性。",
    ],
  },
} as const

const promptLayers = [
  {
    title: "身份与角色前缀",
    detail: "system.ts 会先告诉模型：你是谁、你处在哪种运行模式、你要以什么身份和用户协作。",
  },
  {
    title: "行为边界与输出风格",
    detail: "prompts.ts 里规定了边界、安全要求和输出风格，约束它不要超范围加功能，也不要无视权限治理。",
  },
  {
    title: "工具使用规则",
    detail: "system prompt 不只列工具名，还会规定什么时候该用工具、遇到阻止或注入风险时要怎么调整策略。",
  },
  {
    title: "环境 / 模式 / 会话上下文",
    detail: "cwd、model、skills、mcp servers、permission mode 和 agent / coordinator 状态都会被注入这一层。",
  },
  {
    title: "缓存与 section 失效策略",
    detail: "systemPromptSections.ts 把 prompt 拆成可缓存 section 和故意不缓存 section，连提示词本身都在做缓存治理。",
  },
] as const

const systemGroups = [
  {
    title: "Skills",
    hint: "工作方法层",
    body: "Skill 解决的是工作方法问题，会给模型一套更专业的做事方式。Claude Code 里既有 bundled skill，也能从磁盘目录读取 SKILL.md，还能接入 MCP skill。",
    points: ["bundledSkills.ts", "loadSkillsDir.ts", "mcpSkillBuilders.ts"],
  },
  {
    title: "Plugins",
    hint: "能力包层",
    body: "Plugin 的目标是把 skill、hooks、MCP servers 打包成可启停能力包。当前源码里插件骨架已经在，但 built-in plugin 仍然是空注册，说明 skills 比 plugins 更成熟。",
    points: ["builtinPlugins.ts", "plugins/bundled/index.ts", "services/plugins"],
  },
  {
    title: "MCP",
    hint: "外部世界接口",
    body: "MCP 把 Claude Code 从本地工具升级成可连接外部世界的 agent。它接进来的不只是 tools，还有 resources、prompts、auth 和更多远程能力治理。",
    points: ["services/mcp/client.ts", "auth.ts / config.ts", "MCPTool / ListMcpResources / ReadMcpResource"],
  },
  {
    title: "Tasks / Remote",
    hint: "协作与远程层",
    body: "Task、Agent、Remote 这层说明 Claude Code 已经在往运行平台长。它不只会当场回答，也能拉起 subagent、组织任务对象，并把 system/init 元信息发给远端客户端。",
    points: ["tasks/*", "tools/AgentTool/*", "utils/messages/systemInit.ts"],
  },
] as const

const easterEggs = [
  {
    title: "隐藏工具墙",
    body: "tools.ts 里藏着很多默认界面里不一定直接露出的能力：REPLTool、SleepTool、WorkflowTool、RemoteTriggerTool、MonitorTool、WebBrowserTool、CtxInspectTool、ListPeersTool 等。",
  },
  {
    title: "冷门命令墙",
    body: "commands 目录有 86 个命令，除了常见命令，还有 ant-trace、autofix-pr、ctx_viz、sandbox-toggle、teleport、thinkback、pr_comments 这类很适合放进彩蛋区的内部命令。",
  },
  {
    title: "Prompt 缓存机制",
    body: "Claude Code 会先把 prompt 拆成 section，再决定哪些 section 可以缓存，哪些变化必须触发 cache break。",
  },
  {
    title: "REPL 双层工具体系",
    body: "REPL primitive tools 和主工具注册表分属两层。有些能力不直接暴露给模型，但会一直存在于 REPL VM 上下文里。",
  },
  {
    title: "如果 feature 全开",
    body: "表层 Claude Code 像一个 CLI，深层 Claude Code 则会长出 workflow、monitor、browser、team、cron、remote、task、多 agent 这些平台态能力。",
  },
] as const

const heroSections = [
  "01 执行流",
  "02 数据总览",
  "03 大脑 / 眼睛 / 手",
  "04 System Prompt",
  "05 Skills / MCP / Remote",
  "06 彩蛋",
] as const

function settleProgress(progress: number, activeWindow = 0.55) {
  if (progress <= 0) return 0
  if (progress >= activeWindow) return 1
  return progress / activeWindow
}

function segmentProgress(progress: number, start: number, end: number) {
  if (progress <= start) return 0
  if (progress >= end) return 1
  return (progress - start) / (end - start)
}

function withStagePause(progress: number, duration: number) {
  const activeTicks = Math.max(1, duration - postPauseTicks)
  const cutoff = activeTicks / duration
  return settleProgress(progress, cutoff)
}

export default function App() {
  const [activeStage, setActiveStage] = useState(0)
  const [demoTick, setDemoTick] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [playMode, setPlayMode] = useState<"all" | "single">("all")
  const [revealedData, setRevealedData] = useState<number[]>([])
  const [activeOrgan, setActiveOrgan] = useState<keyof typeof organViews>("brain")
  const [activeLayer, setActiveLayer] = useState(0)
  const [activeSystem, setActiveSystem] = useState(0)
  const [openEggs, setOpenEggs] = useState<number[]>([])

  const organ = organViews[activeOrgan]
  const OrganIcon = organ.icon

  useEffect(() => {
    if (!autoPlay) return

    const timer = window.setInterval(() => {
      setDemoTick((current) => {
        if (playMode === "all") {
          return current >= totalDemoTicks - 1 ? totalDemoTicks - 1 : current + 1
        }

        const stageStart = stageDurations
          .slice(0, activeStage)
          .reduce((sum, value) => sum + value, 0)
        const stageEnd = stageStart + stageDurations[activeStage]!
        return current >= stageEnd - 1 ? stageEnd - 1 : current + 1
      })
    }, 120)

    return () => window.clearInterval(timer)
  }, [activeStage, autoPlay, playMode])

  useEffect(() => {
    if (playMode === "all" && demoTick >= totalDemoTicks - 1) {
      setAutoPlay(false)
      return
    }

    if (playMode === "single") {
      const stageStart = stageDurations
        .slice(0, activeStage)
        .reduce((sum, value) => sum + value, 0)
      const stageEnd = stageStart + stageDurations[activeStage]!
      if (demoTick >= stageEnd - 1) {
        setAutoPlay(false)
      }
    }
  }, [activeStage, demoTick, playMode])

  const derivedStage = useMemo(() => {
    let remaining = demoTick
    for (let index = 0; index < stageDurations.length; index += 1) {
      const duration = stageDurations[index]!
      if (remaining < duration) {
        return { stageIndex: index, stageProgress: remaining / duration }
      }
      remaining -= duration
    }
    return { stageIndex: stageDurations.length - 1, stageProgress: 1 }
  }, [demoTick])

  useEffect(() => {
    setActiveStage(derivedStage.stageIndex)
  }, [derivedStage.stageIndex])

  const stageProgress = derivedStage.stageProgress
  const stage0Progress = withStagePause(stageProgress, stageDurations[0])
  const stage1Progress = withStagePause(stageProgress, stageDurations[1])
  const stage2Progress = withStagePause(stageProgress, stageDurations[2])
  const stage3Progress = withStagePause(stageProgress, stageDurations[3])
  const stage4Progress = withStagePause(stageProgress, stageDurations[4])
  const stage5Progress = withStagePause(stageProgress, stageDurations[5])
  const stage6Progress = withStagePause(stageProgress, stageDurations[6])
  const typedProgress = activeStage === 0 ? settleProgress(stage0Progress, 0.7) : activeStage > 0 ? 1 : 0
  const typedLength = Math.floor(demoCommand.length * typedProgress)
  const typedCommand = demoCommand.slice(0, typedLength)
  const messageStep =
    activeStage === 1
      ? stage1Progress >= 0.72
        ? 4
        : stage1Progress >= 0.5
          ? 3
          : stage1Progress >= 0.28
            ? 2
            : stage1Progress >= 0.08
              ? 1
              : 0
      : activeStage > 1
        ? 4
        : 0
  const mergeProgress =
    activeStage === 1 ? segmentProgress(stage1Progress, 0.56, 0.72) : activeStage > 1 ? 1 : 0
  const sendProgress =
    activeStage === 2 ? segmentProgress(stage2Progress, 0.12, 0.34) : activeStage > 2 ? 1 : 0
  const modelPhraseStep =
    activeStage === 2
      ? stage2Progress >= 0.76
        ? 2
        : stage2Progress >= 0.48
          ? 1
          : 0
      : activeStage > 2
        ? 2
        : 0
  const dispatchCount =
    activeStage === 3
      ? stage3Progress >= 0.78
        ? 3
        : stage3Progress >= 0.5
          ? 2
          : stage3Progress >= 0.22
            ? 1
            : 0
      : activeStage > 3
        ? 3
        : 0
  const batchReadyProgress =
    activeStage === 3 ? segmentProgress(stage3Progress, 0.78, 0.92) : activeStage > 3 ? 1 : 0
  const executeStep =
    activeStage === 4
      ? stage4Progress >= 0.8
        ? 3
        : stage4Progress >= 0.56
          ? 2
          : stage4Progress >= 0.32
            ? 1
            : stage4Progress >= 0.08
              ? 0
              : -1
      : activeStage > 4
        ? 3
        : -1
  const executeResultProgress =
    activeStage === 4 ? segmentProgress(stage4Progress, 0.82, 0.96) : activeStage > 4 ? 1 : 0
  const loopProgress = activeStage === 5 ? segmentProgress(stage5Progress, 0.14, 0.34) : activeStage > 5 ? 1 : 0
  const loopTextProgress =
    activeStage === 5 ? segmentProgress(stage5Progress, 0.52, 0.68) : activeStage > 5 ? 1 : 0
  const loopTagProgress =
    activeStage === 5 ? segmentProgress(stage5Progress, 0.76, 0.92) : activeStage > 5 ? 1 : 0
  const summaryCount =
    activeStage === 6
      ? stage6Progress >= 0.82
        ? 3
        : stage6Progress >= 0.52
          ? 2
          : stage6Progress >= 0.2
            ? 1
            : 0
      : activeStage > 6
        ? 3
        : 0
  const modelPhrases = ["检查上下文", "判断是否需要工具", "选择下一步动作"] as const
  const currentModelPhrase =
    modelPhrases[
      modelPhraseStep
    ]

  const handleReplay = () => {
    setDemoTick(0)
    setActiveStage(0)
    setPlayMode("all")
    setAutoPlay(true)
  }

  const handleStageClick = (index: number) => {
    const tickOffset = stageDurations
      .slice(0, index)
      .reduce((sum, value) => sum + value, 0)
    setDemoTick(tickOffset)
    setActiveStage(index)
    setPlayMode("single")
    setAutoPlay(true)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(237,208,144,0.35),transparent_28%),radial-gradient(circle_at_top_right,rgba(128,164,197,0.18),transparent_22%),linear-gradient(180deg,#f7f1e4_0%,#f3ecdd_44%,#ece4d1_100%)] text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
        <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(38,35,31,0.96),rgba(65,56,44,0.92))] p-7 text-stone-50 shadow-[0_24px_70px_rgba(44,32,18,0.16)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge className="rounded-full border border-amber-200/30 bg-amber-50/10 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-amber-100">
                Claude Code Source Breakdown
              </Badge>
              <div className="space-y-2">
                <h1 className="font-heading text-4xl leading-none tracking-tight md:text-5xl">
                  Claude Code 的核心，是一条持续推进任务的执行流。
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-stone-200/82 md:text-base">
                  这一页按执行流、数据体量、系统提示词、扩展系统和彩蛋五层拆开源码结构。
                </p>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-3 text-sm">
              {heroSections.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-stone-200/90 backdrop-blur-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="grid gap-6">
          <Card className="overflow-hidden rounded-[2rem] border-black/10 bg-white/65 shadow-[0_16px_50px_rgba(65,54,33,0.08)] backdrop-blur-sm">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] tracking-[0.24em] uppercase">
                    01 Demo
                  </Badge>
                  <h2 className="font-heading text-3xl">Claude Code 执行流</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-full bg-white/70"
                    onClick={() => setAutoPlay((current) => !current)}
                  >
                    {autoPlay ? (
                      <CirclePauseIcon className="mr-2 size-4" />
                    ) : (
                      <CirclePlayIcon className="mr-2 size-4" />
                    )}
                    {autoPlay ? "暂停" : "继续"}
                  </Button>
                  <Button className="rounded-full" onClick={handleReplay}>
                    <RefreshCcwIcon className="mr-2 size-4" />
                    重播 Demo
                  </Button>
                </div>
              </div>

              <div className="relative overflow-x-auto pb-2">
                <div className="relative mx-auto min-w-[840px] max-w-5xl px-10 pt-8">
                  <svg
                    className="pointer-events-none absolute inset-x-10 top-0 h-28 w-[calc(100%-5rem)]"
                    viewBox="0 0 1000 180"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M71 104 H929"
                      fill="none"
                      stroke="rgba(74, 62, 47, 0.16)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M786 104 C786 18, 357 18, 357 104"
                      fill="none"
                      stroke={activeStage >= 5 ? "rgba(119, 83, 38, 0.56)" : "rgba(119, 83, 38, 0.18)"}
                      strokeDasharray="10 10"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    {activeStage >= 5 && (
                      <path
                        d="M786 104 C786 18, 357 18, 357 104"
                        fill="none"
                        stroke="rgba(244, 204, 122, 0.9)"
                        strokeDasharray="36 700"
                        strokeDashoffset={540 - loopProgress * 360}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>

                  <div className="grid grid-cols-7 gap-3">
                    {demoStages.map((stage, index) => {
                      const isActive = index === activeStage
                      const isPast = index < activeStage

                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => handleStageClick(index)}
                          className="group relative flex flex-col items-center text-center"
                        >
                          <div
                            className={[
                              "relative z-10 flex size-14 items-center justify-center rounded-full border text-lg font-semibold transition",
                              isActive
                                ? "border-stone-900 bg-stone-900 text-stone-50 shadow-[0_12px_28px_rgba(31,24,19,0.18)]"
                                : isPast
                                  ? "border-[rgba(119,83,38,0.48)] bg-[rgba(246,236,213,0.92)] text-stone-900"
                                  : "border-[rgba(74,62,47,0.18)] bg-[rgba(255,252,247,0.96)] text-stone-500",
                            ].join(" ")}
                          >
                            {stage.id}
                          </div>
                          <div className="mt-3">
                            <div className="text-sm font-medium leading-6 text-stone-800">
                              {stage.title}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-14">
                <div className="mx-auto max-w-3xl rounded-[1.8rem] border border-black/8 bg-[linear-gradient(180deg,rgba(22,18,15,0.97),rgba(38,31,24,0.98))] p-5 text-stone-100 shadow-[0_24px_40px_rgba(30,20,8,0.14)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/10 p-2">
                        <TerminalSquareIcon className="size-4 text-stone-200" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.28em] text-stone-400">
                          Live Demo
                        </div>
                        <div className="text-sm text-stone-300">
                          bugfix flow / one command / loop
                        </div>
                      </div>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-stone-300">
                      stage {demoStages[activeStage]?.id}
                    </div>
                  </div>

                  <div className="min-h-[24rem] rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.26em] text-stone-500">
                      <span>terminal</span>
                      <span>/workspace/login-page</span>
                    </div>

                    <div className="mt-4 space-y-2 font-mono text-sm leading-6">
                      <div className="text-stone-500">$ claude</div>
                      <div className="flex min-h-7 items-center gap-2 text-stone-100">
                        <span className="text-amber-300">&gt;</span>
                        <span>{typedCommand}</span>
                        {activeStage === 0 && (
                          <span className="inline-block h-5 w-2 animate-pulse rounded-sm bg-amber-200/90" />
                        )}
                      </div>

                      <div className="relative mt-8 min-h-[15rem] overflow-hidden">
                        {activeStage === 1 && (
                          <div className="absolute inset-x-0 top-4 mx-auto max-w-md space-y-3 text-[13px] uppercase tracking-[0.26em] text-stone-400">
                            <div
                              className="transition-all duration-300"
                              style={{
                                opacity: messageStep >= 1 ? 1 : 0.12,
                                transform: `translateY(${messageStep >= 1 ? 0 : 8}px)`,
                              }}
                            >
                              system: 你是 claude code
                            </div>
                            <div
                              className="transition-all duration-300 text-amber-100/88"
                              style={{
                                opacity: messageStep >= 2 ? 0.92 : 0.12,
                                transform: `translateY(${messageStep >= 2 ? 0 : 8}px)`,
                              }}
                            >
                              user: review 当前代码
                            </div>
                            <div
                              className="transition-all duration-300"
                              style={{
                                opacity: messageStep >= 3 ? 0.92 : 0.12,
                                transform: `translateY(${messageStep >= 3 ? 0 : 8}px)`,
                              }}
                            >
                              assistant: 先看登录提交流程...
                            </div>
                            <div
                              className="text-amber-50/92 transition-all duration-300"
                              style={{
                                transform: `translateY(${messageStep >= 4 ? (1 - mergeProgress) * -28 : -36}px)`,
                                opacity: messageStep >= 4 ? 0.28 + mergeProgress * 0.72 : 0,
                              }}
                            >
                              user: 修复登录页提交后白屏的问题
                            </div>
                          </div>
                        )}

                        {activeStage === 2 && (
                          <div className="absolute inset-0">
                            <div className="absolute right-4 top-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-sky-100/62">
                              <BrainCircuitIcon className="size-3.5" />
                              model
                            </div>
                            <div
                              className="absolute left-10 top-14 rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-stone-300 transition-all duration-300"
                              style={{
                                opacity: sendProgress > 0 ? 0.3 + sendProgress * 0.7 : 0,
                                transform: `translate(${sendProgress * 250}px, ${-sendProgress * 26}px) scale(${0.96 + sendProgress * 0.04})`,
                              }}
                            >
                              request
                            </div>
                            <div
                              className="absolute left-[4.5rem] top-[4.25rem] h-px w-52 border-t border-dashed border-white/10 transition-all duration-300"
                              style={{
                                opacity: sendProgress > 0.08 ? 0.18 + sendProgress * 0.32 : 0,
                                transform: "rotate(-8deg)",
                                transformOrigin: "left center",
                              }}
                            />
                            <div
                              className="absolute right-6 top-14 size-3 rounded-full bg-sky-200/70 shadow-[0_0_14px_rgba(186,230,253,0.28)] transition-all duration-300"
                              style={{ opacity: sendProgress > 0.2 ? 1 : 0.45 }}
                            />
                            <div className="absolute inset-x-0 top-[4.8rem] mx-auto max-w-sm text-center text-base text-stone-100">
                              {currentModelPhrase}
                            </div>
                            <div
                              className="absolute inset-x-0 bottom-8 mx-auto max-w-xs text-center text-xs uppercase tracking-[0.28em] text-stone-500 transition-all duration-300"
                              style={{
                                opacity: stage2Progress >= 0.36 ? 1 : 0.18,
                                transform: `translateY(${stage2Progress >= 0.36 ? 0 : 8}px)`,
                              }}
                            >
                              sending context
                            </div>
                          </div>
                        )}

                        {activeStage === 3 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                            <div className="flex flex-wrap justify-center gap-3 text-sm text-stone-100">
                              {["grep", "glob", "read"].map((tool, index) => {
                                const visible = index < dispatchCount
                                return (
                                  <div
                                    key={tool}
                                    className="rounded-full border border-white/8 px-4 py-1.5 transition-all duration-300"
                                    style={{
                                      opacity: visible ? 1 : 0.18,
                                      transform: `translateY(${visible ? 0 : 12}px)`,
                                      background: visible ? "rgba(255,255,255,0.06)" : "transparent",
                                    }}
                                  >
                                    {tool}
                                  </div>
                                )
                              })}
                            </div>
                            <div
                              className="w-full max-w-md rounded-full border border-emerald-300/14 px-4 py-2 text-center text-sm uppercase tracking-[0.28em] text-emerald-100/85 transition-all duration-300"
                              style={{
                                opacity: batchReadyProgress > 0 ? 0.2 + batchReadyProgress * 0.8 : 0,
                                transform: `translateY(${(1 - batchReadyProgress) * 10}px)`,
                              }}
                            >
                              readonly batch ready
                            </div>
                          </div>
                        )}

                        {activeStage === 4 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-full max-w-lg">
                              <div className="mb-5 h-px bg-white/8" />
                              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-100">
                                {["validate", "permission", "edit", "bash"].map((step, index) => {
                                  const visible = index <= executeStep
                                  return (
                                    <div
                                      key={step}
                                      className="rounded-full px-3 py-1.5 transition-all duration-300"
                                      style={{
                                        opacity: visible ? 1 : 0.22,
                                        transform: `translateY(${visible ? 0 : 8}px)`,
                                        background: visible ? "rgba(255,255,255,0.07)" : "transparent",
                                      }}
                                    >
                                      {step}
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="mt-5 h-px bg-white/8" />
                            </div>
                            {executeStep >= 2 && (
                              <div
                                className="mt-6 rounded-full border border-white/8 px-4 py-2 text-sm text-stone-200 transition-all duration-300"
                                style={{
                                  opacity: executeResultProgress > 0 ? 0.24 + executeResultProgress * 0.76 : 0,
                                  transform: `translateY(${(1 - executeResultProgress) * 8}px)`,
                                }}
                              >
                                {executeStep === 2 ? "apply edit" : "run test"}
                              </div>
                            )}
                          </div>
                        )}

                        {activeStage === 5 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div
                              className="rounded-full border border-amber-300/18 bg-amber-200/8 px-5 py-2 text-sm text-stone-100 transition-all duration-300"
                              style={{
                                opacity: 0.28 + loopProgress * 0.72,
                                transform: `translateY(${(1 - loopProgress) * 18}px) scale(${0.96 + loopProgress * 0.04})`,
                              }}
                            >
                              tool_result
                            </div>
                            <div
                              className="mt-6 text-xs uppercase tracking-[0.32em] text-amber-100/70 transition-all duration-300"
                              style={{
                                opacity: loopTextProgress > 0 ? 0.2 + loopTextProgress * 0.8 : 0,
                                transform: `translateY(${(1 - loopTextProgress) * 10}px)`,
                              }}
                            >
                              result returned
                            </div>
                            <div
                              className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-stone-500 transition-all duration-300"
                              style={{
                                opacity: loopTagProgress > 0 ? 0.24 + loopTagProgress * 0.76 : 0,
                              }}
                            >
                              <LineChartIcon className="size-3.5" />
                              06 → 03
                            </div>
                          </div>
                        )}

                        {activeStage === 6 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full max-w-xl rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-5 font-mono text-sm leading-7 text-stone-100">
                              <div
                                className="text-base text-stone-50 transition-all duration-300"
                                style={{
                                  opacity: summaryCount >= 1 ? 1 : 0.12,
                                  transform: `translateY(${summaryCount >= 1 ? 0 : 8}px)`,
                                }}
                              >
                                已修复登录页提交后的白屏问题。
                              </div>

                              <div
                                className="mt-4 transition-all duration-300"
                                style={{
                                  opacity: summaryCount >= 2 ? 1 : 0.12,
                                  transform: `translateY(${summaryCount >= 2 ? 0 : 8}px)`,
                                }}
                              >
                                <div className="text-stone-400">- 原因：提交后异常状态没有被正确处理</div>
                                <div className="text-stone-400">- 修改：补上状态分支和跳转前保护</div>
                              </div>

                              <div
                                className="mt-4 transition-all duration-300"
                                style={{
                                  opacity: summaryCount >= 3 ? 1 : 0.12,
                                  transform: `translateY(${summaryCount >= 3 ? 0 : 8}px)`,
                                }}
                              >
                                <div className="text-emerald-200">- 验证：`npm run build` 通过</div>
                                <div className="mt-2 text-stone-500">/login 提交流程已恢复正常</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-[2rem] border border-black/10 bg-white/70 p-6 shadow-[0_16px_50px_rgba(65,54,33,0.08)] backdrop-blur-sm md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] tracking-[0.24em] uppercase">
                02 Data
              </Badge>
              <h2 className="font-heading text-3xl">体量和结构</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                这些数字决定了网页第一眼的体量感：它已经是一套长出模块分层、命令系统和扩展边界的工程系统。
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full bg-white/70"
              onClick={() =>
                setRevealedData((current) =>
                  current.length === dataCards.length
                    ? []
                    : current.length === 0
                      ? [0]
                      : [...current, current.length],
                )
              }
            >
              逐张揭示
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dataCards.map((card, index) => {
              const revealed = revealedData.includes(index)

              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={() =>
                    setRevealedData((current) =>
                      current.includes(index)
                        ? current.filter((item) => item !== index)
                        : [...current, index],
                    )
                  }
                  className="group min-h-52 rounded-[1.75rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,243,233,0.92))] p-5 text-left shadow-[0_10px_30px_rgba(65,54,33,0.05)] transition hover:-translate-y-1"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                        {card.label}
                      </span>
                      <BinaryIcon className="size-4 text-stone-400" />
                    </div>
                    <div className="space-y-4">
                      <div className="font-heading text-5xl leading-none tracking-tight">
                        {card.value}
                      </div>
                      <div
                        className={[
                          "overflow-hidden text-sm leading-6 text-stone-700 transition-all",
                          revealed ? "max-h-28 opacity-100" : "max-h-0 opacity-0",
                        ].join(" ")}
                      >
                        {card.note}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <Card className="rounded-[2rem] border-black/10 bg-white/70 shadow-[0_16px_50px_rgba(65,54,33,0.08)]">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] tracking-[0.24em] uppercase">
                  03 Brain / Eyes / Hands
                </Badge>
                <h2 className="font-heading text-3xl">大脑、眼睛、手</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  这一部分把 Claude Code 拆成三个最关键的动作层：大脑负责判断和循环，眼睛负责找证据，手负责真正推进任务。
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {(
                  Object.entries(organViews) as [keyof typeof organViews, (typeof organViews)[keyof typeof organViews]][]
                ).map(([key, view]) => {
                  const Icon = view.icon

                  return (
                    <Button
                      key={key}
                      variant={activeOrgan === key ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setActiveOrgan(key)}
                    >
                      <Icon className="mr-2 size-4" />
                      {view.title}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-black/10 bg-[linear-gradient(135deg,rgba(255,248,235,0.95),rgba(243,248,253,0.95))] shadow-[0_16px_50px_rgba(65,54,33,0.08)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-stone-900 p-3 text-stone-50">
                      <OrganIcon className="size-5" />
                    </div>
                    <div>
                      <div className="font-heading text-3xl">{organ.title}</div>
                      <div className="text-sm text-muted-foreground">{organ.blurb}</div>
                    </div>
                  </div>
                </div>
                <Badge className="rounded-full bg-stone-900 px-3 py-1 text-stone-50">
                  结构视图
                </Badge>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-black/8 bg-white/70 p-6">
                <div className="space-y-3">
                  {organ.bullets.map((bullet) => (
                    <div key={bullet} className="rounded-2xl border border-black/6 bg-stone-50/70 px-4 py-3 text-sm leading-7 text-stone-700">
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="rounded-[2rem] border-black/10 bg-white/70 shadow-[0_16px_50px_rgba(65,54,33,0.08)]">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 space-y-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] tracking-[0.24em] uppercase">
                  04 System Prompt
                </Badge>
                <h2 className="font-heading text-3xl">系统提示词就是控制面板</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  在 Claude Code 里，system prompt 不只是开场白。它决定身份、边界、工具哲学、模式状态，甚至还有自己的缓存和失效策略。
                </p>
              </div>

              <div className="space-y-3">
                {promptLayers.map((layer, index) => {
                  const active = index === activeLayer
                  const open = index <= activeLayer

                  return (
                    <button
                      key={layer.title}
                      type="button"
                      onClick={() => setActiveLayer(index)}
                      className={[
                        "w-full rounded-[1.4rem] border p-4 text-left transition",
                        active ? "border-stone-900 bg-stone-900 text-stone-50" : "border-black/8 bg-stone-50/80",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium">{layer.title}</span>
                        <ChevronDownIcon
                          className={[
                            "size-4 transition",
                            open ? "rotate-180" : "rotate-0",
                          ].join(" ")}
                        />
                      </div>
                      <div
                        className={[
                          "overflow-hidden text-sm leading-6 transition-all",
                          open ? "mt-3 max-h-24 opacity-80" : "max-h-0 opacity-0",
                        ].join(" ")}
                      >
                        {layer.detail}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-black/10 bg-[linear-gradient(180deg,rgba(245,244,255,0.85),rgba(255,249,238,0.9))] shadow-[0_16px_50px_rgba(65,54,33,0.08)]">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 space-y-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] tracking-[0.24em] uppercase">
                  05 Systems
                </Badge>
                <h2 className="font-heading text-3xl">扩展系统</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Claude Code 不只是主循环和工具池。skills、plugins、MCP、tasks、remote 一起把它推向一个可扩展 agent 平台。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {systemGroups.map((group, index) => (
                  <Button
                    key={group.title}
                    variant={activeSystem === index ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setActiveSystem(index)}
                  >
                    {group.title}
                  </Button>
                ))}
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-black/8 bg-white/75 p-6">
                <div className="mb-3 flex items-center gap-3">
                  <Layers2Icon className="size-5 text-stone-600" />
                  <div>
                    <div className="text-xl font-semibold">{systemGroups[activeSystem]?.title}</div>
                    <div className="text-sm text-muted-foreground">{systemGroups[activeSystem]?.hint}</div>
                  </div>
                </div>
                <p className="text-sm leading-7 text-stone-700">{systemGroups[activeSystem]?.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {systemGroups[activeSystem]?.points.map((point) => (
                    <div key={point} className="rounded-full border border-black/8 bg-stone-50 px-3 py-1.5 text-xs text-stone-600">
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(34,30,25,0.96),rgba(66,56,41,0.92))] p-6 text-stone-50 shadow-[0_16px_50px_rgba(45,36,23,0.14)] md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] tracking-[0.24em] uppercase text-stone-200">
                06 Easter Eggs
              </Badge>
              <h2 className="font-heading text-3xl">彩蛋</h2>
              <p className="max-w-2xl text-sm leading-6 text-stone-300/90">
                这一块专门讲默认界面里不一定直接展示，但最能体现系统味道的地方：隐藏工具、冷门命令、REPL 双层工具、prompt cache 和 feature flag 背后的另一层 Claude Code。
              </p>
            </div>
            <SparklesIcon className="size-7 text-amber-200" />
          </div>

          <div className="grid gap-3">
            {easterEggs.map((egg, index) => {
              const open = openEggs.includes(index)

              return (
                <button
                  key={egg.title}
                  type="button"
                  onClick={() =>
                    setOpenEggs((current) =>
                      current.includes(index)
                        ? current.filter((item) => item !== index)
                        : [...current, index],
                    )
                  }
                  className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4 text-left backdrop-blur-sm transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {index % 2 === 0 ? (
                        <WandSparklesIcon className="size-4 text-amber-200" />
                      ) : (
                        <PuzzleIcon className="size-4 text-sky-200" />
                      )}
                      <span className="font-medium">{egg.title}</span>
                    </div>
                    <ChevronDownIcon
                      className={[
                        "size-4 transition",
                        open ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    />
                  </div>
                  <div
                    className={[
                      "overflow-hidden text-sm leading-6 text-stone-300 transition-all",
                      open ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0",
                    ].join(" ")}
                  >
                    {egg.body}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <Separator className="bg-black/10" />

        <footer className="flex flex-col gap-3 pb-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BotIcon className="size-4" />
            <span>当前页面已经把 Claude Code 的主循环、数据体量、扩展系统和关键彩蛋全部接进叙事结构。</span>
          </div>
          <div className="flex items-center gap-2">
            <LockIcon className="size-4" />
            <span>下一步更适合继续精修视觉和动效，不必再补结构。</span>
          </div>
        </footer>
      </section>
    </main>
  )
}
