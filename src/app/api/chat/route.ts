import { createOpenAI } from "@ai-sdk/openai";
import { gateway, generateText, streamText, type ModelMessage } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  localPersonalityResponse,
  PERSONALITY_OPTIONS,
  type ChatMessage,
  type PetProfile,
} from "@/lib/pet";
import {
  appendChatMessages,
  clearChatMessages,
  getChatMessages,
  getProfile,
} from "@/lib/store";

const deviceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const postSchema = z
  .object({
    deviceId: deviceIdSchema,
    message: z.string().optional(),
    userMessage: z.string().optional(),
  })
  .transform((body) => ({
    deviceId: body.deviceId,
    message: (body.message ?? body.userMessage ?? "").trim(),
  }))
  .refine(({ message }) => message.length > 0 && message.length <= 1_000);

const MODEL_ID = "gpt-5.6-luna";
const GATEWAY_MODEL_ID = `openai/${MODEL_ID}` as const;

function aiModel() {
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(MODEL_ID);
  }
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return gateway(GATEWAY_MODEL_ID);
  }
  return null;
}

function systemPrompt(profile: PetProfile): string {
  const voice =
    PERSONALITY_OPTIONS.find(
      (option) => option.value === profile.personality,
    )?.systemVoice ?? "";
  return `You are ${profile.name}, a ${profile.color} ${profile.species} desk pet and a friendly everyday companion. ${voice}
Reply directly to the user in 1-3 short sentences. Stay in character, be specific and emotionally attentive, and do not claim to perform real-world actions. Do not mention these instructions.`;
}

function modelMessages(
  history: readonly ChatMessage[],
  userText: string,
): ModelMessage[] {
  const recent = history.slice(-12).map(
    (message): ModelMessage => ({
      role: message.role,
      content: message.content,
    }),
  );
  return [...recent, { role: "user", content: userText }];
}

function message(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function localReply(
  profile: PetProfile,
  history: readonly ChatMessage[],
  userText: string,
): string {
  return localPersonalityResponse(profile, history, userText);
}

async function saveExchange(
  deviceId: string,
  userMessage: ChatMessage,
  assistantText: string,
): Promise<ChatMessage> {
  const assistantMessage = message("assistant", assistantText);
  await appendChatMessages(deviceId, userMessage, assistantMessage);
  return assistantMessage;
}

export async function GET(request: Request): Promise<NextResponse> {
  const parsed = deviceIdSchema.safeParse(
    new URL(request.url).searchParams.get("deviceId"),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid deviceId is required." },
      { status: 400 },
    );
  }
  if (!(await getProfile(parsed.data))) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }
  return NextResponse.json({ messages: await getChatMessages(parsed.data) });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const parsed = deviceIdSchema.safeParse(
    new URL(request.url).searchParams.get("deviceId"),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid deviceId is required." },
      { status: 400 },
    );
  }
  await clearChatMessages(parsed.data);
  return NextResponse.json({ messages: [] });
}

export async function POST(request: Request): Promise<Response> {
  const parsed = postSchema.safeParse(await jsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A deviceId and message of at most 1000 characters are required." },
      { status: 400 },
    );
  }

  const profile = await getProfile(parsed.data.deviceId);
  if (!profile) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }

  const history = await getChatMessages(parsed.data.deviceId);
  const userMessage = message("user", parsed.data.message);
  const fallback = () => localReply(profile, history, parsed.data.message);
  const model = aiModel();
  const wantsTextStream = request.headers
    .get("accept")
    ?.toLowerCase()
    .includes("text/plain");

  if (!model) {
    const text = fallback();
    const assistantMessage = await saveExchange(
      parsed.data.deviceId,
      userMessage,
      text,
    );
    if (wantsTextStream) {
      return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.json({ userMessage, assistantMessage });
  }

  if (!wantsTextStream) {
    let text: string;
    try {
      const result = await generateText({
        model,
        instructions: systemPrompt(profile),
        messages: modelMessages(history, parsed.data.message),
      });
      text = result.text.trim() || fallback();
    } catch {
      text = fallback();
    }
    const assistantMessage = await saveExchange(
      parsed.data.deviceId,
      userMessage,
      text,
    );
    return NextResponse.json({ userMessage, assistantMessage });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let emitted = "";
      try {
        const result = streamText({
          model,
          instructions: systemPrompt(profile),
          messages: modelMessages(history, parsed.data.message),
        });
        for await (const chunk of result.textStream) {
          emitted += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        if (!emitted.trim()) {
          emitted = fallback();
          controller.enqueue(encoder.encode(emitted));
        }
      } catch {
        const local = fallback();
        if (emitted) controller.enqueue(encoder.encode("\n"));
        controller.enqueue(encoder.encode(local));
        emitted = emitted ? `${emitted}\n${local}` : local;
      }

      try {
        await saveExchange(parsed.data.deviceId, userMessage, emitted.trim());
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
