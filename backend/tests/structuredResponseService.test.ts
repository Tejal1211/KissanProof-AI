import { describe, expect, it } from "vitest";
import { z } from "zod";
import { callStructuredWithRetry } from "../src/services/structuredResponseService.js";

const schema = z.object({ answer: z.string() });

describe("callStructuredWithRetry", () => {
  it("returns valid output after one provider request", async () => {
    let calls = 0;
    const result = await callStructuredWithRetry("prompt", schema, async () => {
      calls += 1;
      return '{"answer":"ready"}';
    });

    expect(result).toEqual({ answer: "ready" });
    expect(calls).toBe(1);
  });

  it("retries malformed output once with a stricter prompt", async () => {
    const prompts: string[] = [];
    const result = await callStructuredWithRetry("prompt", schema, async (requestPrompt) => {
      prompts.push(requestPrompt);
      return prompts.length === 1 ? "not json" : '{"answer":"recovered"}';
    });

    expect(result).toEqual({ answer: "recovered" });
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain("ONLY the JSON object");
  });

  it("does not repeat a failed provider request", async () => {
    let calls = 0;
    await expect(
      callStructuredWithRetry("prompt", schema, async () => {
        calls += 1;
        throw new Error("provider unavailable");
      })
    ).rejects.toMatchObject({ code: "AI_PROVIDER_ERROR", status: 502 });

    expect(calls).toBe(1);
  });

  it("returns a controlled error after two invalid responses", async () => {
    let calls = 0;
    await expect(
      callStructuredWithRetry("prompt", schema, async () => {
        calls += 1;
        return "not json";
      })
    ).rejects.toMatchObject({ code: "AI_RESPONSE_INVALID", status: 502 });

    expect(calls).toBe(2);
  });
});