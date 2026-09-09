import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

// Leer credenciales de variables de entorno o archivo .env local
function getEnvVar(key) {
  if (process.env[key]) return process.env[key];
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, ...v] = trimmed.split("=");
      if (k.trim() === key) {
        return v.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
  return null;
}

const SUPABASE_URL = getEnvVar("PUBLIC_SUPABASE_URL");
const SERVICE_KEY = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");
const BUCKET = "diverpremier-assets";
const IMAGES_DIR = path.resolve(process.cwd(), "imagenes");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Error: No se encontraron las credenciales de Supabase en .env ni en variables de entorno.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function normalizeTokens(text) {
  let cleaned = text.toLowerCase();
  const replacements = [
    ['á', 'a'], ['é', 'e'], ['í', 'i'], ['ó', 'o'], ['ú', 'u'], ['ñ', 'n']
  ];
  for (const [from, to] of replacements) {
    cleaned = cleaned.replaceAll(from, to);
  }
  cleaned = cleaned.replace(/(\d+)(ml|g|l|lt|oz)\b/g, '$1 $2');
  const matches = cleaned.match(/[a-z0-9]+/g) || [];
  const stopwords = new Set([
    'de', 'del', 'la', 'el', 'en', 'con', 'y', 'x',
    'aguardiente', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'
  ]);
  return new Set(matches.filter(t => !stopwords.has(t)));
}

function findBestProductMatch(filename, products) {
  const fileTokens = normalizeTokens(filename);
  if (fileTokens.size === 0) return null;

  let bestMatch = null;
  let bestScore = -1;

  for (const product of products) {
    const prodTokens = normalizeTokens(product.name);
    if (prodTokens.size === 0) continue;

    let overlap = 0;
    for (const token of fileTokens) {
      if (prodTokens.has(token)) overlap++;
    }
    if (overlap === 0) continue;

    const score = (2.0 * overlap) / (fileTokens.size + prodTokens.size);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { file: filename, productId: product.id, productName: product.name, score };
    }
  }

  if (bestMatch && bestScore >= 0.5) return bestMatch;
  return null;
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function main() {
  console.log('🚀 Iniciando escaneo y sincronización automática de imágenes...');
  
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Directorio no encontrado: ${IMAGES_DIR}`);
    return;
  }

  const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(f));
  if (files.length === 0) {
    console.log(`ℹ️ No hay imágenes para procesar en ${IMAGES_DIR}`);
    return;
  }

  console.log(`📦 Encontradas ${files.length} imágenes en carpeta local.`);

  const { data: products, error } = await supabase.from('products').select('id, name');
  if (error || !products) {
    console.error('❌ Error consultando Supabase:', error);
    return;
  }

  console.log(`🎯 Comparando contra ${products.length} productos en la base de datos...`);

  let matchedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const match = findBestProductMatch(file, products);
    if (!match) {
      console.log(`⚠️ Sin coincidencia para: "${file}"`);
      skippedCount++;
      continue;
    }

    const filePath = path.join(IMAGES_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);

    // 1. Optimizar y forzar a .webp con Sharp
    const webpBuffer = await sharp(fileBuffer)
      .rotate()
      .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const destName = `${sanitizeFilename(match.productName)}.webp`;
    const storagePath = `products/${destName}`;

    // 2. Subir a Supabase Storage
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, webpBuffer, { contentType: 'image/webp', upsert: true });

    if (upErr) {
      console.error(`❌ Error al subir ${destName}:`, upErr.message);
      continue;
    }

    // 3. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // 4. Actualizar base de datos
    await supabase.from('products').update({ image_url: publicUrl }).eq('id', match.productId);

    console.log(`✅ [${match.score * 100 | 0}%] ${file} ➔ "${match.productName}"`);
    matchedCount++;
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log(`🎉 Sincronización finalizada:`);
  console.log(`   - Vinculados y convertidos a WebP: ${matchedCount}`);
  console.log(`   - Omitidos sin coincidencia: ${skippedCount}`);
  console.log('────────────────────────────────────────────────────────');
}

main().catch(console.error);
