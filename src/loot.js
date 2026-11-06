// Regras locais da simulação. Cada abertura faz um novo sorteio independente.
export const weapons = [
  { id: 'rifle', name: 'Rifle de assalto', rarity: 'Raro', emoji: '🎯' },
  { id: 'shotgun', name: 'Espingarda', rarity: 'Épico', emoji: '💥' },
  { id: 'smg', name: 'Submetralhadora', rarity: 'Raro', emoji: '⚡' },
  { id: 'sniper', name: 'Rifle de precisão', rarity: 'Lendário', emoji: '🔭' },
];
export const bonuses = [
  { id: 'accelerator', name: 'Acelerador de extração', rarity: 'Comum', emoji: '🔋' },
  { id: 'extractor', name: 'Extrator portátil', rarity: 'Comum', emoji: '🧰' },
  { id: 'fireworks', name: 'Fogos de artifício dourados', rarity: 'Comum', emoji: '🎆' },
  { id: 'sprite', name: 'Localizador de sprites', rarity: 'Comum', emoji: '🧭' },
  { id: 'luck', name: 'Localizador da sorte', rarity: 'Comum', emoji: '💎' },
  { id: 'ship', name: 'Navio dourado', rarity: 'Raro', emoji: '⛵' },
  { id: 'map', name: 'Mapa do tesouro', rarity: 'Raro', emoji: '🗺️' },
  { id: 'gold', name: 'Traje dourado', rarity: 'Supremo', emoji: '👑' },
];
export const token = { id: 'pirate-token', name: 'Token pirata', rarity: 'Supremo', emoji: '🪙' };
export function openChest(random = Math.random) {
  const drops = [weapons[Math.floor(random() * weapons.length)]];
  // Um único número vencedor entre 100.000 resultados possíveis (0 até 99.999).
  if (Math.floor(random() * 100000) === 0) drops.push(token);
  if (random() < 0.35) drops.push(bonuses[Math.floor(random() * bonuses.length)]);
  return drops;
}
export const emptyProgress = { opened: 0, items: {} };
export function collect(progress, drops) {
  const items = { ...progress.items };
  for (const item of drops) items[item.id] = (items[item.id] || 0) + 1;
  return { opened: progress.opened + 1, items };
}
