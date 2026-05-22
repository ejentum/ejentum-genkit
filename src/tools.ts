/**
 * Genkit `ai.defineTool()` factories for the Ejentum Reasoning Harness.
 *
 * Unlike the other Ejentum framework shims, Genkit's `defineTool` is a
 * method on a `genkit()` instance, not a free function. So the factory
 * here accepts the caller's `ai` instance and registers four tools
 * against it. The returned tool actions are then passed to
 * `ai.generate({ tools })` or `ai.chat({ tools })`.
 *
 * The bracketed labels in the returned scaffold (`[NEGATIVE GATE]`,
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
        "the memory tool, format as: 'I noticed [X]. This might mean " +
        "[Y]. Sharpen: [Z].'",
    ),
});

/**
 * Reasoning-mode harness tool. Call BEFORE the agent performs
 * analysis, diagnosis, planning, or any multi-step task. Library
 * of 311 reasoning operations.
 */
export function createReasoningTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "harness_reasoning",
      description:
        "Retrieve a reasoning scaffold before any analytical, " +
        "diagnostic, planning, or multi-step task. Returns a " +
        "structured scaffold with a named failure pattern, an " +
        "executable procedure, a reasoning topology (graph DAG), " +
        "and a falsification test from a library of 311 reasoning " +
        "operations. Use 'query' to describe what the agent is " +
        "about to work on in 1-2 sentences.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("reasoning", query, config),
  );
}

/**
 * Code-mode harness tool. Call BEFORE the agent produces or
 * reviews code. Library of 128 software-engineering operations.
 */
export function createCodeTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "harness_code",
      description:
        "Retrieve a code scaffold before any code generation, " +
        "refactoring, review, or debugging task. Returns a " +
        "structured scaffold with a named code-failure pattern, an " +
        "engineering procedure, a reasoning topology (graph DAG), " +
        "and a verification step from a library of 128 code " +
        "operations. Use 'query' to describe what the agent is " +
        "coding or reviewing in 1-2 sentences.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("code", query, config),
  );
}

/**
 * Anti-deception harness tool. Call BEFORE the agent responds to
 * prompts that pressure validation, manufactured agreement,
 * authority appeals, fabricated commitments, or any setup where
 * the obvious helpful answer would compromise honesty.
 */
export function createAntiDeceptionTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "harness_anti_deception",
      description:
        "Retrieve an anti-deception scaffold before responding to " +
        "any prompt that pressures the agent to validate, certify, " +
        "or soften an honest assessment. Returns a structured " +
        "scaffold with a named deception pattern, an integrity " +
        "procedure, a detection topology (graph DAG with " +
        "omission-bias gates), and an integrity check. Use 'query' " +
        "to describe the integrity dynamic at play in 1-2 sentences.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("anti-deception", query, config),
  );
}

/**
 * Memory-mode harness tool. Call ONLY when sharpening an
 * observation the agent has already formed about cross-turn
 * drift or pattern. Filter-oriented, not write-oriented.
 */
export function createMemoryTool(
  ai: Genkit,
  config: EjentumConfig = {},
): ToolAction {
  return ai.defineTool(
    {
      name: "harness_memory",
      description:
        "Retrieve a memory-mode scaffold ONLY when sharpening an " +
        "observation the agent has already formed about cross-turn " +
        "drift or pattern. Filter-oriented, not write-oriented; do " +
        "not call for fact extraction. Format 'query' as: 'I " +
        "noticed [X]. This might mean [Y]. Sharpen: [Z].' Calling " +
        "with an empty mind defeats the harness.",
      inputSchema: querySchema,
      outputSchema: z.string(),
    },
    async ({ query }) => callLogicApi("memory", query, config),
  );
}

/**
 * Register all four Ejentum harness tools with a Genkit instance.
 *
 * Genkit's `defineTool` is bound to a `genkit()` instance, so this
 * factory accepts the caller's `ai` and registers the four tools
 * against it. The returned array goes into `ai.generate({ tools })`
 * or `ai.chat({ tools })`.
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
  ];
}
