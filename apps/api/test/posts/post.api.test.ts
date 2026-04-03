import request from "supertest";
import { app } from "@api/app.js";
import { describe, beforeEach, it, expect, vi } from "vitest";
import {
  GROUP_NOT_FOUND,
  NOT_A_GROUP_MEMBER,
} from "@api/features/groups/group.constants.js";
import {
  CANNOT_DELETE_POST,
  CANNOT_EDIT_POST,
  POST_CREATED,
  POST_DELETED,
  POST_EDITED,
  POST_NOT_FOUND,
} from "@api/features/posts/post.constants.js";
import { pool } from "@api/shared/db/db.js";
import crypto from "crypto";

const TEST_OTP = "123456";
const TEST_PASSWORD = "Newpassword123_";

vi.mock("@api/features/auth/auth-helpers/generateOTP.js", () => ({
  generateOTP: vi.fn(() => ({
    otp: TEST_OTP,
    hashedOTP: crypto.createHash("sha256").update(TEST_OTP).digest("hex"),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  })),
}));

const setupAndLoginAs = async (email: string, username: string) => {
  await request(app).post("/api/v1/auth/signup").send({ email });

  const verifyRes = await request(app)
    .post("/api/v1/verify-email")
    .send({ email, otp: TEST_OTP });

  const verifyCookies = verifyRes.headers["set-cookie"];

  await request(app)
    .post("/api/v1/auth/set-info")
    .set(
      "Cookie",
      Array.isArray(verifyCookies)
        ? verifyCookies
        : ([verifyCookies] as string[]),
    )
    .send({ password: TEST_PASSWORD, username });

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password: TEST_PASSWORD });

  const cookies = loginRes.headers["set-cookie"];
  return (Array.isArray(cookies) ? cookies : [cookies]) as string[];
};

const createGroup = async (cookies: string[], name = "Test Group") => {
  const res = await request(app)
    .post("/api/v1/groups")
    .set("Cookie", cookies)
    .send({ groupName: name });
  return res.body.data.group_id as string;
};

const getDisplayId = async (email: string) => {
  const result = await pool.query(
    `SELECT display_id FROM users WHERE email = $1`,
    [email],
  );
  return result.rows[0].display_id as string;
};

const addMember = async (
  cookies: string[],
  groupId: string,
  displayId: string,
) => {
  await request(app)
    .post(`/api/v1/groups/${groupId}/add/${displayId}`)
    .set("Cookie", cookies);
};

