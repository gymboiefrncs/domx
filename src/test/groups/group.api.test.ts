import request from "supertest";
import { app } from "../../app.js";
import { describe, beforeEach, it, expect, vi } from "vitest";
import {
  ALREADY_A_MEMBER,
  GROUP_NOT_FOUND,
  MEMBER_ADDED,
  NOT_A_GROUP_MEMBER,
  SUCCESSFULLY_CREATED_GROUP_MESSAGE,
} from "../../common/constants.js";
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

const setupAndLoginAs = async (email: string, username: string) => {
  await request(app).post("/api/v1/auth/signup").send({ email });
  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email, otp: TEST_OTP });

  const token = verifyRes.body?.data;
  await request(app)
    .post("/api/v1/auth/set-info")
    .set("Authorization", `Bearer ${token}`)
    .send({ password: TEST_PASSWORD, username });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password: TEST_PASSWORD });

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
        data: expect.any(String),
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

  describe("Add member", () => {
    let memberCookies: string | string[] | undefined;
    let outsiderCookies: string | string[] | undefined;
    let targetDisplayId: string;
    let groupId: string;

    beforeEach(async () => {
      memberCookies = await setupAndLogin();
      outsiderCookies = await setupAndLoginAs(
        "target@example.com",
        "targetuser",
      );

      const targetRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["target@example.com"],
      );
      targetDisplayId = targetRow.rows[0].display_id;

      const groupRes = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", memberCookies as string[])
        .send({ groupName: "Test Group" });

      groupId = groupRes.body.data;
    });

    it("successfully adds a member when requester belongs to the group", async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/add/${targetDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: MEMBER_ADDED });

      const members = await pool.query(
        "SELECT * FROM group_members WHERE group_id = $1",
        [groupId],
      );
      expect(members.rows).toHaveLength(2);
      const added = members.rows.find((r) => r.role === "member");
      expect(added).toBeDefined();
    });

    it("reject unauthenticated requests", async () => {
      const res = await request(app).post(
        `/api/v1/groups/${groupId}/add/${targetDisplayId}`,
      );

      expect(res.status).toBe(401);
    });

    it("rejects request when requester is not a member of the group", async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/add/${targetDisplayId}`)
        .set("Cookie", outsiderCookies as string[]);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(NOT_A_GROUP_MEMBER);
    });

    it("rejects request when the group does not exist", async () => {
      const fakeGroupId = crypto.randomUUID();

      const res = await request(app)
        .post(`/api/v1/groups/${fakeGroupId}/add/${targetDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(GROUP_NOT_FOUND);
    });

    it("rejects request when the target display ID does not exist", async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/add/XXXXXXXX`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(404);
    });

    it("rejects request when the target is already a member", async () => {
      await request(app)
        .post(`/api/v1/groups/${groupId}/add/${targetDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/add/${targetDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(409);
      expect(res.body.errors[0].message).toBe(ALREADY_A_MEMBER);
    });

    it("rejects request when displayId format is invalid", async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/add/invalid!!`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(422);
    });

    it("rejects request when groupId is not a valid UUID", async () => {
      const res = await request(app)
        .post(`/api/v1/groups/not-a-uuid/add/${targetDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(422);
    });
  });
});
