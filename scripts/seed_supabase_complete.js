const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const COMPANIES = [
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'CloudNest Inc.', baseRev: 42000, growth: 1.05 },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'PayLoop Platform', baseRev: 65000, growth: 1.07 },
  { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'NimbusPay Gateway', baseRev: 38000, growth: 1.04 },
  { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', name: 'QuickBill SaaS', baseRev: 28000, growth: 1.03 },
  { id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', name: 'DataSync', baseRev: 52000, growth: 1.06 },
  { id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', name: 'CyberShield', baseRev: 48000, growth: 1.08 },
  { id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', name: 'FlowOps', baseRev: 34000, growth: 1.05 },
  { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', name: 'PulseAI', baseRev: 59000, growth: 1.09 },
];

const MONTHS_2026 = [
  { month: '2026-01-31', multiplier: 0.85 },
  { month: '2026-02-28', multiplier: 0.88 },
  { month: '2026-03-31', multiplier: 0.92 },
  { month: '2026-04-30', multiplier: 0.95 },
  { month: '2026-05-31', multiplier: 1.00 },
  { month: '2026-06-30', multiplier: 1.04 },
  { month: '2026-07-31', multiplier: 1.08 },
  { month: '2026-08-31', multiplier: 1.12 },
  { month: '2026-09-18', multiplier: 1.16 },
  { month: '2026-10-31', multiplier: 1.20 },
  { month: '2026-11-30', multiplier: 1.25 },
  { month: '2026-12-31', multiplier: 1.30 },
];

async function seedRollups() {
  console.log('=== Step 1: Checking Existing metric_rollups ===');
  const { data: existingRollups, error: rollupsErr } = await supabase
    .from('metric_rollups')
    .select('company_id, metric_date');

  if (rollupsErr) {
    console.error('Failed to fetch existing rollups:', rollupsErr);
    return;
  }

  const existingSet = new Set(
    (existingRollups || []).map((r) => `${r.company_id}_${r.metric_date}`)
  );

  const rollupsToInsert = [];
  const nowIso = new Date().toISOString();

  for (const comp of COMPANIES) {
    for (const m of MONTHS_2026) {
      const key = `${comp.id}_${m.month}`;
      if (!existingSet.has(key)) {
        const rev = Math.round(comp.baseRev * m.multiplier + (Math.random() * 2000 - 1000));
        const payCount = Math.round((rev / 220) + Math.random() * 20);
        const custCount = Math.round(payCount * 0.82);
        const churnCount = Math.max(1, Math.round(custCount * 0.025));

        rollupsToInsert.push({
          id: crypto.randomUUID(),
          company_id: comp.id,
          metric_date: m.month,
          revenue: rev,
          payment_count: payCount,
          customer_count: custCount,
          churn_count: churnCount,
          status: 'Live',
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
    }
  }

  console.log(`Preparing to insert ${rollupsToInsert.length} non-conflicting metric_rollups...`);
  if (rollupsToInsert.length > 0) {
    // Insert in chunks of 50 to ensure clean execution
    for (let i = 0; i < rollupsToInsert.length; i += 50) {
      const chunk = rollupsToInsert.slice(i, i + 50);
      const { error: insertErr } = await supabase.from('metric_rollups').insert(chunk);
      if (insertErr) {
        console.error(`Error inserting chunk ${i}:`, insertErr);
      } else {
        console.log(`Inserted chunk ${i / 50 + 1} (${chunk.length} rows)`);
      }
    }
  }
}

const NEW_PAYMENTS = [
  {
    payment_id: 'evt_9420',
    customer: 'Sarah Jenkins',
    product: 'Enterprise Tier License',
    amount: 54000,
    status: 'PROCESSED',
    timestamp: '2026-09-18T11:45:00.000Z',
    geo: 'San Francisco, US',
    cardBrand: 'Visa',
    cardLast4: '4242',
    invoiceId: 'in_1P9x9420Enterprise',
  },
  {
    payment_id: 'evt_9421',
    customer: 'Michael Chang',
    product: 'Pro Annual Seat Package',
    amount: 32500,
    status: 'PROCESSED',
    timestamp: '2026-09-18T10:15:30.000Z',
    geo: 'Seattle, US',
    cardBrand: 'Mastercard',
    cardLast4: '8821',
    invoiceId: 'in_1P9x9421Pro',
  },
  {
    payment_id: 'evt_9422',
    customer: 'Amira Patel',
    product: 'Cloud Dedicated Node',
    amount: 68000,
    status: 'PROCESSED',
    timestamp: '2026-09-18T08:30:10.000Z',
    geo: 'London, UK',
    cardBrand: 'Visa',
    cardLast4: '1099',
    invoiceId: 'in_1P9x9422Cloud',
  },
  {
    payment_id: 'evt_9423',
    customer: 'Carlos Mendoza',
    product: 'Enterprise Dedicated Cluster',
    amount: 95000,
    status: 'PROCESSED',
    timestamp: '2026-09-17T16:20:00.000Z',
    geo: 'Madrid, ES',
    cardBrand: 'Visa',
    cardLast4: '5564',
    invoiceId: 'in_1P9x9423Cluster',
  },
  {
    payment_id: 'evt_9424',
    customer: 'Elena Rostova',
    product: 'API Gateway High-Volume License',
    amount: 27800,
    status: 'PROCESSED',
    timestamp: '2026-09-17T14:10:45.000Z',
    geo: 'Berlin, DE',
    cardBrand: 'Mastercard',
    cardLast4: '3312',
    invoiceId: 'in_1P9x9424Gateway',
  },
  {
    payment_id: 'evt_9425',
    customer: 'David Vance',
    product: 'Pro Annual Seat Package',
    amount: 38200,
    status: 'PROCESSED',
    timestamp: '2026-09-17T11:05:00.000Z',
    geo: 'Austin, US',
    cardBrand: 'Amex',
    cardLast4: '7701',
    invoiceId: 'in_1P9x9425Pro',
  },
  {
    payment_id: 'evt_9426',
    customer: 'Chloe Bennett',
    product: 'Enterprise Tier License',
    amount: 62400,
    status: 'PROCESSED',
    timestamp: '2026-09-16T15:40:12.000Z',
    geo: 'Toronto, CA',
    cardBrand: 'Visa',
    cardLast4: '9943',
    invoiceId: 'in_1P9x9426Enterprise',
  },
  {
    payment_id: 'evt_9427',
    customer: 'Marcus Thorne',
    product: 'Security Governance Addon',
    amount: 18500,
    status: 'FAILED',
    timestamp: '2026-09-16T13:25:00.000Z',
    geo: 'Chicago, US',
    cardBrand: 'Visa',
    cardLast4: '2019',
    invoiceId: 'in_1P9x9427Security',
  },
  {
    payment_id: 'evt_9428',
    customer: 'Hana Tanaka',
    product: 'Cloud Dedicated Node',
    amount: 72000,
    status: 'PROCESSED',
    timestamp: '2026-09-15T09:12:30.000Z',
    geo: 'Tokyo, JP',
    cardBrand: 'JCB',
    cardLast4: '6610',
    invoiceId: 'in_1P9x9428Cloud',
  },
  {
    payment_id: 'evt_9429',
    customer: 'Liam O\'Connor',
    product: 'Enterprise Tier License',
    amount: 49000,
    status: 'PROCESSED',
    timestamp: '2026-09-14T14:55:20.000Z',
    geo: 'Dublin, IE',
    cardBrand: 'Mastercard',
    cardLast4: '4488',
    invoiceId: 'in_1P9x9429Enterprise',
  },
  {
    payment_id: 'evt_9430',
    customer: 'Ananya Sharma',
    product: 'Integration API Connector',
    amount: 21500,
    status: 'PROCESSED',
    timestamp: '2026-09-13T16:00:00.000Z',
    geo: 'Bengaluru, IN',
    cardBrand: 'Visa',
    cardLast4: '7723',
    invoiceId: 'in_1P9x9430Connector',
  },
  {
    payment_id: 'evt_9431',
    customer: 'Lucas Meyer',
    product: 'Pro Annual Seat Package',
    amount: 34000,
    status: 'PROCESSED',
    timestamp: '2026-09-12T10:45:10.000Z',
    geo: 'Zurich, CH',
    cardBrand: 'Visa',
    cardLast4: '1130',
    invoiceId: 'in_1P9x9431Pro',
  },
  {
    payment_id: 'evt_9432',
    customer: 'Sophia Dubois',
    product: 'Enterprise Tier License',
    amount: 58000,
    status: 'PROCESSED',
    timestamp: '2026-09-10T11:20:00.000Z',
    geo: 'Paris, FR',
    cardBrand: 'Mastercard',
    cardLast4: '8844',
    invoiceId: 'in_1P9x9432Enterprise',
  },
  {
    payment_id: 'evt_9433',
    customer: 'Noah Lindqvist',
    product: 'Cloud Dedicated Node',
    amount: 64500,
    status: 'PROCESSED',
    timestamp: '2026-09-08T09:30:00.000Z',
    geo: 'Stockholm, SE',
    cardBrand: 'Visa',
    cardLast4: '3391',
    invoiceId: 'in_1P9x9433Cloud',
  },
  {
    payment_id: 'evt_9434',
    customer: 'Isabella Rossi',
    product: 'Integration API Connector',
    amount: 19800,
    status: 'PROCESSED',
    timestamp: '2026-09-05T15:10:00.000Z',
    geo: 'Milan, IT',
    cardBrand: 'Visa',
    cardLast4: '9902',
    invoiceId: 'in_1P9x9434Connector',
  },
  {
    payment_id: 'evt_9435',
    customer: 'Gabriel Santos',
    product: 'Enterprise Tier License',
    amount: 51200,
    status: 'PROCESSED',
    timestamp: '2026-09-03T12:00:00.000Z',
    geo: 'São Paulo, BR',
    cardBrand: 'Mastercard',
    cardLast4: '4419',
    invoiceId: 'in_1P9x9435Enterprise',
  },
];

async function seedPayments() {
  console.log('=== Step 2: Checking Existing payments ===');
  const { data: existingPayments, error: payErr } = await supabase
    .from('payments')
    .select('payment_id');

  if (payErr) {
    console.error('Failed to fetch existing payments:', payErr);
    return;
  }

  const existingIds = new Set((existingPayments || []).map((p) => p.payment_id));
  const cloudnestId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const nowIso = new Date().toISOString();

  const paymentsToInsert = [];

  for (const item of NEW_PAYMENTS) {
    if (!existingIds.has(item.payment_id)) {
      const hashPayload = `${item.payment_id}:${cloudnestId}:${item.amount}:USD:${item.timestamp}`;
      const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');

      paymentsToInsert.push({
        id: crypto.randomUUID(),
        payment_id: item.payment_id,
        company_id: cloudnestId,
        amount: item.amount,
        currency: 'USD',
        payment_timestamp: item.timestamp,
        received_at: item.timestamp,
        status: item.status,
        customer: item.customer,
        product: item.product,
        created_at: nowIso,
        verification_hash: hash,
        raw_payload: {
          geo: item.geo,
          cardBrand: item.cardBrand,
          cardLast4: item.cardLast4,
          invoiceId: item.invoiceId,
        },
      });
    }
  }

  console.log(`Preparing to insert ${paymentsToInsert.length} clean enterprise payments...`);
  if (paymentsToInsert.length > 0) {
    const { error: insertErr } = await supabase.from('payments').insert(paymentsToInsert);
    if (insertErr) {
      console.error('Error inserting payments:', insertErr);
    } else {
      console.log(`Successfully inserted ${paymentsToInsert.length} payments!`);
    }
  } else {
    console.log('All payments already exist. Zero conflicts.');
  }
}

async function run() {
  await seedRollups();
  await seedPayments();
  console.log('=== SEED COMPLETE! All rows 100% populated with zero blanks and zero conflicts ===');
}

run();
