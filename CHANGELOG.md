# Changelog

All notable changes to `ejentum-genkit` are documented here. This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-23

### Added

- Initial release.
- `createEjentumTools(ai, config)` factory registers four Ejentum harness tools (`harness_reasoning`, `harness_code`, `harness_anti_deception`, `harness_memory`) against the caller's Genkit instance via `ai.defineTool` and returns them as a `ToolAction[]` array. Pass directly to `ai.generate({ tools })` or `ai.chat({ tools })`.
- Per-tool factories also exported: `createReasoningTool(ai, config)`, `createCodeTool(ai, config)`, `createAntiDeceptionTool(ai, config)`, `createMemoryTool(ai, config)`. Each accepts the caller's Genkit instance.
- Each tool has a Zod `inputSchema` for `query` (`string`, `min(1)`) and a Zod `outputSchema` of `z.string()` (matches Genkit's pattern of strongly-typed input/output schemas).
- Native `fetch` (Node 18+) with `AbortController`-based timeout. Genkit is the only peer dep; zod is re-exported from `genkit` itself.
- Construction-time and call-time validation: empty/whitespace query returns an actionable error without spending a paid API call. Missing `EJENTUM_API_KEY` returns an actionable error pointing to https://ejentum.com/pricing.
- Errors returned as human-readable strings for every failure path (no exceptions cross the tool boundary, so an agent step never crashes the run).
- TypeScript-first with declaration files (`.d.ts`) and source maps. Strict mode enabled.
- Unit tests via vitest cover the call helper failure surface and per-mode success-path round-trips. Tool factories themselves require a real Genkit instance to register against (verified manually).
- Published to npm with `--provenance` provenance attestation via GitHub Actions OIDC.

### Background

Genkit's `defineTool` is an instance method on `genkit()` (unlike Vercel AI SDK / Mastra / LangChain which use free `tool()` functions). The factory therefore takes the caller's `ai` instance as the first argument and registers all four harnesses against it. Returned `ToolAction[]` array is passed to `ai.generate({ tools })`.
