const LinkedList = require('./models/LinkedList');
const Account = require('./models/Account');

class Bank {
  constructor() {
    this.accounts = new LinkedList();
    this.nextAccountNumber = 1001;
  }

  createAccount(name, balance) {
    const newAccount = new Account(name, balance, this.nextAccountNumber++);
    this.accounts.insert(newAccount);
    return newAccount;
  }

  getAccount(accountNumber) {
    return this.accounts.find(accountNumber);
  }

  getAllAccounts() {
    return this.accounts.getAll();
  }

  transferFunds(fromAccount, toAccount, amount) {
    const from = this.getAccount(fromAccount);
    const to = this.getAccount(toAccount);

    if (!from || !to) return { success: false, message: 'Account not found' };
    if (from.balance < amount) return { success: false, message: 'Insufficient balance' };

    from.balance -= amount;
    to.balance += amount;

    return { success: true, message: `Transferred ₹${amount} from ${fromAccount} to ${toAccount}` };
  }

  checkBalance(accountNumber) {
    const acc = this.getAccount(accountNumber);
    return acc ? acc.balance : null;
  }
}

module.exports = new Bank();
