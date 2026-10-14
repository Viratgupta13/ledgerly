import type { RawSms } from '../parser';

/** Hints used when seeding already-confirmed history (what a user would have chosen). */
export type SeedHint = { category?: string; note?: string };
export type DemoSms = RawSms & { daysAgo: number; seed?: SeedHint };

/** Messages older than this are pre-confirmed history; newer ones wait to be scanned. */
export const SCAN_CUTOFF_DAYS = 8;

const DAY = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let counter = 0;
const nextRef = () => String(428800000000 + ++counter * 7919);

type Parts = { dd: string; mm: string; yy: string; yyyy: string; mon: string; hh: string; mi: string };

/** Fake (but realistic) bank and UPI SMS, built from a template per bank format. */
const formats = {
  upi: (p: Parts, to: string, amt: number) =>
    `Sent Rs.${amt}.00 From HDFC Bank A/C *4092 To ${to} On ${p.dd}/${p.mm}/${p.yy} Ref ${nextRef()} Not You? Call 18002586161`,
  vpa: (p: Parts, vpa: string, amt: number) =>
    `Rs ${amt}.00 debited from A/c XX4092 on ${p.dd}-${p.mon}-${p.yy} to VPA ${vpa} (UPI Ref No ${nextRef()}).`,
  card: (p: Parts, at: string, amt: number) =>
    `Spent Rs.${amt} On HDFC Bank Card 4092 At ${at} On ${p.yyyy}-${p.mm}-${p.dd}:${p.hh}:${p.mi}:00. Avl Lmt Rs 50000`,
  credit: (p: Parts, from: string, amt: number) =>
    `Rs ${amt.toLocaleString('en-IN')}.00 credited to your a/c XX4092 on ${p.dd}-${p.mm}-${p.yy} by NEFT from ${from}. UTR ${nextRef()}`,
  upiIn: (p: Parts, vpa: string, amt: number) =>
    `Rs.${amt}.00 credited to a/c XX4092 on ${p.dd}-${p.mm}-${p.yy} by UPI from VPA ${vpa} (UPI Ref No ${nextRef()})`,
};

function make(now: number, daysAgo: number, hour: number, minute: number, body: (p: Parts) => string, seed?: SeedHint): DemoSms {
  const d = new Date(now - daysAgo * DAY);
  d.setHours(hour, minute, 0, 0);
  const p: Parts = {
    dd: pad(d.getDate()),
    mm: pad(d.getMonth() + 1),
    yy: String(d.getFullYear()).slice(2),
    yyyy: String(d.getFullYear()),
    mon: MON[d.getMonth()],
    hh: pad(hour),
    mi: pad(minute),
  };
  return { body: body(p), address: 'VM-HDFCBK', date: d.getTime(), daysAgo, seed };
}

