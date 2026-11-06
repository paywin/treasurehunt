import test from 'node:test';
import assert from 'node:assert/strict';
import { openChest, collect, emptyProgress, weapons, token } from '../src/loot.js';
import { fetchPirate } from '../src/api.js';
const sequence = (...values) => () => values.shift();

test('sempre entrega exatamente uma arma, inclusive com token e bônus', () => {
  for (const roll of [0, 0.25, 0.5, 0.999999]) {
    const result = openChest(sequence(roll, 0, 0, 0));
    assert.equal(result.filter(item => weapons.some(w => w.id === item.id)).length, 1);
    assert.equal(result.length, 3);
  }
});
test('há exatamente um resultado vencedor nos 100.000 intervalos do token', () => {
  let winners = 0;
  for (let i = 0; i < 100000; i++) {
    const result = openChest(sequence(0, (i + 0.5) / 100000, 0.9));
    if (result.some(item => item.id === token.id)) winners++;
  }
  assert.equal(winners, 1);
});
test('limites da chance do token e do bônus', () => {
  assert.equal(openChest(sequence(0, 0.00000999, 0.35)).length, 2);
  assert.equal(openChest(sequence(0, 0.00001, 0.35)).length, 1);
  assert.equal(openChest(sequence(0, 0.5, 0.34999, 0.99999)).length, 2);
});
test('coleção acumula repetidos sem alterar o estado anterior', () => {
  const first = collect(emptyProgress, [weapons[0], token]);
  const second = collect(first, [weapons[0]]);
  assert.equal(second.opened, 2);
  assert.equal(second.items.rifle, 2);
  assert.equal(second.items[token.id], 1);
  assert.equal(first.items.rifle, 1);
  assert.deepEqual(emptyProgress.items, {});
});
test('API normaliza os dados e rejeita respostas inválidas', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: { name: 'Pirata', description: 'Teste', images: { icon: 'https://example.com/image.png' } } }) });
    assert.equal((await fetchPirate()).name, 'Pirata');
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(fetchPirate);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: {} }) });
    await assert.rejects(fetchPirate);
    globalThis.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(fetchPirate);
  } finally { globalThis.fetch = original; }
});
