import { test, expect } from "@playwright/test";

test.describe("Contact Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Navigate to contacts page
    await page.click('[data-testid="nav-contacts"]');
  });

  test("should create a new contact", async ({ page }) => {
    // Click add contact button
    await page.click('[data-testid="add-contact-btn"]');

    // Fill contact form
    await page.fill('[data-testid="contact-name"]', "João Silva");
    await page.fill('[data-testid="contact-email"]', "joao@example.com");
    await page.fill('[data-testid="contact-phone"]', "(11) 99999-9999");
    await page.selectOption('[data-testid="contact-type"]', "friend");

    // Save contact
    await page.click('[data-testid="save-contact-btn"]');

    // Verify contact was created
    await expect(page.locator('[data-testid="contact-item"]')).toContainText(
      "João Silva",
    );
    await expect(page.locator('[data-testid="contact-item"]')).toContainText(
      "joao@example.com",
    );
  });

  test("should validate required fields", async ({ page }) => {
    await page.click('[data-testid="add-contact-btn"]');

    // Try to save without filling required fields
    await page.click('[data-testid="save-contact-btn"]');

    // Check for validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-error"]')).toContainText(
      "Nome é obrigatório",
    );
  });

  test("should validate email format", async ({ page }) => {
    await page.click('[data-testid="add-contact-btn"]');

    await page.fill('[data-testid="contact-name"]', "Test User");
    await page.fill('[data-testid="contact-email"]', "invalid-email");

    await page.click('[data-testid="save-contact-btn"]');

    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      "Email inválido",
    );
  });

  test("should edit existing contact", async ({ page }) => {
    // First create a contact
    await page.click('[data-testid="add-contact-btn"]');
    await page.fill('[data-testid="contact-name"]', "Maria Santos");
    await page.fill('[data-testid="contact-email"]', "maria@example.com");
    await page.click('[data-testid="save-contact-btn"]');

    // Edit the contact
    await page.click('[data-testid="edit-contact-btn"]');
    await page.fill('[data-testid="contact-name"]', "Maria Santos Silva");
    await page.fill('[data-testid="contact-phone"]', "(11) 88888-8888");
    await page.click('[data-testid="save-contact-btn"]');

    // Verify changes
    await expect(page.locator('[data-testid="contact-item"]')).toContainText(
      "Maria Santos Silva",
    );
    await expect(page.locator('[data-testid="contact-item"]')).toContainText(
      "(11) 88888-8888",
    );
  });

  test("should delete contact", async ({ page }) => {
    // Create a contact first
    await page.click('[data-testid="add-contact-btn"]');
    await page.fill('[data-testid="contact-name"]', "Pedro Costa");
    await page.fill('[data-testid="contact-email"]', "pedro@example.com");
    await page.click('[data-testid="save-contact-btn"]');

    // Delete the contact
    await page.click('[data-testid="delete-contact-btn"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');

    // Verify contact was deleted
    await expect(
      page.locator('[data-testid="contact-item"]'),
    ).not.toContainText("Pedro Costa");
  });

  test("should search contacts", async ({ page }) => {
    // Create multiple contacts
    const contacts = [
      { name: "Ana Silva", email: "ana@example.com" },
      { name: "Bruno Santos", email: "bruno@example.com" },
      { name: "Carlos Lima", email: "carlos@example.com" },
    ];

    for (const contact of contacts) {
      await page.click('[data-testid="add-contact-btn"]');
      await page.fill('[data-testid="contact-name"]', contact.name);
      await page.fill('[data-testid="contact-email"]', contact.email);
      await page.click('[data-testid="save-contact-btn"]');
    }

    // Search for specific contact
    await page.fill('[data-testid="search-contacts"]', "Ana");

    // Verify search results
    await expect(page.locator('[data-testid="contact-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="contact-item"]')).toContainText(
      "Ana Silva",
    );
  });

  test("should filter contacts by type", async ({ page }) => {
    // Create contacts with different types
    const contacts = [
      { name: "Friend Contact", type: "friend" },
      { name: "Family Contact", type: "family" },
      { name: "Work Contact", type: "work" },
    ];

    for (const contact of contacts) {
      await page.click('[data-testid="add-contact-btn"]');
      await page.fill('[data-testid="contact-name"]', contact.name);
      await page.fill(
        '[data-testid="contact-email"]',
        `${contact.name.toLowerCase().replace(" ", "")}@example.com`,
      );
      await page.selectOption('[data-testid="contact-type"]', contact.type);
      await page.click('[data-testid="save-contact-btn"]');
    }

    // Filter by family
    await page.selectOption('[data-testid="filter-contact-type"]', "family");

    // Verify filter results
    await expect(page.locator('[data-testid="contact-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="contact-item"]')).toContainText(
      "Family Contact",
    );
  });

  test("should handle duplicate contacts", async ({ page }) => {
    // Create first contact
    await page.click('[data-testid="add-contact-btn"]');
    await page.fill('[data-testid="contact-name"]', "Duplicate Test");
    await page.fill('[data-testid="contact-email"]', "duplicate@example.com");
    await page.click('[data-testid="save-contact-btn"]');

    // Try to create duplicate
    await page.click('[data-testid="add-contact-btn"]');
    await page.fill('[data-testid="contact-name"]', "Duplicate Test");
    await page.fill('[data-testid="contact-email"]', "duplicate@example.com");
    await page.click('[data-testid="save-contact-btn"]');

    // Should show duplicate warning
    await expect(
      page.locator('[data-testid="duplicate-warning"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="duplicate-warning"]'),
    ).toContainText("Contato já existe");
  });

  test("should persist data after page reload", async ({ page }) => {
    // Create a contact
    await page.click('[data-testid="add-contact-btn"]');
    await page.fill('[data-testid="contact-name"]', "Persistence Test");
    await page.fill('[data-testid="contact-email"]', "persist@example.com");
    await page.click('[data-testid="save-contact-btn"]');

    // Reload page
    await page.reload();
    await page.click('[data-testid="nav-contacts"]');

    // Verify contact still exists
    await expect(page.locator('[data-testid="contact-item"]')).toContainText(
      "Persistence Test",
    );
  });
});
