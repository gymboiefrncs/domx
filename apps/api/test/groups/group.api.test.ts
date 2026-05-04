import request from "supertest";
import { app } from "@api/app.js";
import { describe, beforeEach, it, expect, vi } from "vitest";
import { GROUP_ERROR } from "@api/features/groups/group.constants.js";
import { pool } from "@api/shared/db/db.js";
import crypto from "crypto";

const ALREADY_A_MEMBER = "User is already a member of this group.";
const GROUP_NOT_FOUND = GROUP_ERROR.NOT_FOUND;
const NOT_A_GROUP_MEMBER = GROUP_ERROR.NOT_A_MEMBER;
const TEST_OTP = "123456";
const TEST_PASSWORD = "Newpassword123_";
const TEST_USERNAME = "testuser";
const signupData = { email: "grouptest@example.com" };

vi.mock("@api/features/auth/auth-helpers/generateOTP.js", () => ({
  generateOTP: vi.fn(() => ({
    otp: TEST_OTP,
    hashedOTP: crypto.createHash("sha256").update(TEST_OTP).digest("hex"),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })),
}));

const requireCookies = (
  value: string | string[] | undefined,
  step: string,
): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Expected set-cookie header from ${step}`);
  }

  return value;
};

const setupAndLogin = async () => {
  await request(app).post("/api/v1/auth/signup").send(signupData);
  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email: signupData.email, otp: TEST_OTP });
  const verifyCookies = requireCookies(
    verifyRes.headers["set-cookie"],
    "verify-email",
  );

  await request(app)
    .post("/api/v1/auth/set-info")
    .set("Cookie", verifyCookies)
    .send({ password: TEST_PASSWORD, username: TEST_USERNAME });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: signupData.email, password: TEST_PASSWORD });

  return requireCookies(loginRes.headers["set-cookie"], "auth/login");
};

const setupAndLoginAs = async (email: string, username: string) => {
  await request(app).post("/api/v1/auth/signup").send({ email });
  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email, otp: TEST_OTP });
  const verifyCookies = requireCookies(
    verifyRes.headers["set-cookie"],
    "verify-email",
  );

  await request(app)
    .post("/api/v1/auth/set-info")
    .set("Cookie", verifyCookies)
    .send({ password: TEST_PASSWORD, username });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password: TEST_PASSWORD });

  return requireCookies(loginRes.headers["set-cookie"], "auth/login");
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
        data: expect.objectContaining({
          group_id: expect.any(String),
          last_seen_at: expect.any(String),
          member_count: expect.any(Number),
          name: expect.any(String),
          role: "admin",
          unread_count: expect.any(Number),
        }),
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

      groupId = groupRes.body.data.group_id;
    });

    it("successfully adds a member when requester belongs to the group", async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/add/${targetDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        data: expect.objectContaining({
          display_id: targetDisplayId,
          group_id: expect.any(String),
          role: "member",
          username: "targetuser",
        }),
      });

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