/** The fake inbox: history to seed, payments waiting to be scanned, and noise the parser must skip. */
export function buildDemoSms(now = Date.now()): DemoSms[] {
  counter = 0;
  const m = (d: number, h: number, mi: number, f: (p: Parts) => string, seed?: SeedHint) => make(now, d, h, mi, f, seed);
  return [
    // --- older history (seeded as confirmed) ---
    m(48, 20, 15, (p) => formats.upi(p, 'SWIGGY', 520)),
    m(46, 9, 5, (p) => formats.vpa(p, 'uber@axisbank', 230)),
    m(45, 14, 30, (p) => formats.card(p, 'AMAZON', 1899)),
    m(44, 10, 0, (p) => formats.credit(p, 'ACME CORP', 52000)),
    m(44, 11, 20, (p) => formats.upi(p, 'RAMESH KUMAR', 15000), { category: 'Rent', note: 'Flat rent' }),
    m(40, 21, 10, (p) => formats.upi(p, 'ZOMATO', 690)),
    m(36, 18, 45, (p) => formats.upi(p, 'BLINKIT', 410)),
    m(30, 11, 20, (p) => formats.vpa(p, 'jio@paytm', 299)),
    m(27, 8, 40, (p) => formats.upi(p, 'RINKU SINGH', 80), { category: 'Transport', note: 'Rapido ride' }),
    m(26, 9, 10, (p) => formats.vpa(p, 'uber@axisbank', 215)),
    m(25, 20, 10, (p) => formats.upi(p, 'SWIGGY', 349)),
    m(24, 21, 30, (p) => formats.upi(p, 'ZOMATO', 612)),
    m(23, 8, 40, (p) => formats.upi(p, 'AMAN VERMA', 60), { category: 'Transport', note: 'Rapido ride' }),
    m(22, 18, 40, (p) => formats.upi(p, 'BLINKIT', 420)),
    m(22, 19, 0, (p) => formats.upi(p, 'GUPTA KIRANA STORE', 320), { category: 'Essential' }),
    m(21, 16, 10, (p) => formats.card(p, 'AMAZON', 1499)),
    m(20, 0, 30, (p) => formats.card(p, 'NETFLIX', 499)),
    m(19, 19, 5, (p) => formats.upi(p, 'BLINKIT', 631)),
    m(18, 20, 0, (p) => formats.card(p, 'MYNTRA', 2140)),
    m(17, 13, 20, (p) => formats.upi(p, 'ZOMATO', 480)),
    m(16, 18, 55, (p) => formats.upi(p, 'UDIT KUMAR', 120), { category: 'Transport', note: 'Rapido ride' }),
    m(15, 21, 0, (p) => formats.upi(p, 'SWIGGY', 540)),
    m(15, 10, 15, (p) => formats.upi(p, 'BESCOM ELECTRICITY', 1860)),
    m(14, 19, 30, (p) => formats.vpa(p, 'ola@icici', 189)),
    m(14, 10, 0, (p) => formats.credit(p, 'ACME CORP', 52000)),
    m(14, 11, 20, (p) => formats.upi(p, 'RAMESH KUMAR', 15000), { category: 'Rent', note: 'Flat rent' }),
    m(13, 14, 20, (p) => formats.vpa(p, 'flipkart@axisbank', 899)),
    m(13, 22, 0, (p) => formats.upi(p, 'ANANYA SHARMA', 850), { category: 'Friends', note: 'Dinner split' }),
    m(12, 20, 45, (p) => formats.upi(p, 'DOMINOS', 799)),
    m(12, 17, 30, (p) => formats.upi(p, 'MEDPLUS PHARMACY', 410), { category: 'Essential' }),
    m(11, 8, 50, (p) => formats.upi(p, 'SURESH YADAV', 70), { category: 'Transport', note: 'Auto ride' }),
    m(10, 18, 30, (p) => formats.upi(p, 'BLINKIT', 349)),
    m(9, 22, 10, (p) => formats.upi(p, 'ZOMATO', 655)),
    m(9, 10, 0, (p) => formats.vpa(p, 'uber@axisbank', 240)),
    m(8, 15, 0, (p) => formats.card(p, 'DECATHLON', 1251), { category: 'Shopping' }),

    // --- recent payments (waiting to be scanned) ---
    m(7, 11, 5, (p) => formats.vpa(p, 'jio@paytm', 299)),
    m(6, 19, 10, (p) => formats.upi(p, 'BLINKIT', 349)),
    m(5, 16, 40, (p) => formats.card(p, 'AMAZON', 1299)),
    m(4, 18, 20, (p) => formats.upi(p, 'BLINKIT', 280)),
    m(3, 21, 15, (p) => formats.upi(p, 'ZOMATO', 613)),
    m(3, 13, 0, (p) => formats.upiIn(p, 'rahul.mehta@okaxis', 1200)),
    m(2, 20, 5, (p) => formats.upi(p, 'SWIGGY', 458)),
    m(2, 8, 45, (p) => formats.upi(p, 'MAHESH PATEL', 90)),
    m(1, 14, 10, (p) => formats.upi(p, 'SWIGGY INSTAMART', 240)),
    m(1, 9, 20, (p) => formats.vpa(p, 'uber@axisbank', 215)),
    m(1, 17, 25, (p) => formats.vpa(p, '9876543210@ybl', 40)),

    // --- noise the parser must ignore ---
    m(5, 10, 0, () => '482913 is your OTP for login to HDFC Bank NetBanking. Do not share it with anyone.'),
    m(3, 12, 0, () => 'Congratulations! You are pre-approved for a personal loan up to Rs 5,00,000. Apply now: http://bit.ly/xyz'),
    m(2, 15, 0, () => 'Recharge now with Rs 299 for 28 days validity and unlimited calls. Jio'),
    m(1, 11, 0, () => 'Your UPI transaction of Rs 500.00 to SWIGGY has failed. Amount will be refunded to a/c XX4092 if debited.'),
  ];
}
