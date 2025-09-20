import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting global teardown for E2E tests...");

  try {
    // Cleanup operations can be added here if needed
    // For example: cleanup test databases, stop services, etc.

    // Log test results summary
    console.log("📊 E2E test session completed");
    console.log("✅ Global teardown completed successfully");
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    // Don't throw error to avoid masking test failures
  }
}

export default globalTeardown;
