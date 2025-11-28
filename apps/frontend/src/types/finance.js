export var AccountType;
(function (AccountType) {
    AccountType["CASH"] = "cash";
    AccountType["BANK"] = "bank";
    AccountType["OTHER"] = "other";
})(AccountType || (AccountType = {}));
export var TransactionType;
(function (TransactionType) {
    TransactionType["PURCHASE"] = "purchase";
    TransactionType["SALE"] = "sale";
    TransactionType["BUYBACK"] = "buyback";
    TransactionType["WRITE_OFF"] = "write_off";
    TransactionType["PARTNER_WITHDRAWAL"] = "partner_withdrawal";
})(TransactionType || (TransactionType = {}));
