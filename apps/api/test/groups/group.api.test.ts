import request from "supertest";
import { app } from "@api/app.js";
import { describe, beforeEach, it, expect, vi } from "vitest";
import {
  ALREADY_A_MEMBER,
  ALREADY_AN_ADMIN,
  ALREADY_A_REGULAR_MEMBER,
  CANNOT_KICK_SELF,
  GROUP_NOT_FOUND,
  LEFT_GROUP,
  MEMBER_ADDED,
  MEMBER_DEMOTED,
  MEMBER_KICKED,
  MEMBER_PROMOTED,
  NOT_A_GROUP_MEMBER,
  SOLE_ADMIN_CANNOT_DEMOTE,
  SOLE_ADMIN_CANNOT_LEAVE,
  SUCCESSFULLY_CREATED_GROUP_MESSAGE,
} from "@api/features/groups/group.constants.js";
import { USER_NOT_FOUND } from "@api/features/profile/profile.constants.js";
import { pool } from "@api/config/db.js";
import crypto from "crypto";

const TEST_OTP = "123456";
const TEST_PASSWORD = "Newpassword123_";
const TEST_USERNAME = "testuser";
const signupData = { email: "grouptest@example.com" };

vi.mock("@api/utils/generateOTP.js", () => ({
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
        success: true,
        message: SUCCESSFULLY_CREATED_GROUP_MESSAGE,
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

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: expect.objectContaining({
          display_id: targetDisplayId,
          group_id: expect.any(String),
          role: "member",
          username: "targetuser",
        }),
        message: MEMBER_ADDED,
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

  describe("Kick member", () => {
    let adminCookies: string | string[] | undefined;
    let memberCookies: string | string[] | undefined;
    let outsiderCookies: string | string[] | undefined;
    let memberDisplayId: string;
    let adminDisplayId: string;
    let groupId: string;

    beforeEach(async () => {
      adminCookies = await setupAndLogin();
      memberCookies = await setupAndLoginAs("member@example.com", "memberuser");
      outsiderCookies = await setupAndLoginAs(
        "outsider@example.com",
        "outsideruser",
      );

      const memberRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["member@example.com"],
      );
      memberDisplayId = memberRow.rows[0].display_id;

      const adminRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["grouptest@example.com"],
      );
      adminDisplayId = adminRow.rows[0].display_id;

      const groupRes = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", adminCookies as string[])
        .send({ groupName: "Kick Test Group" });

      groupId = groupRes.body.data.group_id;

      // Add the member to the group
      await request(app)
        .post(`/api/v1/groups/${groupId}/add/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);
    });

    it("successfully kicks a member when requester is admin", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: MEMBER_KICKED,
      });

      const members = await pool.query(
        "SELECT * FROM group_members WHERE group_id = $1",
        [groupId],
      );
      expect(members.rows).toHaveLength(1);
      expect(members.rows[0].role).toBe("admin");
    });

    it("rejects unauthenticated requests", async () => {
      const res = await request(app).delete(
        `/api/v1/groups/${groupId}/kick/${memberDisplayId}`,
      );

      expect(res.status).toBe(401);
    });

    it("rejects request when requester is not a member of the group", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/${memberDisplayId}`)
        .set("Cookie", outsiderCookies as string[]);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(NOT_A_GROUP_MEMBER);
    });

    it("rejects request when requester is a member but not admin", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/${adminDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(
        "Only group admins can perform this action.",
      );
    });

    it("rejects request when the group does not exist", async () => {
      const fakeGroupId = crypto.randomUUID();

      const res = await request(app)
        .delete(`/api/v1/groups/${fakeGroupId}/kick/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(GROUP_NOT_FOUND);
    });

    it("rejects request when the target display ID does not exist", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/XXXXXXXX`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(USER_NOT_FOUND);
    });

    it("rejects request when the target is not a member of the group", async () => {
      const outsiderRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["outsider@example.com"],
      );
      const outsiderDisplayId = outsiderRow.rows[0].display_id;

      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/${outsiderDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(USER_NOT_FOUND);
    });

    it("rejects request when admin tries to kick themselves", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/${adminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(CANNOT_KICK_SELF);
    });

    it("rejects request when displayId format is invalid", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/invalid!!`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(422);
    });
  });

  describe("Promote member", () => {
    let adminCookies: string | string[] | undefined;
    let memberCookies: string | string[] | undefined;
    let outsiderCookies: string | string[] | undefined;
    let memberDisplayId: string;
    let adminDisplayId: string;
    let groupId: string;

    beforeEach(async () => {
      adminCookies = await setupAndLogin();
      memberCookies = await setupAndLoginAs("member@example.com", "memberuser");
      outsiderCookies = await setupAndLoginAs(
        "outsider@example.com",
        "outsideruser",
      );

      const memberRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["member@example.com"],
      );
      memberDisplayId = memberRow.rows[0].display_id;

      const adminRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["grouptest@example.com"],
      );
      adminDisplayId = adminRow.rows[0].display_id;

      const groupRes = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", adminCookies as string[])
        .send({ groupName: "Promote Test Group" });

      groupId = groupRes.body.data.group_id;

      await request(app)
        .post(`/api/v1/groups/${groupId}/add/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);
    });

    it("successfully promotes a member to admin", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/promote/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: MEMBER_PROMOTED,
      });

      // Verify directly via DB
      const members = await pool.query(
        "SELECT role FROM group_members WHERE group_id = $1",
        [groupId],
      );
      const admins = members.rows.filter((r) => r.role === "admin");
      expect(admins).toHaveLength(2);
    });

    it("rejects unauthenticated requests", async () => {
      const res = await request(app).patch(
        `/api/v1/groups/${groupId}/promote/${memberDisplayId}`,
      );

      expect(res.status).toBe(401);
    });

    it("rejects when requester is not admin", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/promote/${adminDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(403);
    });

    it("rejects when requester is not a group member", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/promote/${memberDisplayId}`)
        .set("Cookie", outsiderCookies as string[]);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(NOT_A_GROUP_MEMBER);
    });

    it("rejects when target is already an admin", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/promote/${adminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(409);
      expect(res.body.errors[0].message).toBe(ALREADY_AN_ADMIN);
    });

    it("rejects when group does not exist", async () => {
      const fakeGroupId = crypto.randomUUID();

      const res = await request(app)
        .patch(`/api/v1/groups/${fakeGroupId}/promote/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(GROUP_NOT_FOUND);
    });

    it("rejects when target display ID does not exist", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/promote/XXXXXXXX`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(USER_NOT_FOUND);
    });
  });

  describe("Demote member", () => {
    let adminCookies: string | string[] | undefined;
    let memberCookies: string | string[] | undefined;
    let outsiderCookies: string | string[] | undefined;
    let secondAdminDisplayId: string;
    let memberDisplayId: string;
    let adminDisplayId: string;
    let groupId: string;

    beforeEach(async () => {
      adminCookies = await setupAndLogin();
      await setupAndLoginAs("admin2@example.com", "admin2user");
      memberCookies = await setupAndLoginAs("member@example.com", "memberuser");
      outsiderCookies = await setupAndLoginAs(
        "outsider@example.com",
        "outsideruser",
      );

      const adminRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["grouptest@example.com"],
      );
      adminDisplayId = adminRow.rows[0].display_id;

      const secondAdminRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["admin2@example.com"],
      );
      secondAdminDisplayId = secondAdminRow.rows[0].display_id;

      const memberRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["member@example.com"],
      );
      memberDisplayId = memberRow.rows[0].display_id;

      const groupRes = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", adminCookies as string[])
        .send({ groupName: "Demote Test Group" });

      groupId = groupRes.body.data.group_id;

      // Add second admin and member
      await request(app)
        .post(`/api/v1/groups/${groupId}/add/${secondAdminDisplayId}`)
        .set("Cookie", adminCookies as string[]);
      await request(app)
        .patch(`/api/v1/groups/${groupId}/promote/${secondAdminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      await request(app)
        .post(`/api/v1/groups/${groupId}/add/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);
    });

    it("successfully demotes an admin to member", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/${secondAdminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: MEMBER_DEMOTED,
      });

      const members = await pool.query(
        "SELECT role FROM group_members WHERE group_id = $1",
        [groupId],
      );
      const admins = members.rows.filter((r) => r.role === "admin");
      expect(admins).toHaveLength(1);
    });

    it("allows self-demotion when another admin exists", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/${adminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: MEMBER_DEMOTED,
      });
    });

    it("rejects demotion when it would leave zero admins", async () => {
      // First demote the second admin so only primary admin remains
      await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/${secondAdminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      // Now try to demote the last admin (self-demotion)
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/${adminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(409);
      expect(res.body.errors[0].message).toBe(SOLE_ADMIN_CANNOT_DEMOTE);
    });

    it("rejects unauthenticated requests", async () => {
      const res = await request(app).patch(
        `/api/v1/groups/${groupId}/demote/${secondAdminDisplayId}`,
      );

      expect(res.status).toBe(401);
    });

    it("rejects when requester is not admin", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/${adminDisplayId}`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(403);
    });

    it("rejects when requester is not a group member", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/${secondAdminDisplayId}`)
        .set("Cookie", outsiderCookies as string[]);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(NOT_A_GROUP_MEMBER);
    });

    it("rejects when target is already a regular member", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(409);
      expect(res.body.errors[0].message).toBe(ALREADY_A_REGULAR_MEMBER);
    });

    it("rejects when group does not exist", async () => {
      const fakeGroupId = crypto.randomUUID();

      const res = await request(app)
        .patch(`/api/v1/groups/${fakeGroupId}/demote/${secondAdminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(GROUP_NOT_FOUND);
    });

    it("rejects when target display ID does not exist", async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/XXXXXXXX`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(USER_NOT_FOUND);
    });
  });

  describe("Leave group", () => {
    let adminCookies: string | string[] | undefined;
    let memberCookies: string | string[] | undefined;
    let outsiderCookies: string | string[] | undefined;
    let adminDisplayId: string;
    let memberDisplayId: string;
    let groupId: string;

    beforeEach(async () => {
      adminCookies = await setupAndLogin();
      await setupAndLoginAs("admin2@example.com", "admin2user");
      memberCookies = await setupAndLoginAs("member@example.com", "memberuser");
      outsiderCookies = await setupAndLoginAs(
        "outsider@example.com",
        "outsideruser",
      );

      const adminRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["admin2@example.com"],
      );
      adminDisplayId = adminRow.rows[0].display_id;

      const memberRow = await pool.query(
        "SELECT display_id FROM users WHERE email = $1",
        ["member@example.com"],
      );
      memberDisplayId = memberRow.rows[0].display_id;

      const groupRes = await request(app)
        .post("/api/v1/groups")
        .set("Cookie", adminCookies as string[])
        .send({ groupName: "Leave Test Group" });

      groupId = groupRes.body.data.group_id;

      // Add second admin and member
      await request(app)
        .post(`/api/v1/groups/${groupId}/add/${adminDisplayId}`)
        .set("Cookie", adminCookies as string[]);
      await request(app)
        .patch(`/api/v1/groups/${groupId}/promote/${adminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      await request(app)
        .post(`/api/v1/groups/${groupId}/add/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);
    });

    it("allows a regular member to leave", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/leave`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: LEFT_GROUP,
      });

      const members = await pool.query(
        "SELECT * FROM group_members WHERE group_id = $1",
        [groupId],
      );
      expect(members.rows).toHaveLength(2);
    });

    it("allows an admin to leave when another admin exists", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/leave`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: LEFT_GROUP,
      });

      const members = await pool.query(
        "SELECT * FROM group_members WHERE group_id = $1",
        [groupId],
      );
      expect(members.rows).toHaveLength(2);
    });

    it("rejects when sole admin tries to leave with other members", async () => {
      // Demote the second admin so only one admin remains
      await request(app)
        .patch(`/api/v1/groups/${groupId}/demote/${adminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/leave`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(409);
      expect(res.body.errors[0].message).toBe(SOLE_ADMIN_CANNOT_LEAVE);
    });

    it("allows sole member (admin) to leave and deletes the group", async () => {
      // Remove all other members first
      await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/${memberDisplayId}`)
        .set("Cookie", adminCookies as string[]);
      await request(app)
        .delete(`/api/v1/groups/${groupId}/kick/${adminDisplayId}`)
        .set("Cookie", adminCookies as string[]);

      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/leave`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: LEFT_GROUP,
      });

      // Verify group is deleted
      const groups = await pool.query(
        "SELECT * FROM groups WHERE group_id = $1",
        [groupId],
      );
      expect(groups.rows).toHaveLength(0);
    });

    it("rejects unauthenticated requests", async () => {
      const res = await request(app).delete(`/api/v1/groups/${groupId}/leave`);

      expect(res.status).toBe(401);
    });

    it("rejects when requester is not a group member", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/leave`)
        .set("Cookie", outsiderCookies as string[]);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(NOT_A_GROUP_MEMBER);
    });

    it("rejects when group does not exist", async () => {
      const fakeGroupId = crypto.randomUUID();

      const res = await request(app)
        .delete(`/api/v1/groups/${fakeGroupId}/leave`)
        .set("Cookie", memberCookies as string[]);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(GROUP_NOT_FOUND);
    });

    it("rejects when groupId is not a valid UUID", async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/not-a-uuid/leave`)
        .set("Cookie", adminCookies as string[]);

      expect(res.status).toBe(422);
    });
  });
});
