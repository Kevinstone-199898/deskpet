import { Redis } from "@upstash/redis";
import type { ChatMessage, PetProfile } from "./pet";

type MemoryState = {
  profiles: Map<string, PetProfile>;
  chats: Map<string, ChatMessage[]>;
};

const memoryKey = Symbol.for("deskpet.memory-store");
const globalWithMemory = globalThis as typeof globalThis & {
  [memoryKey]?: MemoryState;
};

function memoryStore(): MemoryState {
  globalWithMemory[memoryKey] ??= {
    profiles: new Map<string, PetProfile>(),
    chats: new Map<string, ChatMessage[]>(),
  };
  return globalWithMemory[memoryKey];
}

function redisConfig(): { url: string; token: string } | null {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    };
  }
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }
  return null;
}

function redis(): Redis | null {
  const config = redisConfig();
  return config ? new Redis(config) : null;
}

function profileKey(deviceId: string): string {
  return `deskpet:profile:${deviceId}`;
}

function chatKey(deviceId: string): string {
  return `deskpet:chat:${deviceId}`;
}

function parseStored<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

export async function getProfile(deviceId: string): Promise<PetProfile | null> {
  const client = redis();
  if (client) {
    return parseStored<PetProfile>(await client.get(profileKey(deviceId)));
  }
  return memoryStore().profiles.get(deviceId) ?? null;
}

export async function setProfile(profile: PetProfile): Promise<PetProfile> {
  const client = redis();
  if (client) {
    await client.set(profileKey(profile.deviceId), JSON.stringify(profile));
  } else {
    memoryStore().profiles.set(profile.deviceId, structuredClone(profile));
  }
  return profile;
}

export async function createProfile(profile: PetProfile): Promise<PetProfile> {
  return setProfile(profile);
}

export async function updateProfile(
  deviceId: string,
  changes: Partial<Omit<PetProfile, "deviceId" | "createdAt">>,
): Promise<PetProfile | null> {
  const current = await getProfile(deviceId);
  if (!current) return null;
  return setProfile({ ...current, ...changes, deviceId });
}

export async function getChatMessages(
  deviceId: string,
): Promise<ChatMessage[]> {
  const client = redis();
  if (client) {
    return (
      parseStored<ChatMessage[]>(await client.get(chatKey(deviceId))) ?? []
    );
  }
  return structuredClone(memoryStore().chats.get(deviceId) ?? []);
}

export async function appendChatMessages(
  deviceId: string,
  ...messages: ChatMessage[]
): Promise<ChatMessage[]> {
  const allMessages = [...(await getChatMessages(deviceId)), ...messages];
  const client = redis();
  if (client) {
    await client.set(chatKey(deviceId), JSON.stringify(allMessages));
  } else {
    memoryStore().chats.set(deviceId, structuredClone(allMessages));
  }
  return allMessages;
}

export async function clearChatMessages(deviceId: string): Promise<void> {
  const client = redis();
  if (client) {
    await client.del(chatKey(deviceId));
  } else {
    memoryStore().chats.delete(deviceId);
  }
}

export function resetMemoryStore(): void {
  memoryStore().profiles.clear();
  memoryStore().chats.clear();
}
