export const API_URL = 'https://fortnite-api.com/v2/cosmetics/br/search?name=Blackheart&language=pt-BR';
// A API fornece o cosmético exibido na tela. O sorteio é separado e local.
export async function fetchPirate() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(API_URL, { signal: controller.signal });
    if (!response.ok) throw new Error('A API não respondeu.');
    const { data } = await response.json();
    if (!data?.name || !data?.images?.icon) throw new Error('Dados inválidos.');
    return { name: data.name, description: data.description, image: data.images.icon };
  } finally { clearTimeout(timeout); }
}
