const BASE = process.env.BASE_URL || 'http://localhost:3000';
const PARALLEL = Number(process.env.PARALLEL) || 20;

const call = async (path, method, body, token) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

(async () => {
  const email = `race-${Date.now()}@example.com`;
  await call('/auth/register', 'POST', { name: 'Race Tester', email, password: 'password123' });
  const login = await call('/auth/login', 'POST', { email, password: 'password123' });
  const token = login.body.data.token;

  const created = await call('/items', 'POST', { name: 'Barang X', description: '', stock: 1, price: 1000 }, token);
  const id = created.body.data.id;

  const results = await Promise.all(
    Array.from({ length: PARALLEL }, () => call(`/items/${id}/decrease-stock`, 'PATCH', { quantity: 1 }, token))
  );

  const ok = results.filter((r) => r.status === 200).length;
  const conflict = results.filter((r) => r.status === 409).length;
  const final = await call(`/items/${id}`, 'GET', null, token);

  console.log(`Request paralel : ${PARALLEL}`);
  console.log(`Sukses (200)    : ${ok}`);
  console.log(`Ditolak (409)   : ${conflict}`);
  console.log(`Stok akhir      : ${final.body.data.stock}`);
  process.exit(ok === 1 && final.body.data.stock === 0 ? 0 : 1);
})();
