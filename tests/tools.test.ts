import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  callLogicApi,
  createAdaptiveAntiDeceptionTool,
  createAdaptiveCodeTool,
  createAdaptiveMemoryTool,
  createAdaptiveReasoningTool,
  createAntiDeceptionTool,
  createCodeTool,
  createEjentumTools,
  createMemoryTool,
  createReasoningTool,
  VALID_MODES,
} from "../src/index.js";

const API_URL = "https://example.test/api/";

const okResponse = (body: unknown): Response => ({
  status: 200,
  headers: new Headers({ "Content-Type": "application/json" }),
  json: async () => body,
  text: async () => JSON.stringify(body),
}) as unknown as Response;

const errorResponse = (status: number, text: string): Response => ({
  status,
  headers: new Headers(),
  json: async () => {
    throw new Error("not json");
  },
  text: async () => text,
}) as unknown as Response;

const htmlResponse = (text: string): Response => ({
  status: 200,
  headers: new Headers({ "Content-Type": "text/html" }),
  json: async () => {
    throw new Error("not json");
  },
  text: async () => text,
}) as unknown as Response;

/**
 * Stub Genkit instance: captures defineTool calls so we can verify the
 * factory contract without spinning up real Genkit. The returned
 * ToolAction stub stores name, description, schemas, and handler.
 */
function makeStubGenkit() {
  const captured: Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    outputSchema: unknown;
    handler: (input: unknown) => Promise<unknown>;
  }> = [];

  const ai = {
    defineTool: (
      meta: {
        name: string;
        description: string;
        inputSchema: unknown;
        outputSchema: unknown;
      },
      handler: (input: unknown) => Promise<unknown>,
    ) => {
      const action = { ...meta, handler };
      captured.push(action);
      return action;
    },
  } as never;

  return { ai, captured };
}

describe("createEjentumTools factory contract (stubbed Genkit)", () => {
  it("calls defineTool eight times with canonical mode-string names", () => {
    const { ai, captured } = makeStubGenkit();
    const tools = createEjentumTools(ai);

    expect(tools).toHaveLength(8);
    expect(captured.map((c) => c.name).sort()).toEqual([
      "adaptive-anti-deception",
      "adaptive-code",
      "adaptive-memory",
      "adaptive-reasoning",
      "anti-deception",
      "code",
      "memory",
      "reasoning",
    ]);
  });

  it("each registered tool has a non-empty description and schemas", () => {
    const { ai, captured } = makeStubGenkit();
    createEjentumTools(ai);

    for (const t of captured) {
      expect(t.description.length).toBeGreaterThan(50);
      expect(t.inputSchema).toBeDefined();
      expect(t.outputSchema).toBeDefined();
      expect(typeof t.handler).toBe("function");
    }
  });

  it("registers independent tools per factory call", () => {
    const { ai: a } = makeStubGenkit();
    const { ai: b } = makeStubGenkit();
    const ta = createEjentumTools(a);
    const tb = createEjentumTools(b);
    expect(ta[0]).not.toBe(tb[0]);
  });

  it("each tool's handler routes to the matching harness mode", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValue(
      okResponse([{ reasoning: "injection" }]),
    );

    const { ai, captured } = makeStubGenkit();
    createEjentumTools(ai, { apiKey: "test-key", apiUrl: API_URL });

    const reasoningTool = captured.find((c) => c.name === "reasoning");
    expect(reasoningTool).toBeDefined();
    await reasoningTool!.handler({ query: "test" });

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.mode).toBe("reasoning");
    expect(body.query).toBe("test");

    fetchSpy.mockRestore();
  });
});

describe("per-tool factories (stubbed Genkit)", () => {
  it("createReasoningTool registers with the canonical name", () => {
    const { ai, captured } = makeStubGenkit();
    createReasoningTool(ai);
    expect(captured[0]?.name).toBe("reasoning");
  });
  it("createCodeTool registers with the canonical name", () => {
    const { ai, captured } = makeStubGenkit();
    createCodeTool(ai);
    expect(captured[0]?.name).toBe("code");
  });
  it("createAntiDeceptionTool registers with the canonical name", () => {
    const { ai, captured } = makeStubGenkit();
    createAntiDeceptionTool(ai);
    expect(captured[0]?.name).toBe("anti-deception");
  });
  it("createMemoryTool registers with the canonical name", () => {
    const { ai, captured } = makeStubGenkit();
    createMemoryTool(ai);
    expect(captured[0]?.name).toBe("memory");
  });
  it("createAdaptiveReasoningTool registers with the canonical name", () => {
    const { ai, captured } = makeStubGenkit();
    createAdaptiveReasoningTool(ai);
    expect(captured[0]?.name).toBe("adaptive-reasoning");
  });
  it("createAdaptiveCodeTool registers with the canonical name", () => {
    const { ai, captured } = makeStubGenkit();
    createAdaptiveCodeTool(ai);
    expect(captured[0]?.name).toBe("adaptive-code");
  });
  it("createAdaptiveAntiDeceptionTool registers with the canonical name", () => {
    const { ai, captured } = makeStubGenkit();
    createAdaptiveAntiDeceptionTool(ai);
    expect(captured[0]?.name).toBe("adaptive-anti-deception");
  });
  it("createAdaptiveMemoryTool registers with the canonical name", () => {
    const { ai, captured } = makeStubGenkit();
    createAdaptiveMemoryTool(ai);
    expect(captured[0]?.name).toBe("adaptive-memory");
  });
});

