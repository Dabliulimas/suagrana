import { rateLimiter } from "@/lib/rate-limiter";

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("RateLimiter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rateLimiter.cleanup();
  });

  describe("Basic Functionality", () => {
    it("should be defined", () => {
      expect(rateLimiter).toBeDefined();
    });

    it("should have required methods", () => {
      expect(typeof rateLimiter.checkLimit).toBe("function");
      expect(typeof rateLimiter.isBlocked).toBe("function");
      expect(typeof rateLimiter.clearLimits).toBe("function");
      expect(typeof rateLimiter.cleanup).toBe("function");
      expect(typeof rateLimiter.getLimits).toBe("function");
      expect(typeof rateLimiter.updateConfig).toBe("function");
    });

    it("should allow requests within limits", () => {
      const result = rateLimiter.checkLimit("api");
      expect(result.allowed).toBe(true);
    });

    it("should handle different action types", () => {
      const loginResult = rateLimiter.checkLimit("login");
      const apiResult = rateLimiter.checkLimit("api");
      const transactionResult = rateLimiter.checkLimit("transaction");

      expect(loginResult.allowed).toBe(true);
      expect(apiResult.allowed).toBe(true);
      expect(transactionResult.allowed).toBe(true);
    });

    it("should check if client is blocked", () => {
      const isBlocked = rateLimiter.isBlocked("api");
      expect(typeof isBlocked).toBe("boolean");
    });

    it("should clear limits for client", () => {
      expect(() => {
        rateLimiter.clearLimits();
      }).not.toThrow();
    });

    it("should cleanup expired entries", () => {
      expect(() => {
        rateLimiter.cleanup();
      }).not.toThrow();
    });

    it("should get current limits configuration", () => {
      const limits = rateLimiter.getLimits();
      expect(limits).toBeDefined();
      expect(typeof limits).toBe("object");
      expect(limits.login).toBeDefined();
      expect(limits.api).toBeDefined();
      expect(limits.transaction).toBeDefined();
    });

    it("should update configuration", () => {
      expect(() => {
        rateLimiter.updateConfig("test", {
          maxRequests: 10,
          windowMs: 60000,
          blockDurationMs: 60000,
        });
      }).not.toThrow();

      const limits = rateLimiter.getLimits();
      expect(limits.test).toBeDefined();
      expect(limits.test.maxRequests).toBe(10);
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown actions with default config", () => {
      const result = rateLimiter.checkLimit("unknown-action");
      expect(result.allowed).toBe(true);
    });
  });
});
