# ejentum-genkit

[Genkit](https://genkit.dev) integration for the [Ejentum](https://ejentum.com) Reasoning Harness. `createEjentumTools(ai)` registers eight agent-callable tools against your Genkit instance and returns them as an array you pass to `ai.generate({ tools })`: four dynamic (`reasoning`, `code`, `anti-deception`, `memory`) plus four adaptive (`adaptive-reasoning`, `adaptive-code`, `adaptive-anti-deception`, `adaptive-memory`) that pre-fit the cognitive operation to the caller's task via an adapter LLM.

Each operation in the Ejentum library (679 of them, organized across four cognitive harnesses each with dynamic and adaptive variants) is engineered in **two layers**:

- a **natural-language procedure** the model can read, naming the steps to take and the failure pattern to refuse, and
- an **executable reasoning topology**: a graph-shaped plan over those steps. The plan names explicit decision points where the model branches, parallel branches that run and rejoin, bounded loops that run until convergence, named meta-cognitive moments where the model is asked to stop, look at its own working, and re-enter at a specific step, plus escape paths for when the prescribed plan stops fitting the task at hand.

The natural-language layer tells the model *what* to do. The topology layer pins down *how* those steps connect: where to decide, where to loop, where to stop and look at itself. Together they act as a persistent attention anchor that survives long context windows and multi-turn execution chains, which is precisely where a model's own reasoning template typically decays.

## Installation

```bash
npm install ejentum-genkit
# peer dep
npm install genkit
```

## Configuration

Get an Ejentum API key at <https://ejentum.com/pricing>. The 30-day free trial (no card required) includes 1,000 dynamic reasoning calls; adaptive tools require Go or Super.

```bash
export EJENTUM_API_KEY="ej_..."
```

Or pass it explicitly: `createEjentumTools(ai, { apiKey: "..." })`.

## Usage

```ts
import { genkit } from "genkit";
import { gemini20Flash, googleAI } from "@genkit-ai/googleai";
import { createEjentumTools } from "ejentum-genkit";

const ai = genkit({
  plugins: [googleAI()],
  model: gemini20Flash,
});

const tools = createEjentumTools(ai); // reads EJENTUM_API_KEY from env

const response = await ai.generate({
  prompt:
    "We've spent three months on the GraphQL gateway. " +
    "Should we keep going or pivot to REST?",
  tools,
});

console.log(response.text);
```

The model reads each tool's description and routes to `anti-deception` on the sunk-cost framing, `reasoning` on a clean analytical question, etc.

### Chat interface

```ts
const chat = ai.chat({
  system: "Answer questions using the tools you have.",
  tools: createEjentumTools(ai),
});

const response = await chat.send(
  "Why does our nightly ETL fail intermittently?",
);
```

### Pick a subset of harnesses

```ts
import { createReasoningTool, createAntiDeceptionTool } from "ejentum-genkit";

const tools = [
  createReasoningTool(ai),
  createAntiDeceptionTool(ai),
  // ...your other non-Ejentum tools
];
```

### Explicit API key

```ts
const tools = createEjentumTools(ai, { apiKey: "ej_..." });
```

## The eight tools

### Dynamic (single retrieval, all tiers including the 30-day free trial)

| Tool name (LLM-visible) | Best for | Library size |
|---|---|---|
| `reasoning` | Analytical, diagnostic, planning, multi-step tasks | 311 operations |
| `code` | Code generation, refactoring, review, debugging | 128 operations |
| `anti-deception` | Prompts that pressure the agent to validate, certify, or soften an honest assessment | 139 operations |
| `memory` | Sharpening an observation about cross-turn drift. Filter-oriented, not write-oriented. Format `query` as `"I noticed X. This might mean Y. Sharpen: Z."` | 101 operations |

### Adaptive (top-k retrieval + adapter LLM rewrites operation to fit the task; Go or Super tier required)

| Tool name | When to prefer over the dynamic version |
|---|---|
| `adaptive-reasoning` | High-stakes analytical work where every DAG node should be mapped to your specifics before generation. Cost ~2-3s vs ~1s. |
| `adaptive-code` | Security-critical reviews, refactor-heavy diffs, or any code work where every verification step should be concretized. |
| `adaptive-anti-deception` | When the stakes of a soft or sycophantic answer are high. |
| `adaptive-memory` | When the dynamic memory tool's general scaffold is not sharp enough for the perception being formed. |

Each tool returns a string. The bracketed labels in the returned injection (`[NEGATIVE GATE]`, `[PROCEDURE]`, `[REASONING TOPOLOGY]`, etc.) are instructions to the agent, not content to display.

## What an injection looks like

A real `reasoning` mode response on the query `investigate why our nightly ETL job has started failing intermittently over the past two weeks; nothing in the code or schema has changed`:

```
[NEGATIVE GATE]
The server's response time was accepted as average, despite a suspicious
rhythm break in its timing pattern.

[PROCEDURE]
Step 1: Establish baseline timing profiles by extracting historical
durations and intervals for each event type. Step 2: Compare each observed
timing against its baseline and compute deviation magnitude. ...

[REASONING TOPOLOGY]
S1:durations -> FIXED_POINT[baselines] -> N{dismiss_timing_deviations_
without_investigation} -> for_each: S2:compare -> S3:deviation ->
G1{>2sigma?} --yes-> S4:classify -> S5:probe_cause -> FLAG -> continue --no->
S6:validate -> continue -> all_checked -> OUT:anomaly_report

[FALSIFICATION TEST]
If no event timing is flagged as suspiciously fast or slow relative to
baseline, temporal anomaly detection was not active.

Amplify: timing baseline comparison; anomaly classification
Suppress: average timing acceptance; outlier normalization
```

## API reference

```ts
import { createEjentumTools, type EjentumConfig } from "ejentum-genkit";
import { Genkit, ToolAction } from "genkit";

createEjentumTools(ai: Genkit, config?: EjentumConfig): ToolAction[]
```

| Config field | Default | Description |
|---|---|---|
| `apiKey` | `process.env.EJENTUM_API_KEY` | Ejentum API key. |
| `apiUrl` | `https://api.ejentum.com/harness/` | Override only if you self-host the gateway. |
| `timeoutMs` | `10000` | Per-call HTTP timeout in milliseconds. |

Per-tool factories (all accept the caller's Genkit instance plus optional config):

- Dynamic: `createReasoningTool(ai, config)`, `createCodeTool(ai, config)`, `createAntiDeceptionTool(ai, config)`, `createMemoryTool(ai, config)`
- Adaptive: `createAdaptiveReasoningTool(ai, config)`, `createAdaptiveCodeTool(ai, config)`, `createAdaptiveAntiDeceptionTool(ai, config)`, `createAdaptiveMemoryTool(ai, config)`

## Why the `ai` argument

Unlike Vercel AI SDK (`tool()`) or LangChain (`tool()`) or Mastra (`createTool()`), Genkit's `defineTool` is an instance method on `genkit()`. So this factory accepts your `ai` instance and registers all eight harness tools against it. The returned `ToolAction[]` is then a standard array of Genkit tool actions ready for `ai.generate({ tools })`.

## ejentum-mcp alternative

Genkit supports MCP via the `@genkit-ai/mcp` plugin. If you'd rather wire the same eight tools via the protocol:

```ts
import { mcpClient } from "@genkit-ai/mcp";

const ejentumPlugin = mcpClient({
  name: "ejentum",
  serverProcess: { command: "npx", args: ["-y", "ejentum-mcp"] },
});

const ai = genkit({ plugins: [ejentumPlugin] });
```

This `ejentum-genkit` package is the direct-REST path; MCP is the universal protocol path.

## Compatibility

- Node.js 18+
- `genkit` 1.x (peer dep `>=1.0.0`)
- TypeScript 5.x
- `zod` is re-exported from `genkit` itself, no separate install needed

## Resources

- Ejentum homepage: <https://ejentum.com>
- Pricing: <https://ejentum.com/pricing>
- API reference: <https://ejentum.com/docs/api_reference>
- "Why LLM Agents Fail" essay: <https://ejentum.com/blog/why-llm-agents-fail>
- "Under Pressure" research paper: <https://doi.org/10.5281/zenodo.19392715>
- Genkit documentation: <https://genkit.dev/docs>

## License

[MIT](./LICENSE)
