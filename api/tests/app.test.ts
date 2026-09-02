import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
describe("API shell", () => {
  it("menyediakan health check publik", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
  });
  it("melindungi route bisnis", async () => {
    const response = await request(app).get("/api/v1/products");
    expect(response.status).toBe(401);
    expect(response.body.code).toBe("UNAUTHORIZED");
  });
  it("memberikan token CSRF", async () => {
    const response = await request(app).get("/api/v1/auth/csrf");
    expect(response.status).toBe(200);
    expect(response.body.data.csrfToken).toContain(".");
  });
});
