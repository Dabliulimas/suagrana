import { test, expect } from "@playwright/test";

test.describe("Account Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Navigate to accounts page
    await page.click('[data-testid="nav-accounts"]');
  });

  test("should create a new bank account", async ({ page }) => {
    await page.click('[data-testid="add-account-btn"]');

    // Fill account form
    await page.fill(
      '[data-testid="account-name"]',
      "Conta Corrente Banco do Brasil",
    );
    await page.selectOption('[data-testid="account-type"]', "checking");
    await page.fill('[data-testid="account-balance"]', "5000.00");
    await page.fill('[data-testid="account-bank"]', "Banco do Brasil");
    await page.fill('[data-testid="account-number"]', "12345-6");

    await page.click('[data-testid="save-account-btn"]');

    // Verify account was created
    await expect(page.locator('[data-testid="account-item"]')).toContainText(
      "Conta Corrente Banco do Brasil",
    );
    await expect(page.locator('[data-testid="account-balance"]')).toContainText(
      "R$ 5.000,00",
    );
  });

  test("should create a credit card account", async ({ page }) => {
    await page.click('[data-testid="add-account-btn"]');

    await page.fill('[data-testid="account-name"]', "Cartão Visa");
    await page.selectOption('[data-testid="account-type"]', "credit_card");
    await page.fill('[data-testid="account-limit"]', "10000.00");
    await page.fill('[data-testid="account-used-limit"]', "2500.00");
    await page.fill('[data-testid="account-due-date"]', "15");

    await page.click('[data-testid="save-account-btn"]');

    // Verify credit card was created
    await expect(page.locator('[data-testid="account-item"]')).toContainText(
      "Cartão Visa",
    );
    await expect(page.locator('[data-testid="available-limit"]')).toContainText(
      "R$ 7.500,00",
    );
  });

  test("should validate required fields", async ({ page }) => {
    await page.click('[data-testid="add-account-btn"]');

    // Try to save without filling required fields
    await page.click('[data-testid="save-account-btn"]');

    // Check for validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-error"]')).toContainText(
      "Nome é obrigatório",
    );

    await expect(page.locator('[data-testid="type-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-error"]')).toContainText(
      "Tipo é obrigatório",
    );
  });

  test("should validate balance format", async ({ page }) => {
    await page.click('[data-testid="add-account-btn"]');

    await page.fill('[data-testid="account-name"]', "Test Account");
    await page.selectOption('[data-testid="account-type"]', "checking");
    await page.fill('[data-testid="account-balance"]', "invalid-amount");

    await page.click('[data-testid="save-account-btn"]');

    await expect(page.locator('[data-testid="balance-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="balance-error"]')).toContainText(
      "Valor inválido",
    );
  });

  test("should edit existing account", async ({ page }) => {
    // Create account first
    await page.click('[data-testid="add-account-btn"]');
    await page.fill('[data-testid="account-name"]', "Conta Poupança");
    await page.selectOption('[data-testid="account-type"]', "savings");
    await page.fill('[data-testid="account-balance"]', "3000.00");
    await page.click('[data-testid="save-account-btn"]');

    // Edit the account
    await page.click('[data-testid="edit-account-btn"]');
    await page.fill('[data-testid="account-name"]', "Conta Poupança Premium");
    await page.fill('[data-testid="account-balance"]', "3500.00");
    await page.click('[data-testid="save-account-btn"]');

    // Verify changes
    await expect(page.locator('[data-testid="account-item"]')).toContainText(
      "Conta Poupança Premium",
    );
    await expect(page.locator('[data-testid="account-balance"]')).toContainText(
      "R$ 3.500,00",
    );
  });

  test("should delete account", async ({ page }) => {
    // Create account first
    await page.click('[data-testid="add-account-btn"]');
    await page.fill('[data-testid="account-name"]', "Conta para Deletar");
    await page.selectOption('[data-testid="account-type"]', "checking");
    await page.fill('[data-testid="account-balance"]', "1000.00");
    await page.click('[data-testid="save-account-btn"]');

    // Delete the account
    await page.click('[data-testid="delete-account-btn"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');

    // Verify account was deleted
    await expect(
      page.locator('[data-testid="account-item"]'),
    ).not.toContainText("Conta para Deletar");
  });

  test("should show account summary", async ({ page }) => {
    // Create multiple accounts
    const accounts = [
      { name: "Conta Corrente", type: "checking", balance: "2000.00" },
      { name: "Conta Poupança", type: "savings", balance: "5000.00" },
      {
        name: "Cartão de Crédito",
        type: "credit_card",
        limit: "3000.00",
        used: "1000.00",
      },
    ];

    for (const account of accounts) {
      await page.click('[data-testid="add-account-btn"]');
      await page.fill('[data-testid="account-name"]', account.name);
      await page.selectOption('[data-testid="account-type"]', account.type);

      if (account.type === "credit_card") {
        await page.fill('[data-testid="account-limit"]', account.limit!);
        await page.fill('[data-testid="account-used-limit"]', account.used!);
      } else {
        await page.fill('[data-testid="account-balance"]', account.balance!);
      }

      await page.click('[data-testid="save-account-btn"]');
    }

    // Check summary
    await expect(page.locator('[data-testid="total-balance"]')).toContainText(
      "R$ 7.000,00",
    );
    await expect(
      page.locator('[data-testid="available-credit"]'),
    ).toContainText("R$ 2.000,00");
    await expect(page.locator('[data-testid="total-accounts"]')).toContainText(
      "3",
    );
  });

  test("should filter accounts by type", async ({ page }) => {
    // Create accounts with different types
    const accounts = [
      { name: "Conta Corrente 1", type: "checking" },
      { name: "Conta Corrente 2", type: "checking" },
      { name: "Conta Poupança", type: "savings" },
      { name: "Cartão Visa", type: "credit_card" },
    ];

    for (const account of accounts) {
      await page.click('[data-testid="add-account-btn"]');
      await page.fill('[data-testid="account-name"]', account.name);
      await page.selectOption('[data-testid="account-type"]', account.type);

      if (account.type === "credit_card") {
        await page.fill('[data-testid="account-limit"]', "1000.00");
        await page.fill('[data-testid="account-used-limit"]', "0.00");
      } else {
        await page.fill('[data-testid="account-balance"]', "1000.00");
      }

      await page.click('[data-testid="save-account-btn"]');
    }

    // Filter by checking accounts
    await page.selectOption('[data-testid="filter-account-type"]', "checking");

    // Verify filter results
    await expect(page.locator('[data-testid="account-item"]')).toHaveCount(2);
    await expect(
      page.locator('[data-testid="account-item"]').first(),
    ).toContainText("Conta Corrente");
  });

  test("should search accounts", async ({ page }) => {
    // Create multiple accounts
    const accounts = [
      { name: "Banco do Brasil CC", type: "checking" },
      { name: "Itaú Poupança", type: "savings" },
      { name: "Nubank Cartão", type: "credit_card" },
    ];

    for (const account of accounts) {
      await page.click('[data-testid="add-account-btn"]');
      await page.fill('[data-testid="account-name"]', account.name);
      await page.selectOption('[data-testid="account-type"]', account.type);

      if (account.type === "credit_card") {
        await page.fill('[data-testid="account-limit"]', "1000.00");
        await page.fill('[data-testid="account-used-limit"]', "0.00");
      } else {
        await page.fill('[data-testid="account-balance"]', "1000.00");
      }

      await page.click('[data-testid="save-account-btn"]');
    }

    // Search for specific account
    await page.fill('[data-testid="search-accounts"]', "Nubank");

    // Verify search results
    await expect(page.locator('[data-testid="account-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="account-item"]')).toContainText(
      "Nubank Cartão",
    );
  });

  test("should handle account balance updates", async ({ page }) => {
    // Create account
    await page.click('[data-testid="add-account-btn"]');
    await page.fill('[data-testid="account-name"]', "Conta Teste");
    await page.selectOption('[data-testid="account-type"]', "checking");
    await page.fill('[data-testid="account-balance"]', "1000.00");
    await page.click('[data-testid="save-account-btn"]');

    // Update balance
    await page.click('[data-testid="update-balance-btn"]');
    await page.fill('[data-testid="new-balance"]', "1500.00");
    await page.click('[data-testid="confirm-update-btn"]');

    // Verify balance was updated
    await expect(page.locator('[data-testid="account-balance"]')).toContainText(
      "R$ 1.500,00",
    );
  });

  test("should persist data after page reload", async ({ page }) => {
    // Create account
    await page.click('[data-testid="add-account-btn"]');
    await page.fill('[data-testid="account-name"]', "Persistence Test Account");
    await page.selectOption('[data-testid="account-type"]', "savings");
    await page.fill('[data-testid="account-balance"]', "2500.00");
    await page.click('[data-testid="save-account-btn"]');

    // Reload page
    await page.reload();
    await page.click('[data-testid="nav-accounts"]');

    // Verify account still exists
    await expect(page.locator('[data-testid="account-item"]')).toContainText(
      "Persistence Test Account",
    );
    await expect(page.locator('[data-testid="account-balance"]')).toContainText(
      "R$ 2.500,00",
    );
  });
});
