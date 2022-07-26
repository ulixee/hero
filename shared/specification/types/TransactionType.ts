enum TransactionType {
  COINBASE = 0,
  TRANSFER = 1,
  COINAGE_CLAIM = 2,
  BOND_PURCHASE = 3,
  BOND_REDEMPTION = 4, // only allowed in stable ledger. must have corresponding transaction in bondTransactions
}
export default TransactionType;