describe("VALID_MODES constant", () => {
  it("contains the eight canonical modes", () => {
    expect([...VALID_MODES].sort()).toEqual([
      "adaptive-anti-deception",
      "adaptive-code",
      "adaptive-memory",
      "adaptive-reasoning",
      "anti-deception",
      "code",
      "memory",
      "reasoning",
    ]);
  });
});

describe("callLogicApi failure surface", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    delete process.env.EJENTUM_API_KEY;
  });

  it("empty query returns validation error without calling fetch", async () => {
    process.env.EJENTUM_API_KEY = "test-key";
    const result = await callLogicApi("reasoning", "", { apiUrl: API_URL });
    expect(result.toLowerCase()).toContain("query");
    expect(result.toLowerCase()).toContain("required");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("whitespace-only query does not leak a paid request", async () => {
    process.env.EJENTUM_API_KEY = "test-key";
    const result = await callLogicApi("reasoning", "   \t\n  ", {
      apiUrl: API_URL,
    });
    expect(result.toLowerCase()).toContain("query");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("missing api key returns actionable error", async () => {
    const result = await callLogicApi("reasoning", "diagnose 503s", {
      apiUrl: API_URL,
    });
    expect(result).toContain("EJENTUM_API_KEY");
    expect(result).toContain("ejentum.com/pricing");
  });

  it("401 returns actionable error", async () => {
    fetchSpy.mockResolvedValue(errorResponse(401, "Unauthorized"));
    const result = await callLogicApi("anti-deception", "anything", {
      apiKey: "bad-key",
      apiUrl: API_URL,
    });
    expect(result).toContain("401");
    expect(result).toContain("EJENTUM_API_KEY");
  });

  it("non-200 returns status code and truncated body", async () => {
    fetchSpy.mockResolvedValue(errorResponse(500, "boom"));
    const result = await callLogicApi("code", "anything", {
      apiKey: "test-key",
      apiUrl: API_URL,
    });
    expect(result).toContain("500");
    expect(result).toContain("boom");
  });

  it("invalid JSON response is handled", async () => {
    fetchSpy.mockResolvedValue(htmlResponse("<html>not json</html>"));
    const result = await callLogicApi("reasoning", "anything", {
      apiKey: "test-key",
      apiUrl: API_URL,
    });
    expect(result.toLowerCase()).toContain("not valid json");
  });

  it("unexpected response shape is handled", async () => {
    fetchSpy.mockResolvedValue(okResponse({ wrong: "shape" }));
    const result = await callLogicApi("code", "anything", {
      apiKey: "test-key",
      apiUrl: API_URL,
    });
    expect(result.toLowerCase()).toContain("unexpected response shape");
  });

  it("network error is caught and returned as string", async () => {
    fetchSpy.mockRejectedValue(new Error("simulated network failure"));
    const result = await callLogicApi("memory", "I noticed drift. This might mean Y. Sharpen: Z.", {
      apiKey: "test-key",
      apiUrl: API_URL,
    });
    expect(result.toLowerCase()).toContain("network error");
    expect(result).toContain("simulated network failure");
  });
});

describe("callLogicApi success path", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  for (const mode of [
    "reasoning",
    "code",
    "anti-deception",
    "memory",
    "adaptive-reasoning",
    "adaptive-code",
    "adaptive-anti-deception",
    "adaptive-memory",
  ] as const) {
    it(`round-trips ${mode} mode`, async () => {
      fetchSpy.mockResolvedValue(
        okResponse([{ [mode]: `[PROCEDURE] sample ${mode} injection` }]),
      );
      const query =
        mode === "memory" || mode === "adaptive-memory"
          ? "I noticed drift. This might mean Y. Sharpen: Z."
          : "sample task";
      const result = await callLogicApi(mode, query, {
        apiKey: "test-key",
        apiUrl: API_URL,
      });
      expect(result).toContain(`sample ${mode} injection`);
      const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body).toEqual({ query, mode });
    });
  }
});
