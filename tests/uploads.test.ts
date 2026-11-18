import { describe, it, expect, beforeEach } from "vitest";
import {
  saveUserUpload,
  getAllUserUploads,
  deleteUserUpload,
  userUploadToLoopItem,
  type UserUpload,
} from "@/lib/storage/uploads";

describe("User Uploads Storage", () => {
  const dummyUpload: UserUpload = {
    id: "test-loop-1",
    slug: "my-test-cat-loop",
    title: "My Test Cat Loop",
    description: "A funny cat looping seamlessly",
    category: "cats",
    mood: "calm",
    tags: ["cat", "cute"],
    creator: "You",
    license: "Personal Upload",
    duration_seconds: 3.5,
    width: 480,
    height: 480,
    aspect_ratio: 1.0,
    posterDataUrl: "data:image/jpeg;base64,abc123",
    mediaBlob: new Blob(["dummy video bytes"], { type: "video/mp4" }),
    mediaType: "video/mp4",
    bytes: 10240,
    uploadedAt: new Date().toISOString(),
  };

  it("converts UserUpload to LoopItem correctly", () => {
    const item = userUploadToLoopItem(dummyUpload);
    expect(item.id).toBe("test-loop-1");
    expect(item.slug).toBe("my-test-cat-loop");
    expect(item.title).toBe("My Test Cat Loop");
    expect(item.category).toBe("cats");
    expect(item.mood).toBe("calm");
    expect(item.creator).toBe("You");
    expect(item.duration_seconds).toBe(3.5);
    expect(item.poster).toBe(dummyUpload.posterDataUrl);
  });

  it("saves and retrieves uploads using fallback memory/IndexedDB", async () => {
    await saveUserUpload(dummyUpload);
    const uploads = await getAllUserUploads();
    expect(uploads.length).toBeGreaterThanOrEqual(1);
    const found = uploads.find((u) => u.id === dummyUpload.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe("My Test Cat Loop");
  });

  it("deletes user upload by id", async () => {
    await saveUserUpload(dummyUpload);
    await deleteUserUpload(dummyUpload.id);
    const uploads = await getAllUserUploads();
    const found = uploads.find((u) => u.id === dummyUpload.id);
    expect(found).toBeUndefined();
  });
});
