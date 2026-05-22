/**
 * ejentum-genkit: Genkit integration for the Ejentum Reasoning Harness.
 *
 * Re-exports the four Ejentum harness tools (registered with the
 * caller's `genkit()` instance via `ai.defineTool`) and the
 * `createEjentumTools(ai)` factory. Pass the returned array to
 * `ai.generate({ tools })` or `ai.chat({ tools })`.
 *
 * Free and paid tiers at https://ejentum.com/pricing.
 */

export {
  createEjentumTools,
  createReasoningTool,
  createCodeTool,
  createAntiDeceptionTool,
  createMemoryTool,
} from "./tools.js";

export {
  callLogicApi,
  DEFAULT_API_URL,
  DEFAULT_TIMEOUT_MS,
  VALID_MODES,
  type EjentumConfig,
  type HarnessMode,
} from "./api.js";

export const VERSION = "0.1.0";
