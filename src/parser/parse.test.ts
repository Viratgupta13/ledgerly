import { dedupeKey, parseSms } from './index';
import { extractAmount, extractOccurredAt, toPayeeKey } from './extract';

// 12 Oct 2024, 10:20:30 IST
const SMS_DATE = Date.UTC(2024, 9, 12, 4, 50, 30);
const sms = (body: string, date = SMS_DATE) => ({ body, address: 'AX-HDFCBK', date });

function ok(body: string, date = SMS_DATE) {
  const r = parseSms(sms(body, date));
  if (!r.ok) throw new Error(`expected parse, got reject: ${r.reason}`);
  return r.txn;
}

describe('parseSms', () => {
  it('parses an HDFC UPI P2M debit', () => {
    const t = ok('Sent Rs.500.00 From HDFC Bank A/C *1234 To SWIGGY On 12/10/24 Ref 428812345678 Not You? Call 18002586161');
    expect(t).toMatchObject({
      amount: 500,
      type: 'debit',
      merchant: 'SWIGGY',
      payeeKey: 'swiggy',
      bankRef: '428812345678',
    });
    expect(t.occurredAt).toBe(new Date(SMS_DATE).toISOString());
  });

  it('parses a VPA debit and uses the handle as merchant', () => {
    const t = ok('Rs 1,250.00 debited from A/c XX1234 on 12-Oct-24 to VPA abc@ybl (UPI Ref No 428812345678).');
    expect(t).toMatchObject({ amount: 1250, type: 'debit', merchant: 'abc@ybl', payeeKey: 'abc@ybl', bankRef: '428812345678' });
  });

  it('parses an SBI debit with no currency marker', () => {
    const t = ok('Dear UPI user A/C X1234 debited by 500.0 on date 12Oct24 trf to RAMESH KUMAR Refno 428812345678');
    expect(t).toMatchObject({ amount: 500, type: 'debit', merchant: 'RAMESH KUMAR', payeeKey: 'ramesh kumar', bankRef: '428812345678' });
  });

  it('parses an ICICI debit where the payee precedes "credited"', () => {
    const t = ok('ICICI Bank Acct XX123 debited for Rs 500.00 on 12-Oct-24; ZOMATO LTD credited. UPI:428812345678.');
    expect(t).toMatchObject({ amount: 500, type: 'debit', merchant: 'ZOMATO LTD', payeeKey: 'zomato', bankRef: '428812345678' });
  });

  it('parses an Axis UPI/P2M debit', () => {
    const t = ok('Debit INR 350.00 A/c no. XX1234 12-10-24 10:20:30 UPI/P2M/428812345678/BIGBASKET SMS BLOCK UPI to 9223008486');
    expect(t).toMatchObject({ amount: 350, type: 'debit', merchant: 'BIGBASKET', bankRef: '428812345678' });
  });

  it('parses a card spend and ignores the available limit', () => {
    const t = ok('Spent Rs.899 On HDFC Bank Card 1234 At AMAZON On 2024-10-12:10:20:30. Avl Lmt Rs 50000');
    expect(t).toMatchObject({ amount: 899, type: 'debit', merchant: 'AMAZON', bankRef: null });
    expect(t.occurredAt).toBe(new Date(SMS_DATE).toISOString());
  });

  it('does not read "Credit Card" as a credit', () => {
    const t = ok('Your Credit Card XX1234 was used for Rs 640.00 at DECATHLON on 12-10-24. Ref 428812345678');
    expect(t.type).toBe('debit');
    expect(t.merchant).toBe('DECATHLON');
  });

  it('parses a NEFT credit with lakh-style grouping', () => {
    const t = ok('Rs 1,25,000.00 credited to your a/c XX1234 on 12-10-24 by NEFT from ACME CORP. UTR 123456789012');
    expect(t).toMatchObject({ amount: 125000, type: 'credit', merchant: 'ACME CORP', bankRef: '123456789012' });
  });

  it('parses an incoming UPI credit', () => {
    const t = ok('Rs.2000.00 credited to a/c XX1234 on 12-10-24 by UPI from VPA friend@okaxis (UPI Ref No 428812345678)');
    expect(t).toMatchObject({ amount: 2000, type: 'credit', merchant: 'friend@okaxis', payeeKey: 'friend@okaxis' });
  });

  it('treats a refund as a credit', () => {
    const t = ok('Your UPI refund of INR 250.00 has been credited to a/c XX1234. UPI Ref 428812345678');
    expect(t).toMatchObject({ amount: 250, type: 'credit', bankRef: '428812345678' });
  });

  it('returns null bankRef when the SMS has none, and dedupeKey stays deterministic', () => {
    const msg = sms('Spent Rs.899 On HDFC Bank Card 1234 At AMAZON On 2024-10-12:10:20:30.');
    const r = parseSms(msg);
    if (!r.ok) throw new Error(r.reason);
    expect(r.txn.bankRef).toBeNull();
    expect(dedupeKey(msg, r.txn)).toBe(dedupeKey(msg, r.txn));
    expect(dedupeKey(msg, r.txn)).toContain('AX-HDFCBK');
  });

  it('uses the body date (IST) when it is not the day the SMS arrived', () => {
    const later = Date.UTC(2024, 9, 14, 6, 0, 0);
    const t = ok('Rs 100.00 debited from A/c XX1234 on 12-10-24 10:20:30 to VPA abc@ybl UPI Ref 428812345678', later);
    expect(t.occurredAt).toBe('2024-10-12T04:50:30.000Z');
  });

  it.each([
    ['otp', '123456 is your OTP for login to HDFC Bank NetBanking.'],
    ['promo', 'Congratulations! Pre-approved loan up to Rs 5,00,000. Apply now http://bit.ly/xyz'],
    ['recharge', 'Recharge now with Rs 299 for 28 days validity. Jio'],
    ['failed', 'UPI transaction of Rs 500.00 to SWIGGY has failed.'],
  ] as const)('rejects %s', (reason, body) => {
    expect(parseSms(sms(body))).toEqual({ ok: false, reason });
  });
});

