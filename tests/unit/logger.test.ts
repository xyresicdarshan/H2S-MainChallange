import { describe, expect, it, vi, beforeEach } from "vitest";
import { logError, logWarn, logInfo } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  describe("logError", () => {
    it("calls console.error with context and message", () => {
      const error = new Error("Test error");
      logError("test-context", "Something failed", error);

      expect(console.error).toHaveBeenCalledWith("[test-context] Something failed", error);
    });

    it("handles undefined error gracefully", () => {
      logError("test-context", "Something failed");

      expect(console.error).toHaveBeenCalledWith("[test-context] Something failed", "");
    });

    it("never throws even if console.error throws", () => {
      vi.mocked(console.error).mockImplementation(() => {
        throw new Error("Console error failed");
      });

      expect(() => {
        logError("test-context", "message");
      }).not.toThrow();
    });
  });

  describe("logWarn", () => {
    it("calls console.warn with formatted message", () => {
      logWarn("test-context", "Warning message");

      expect(console.warn).toHaveBeenCalledWith("[test-context] Warning message");
    });

    it("never throws even if console.warn throws", () => {
      vi.mocked(console.warn).mockImplementation(() => {
        throw new Error("Console warn failed");
      });

      expect(() => {
        logWarn("test-context", "message");
      }).not.toThrow();
    });
  });

  describe("logInfo", () => {
    it("calls console.info with formatted message", () => {
      logInfo("test-context", "Info message");

      expect(console.info).toHaveBeenCalledWith("[test-context] Info message");
    });

    it("never throws even if console.info throws", () => {
      vi.mocked(console.info).mockImplementation(() => {
        throw new Error("Console info failed");
      });

      expect(() => {
        logInfo("test-context", "message");
      }).not.toThrow();
    });
  });
});
