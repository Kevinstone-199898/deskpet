import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "../src/app/api/pet/route";
import { resetMemoryStore } from "../src/lib/store";

const originalEnv = { ...process.env };

describe("pet API", () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetMemoryStore();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("creates and retrieves a pet", async () => {
    const createResponse = await POST(
      new Request("http://localhost/api/pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: "e2e-test-device",
          name: "Mochi",
          species: "cat",
          color: "#b39ddb",
          personality: "sunny",
        }),
      }),
    );

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created.profile).toMatchObject({
      deviceId: "e2e-test-device",
      name: "Mochi",
      species: "cat",
    });
    expect(created.greeting).toContain("Mochi");

    const getResponse = await GET(
      new Request("http://localhost/api/pet?deviceId=e2e-test-device"),
    );
    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toMatchObject({
      profile: { name: "Mochi", personality: "sunny" },
    });
  });

  it("rejects a name longer than 24 trimmed characters", async () => {
    const response = await POST(
      new Request("http://localhost/api/pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: "name-test-device",
          name: `  ${"x".repeat(25)}  `,
          species: "dog",
          color: "#7fcbb0",
          personality: "gentle",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Name must be between 1 and 24 characters.",
    });
  });
});
