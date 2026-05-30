/**
 * Genkit `ai.defineTool()` factories for the Ejentum Reasoning Harness.
 *
 * Eight tools: four dynamic (`reasoning`, `code`, `anti-deception`,
 * `memory`) and four adaptive (`adaptive-reasoning`, `adaptive-code`,
 * `adaptive-anti-deception`, `adaptive-memory`) that pre-fit the
 * cognitive operation to the caller's task via an adapter LLM.
 * Adaptive tools require the Go or Super tier.
 *
 * Tool name (the `name` field, visible to the LLM) equals the API mode
 * string. Genkit's `defineTool` is bound to a `genkit()` instance, so
 * the factory accepts the caller's `ai` and registers tools against it.
 *
 * The bracketed labels in the returned injection (`[NEGATIVE GATE]`,
 * `[PROCEDURE]`, `[REASONING TOPOLOGY]`, etc.) are instructions to the
 * agent, not content to display.
 */

import { z, type Genkit, type ToolAction } from "genkit";

import { callLogicApi, type EjentumConfig } from "./api.js";

const querySchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "A 1-2 sentence description of the task the agent is about to " +
        "work on. Be specific about the failure mode to avoid. For " +
        "memory and adaptive-memory, format as: 'I noticed [X]. This " +
        "might mean [Y]. Sharpen: [Z].'",
    ),
});

// ---------------------------------------------------------------------------
// Dynamic tools
// ---------------------------------------------------------------------------

export function createReasoningTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "reasoning",
      description:
        "Retrieve a reasoning injection before any analytical, " +
        "diagnostic, planning, or multi-step task. Returns a structured " +
        "injection with a named failure pattern, an executable procedure, " +
        "a reasoning topology (graph DAG), and a falsification test from " +
        "a library of 311 reasoning operations.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("reasoning", query, config),
  );
}

export function createCodeTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "code",
      description:
        "Retrieve a code injection before any code generation, " +
        "refactoring, review, or debugging task. Returns a structured " +
        "injection with a named code-failure pattern, an engineering " +
        "procedure, a reasoning topology (graph DAG), and a verification " +
        "step from a library of 128 code operations.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("code", query, config),
  );
}

export function createAntiDeceptionTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "anti-deception",
      description:
        "Retrieve an anti-deception injection before responding to any " +
        "prompt that pressures the agent to validate, certify, or soften " +
        "an honest assessment. Returns a structured injection with a " +
        "named deception pattern, an integrity procedure, a detection " +
        "topology (graph DAG with omission-bias gates), and an integrity " +
        "check from a library of 139 operations.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("anti-deception", query, config),
  );
}

export function createMemoryTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "memory",
      description:
        "Retrieve a memory-mode injection ONLY when sharpening an " +
        "observation the agent has already formed about cross-turn " +
        "drift or pattern. Filter-oriented, not write-oriented. Format " +
        "'query' as: 'I noticed [X]. This might mean [Y]. Sharpen: [Z].' " +
        "Library of 101 perception operations.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("memory", query, config),
  );
}

// ---------------------------------------------------------------------------
// Adaptive tools (Go or Super tier required)
// ---------------------------------------------------------------------------

export function createAdaptiveReasoningTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "adaptive-reasoning",
      description:
        "Same triggers as `reasoning`, but the returned operation is " +
        "REWRITTEN by an adapter LLM to fit the specific task. Procedure " +
        "steps and topology DAG nodes are concretized with task-specific " +
        "language. Use when the dynamic tool is too generic or for " +
        "high-stakes analytical work. Requires Go or Super tier. Cost ~2-3s.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("adaptive-reasoning", query, config),
  );
}

export function createAdaptiveCodeTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "adaptive-code",
      description:
        "Same triggers as `code`, but the returned operation is REWRITTEN " +
        "by an adapter LLM to fit the specific code task: language, " +
        "framework, and failure modes are concretized in every step. " +
        "Requires Go or Super tier. Cost ~2-3s.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("adaptive-code", query, config),
  );
}

export function createAdaptiveAntiDeceptionTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "adaptive-anti-deception",
      description:
        "Same triggers as `anti-deception`, but the returned operation " +
        "is REWRITTEN by an adapter LLM to fit the specific integrity " +
        "dynamic at play. Use when stakes of a soft answer are high. " +
        "Requires Go or Super tier. Cost ~2-3s.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) =>
      callLogicApi("adaptive-anti-deception", query, config),
  );
}

export function createAdaptiveMemoryTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "adaptive-memory",
      description:
        "Same triggers as `memory`, but the returned operation is " +
        "REWRITTEN by an adapter LLM to fit the specific observation. " +
        "Observe FIRST, then call. Requires Go or Super tier. Cost ~2-3s.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("adaptive-memory", query, config),
  );
}

/**
 * Register all eight Ejentum harness tools with a Genkit instance.
 *
 * ```ts
 * import { genkit } from "genkit";
 * import { gemini20Flash, googleAI } from "@genkit-ai/googleai";
 * import { createEjentumTools } from "ejentum-genkit";
 *
 * const ai = genkit({ plugins: [googleAI()], model: gemini20Flash });
 * const tools = createEjentumTools(ai);
 *
 * const response = await ai.generate({
 *   prompt: "Should we keep the GraphQL gateway or pivot to REST?",
 *   tools,
 * });
 * ```
 *
 * @param ai The user's Genkit instance.
 * @param config Shared Ejentum config (`apiKey`, `apiUrl`,
 *   `timeoutMs`). If `apiKey` is omitted, each tool reads
 *   `EJENTUM_API_KEY` from the environment at call time.
 */
export function createEjentumTools(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction[] {
  return [
    createReasoningTool(ai, config),
    createCodeTool(ai, config),
    createAntiDeceptionTool(ai, config),
    createMemoryTool(ai, config),
    createAdaptiveReasoningTool(ai, config),
    createAdaptiveCodeTool(ai, config),
    createAdaptiveAntiDeceptionTool(ai, config),
    createAdaptiveMemoryTool(ai, config),
  ];
}
