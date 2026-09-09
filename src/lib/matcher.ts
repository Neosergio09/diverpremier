/**
 * Normaliza cadenas de texto para emparejamiento semántico de productos y archivos.
 */
export function normalizeTokens(text: string): Set<string> {
  let cleaned = text.toLowerCase();
  
  // Reemplazar acentos y diacríticos
  const replacements: [string, string][] = [
    ['á', 'a'], ['é', 'e'], ['í', 'i'], ['ó', 'o'], ['ú', 'u'], ['ñ', 'n']
  ];
  for (const [from, to] of replacements) {
    cleaned = cleaned.replaceAll(from, to);
  }

  // Separar números y unidades (ej. 750ml -> 750 ml)
  cleaned = cleaned.replace(/(\d+)(ml|g|l|lt|oz)\b/g, '$1 $2');

  // Extraer palabras/números alfanuméricos
  const matches = cleaned.match(/[a-z0-9]+/g) || [];
  
  // Palabras comunes sin valor discriminatorio
  const stopwords = new Set([
    'de', 'del', 'la', 'el', 'en', 'con', 'y', 'x',
    'aguardiente', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'
  ]);

  return new Set(matches.filter(t => !stopwords.has(t)));
}

export interface MatchResult {
  file: string;
  productId: string;
  productName: string;
  score: number;
}

/**
 * Encuentra el producto que mejor coincide con el nombre de un archivo de imagen.
 */
export function findBestProductMatch(
  filename: string,
  products: { id: string; name: string }[]
): MatchResult | null {
  const fileTokens = normalizeTokens(filename);
  if (fileTokens.size === 0) return null;

  let bestMatch: MatchResult | null = null;
  let bestScore = -1;

  for (const product of products) {
    const prodTokens = normalizeTokens(product.name);
    if (prodTokens.size === 0) continue;

    let overlap = 0;
    for (const token of fileTokens) {
      if (prodTokens.has(token)) overlap++;
    }

    if (overlap === 0) continue;

    // Coeficiente de Dice para balancear longitud
    const score = (2.0 * overlap) / (fileTokens.size + prodTokens.size);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        file: filename,
        productId: product.id,
        productName: product.name,
        score,
      };
    }
  }

  // Umbral de confianza mínimo (0.5 o 50% de coincidencia)
  if (bestMatch && bestScore >= 0.5) {
    return bestMatch;
  }

  return null;
}