const insertPostDirectly = async (
  title: string,
  body: string,
  userId: string,
  groupId: string,
) => {
  const result = await pool.query(
    `INSERT INTO posts (title, body, user_id, group_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    [title, body, userId, groupId],
  );
  return result.rows[0].id as string;
};

const getUserId = async (email: string) => {
  const result = await pool.query(`SELECT id FROM users WHERE email = $1`, [
    email,
  ]);
  return result.rows[0].id as string;
};

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

describe("Post API", () => {
  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE groups RESTART IDENTITY CASCADE");
    vi.resetModules();
    vi.clearAllMocks();
  });

  // ─── CREATE POST ───────────────────────────────────────────────
  describe("Create post", () => {
    it("allows a group member to create a post", async () => {
      const cookies = await setupAndLoginAs("post1@test.com", "poster1");
      const groupId = await createGroup(cookies);

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/posts`)
        .set("Cookie", cookies)
        .send({ title: "sample", body: "Hello world" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        message: POST_CREATED,
      });

      const posts = await pool.query(
        `SELECT * FROM posts WHERE group_id = $1`,
        [groupId],
      );
      expect(posts.rows).toHaveLength(1);
      expect(posts.rows[0].title).toBe("sample");
      expect(posts.rows[0].body).toBe("Hello world");
    });

    it("rejects post creation from a non-member", async () => {
      const adminCookies = await setupAndLoginAs("admin2@test.com", "admin2");
      const groupId = await createGroup(adminCookies);

      const outsiderCookies = await setupAndLoginAs(
        "outsider@test.com",
        "outsider",
      );

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/posts`)
        .set("Cookie", outsiderCookies)
        .send({ title: "sample", body: "I'm not a member" });

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(NOT_A_GROUP_MEMBER);
    });

    it("rejects post for a non-existent group", async () => {
      const cookies = await setupAndLoginAs("post3@test.com", "poster3");

      const res = await request(app)
        .post(`/api/v1/groups/${FAKE_UUID}/posts`)
        .set("Cookie", cookies)
        .send({ title: "sample", body: "No group" });

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(GROUP_NOT_FOUND);
    });

    it("rejects empty post title and body", async () => {
      const cookies = await setupAndLoginAs("post4@test.com", "poster4");
      const groupId = await createGroup(cookies);

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/posts`)
        .set("Cookie", cookies)
        .send({ title: "", body: "" });

      expect(res.status).toBe(422);
    });

    it("rejects unauthenticated post creation", async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${FAKE_UUID}/posts`)
        .send({ title: "sample", body: "No auth" });

      expect(res.status).toBe(401);
    });
  });

  // ─── EDIT POST ─────────────────────────────────────────────────
  describe("Edit post", () => {
    it("allows the post author to edit their own post", async () => {
      const cookies = await setupAndLoginAs("edit1@test.com", "editor1");
      const groupId = await createGroup(cookies);
      const userId = await getUserId("edit1@test.com");
      const postId = await insertPostDirectly(
        "Original Title",
        "Original Body",
        userId,
        groupId,
      );

      const res = await request(app)
        .put(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", cookies)
        .send({ title: "Updated Title", body: "Updated Body" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: POST_EDITED });

      const post = await pool.query(
        `SELECT title, body FROM posts WHERE id = $1`,
        [postId],
      );
      expect(post.rows[0].title).toBe("Updated Title");
      expect(post.rows[0].body).toBe("Updated Body");
    });

    it("allows a group admin to edit another member's post", async () => {
      const adminCookies = await setupAndLoginAs("edit2@test.com", "edit2adm");
      const groupId = await createGroup(adminCookies);

      await setupAndLoginAs("edit2m@test.com", "edit2mem");
      const memberDisplayId = await getDisplayId("edit2m@test.com");
      await addMember(adminCookies, groupId, memberDisplayId);

      const memberId = await getUserId("edit2m@test.com");
      const postId = await insertPostDirectly(
        "Member post",
        "Member body",
        memberId,
        groupId,
      );

      const res = await request(app)
        .put(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", adminCookies)
        .send({ title: "Admin Updated Title", body: "Admin edited" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(POST_EDITED);
    });

    it("rejects edit from a regular member who is not the author", async () => {
      const adminCookies = await setupAndLoginAs("edit3@test.com", "edit3adm");
      const groupId = await createGroup(adminCookies);

      await setupAndLoginAs("edit3a@test.com", "edit3memA");
      const member1DisplayId = await getDisplayId("edit3a@test.com");
      await addMember(adminCookies, groupId, member1DisplayId);

      const member2Cookies = await setupAndLoginAs(
        "edit3b@test.com",
        "edit3memB",
      );
      const member2DisplayId = await getDisplayId("edit3b@test.com");
      await addMember(adminCookies, groupId, member2DisplayId);

      const member1Id = await getUserId("edit3a@test.com");
      const postId = await insertPostDirectly(
        "Member1 post",
        "Member1 body",
        member1Id,
        groupId,
      );

      const res = await request(app)
        .put(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", member2Cookies)
        .send({ title: "Sneaky edit", body: "Sneaky edit" });

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(CANNOT_EDIT_POST);
    });

    it("returns 404 for a non-existent post", async () => {
      const cookies = await setupAndLoginAs("edit4@test.com", "editor4");
      const groupId = await createGroup(cookies);

      const res = await request(app)
        .put(`/api/v1/groups/${groupId}/posts/${FAKE_UUID}`)
        .set("Cookie", cookies)
        .send({ title: "Ghost title", body: "Ghost post" });

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(POST_NOT_FOUND);
    });

    it("rejects edit from a non-member", async () => {
      const adminCookies = await setupAndLoginAs("edit5@test.com", "edit5adm");
      const groupId = await createGroup(adminCookies);
      const adminId = await getUserId("edit5@test.com");
      const postId = await insertPostDirectly(
        "Admin post",
        "Admin body",
        adminId,
        groupId,
      );

      const outsiderCookies = await setupAndLoginAs(
        "edit5out@test.com",
        "edit5out",
      );

      const res = await request(app)
        .put(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", outsiderCookies)
        .send({ title: "Non-member edit", body: "Not my group" });

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(NOT_A_GROUP_MEMBER);
    });

    it("rejects empty body on edit", async () => {
      const cookies = await setupAndLoginAs("edit6@test.com", "editor6");
      const groupId = await createGroup(cookies);
      const userId = await getUserId("edit6@test.com");
      const postId = await insertPostDirectly(
        "Original Title",
        "Original Body",
        userId,
        groupId,
      );

      const res = await request(app)
        .put(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", cookies)
        .send({ title: "Updated Title", body: "" });

      expect(res.status).toBe(422);
    });
  });

  // ─── DELETE POST ───────────────────────────────────────────────
  describe("Delete post", () => {
    it("allows the post author to delete their own post", async () => {
      const cookies = await setupAndLoginAs("del1@test.com", "deleter1");
      const groupId = await createGroup(cookies);
      const userId = await getUserId("del1@test.com");
      const postId = await insertPostDirectly(
        "To delete",
        "To delete body",
        userId,
        groupId,
      );

      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: POST_DELETED });

      const remaining = await pool.query(`SELECT * FROM posts WHERE id = $1`, [
        postId,
      ]);
      expect(remaining.rows).toHaveLength(0);
    });

    it("allows a group admin to delete another member's post", async () => {
      const adminCookies = await setupAndLoginAs("del2@test.com", "del2admin");
      const groupId = await createGroup(adminCookies);

      await setupAndLoginAs("del2m@test.com", "del2member");
      const memberDisplayId = await getDisplayId("del2m@test.com");
      await addMember(adminCookies, groupId, memberDisplayId);

      const memberId = await getUserId("del2m@test.com");
      const postId = await insertPostDirectly(
        "Member post",
        "Member body",
        memberId,
        groupId,
      );

      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(POST_DELETED);
    });

    it("rejects delete from a regular member who is not the author", async () => {
      const adminCookies = await setupAndLoginAs("del3@test.com", "del3admin");
      const groupId = await createGroup(adminCookies);

      await setupAndLoginAs("del3a@test.com", "del3memA");
      const member1DisplayId = await getDisplayId("del3a@test.com");
      await addMember(adminCookies, groupId, member1DisplayId);

      const member2Cookies = await setupAndLoginAs(
        "del3b@test.com",
        "del3memB",
      );
      const member2DisplayId = await getDisplayId("del3b@test.com");
      await addMember(adminCookies, groupId, member2DisplayId);

      const member1Id = await getUserId("del3a@test.com");
      const postId = await insertPostDirectly(
        "Member1 post",
        "Member1 body",
        member1Id,
        groupId,
      );

      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", member2Cookies);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(CANNOT_DELETE_POST);
    });

    it("returns 404 for a non-existent post", async () => {
      const cookies = await setupAndLoginAs("del4@test.com", "deleter4");
      const groupId = await createGroup(cookies);

      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/posts/${FAKE_UUID}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(404);
      expect(res.body.errors[0].message).toBe(POST_NOT_FOUND);
    });

    it("rejects delete from a non-member", async () => {
      const adminCookies = await setupAndLoginAs("del5@test.com", "del5admin");
      const groupId = await createGroup(adminCookies);
      const adminId = await getUserId("del5@test.com");
      const postId = await insertPostDirectly(
        "Admin post",
        "Admin body",
        adminId,
        groupId,
      );

      const outsiderCookies = await setupAndLoginAs(
        "del5out@test.com",
        "del5out",
      );

      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/posts/${postId}`)
        .set("Cookie", outsiderCookies);

      expect(res.status).toBe(403);
      expect(res.body.errors[0].message).toBe(NOT_A_GROUP_MEMBER);
    });
  });
});
