import { describe, it, expect } from "vitest";
import { ExportDataSchema, importUserData } from "../src/lib/storage/portability";

describe("Portability & Storage Portability Schemas", () => {
  it("validates valid export data payload", () => {
    const valid = {
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: ["loop-1", "loop-2"],
      recent: ["loop-1"],
      preferences: {
        autoplayPreviews: true,
        reducedMotionOverride: false,
        preferredFormat: "auto",
        gridDensity: "comfortable",
      },
      collections: [
        {
          id: "col-1",
          name: "Ambient",
          description: "Calm loops",
          loopIds: ["loop-1"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const res = ExportDataSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects invalid export data with missing fields", async () => {
    const res = await importUserData(JSON.stringify({ version: 99 }));
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("rejects non-JSON string", async () => {
    const res = await importUserData("not-json-content");
    expect(res.success).toBe(false);
  });
});
