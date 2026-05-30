# ejentum-genkit

[Genkit](https://genkit.dev) integration for the Ejentum Reasoning Harness. `createEjentumTools(ai)` registers eight tools against your `genkit()` instance and returns them as a `ToolAction[]` you pass to `ai.generate({ tools })` or `ai.chat({ tools })`.

Use the harness before the agent generates on complex, multi-step, or multi-constraint tasks where the model's default reasoning template would miss a constraint, take a shortcut, or drift across turns. Each call returns a *cognitive operation*: a structured procedure (numbered steps with a failure pattern to refuse and a falsification test) paired with an executable reasoning topology (a DAG of those steps with decision gates, parallel branches, bounded loops, and meta-cognitive exit nodes). The agent reads both layers before producing its response.

Four dynamic tools (`reasoning`, `code`, `anti-deception`, `memory`) are available on all tiers including the 30-day free trial. Four adaptive tools (`adaptive-reasoning`, `adaptive-code`, `adaptive-anti-deception`, `adaptive-memory`) additionally run an adapter LLM that rewrites the matched operation with task-specific identifiers; they require the Go or Super tier.

## Install

```bash
npm install ejentum-genkit
# peer dep
npm install genkit
```

## Configuration

```bash
export EJENTUM_API_KEY="ej_..."
```

Or pass it explicitly: `createEjentumTools(ai, { apiKey: "..." })`. Get a key at [ejentum.com/pricing](https://ejentum.com/pricing).

## Usage

```ts
import { genkit } from "genkit";
import { gemini20Flash, googleAI } from "@genkit-ai/googleai";
import { createEjentumTools } from "ejentum-genkit";

const ai = genkit({ plugins: [googleAI()], model: gemini20Flash });
const tools = createEjentumTools(ai);

const response = await ai.generate({
  prompt: "Should we keep the GraphQL gateway or pivot to REST?",
  tools,
});
```

### Chat interface

```ts
const chat = ai.chat({ tools: createEjentumTools(ai) });
const response = await chat.send("Why does our nightly ETL fail intermittently?");
```

### Pick a subset

```ts
import { createReasoningTool, createAntiDeceptionTool } from "ejentum-genkit";

const tools = [createReasoningTool(ai), createAntiDeceptionTool(ai)];
```

## Tool inventory

The LLM-facing tool name is the `name` field passed to `ai.defineTool` (canonical hyphenated strings).

| Factory | Tool `name` (LLM-visible) | Mode string | Library size |
|---|---|---|---:|
| `createReasoningTool` | `reasoning` | `reasoning` | 311 |
| `createCodeTool` | `code` | `code` | 128 |
| `createAntiDeceptionTool` | `anti-deception` | `anti-deception` | 139 |
| `createMemoryTool` | `memory` | `memory` | 101 |
| `createAdaptiveReasoningTool` | `adaptive-reasoning` | `adaptive-reasoning` | (same pool) |
| `createAdaptiveCodeTool` | `adaptive-code` | `adaptive-code` | (same pool) |
| `createAdaptiveAntiDeceptionTool` | `adaptive-anti-deception` | `adaptive-anti-deception` | (same pool) |
| `createAdaptiveMemoryTool` | `adaptive-memory` | `adaptive-memory` | (same pool) |

Each tool takes one parameter, `query: string`, and returns the injection as plain text. Errors return as strings rather than thrown exceptions.

## API reference

```ts
import { createEjentumTools, type EjentumConfig, type HarnessMode } from "ejentum-genkit";
import { Genkit, ToolAction } from "genkit";

createEjentumTools(ai: Genkit, config?: EjentumConfig): ToolAction[]
```

| `EjentumConfig` field | Default | Description |
|---|---|---|
| `apiKey` | `process.env.EJENTUM_API_KEY` | API key. |
| `apiUrl` | `https://api.ejentum.com/harness/` | Override for self-hosted gateway. |
| `timeoutMs` | `10000` | Per-call HTTP timeout. |

Per-tool factories: `createReasoningTool(ai, config)`, `createCodeTool(ai, config)`, `createAntiDeceptionTool(ai, config)`, `createMemoryTool(ai, config)`, plus the four `createAdaptive*Tool(ai, config)` variants. Each accepts the caller's `Genkit` instance plus an optional `EjentumConfig`.

## Why the `ai` argument

Genkit's `defineTool` is an instance method on the `genkit()` object, not a free function. The factory therefore accepts the caller's `ai` instance and registers all eight tools against it. The returned `ToolAction[]` is a standard array consumable by `ai.generate({ tools })` and `ai.chat({ tools })`.

## Wire contract

`createEjentumTools(ai)` issues:

```
POST https://api.ejentum.com/harness/
Headers: Authorization: Bearer <key>, Content-Type: application/json
Body:    { "query": <string>, "mode": <one of 8 mode strings> }
Response (200): [ { "<mode>": "<injection string>" } ]
```

Full wire contract, field structure, DAG syntax, and a canonical dynamic-vs-adaptive comparison on the same query are documented in the [ejentum-mcp README](https://github.com/ejentum/ejentum-mcp#wire-contract). The format is identical across this package and every Ejentum shim.

## ejentum-mcp alternative

Genkit supports MCP via the `@genkit-ai/mcp` plugin:

```ts
import { mcpClient } from "@genkit-ai/mcp";

const ejentumPlugin = mcpClient({
  name: "ejentum",
  serverProcess: { command: "npx", args: ["-y", "ejentum-mcp"] },
});
const ai = genkit({ plugins: [ejentumPlugin] });
```

## Compatibility

- Node.js 18+
- `genkit` 1.x (peer dep `>=1.0.0`)
- TypeScript 5.x
- `zod` is re-exported from `genkit`; no separate install

## License

[MIT](./LICENSE)


## Measured effects

The Ejentum harness is benchmarked publicly under CC BY 4.0 at [github.com/ejentum/benchmarks](https://github.com/ejentum/benchmarks):

- **ELEPHANT** sycophancy: 5.8% composite on GPT-4o (40 real Reddit scenarios)
- **LiveCodeBench Hard**: 85.7% to 100% on Claude Opus (28 competitive programming tasks)
- **Memory retention**: 50% fewer stale facts served (20-turn implicit state changes)
- Plus per-harness numbers across BBH/CausalBench/MuSR, ARC-AGI-3, SciCode, and perception tasks

Methodology, scenarios, run scripts, and raw outputs are all in-repo.
