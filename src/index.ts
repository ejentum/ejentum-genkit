/**
 * ejentum-genkit: Genkit integration for the Ejentum Reasoning Harness.
 *
 * Re-exports the eight Ejentum harness tools (four dynamic + four
 * adaptive), registered with the caller's `genkit()` instance via
 * `ai.defineTool`, and the `createEjentumTools(ai)` array factory.
 * Pass the returned array to `ai.generate({ tools })` or
 * `ai.chat({ tools })`.
 *
 * 30-day free trial, then €5 Go or €25 Super for adaptive tools.
 * Pricing at https://ejentum.com/pricing.
 */

export {
  createEjentumTools,
  createReasoningTool,
  createCodeTool,
  createAntiDeceptionTool,
  createMemoryTool,
  createAdaptiveReasoningTool,
  createAdaptiveCodeTool,
  createAdaptiveAntiDeceptionTool,
  createAdaptiveMemoryTool,
} from "./tools.js";

export {
  callLogicApi,
  DEFAULT_API_URL,
  DEFAULT_TIMEOUT_MS,
  VALID_MODES,
  type EjentumConfig,
  type HarnessMode,
} from "./api.js";

export const VERSION = "0.2.0";