describe('payeeKind', () => {
  it.each([
    ['Sent Rs.100.00 From HDFC Bank A/C *1234 To UDIT SINGH On 12/10/24 Ref 428812345678', 'person'],
    ['Rs 100.00 debited from A/c XX1234 on 12-10-24 to VPA 9876543210@ybl (UPI Ref No 428812345678).', 'person'],
    ['Debit INR 100.00 A/c no. XX1234 12-10-24 10:20:30 UPI/P2A/428812345678/RAVI KUMAR SMS BLOCK', 'person'],
    ['Debit INR 350.00 A/c no. XX1234 12-10-24 10:20:30 UPI/P2M/428812345678/BIGBASKET SMS BLOCK', 'merchant'],
    ['Sent Rs.500.00 From HDFC Bank A/C *1234 To SWIGGY On 12/10/24 Ref 428812345678', 'merchant'],
    ['Spent Rs.899 On HDFC Bank Card 1234 At LOCAL SHOP On 2024-10-12:10:20:30.', 'merchant'],
    ['Rs 100.00 debited from A/c XX1234 on 12-10-24 to VPA abc@ybl (UPI Ref No 428812345678).', 'unknown'],
  ] as const)('%s -> %s', (body, kind) => {
    expect(ok(body).payeeKind).toBe(kind);
  });
});

describe('extractors', () => {
  it('skips balance amounts when picking the transaction amount', () => {
    expect(extractAmount('Avl Bal Rs 9,999.00. Rs 45.50 debited')).toBe(45.5);
  });

  it('normalises payee keys', () => {
    expect(toPayeeKey('Zomato Pvt. Ltd.')).toBe('zomato');
    expect(toPayeeKey('Friend@OKAXIS')).toBe('friend@okaxis');
    expect(toPayeeKey(null)).toBeNull();
  });

  it('falls back to the SMS time when no date is in the body', () => {
    expect(extractOccurredAt('no date here', SMS_DATE)).toBe(new Date(SMS_DATE).toISOString());
  });
});
