import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { SPECTRUM_SYSTEM_PROMPT } from "@/lib/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  messages: UIMessage[];
  currentSource?: string;
};

export async function POST(req: Request) {
  const { messages, currentSource } = (await req.json()) as Body;

  const sourceContext = currentSource?.trim()
    ? `\n\n## User's current editor source\n\n\`\`\`c\n${currentSource}\n\`\`\`\n\nWhen the user asks to change "the code" or "this code", treat the above as the baseline.`
    : "";

  const result = streamText({
    model: anthropic(process.env.AI_MODEL ?? "claude-sonnet-4-6"),
    system: SPECTRUM_SYSTEM_PROMPT + sourceContext,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
