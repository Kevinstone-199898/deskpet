import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createGreeting,
  type PetProfile,
  validateName,
} from "@/lib/pet";
import { createProfile, getProfile, updateProfile } from "@/lib/store";

const deviceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const speciesSchema = z.enum(["cat", "dog", "bunny", "fox", "dragon", "robot"]);
const colorSchema = z.enum([
  "#f4a879",
  "#7fcbb0",
  "#7fb2e5",
  "#b39ddb",
  "#e896b8",
  "#f2c14e",
]);
const personalitySchema = z.enum(["sunny", "sassy", "chill", "chaotic", "gentle"]);

const createSchema = z.object({
  deviceId: deviceIdSchema,
  name: z.unknown(),
  species: speciesSchema,
  color: colorSchema,
  personality: personalitySchema,
});

const updateSchema = z
  .object({
    deviceId: deviceIdSchema,
    name: z.unknown().optional(),
    species: speciesSchema.optional(),
    color: colorSchema.optional(),
    personality: personalitySchema.optional(),
  })
  .refine(
    ({ name, species, color, personality }) =>
      name !== undefined ||
      species !== undefined ||
      color !== undefined ||
      personality !== undefined,
    "At least one profile field is required",
  );

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function requestJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const parsed = deviceIdSchema.safeParse(
    new URL(request.url).searchParams.get("deviceId"),
  );
  if (!parsed.success) return badRequest("A valid deviceId is required.");

  const profile = await getProfile(parsed.data);
  return NextResponse.json({ profile });
}

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = createSchema.safeParse(await requestJson(request));
  if (!parsed.success) return badRequest("Invalid pet profile.");

  const nameValidation = validateName(parsed.data.name);
  if (nameValidation !== true) {
    return badRequest("Name must be between 1 and 24 characters.");
  }
  const name = (parsed.data.name as string).trim();

  const now = new Date().toISOString();
  const profile: PetProfile = {
    deviceId: parsed.data.deviceId,
    name,
    species: parsed.data.species,
    color: parsed.data.color,
    personality: parsed.data.personality,
    mood: "happy",
    createdAt: now,
    updatedAt: now,
  };
  await createProfile(profile);

  return NextResponse.json(
    { profile, greeting: createGreeting(profile) },
    { status: 201 },
  );
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const parsed = updateSchema.safeParse(await requestJson(request));
  if (!parsed.success) return badRequest("Invalid profile update.");

  const nameValidation =
    parsed.data.name === undefined ? true : validateName(parsed.data.name);
  if (nameValidation !== true) {
    return badRequest("Name must be between 1 and 24 characters.");
  }
  const name =
    parsed.data.name === undefined
      ? undefined
      : (parsed.data.name as string).trim();

  const profile = await updateProfile(parsed.data.deviceId, {
    ...(name ? { name } : {}),
    ...(parsed.data.species ? { species: parsed.data.species } : {}),
    ...(parsed.data.color ? { color: parsed.data.color } : {}),
    ...(parsed.data.personality
      ? { personality: parsed.data.personality }
      : {}),
    updatedAt: new Date().toISOString(),
  });

  if (!profile) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }
  return NextResponse.json({ profile });
}
