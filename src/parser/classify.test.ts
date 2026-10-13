import { classifySms, isTransactionSms } from './classify';

const genuine = [
  'Sent Rs.500.00 From HDFC Bank A/C *1234 To SWIGGY On 12/10/24 Ref 428812345678 Not You? Call 18002586161',
  'Rs 1,250.00 debited from A/c XX1234 on 12-Oct-24 to VPA abc@ybl (UPI Ref No 428812345678).',
  'Dear UPI user A/C X1234 debited by 500.0 on date 12Oct24 trf to RAMESH KUMAR Refno 428812345678',
  'Rs.15000 credited to your a/c XX1234 on 12-10-24 by NEFT. UTR 123456789012',
  'Spent Rs.899 On HDFC Bank Card 1234 At AMAZON On 2024-10-12:10:20:30. Avl Lmt Rs 50000',
  'Your UPI refund of INR 250.00 has been credited to a/c XX1234. UPI Ref 428812345678',
];

const rejected: [string, string][] = [
  ['otp', '123456 is your OTP for login to HDFC Bank NetBanking. Do not share it with anyone.'],
  ['otp', 'OTP for txn of Rs 500.00 at AMAZON on card XX1234 is 482913. Valid for 10 mins.'],
  ['otp', 'Use verification code 4829 to confirm your payment of Rs 100.'],
  ['promo', 'Congratulations! You are pre-approved for a personal loan up to Rs 5,00,000. Apply now: http://bit.ly/xyz'],
  ['promo', 'Get flat 20% cashback up to Rs 100 on your next order. Use code SAVE20. T&C apply.'],
  ['recharge', 'Recharge now with Rs 299 for 28 days validity and unlimited calls. Jio'],
  ['recharge', 'Your prepaid plan expires tomorrow. Recharge with Rs 239 to continue enjoying data pack benefits.'],
  ['failed', 'Your UPI transaction of Rs 500.00 to SWIGGY has failed. Amount will be refunded to a/c XX1234 if debited.'],
  ['failed', 'Transaction of Rs 899 on card XX1234 declined due to insufficient funds.'],
  ['request', 'RAMESH has requested Rs 500.00 from you on UPI. Approve in your UPI app.'],
  ['reminder', 'Your HDFC Credit Card bill of Rs 12,345 is due on 20-Oct-24. Minimum amount due Rs 617.'],
  ['reminder', 'Rs 499 will be debited from your a/c XX1234 on 15-Oct-24 for Netflix mandate.'],
  ['not-transaction', 'Hi, your order #4521 has been shipped and will arrive by Friday.'],
  ['not-transaction', 'Your a/c XX1234 balance is Rs 12,000.00 as of 12-Oct-24.'],
];

describe('classifySms', () => {
  it.each(genuine)('accepts genuine transaction: %s', (body) => {
    expect(isTransactionSms(body)).toBe(true);
  });

  it.each(rejected)('rejects as %s: %s', (reason, body) => {
    expect(classifySms(body)).toEqual({ genuine: false, reason });
  });

  it('keeps a real debit even when the bank adds a "never share OTP" footer', () => {
    const body = 'Rs 750.00 debited from A/c XX1234 via UPI Ref 428812345678. Never share OTP/PIN with anyone.';
    expect(isTransactionSms(body)).toBe(true);
  });

  it('keeps a real UPI debit made to a recharge payee', () => {
    const body = 'Rs 299.00 debited from A/c XX1234 on 12-10-24 via UPI to AIRTEL RECHARGE Ref 428812345678';
    expect(isTransactionSms(body)).toBe(true);
  });
});
