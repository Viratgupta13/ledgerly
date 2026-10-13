export type TxnStatus = 'pending' | 'confirmed' | 'ignored';

export type TxnRow = {
  id: string;
  amount: number;
  type: 'debit' | 'credit';
  merchant: string | null;
  category: string | null;
  bank_ref: string | null;
  occurred_at: string;
  status: TxnStatus;
  note: string | null;
  payee_key: string | null;
  payee_kind: 'person' | 'merchant' | 'unknown';
};

export type RuleRow = { id: string; payee_key: string; category: string };

export type CategoryRow = { id: string; name: string };
