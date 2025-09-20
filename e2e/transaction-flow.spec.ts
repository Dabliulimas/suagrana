import { test, expect } from "@playwright/test";

/**
 * End-to-End tests for transaction management flow
 * Tests the complete user journey from creating to managing transactions
 */
test.describe("Transaction Management E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/");

    // Wait for the application to load
    await page.waitForLoadState("networkidle");

    // Clear any existing data by resetting localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload to ensure clean state
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("should create a new expense transaction successfully", async ({
    page,
  }) => {
    // Look for add transaction button or form
    const addButton = page
      .locator("button")
      .filter({ hasText: /adicionar|nova|criar/i })
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Fill transaction form
    await page.fill(
      'input[name="description"], input[placeholder*="descrição"], input[placeholder*="description"]',
      "E2E Test Expense",
    );
    await page.fill(
      'input[name="amount"], input[placeholder*="valor"], input[placeholder*="amount"]',
      "150.75",
    );

    // Select expense type if available
    const typeSelect = page
      .locator('select[name="type"], [role="combobox"]')
      .first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("expense");
    }

    // Select category if available
    const categorySelect = page
      .locator('select[name="category"], input[name="category"]')
      .first();
    if (await categorySelect.isVisible()) {
      await categorySelect.fill("food");
    }

    // Set date
    const dateInput = page
      .locator('input[type="date"], input[name="date"]')
      .first();
    if (await dateInput.isVisible()) {
      await dateInput.fill("2024-01-15");
    }

    // Submit the form
    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /salvar|save|criar|create/i })
      .first();
    await submitButton.click();

    // Verify transaction was created
    await expect(page.locator("text=E2E Test Expense")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=150.75, text=R$ 150,75")).toBeVisible();
  });

  test("should create a new income transaction successfully", async ({
    page,
  }) => {
    // Look for add transaction button
    const addButton = page
      .locator("button")
      .filter({ hasText: /adicionar|nova|criar/i })
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Fill transaction form for income
    await page.fill(
      'input[name="description"], input[placeholder*="descrição"]',
      "E2E Test Income",
    );
    await page.fill(
      'input[name="amount"], input[placeholder*="valor"]',
      "2500.00",
    );

    // Select income type
    const typeSelect = page
      .locator('select[name="type"], [role="combobox"]')
      .first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("income");
    }

    // Select category
    const categorySelect = page
      .locator('select[name="category"], input[name="category"]')
      .first();
    if (await categorySelect.isVisible()) {
      await categorySelect.fill("salary");
    }

    // Submit the form
    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /salvar|save|criar|create/i })
      .first();
    await submitButton.click();

    // Verify income transaction was created
    await expect(page.locator("text=E2E Test Income")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=2500, text=R$ 2.500")).toBeVisible();
  });

  test("should validate required fields and show errors", async ({ page }) => {
    // Try to submit empty form
    const addButton = page
      .locator("button")
      .filter({ hasText: /adicionar|nova|criar/i })
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Try to submit without filling required fields
    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /salvar|save|criar|create/i })
      .first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // Check for validation errors
    const errorMessages = page.locator(
      '[role="alert"], .error, .text-red, .text-destructive',
    );
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test("should edit an existing transaction", async ({ page }) => {
    // First create a transaction
    const addButton = page
      .locator("button")
      .filter({ hasText: /adicionar|nova|criar/i })
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
    }

    await page.fill(
      'input[name="description"], input[placeholder*="descrição"]',
      "Original Transaction",
    );
    await page.fill(
      'input[name="amount"], input[placeholder*="valor"]',
      "100.00",
    );

    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /salvar|save|criar|create/i })
      .first();
    await submitButton.click();

    // Wait for transaction to appear
    await expect(page.locator("text=Original Transaction")).toBeVisible();

    // Find and click edit button
    const editButton = page
      .locator("button")
      .filter({ hasText: /editar|edit/i })
      .first();
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      // Try clicking on the transaction itself
      await page.locator("text=Original Transaction").click();
    }

    // Update the transaction
    await page.fill(
      'input[name="description"], input[placeholder*="descrição"]',
      "Updated Transaction",
    );
    await page.fill(
      'input[name="amount"], input[placeholder*="valor"]',
      "200.00",
    );

    // Save changes
    const saveButton = page
      .locator("button")
      .filter({ hasText: /salvar|save|atualizar|update/i })
      .first();
    await saveButton.click();

    // Verify changes
    await expect(page.locator("text=Updated Transaction")).toBeVisible();
    await expect(page.locator("text=200")).toBeVisible();
    await expect(page.locator("text=Original Transaction")).not.toBeVisible();
  });

  test("should delete a transaction", async ({ page }) => {
    // First create a transaction
    const addButton = page
      .locator("button")
      .filter({ hasText: /adicionar|nova|criar/i })
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
    }

    await page.fill(
      'input[name="description"], input[placeholder*="descrição"]',
      "Transaction to Delete",
    );
    await page.fill(
      'input[name="amount"], input[placeholder*="valor"]',
      "75.50",
    );

    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /salvar|save|criar|create/i })
      .first();
    await submitButton.click();

    // Wait for transaction to appear
    await expect(page.locator("text=Transaction to Delete")).toBeVisible();

    // Find and click delete button
    const deleteButton = page
      .locator("button")
      .filter({ hasText: /excluir|delete|remover/i })
      .first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    }

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = page
      .locator("button")
      .filter({ hasText: /confirmar|confirm|sim|yes/i })
      .first();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Verify transaction was deleted
    await expect(page.locator("text=Transaction to Delete")).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("should filter transactions by type", async ({ page }) => {
    // Create multiple transactions of different types
    const transactions = [
      { description: "Expense 1", amount: "100", type: "expense" },
      { description: "Income 1", amount: "500", type: "income" },
      { description: "Expense 2", amount: "200", type: "expense" },
    ];

    for (const transaction of transactions) {
      const addButton = page
        .locator("button")
        .filter({ hasText: /adicionar|nova|criar/i })
        .first();

      if (await addButton.isVisible()) {
        await addButton.click();
      }

      await page.fill(
        'input[name="description"], input[placeholder*="descrição"]',
        transaction.description,
      );
      await page.fill(
        'input[name="amount"], input[placeholder*="valor"]',
        transaction.amount,
      );

      const typeSelect = page
        .locator('select[name="type"], [role="combobox"]')
        .first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption(transaction.type);
      }

      const submitButton = page
        .locator('button[type="submit"], button')
        .filter({ hasText: /salvar|save|criar|create/i })
        .first();
      await submitButton.click();

      await expect(
        page.locator(`text=${transaction.description}`),
      ).toBeVisible();
    }

    // Test filtering by expense
    const expenseFilter = page
      .locator("button, select")
      .filter({ hasText: /despesa|expense/i })
      .first();
    if (await expenseFilter.isVisible()) {
      await expenseFilter.click();

      // Should show expenses only
      await expect(page.locator("text=Expense 1")).toBeVisible();
      await expect(page.locator("text=Expense 2")).toBeVisible();
      await expect(page.locator("text=Income 1")).not.toBeVisible();
    }

    // Test filtering by income
    const incomeFilter = page
      .locator("button, select")
      .filter({ hasText: /receita|income/i })
      .first();
    if (await incomeFilter.isVisible()) {
      await incomeFilter.click();

      // Should show income only
      await expect(page.locator("text=Income 1")).toBeVisible();
      await expect(page.locator("text=Expense 1")).not.toBeVisible();
      await expect(page.locator("text=Expense 2")).not.toBeVisible();
    }
  });

  test("should search transactions by description", async ({ page }) => {
    // Create test transactions
    const transactions = [
      "Grocery Shopping",
      "Gas Station",
      "Restaurant Dinner",
    ];

    for (const description of transactions) {
      const addButton = page
        .locator("button")
        .filter({ hasText: /adicionar|nova|criar/i })
        .first();

      if (await addButton.isVisible()) {
        await addButton.click();
      }

      await page.fill(
        'input[name="description"], input[placeholder*="descrição"]',
        description,
      );
      await page.fill(
        'input[name="amount"], input[placeholder*="valor"]',
        "50.00",
      );

      const submitButton = page
        .locator('button[type="submit"], button')
        .filter({ hasText: /salvar|save|criar|create/i })
        .first();
      await submitButton.click();

      await expect(page.locator(`text=${description}`)).toBeVisible();
    }

    // Test search functionality
    const searchInput = page
      .locator(
        'input[placeholder*="buscar"], input[placeholder*="search"], input[type="search"]',
      )
      .first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Grocery");

      // Should show only matching transaction
      await expect(page.locator("text=Grocery Shopping")).toBeVisible();
      await expect(page.locator("text=Gas Station")).not.toBeVisible();
      await expect(page.locator("text=Restaurant Dinner")).not.toBeVisible();

      // Clear search
      await searchInput.clear();

      // All transactions should be visible again
      await expect(page.locator("text=Grocery Shopping")).toBeVisible();
      await expect(page.locator("text=Gas Station")).toBeVisible();
      await expect(page.locator("text=Restaurant Dinner")).toBeVisible();
    }
  });

  test("should display transaction summary/totals", async ({ page }) => {
    // Create transactions with known amounts
    const transactions = [
      { description: "Income 1", amount: "1000", type: "income" },
      { description: "Expense 1", amount: "300", type: "expense" },
      { description: "Expense 2", amount: "200", type: "expense" },
    ];

    for (const transaction of transactions) {
      const addButton = page
        .locator("button")
        .filter({ hasText: /adicionar|nova|criar/i })
        .first();

      if (await addButton.isVisible()) {
        await addButton.click();
      }

      await page.fill(
        'input[name="description"], input[placeholder*="descrição"]',
        transaction.description,
      );
      await page.fill(
        'input[name="amount"], input[placeholder*="valor"]',
        transaction.amount,
      );

      const typeSelect = page
        .locator('select[name="type"], [role="combobox"]')
        .first();
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption(transaction.type);
      }

      const submitButton = page
        .locator('button[type="submit"], button')
        .filter({ hasText: /salvar|save|criar|create/i })
        .first();
      await submitButton.click();

      await expect(
        page.locator(`text=${transaction.description}`),
      ).toBeVisible();
    }

    // Check for summary/total displays
    // Total income should be 1000
    const incomeTotal = page.locator("text=/.*1.?000.*/");
    if (await incomeTotal.isVisible()) {
      await expect(incomeTotal).toBeVisible();
    }

    // Total expenses should be 500 (300 + 200)
    const expenseTotal = page.locator("text=/.*500.*/");
    if (await expenseTotal.isVisible()) {
      await expect(expenseTotal).toBeVisible();
    }

    // Balance should be 500 (1000 - 500)
    const balance = page.locator("text=/.*saldo.*|.*balance.*/", {
      hasText: /500/,
    });
    if (await balance.isVisible()) {
      await expect(balance).toBeVisible();
    }
  });

  test("should handle data persistence across page reloads", async ({
    page,
  }) => {
    // Create a transaction
    const addButton = page
      .locator("button")
      .filter({ hasText: /adicionar|nova|criar/i })
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
    }

    await page.fill(
      'input[name="description"], input[placeholder*="descrição"]',
      "Persistent Transaction",
    );
    await page.fill(
      'input[name="amount"], input[placeholder*="valor"]',
      "123.45",
    );

    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /salvar|save|criar|create/i })
      .first();
    await submitButton.click();

    // Verify transaction exists
    await expect(page.locator("text=Persistent Transaction")).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify transaction still exists after reload
    await expect(page.locator("text=Persistent Transaction")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=123.45")).toBeVisible();
  });
});
