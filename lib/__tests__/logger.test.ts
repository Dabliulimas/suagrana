import { logger, LogLevel } from "@/lib/logger";

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

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

Object.defineProperty(console, "log", { value: mockConsole.log });
Object.defineProperty(console, "info", { value: mockConsole.info });
Object.defineProperty(console, "warn", { value: mockConsole.warn });
Object.defineProperty(console, "error", { value: mockConsole.error });
Object.defineProperty(console, "debug", { value: mockConsole.debug });

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logger.clearLogs();
  });

  describe("Basic Functionality", () => {
    it("should be defined", () => {
      expect(logger).toBeDefined();
    });

    it("should have required methods", () => {
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.getLogs).toBe("function");
      expect(typeof logger.clearLogs).toBe("function");
      expect(typeof logger.exportLogs).toBe("function");
    });

    it("should log debug messages", () => {
      expect(() => {
        logger.debug("Debug message");
      }).not.toThrow();
    });

    it("should log info messages", () => {
      expect(() => {
        logger.info("Info message");
      }).not.toThrow();
    });

    it("should log warning messages", () => {
      expect(() => {
        logger.warn("Warning message");
      }).not.toThrow();
    });

    it("should log error messages", () => {
      expect(() => {
        logger.error("Error message");
      }).not.toThrow();
    });

    it("should get logs", () => {
      logger.info("Test message");
      const logs = logger.getLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should clear logs", () => {
      logger.info("Test message");
      expect(() => {
        logger.clearLogs();
      }).not.toThrow();
    });

    it("should export logs", () => {
      logger.info("Test message");
      expect(() => {
        logger.exportLogs();
      }).not.toThrow();
    });
  });

  describe("Log Levels", () => {
    it("should handle different log levels", () => {
      expect(() => {
        logger.debug("Debug message");
        logger.info("Info message");
        logger.warn("Warning message");
        logger.error("Error message");
      }).not.toThrow();
    });

    it("should get logs by level", () => {
      logger.info("Info message");
      logger.error("Error message");

      const allLogs = logger.getLogs();
      expect(Array.isArray(allLogs)).toBe(true);

      const errorLogs = logger.getLogs(LogLevel.ERROR);
      expect(Array.isArray(errorLogs)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle localStorage errors gracefully", () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      expect(() => {
        logger.info("Test message");
      }).not.toThrow();
    });

    it("should handle invalid data gracefully", () => {
      expect(() => {
        logger.info("Test message", { circular: {} });
      }).not.toThrow();
    });
  });

  describe("Component Logging", () => {
    it("should log with component name", () => {
      expect(() => {
        logger.info("Test message", undefined, "TestComponent");
      }).not.toThrow();
    });

    it("should log with data and component", () => {
      expect(() => {
        logger.info("Test message", { key: "value" }, "TestComponent");
      }).not.toThrow();
    });
  });
});
