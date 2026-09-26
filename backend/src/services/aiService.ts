import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config, isAiConfigured } from "../config.js";
import { AppError } from "../middleware/errorHandler.js";
import { claimAnalysisSchema, chatAnswerSchema } from "../validators/schemas.js";
import { buildAnalysisPrompt, buildChatPrompt } from "../ai/prompts.js";
import type { ClaimAnalysis, Language } from "../types.js";

const anthropicClient = config.anthropicApiKey ? new Anthropic({ apiKey: config.anthropicApiKey }) : null;

function extractJsonText(raw: string): string {
  return raw.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
}

async function callAnthropic(prompt: string) {
  if (!anthropicClient) {
    throw new Error("Anthropic is not configured.");
  }

  const response = await anthropicClient.messages.create({
    model: config.anthropicModel,
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";
  return JSON.parse(extractJsonText(raw));
}

async function callGemini(prompt: string) {
  if (!config.geminiApiKey) {
    throw new Error("Gemini is not configured.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const raw = payload.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("") ?? "";

  return JSON.parse(extractJsonText(raw));
}

/**
 * Calls the configured AI provider and requires a JSON response validated against `schema`.
 * Retries once with a stricter reminder if the first response doesn't
 * parse/validate. Never throws a raw model/parse error to the caller —
 * only a controlled AppError, per the "never crash on bad AI output" rule.
 */
async function callStructured<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> {
  if (!isAiConfigured()) {
    throw new AppError(
      "AI_NOT_CONFIGURED",
      "The AI service is not configured on this server. Set GEMINI_API_KEY or ANTHROPIC_API_KEY to enable analysis.",
      503
    );
  }

  const attempt = async (extra?: string) => {
    const fullPrompt = extra ? `${prompt}\n\n${extra}` : prompt;
    if (config.provider === "gemini") {
      return await callGemini(fullPrompt);
    }
    return await callAnthropic(fullPrompt);
  };

  try {
    const parsed = await attempt();
    return schema.parse(parsed);
  } catch (firstErr) {
    try {
      const parsed = await attempt(
        "Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object, no other text."
      );
      return schema.parse(parsed);
    } catch (secondErr) {
      console.error("AI structured-output validation failed twice:", firstErr, secondErr);
      throw new AppError(
        "AI_RESPONSE_INVALID",
        "We couldn't complete the analysis. Please try again.",
        502
      );
    }
  }
}

export async function analyzeClaim(input: {
  claimType: string;
  crop: string;
  location: string;
  farmArea: string;
  eventDescription: string;
  eventDate: string;
  documents: { name: string; pages: { page: number; text: string }[] }[];
  language: Language;
}): Promise<ClaimAnalysis> {
  const prompt = buildAnalysisPrompt(input);
  const result = await callStructured(prompt, claimAnalysisSchema);
  return {
    summary: result.summary,
    readiness: result.readiness,
    informationFound: result.informationFound ?? [],
    needsVerification: result.needsVerification ?? [],
    missingInformation: result.missingInformation ?? [],
    issues: (result.issues ?? []).map((i) => ({ ...i, sources: i.sources ?? [] })),
    deadlines: result.deadlines ?? [],
    questionsForProfessional: result.questionsForProfessional ?? [],
    disclaimer:
      "This is general information and document assistance based on what you provided. It does not decide eligibility, approve or reject anything, or replace a lawyer, insurer, or official. Please verify flagged items with the relevant authority.",
  };
}

export async function answerFromDocuments(input: {
  question: string;
  chunks: { documentName: string; page: number; text: string }[];
  language: Language;
}) {
  const prompt = buildChatPrompt(input);
  return callStructured(prompt, chatAnswerSchema);
}
