import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup for E2E tests...");

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the dev server to be ready
    console.log("⏳ Waiting for dev server to be ready...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Clear any existing data in localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Setup test data if needed
    await page.evaluate(() => {
      // Initialize with clean state
      const testData = {
        transactions: [],
        contacts: [],
        accounts: [],
        goals: [],
        investments: [],
        trips: [],
        userProfile: {
          name: "Test User",
          email: "test@example.com",
          preferences: {
            currency: "BRL",
            language: "pt-BR",
            theme: "light",
            notifications: {
              email: true,
              push: false,
              sms: false,
            },
          },
        },
      };

      // Save test data to localStorage
      Object.entries(testData).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    });

    console.log("✅ Global setup completed successfully");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
