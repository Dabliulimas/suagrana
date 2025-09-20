import { PrismaClient } from "@prisma/client";

describe("Sample Test", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have test environment configured", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.DATABASE_URL).toBe("file:./test.db");
    expect(process.env.JWT_SECRET).toBe("test-jwt-secret-key-for-testing-only");
  });

  it("should be able to create Prisma client", () => {
    const prisma = new PrismaClient();
    expect(prisma).toBeDefined();
  });

  it("should mock Redis correctly", () => {
    const Redis = require("ioredis");
    const redis = new Redis();

    expect(redis.get).toBeDefined();
    expect(redis.set).toBeDefined();
    expect(redis.del).toBeDefined();
    expect(typeof redis.get).toBe("function");
  });
});
