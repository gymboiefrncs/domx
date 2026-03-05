import request from "supertest";
import { app } from "../../app.js";
import { describe, beforeEach, it, expect, vi } from "vitest";
import { SUCCESSFULLY_CREATED_GROUP_MESSAGE } from "../../common/constants.js";
import { pool } from "../../config/db.js";
import crypto from "crypto";

const TEST_OTP = "123456";
const TEST_PASSWORD = "Newpassword123_";
const TEST_USERNAME = "testuser";
const signupData = { email: "grouptest@example.com" };

vi.mock("../../utils/generateOTP", () => ({
  generateOTP: vi.fn(() => ({
    otp: TEST_OTP,
    hashedOTP: crypto.createHash("sha256").update(TEST_OTP).digest("hex"),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })),
}));

const setupAndLogin = async () => {
  await request(app).post("/api/v1/auth/signup").send(signupData);
  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email: signupData.email, otp: TEST_OTP });

  const token = verifyRes.body?.data;
  await request(app)
    .post("/api/v1/auth/set-info")
    .set("Authorization", `Bearer ${token}`)
    .send({ password: TEST_PASSWORD, username: TEST_USERNAME });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: signupData.email, password: TEST_PASSWORD });

  const cookies = loginRes.headers["set-cookie"];
  if (!Array.isArray(cookies)) return cookies;

  return cookies as string[];
};

describe("Group API", () => {
  beforeEach(async () => {
    await pool.query("TRUNCATE table groups RESTART IDENTITY CASCADE");
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("Create group", () => {
    it("creates a group and adds the creator as admin", async () => {
      const cookies = await setupAndLogin();

      const res = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", cookies as string[])
        .send({ groupName: "My Group" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        message: SUCCESSFULLY_CREATED_GROUP_MESSAGE,
      });

      const groups = await pool.query("SELECT * FROM groups WHERE name = $1", [
        "My Group",
      ]);
      expect(groups.rows).toHaveLength(1);

      const members = await pool.query(
        "SELECT * FROM group_members WHERE group_id = $1",
        [groups.rows[0].group_id],
      );
      expect(members.rows).toHaveLength(1);
      expect(members.rows[0].role).toBe("admin");
    });

    it("rejects unauthenticated requests", async () => {
      const res = await request(app)
        .post("/api/v1/groups")
        .send({ groupName: "No Auth Group" });

      expect(res.status).toBe(401);
    });

    it("rejects empty group name", async () => {
      const cookies = await setupAndLogin();

      const res = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", cookies as string[])
        .send({ groupName: "" });

      expect(res.status).toBe(422);
    });

    it("rejects group name exceeding 50 characters", async () => {
      const cookies = await setupAndLogin();
      const longName = "A".repeat(51);

      const res = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", cookies as string[])
        .send({ groupName: longName });

      expect(res.status).toBe(422);
    });

    it("rejects request with missing groupName field", async () => {
      const cookies = await setupAndLogin();

      const res = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", cookies as string[])
        .send({});

      expect(res.status).toBe(422);
    });
  });
});
