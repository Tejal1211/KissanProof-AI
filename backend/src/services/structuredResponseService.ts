import { z } from "zod";
import { AppError } from "../middleware/errorHandler.js";

const RETRY_INSTRUCTION =
  "Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object, no other text.";

function parseResponse<T>(raw: string, schema: z.ZodSchema<T>): T {
  const json = raw.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
  return schema.parse(JSON.parse(json));
}

export async function callStructuredWithRetry<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  request: (prompt: string) => Promise<string>
): Promise<T> {
  let firstResponse: string;
  try {
    firstResponse = await request(prompt);
  } catch {
    throw new AppError("AI_PROVIDER_ERROR", "The AI service is temporarily unavailable. Please try again.", 502);
  }

  try {
    return parseResponse(firstResponse, schema);
  } catch {
    let retryResponse: string;
    try {
      retryResponse = await request(`${prompt}\n\n${RETRY_INSTRUCTION}`);
    } catch {
      throw new AppError("AI_PROVIDER_ERROR", "The AI service is temporarily unavailable. Please try again.", 502);
    }

    try {
      return parseResponse(retryResponse, schema);
    } catch {
      throw new AppError("AI_RESPONSE_INVALID", "We couldn't complete the analysis. Please try again.", 502);
    }
  }
}