# 📚 Design & Architecture Docs

Design decisions for AK Productions — Studio OS, recorded as living docs so the
reasoning behind the build is auditable (and demo-explainable).

| # | Doc | What it covers |
|---|---|---|
| 01 | [Architecture](./01-architecture.md) | System shape, agent roster, request flow |
| 02 | [Agentic Patterns](./02-agentic-patterns.md) | ReAct tool-loops, terminal tools, error recovery, guardrails, reflection, orchestration |
| 03 | [LLM Fallback Chain](./03-llm-fallback-chain.md) | Multi-provider router; cost-first vs capability-first routing |
| 04 | [Model Configuration](./04-model-configuration.md) | Centralized config + runtime admin panel |
| 05 | [Studio Intelligence](./05-studio-intelligence.md) | YouTube digest agent — OAuth, RSS, delivery, scheduling |
| 06 | [Design System](./06-design-system.md) | Switchable multi-theme UI |
| 07 | [Decision Log (ADRs)](./07-decision-log.md) | Chronological record of key decisions + trade-offs |

> Operational setup guides live alongside the code: [STUDIO_INTEL.md](../STUDIO_INTEL.md),
> [GCP_DEPLOYMENT.md](../GCP_DEPLOYMENT.md), [ARCHITECTURE.md](../ARCHITECTURE.md).
