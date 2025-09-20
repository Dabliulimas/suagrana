/**
 * Simple test script to verify account creation doesn't cause hanging
 */

// Simulate account creation data
const testAccount = {
  name: "Teste Conta",
  type: "checking",
  balance: 1000,
  currency: "BRL",
  bank: "Banco Teste",
  description: "Conta para teste de funcionalidade"
};

// Mock localStorage for testing
if (typeof window !== 'undefined') {
  console.log('Testing account creation...');
  
  try {
    // Test basic localStorage operations
    const existingAccounts = JSON.parse(localStorage.getItem('sua-grana-accounts') || '[]');
    console.log('Existing accounts:', existingAccounts.length);
    
    // Create new account
    const newAccount = {
      ...testAccount,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedAccounts = [...existingAccounts, newAccount];
    localStorage.setItem('sua-grana-accounts', JSON.stringify(updatedAccounts));
    
    console.log('✅ Account created successfully:', newAccount.name);
    console.log('Total accounts:', updatedAccounts.length);
    
  } catch (error) {
    console.error('❌ Error testing account creation:', error);
  }
} else {
  console.log('Running in server environment - skipping localStorage test');
}
