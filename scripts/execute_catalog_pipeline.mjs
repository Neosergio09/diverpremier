import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

// 1. Cargar variables de entorno
function getEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...v] = trimmed.split('=');
      env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = getEnv();
const SUPABASE_URL = env.PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'diverpremier-assets';
const IMAGES_DIR = path.resolve(process.cwd(), 'imagenes');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Error: Credenciales de Supabase no encontradas.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const slugify = (text) =>
  text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const norm = (text) =>
  text.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

// Iconos temáticos de Lucide para cada categoría
const CATEGORY_ICONS = {
  'aguardiente': null,
  'ron': 'Flame',
  'tequila': 'Sun',
  'bacardi': 'PartyPopper',
  'smirnoff': 'Snowflake',
  'convier': 'Martini',
  'coloma': 'Coffee',
  'vodka': 'Snowflake',
  'ginebra': 'Citrus',
  'whisky': 'Wine',
  'cervezas': 'Beer',
  'snacks': 'UtensilsCrossed'
};

async function downloadBuffer(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
  };
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} al descargar ${url}`);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function main() {
  console.log('🚀 Iniciando Pipeline Masivo de Catálogo e Imágenes para Diverpremier...');

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  // A. Sincronizar Categorías en Base de Datos
  console.log('\n📂 Verificando y sincronizando categorías en Supabase...');
  const { data: existingCategories, error: errCat } = await supabase.from('categories').select('*');
  if (errCat) {
    console.error('❌ Error al consultar categorías:', errCat);
    process.exit(1);
  }

  const categoryMap = {};
  existingCategories.forEach((c) => {
    categoryMap[c.name.toLowerCase().trim()] = c.id;
  });

  const requiredCategories = [
    'Aguardiente', 'Ron', 'Tequila', 'Bacardi', 'Smirnoff',
    'Convier', 'Coloma', 'Vodka', 'Ginebra', 'Whisky'
  ];

  for (const catName of requiredCategories) {
    const key = catName.toLowerCase().trim();
    if (!categoryMap[key]) {
      const slug = slugify(catName);
      const icon = CATEGORY_ICONS[slug] || 'Wine';
      console.log(`➕ Creando nueva categoría: "${catName}" (slug: ${slug}, icon: ${icon})...`);
      const { data: newCat, error: insErr } = await supabase
        .from('categories')
        .insert({ name: catName, slug, icon })
        .select()
        .single();
      if (insErr) {
        console.error(`❌ Error creando categoría "${catName}":`, insErr);
      } else {
        categoryMap[key] = newCat.id;
      }
    }
  }

  // B. Consultar Productos Existentes para Evitar Duplicados
  console.log('\n🔍 Consultando productos existentes en la base de datos...');
  const { data: existingProducts, error: errProd } = await supabase
    .from('products')
    .select('id, name, price, category_id, image_url');
  if (errProd) {
    console.error('❌ Error al consultar productos:', errProd);
    process.exit(1);
  }

  const existingByNormName = new Map();
  for (const p of existingProducts) {
    existingByNormName.set(norm(p.name), p);
  }

  // Aliases conocidos para los whiskies ya existentes
  const whiskyAliases = {
    [norm("Buchanans Deluxe 12 Años (750ml)")]: norm("Buchanan's deluxe 12 años Botella (750 ml)"),
    [norm("Johnnie Walker Black Label (750ml)")]: norm("Black label Botella (750 ml)"),
    [norm("Old Parr 12 Años (750ml)")]: norm("Old parr 12 años Botella (750 ml)")
  };

  // C. Cargar Plan Final de Catálogo
  const planPath = path.resolve(process.cwd(), 'scripts/final_catalog_plan.json');
  if (!fs.existsSync(planPath)) {
    console.error('❌ Archivo scripts/final_catalog_plan.json no encontrado.');
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  console.log(`📋 Plan cargado: ${plan.length} productos a procesar e incorporar.`);

  let uploadedCount = 0;
  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    const target = item.target;
    const fullName = target.full_name;
    const catId = categoryMap[target.category.toLowerCase().trim()];
    const destFilename = item.dest_filename;
    const storagePath = `products/${destFilename}`;

    console.log(`\n[${i + 1}/${plan.length}] Procesando: "${fullName}" (${target.category})`);

    try {
      // 1. Descargar imagen oficial
      console.log(`   ⬇️ Descargando de: ${item.imageUrl.slice(0, 70)}...`);
      const rawBuffer = await downloadBuffer(item.imageUrl);

      // Guardar copia local en imagenes/
      const localExt = item.imageUrl.includes('.png') ? 'png' : 'jpg';
      const localPath = path.join(IMAGES_DIR, `${destFilename.replace('.webp', '')}.${localExt}`);
      fs.writeFileSync(localPath, rawBuffer);

      // 2. Procesar a WebP con Sharp (estricto 1000x1000 dentro de proporciones, 85% calidad)
      const webpBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();

      // 3. Subir a Supabase Storage
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (upErr) {
        throw new Error(`Error al subir a Storage: ${upErr.message}`);
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      uploadedCount++;
      console.log(`   ☁️ Subida exitosa a Supabase Storage: ${destFilename}`);

      // 4. Determinar si el producto ya existe en la base de datos para no duplicarlo
      const targetNorm = norm(fullName);
      let existingRecord = existingByNormName.get(targetNorm);

      if (!existingRecord) {
        // Buscar por aliases de whisky
        for (const [dbKey, aliasKey] of Object.entries(whiskyAliases)) {
          if (aliasKey === targetNorm) {
            existingRecord = existingByNormName.get(dbKey);
            break;
          }
        }
      }

      if (existingRecord) {
        // Actualizar producto existente sin duplicar
        console.log(`   🔄 Producto ya existente (ID: ${existingRecord.id}). Actualizando imagen y precio...`);
        const { error: upDbErr } = await supabase
          .from('products')
          .update({
            price: target.price,
            image_url: publicUrl
          })
          .eq('id', existingRecord.id);

        if (upDbErr) {
          console.error(`   ❌ Error actualizando producto en BD:`, upDbErr);
          errorCount++;
        } else {
          updatedCount++;
          console.log(`   ✅ Producto actualizado en base de datos.`);
        }
      } else {
        // Insertar nuevo producto
        console.log(`   🆕 Insertando nuevo producto en tabla 'products'...`);
        const { data: newProd, error: insDbErr } = await supabase
          .from('products')
          .insert({
            name: fullName,
            price: target.price,
            stock_quantity: 10,
            category_id: catId,
            image_url: publicUrl
          })
          .select()
          .single();

        if (insDbErr) {
          console.error(`   ❌ Error insertando producto en BD:`, insDbErr);
          errorCount++;
        } else {
          insertedCount++;
          existingByNormName.set(targetNorm, newProd);
          console.log(`   ✅ Nuevo producto creado con ID: ${newProd.id}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Falla procesando "${fullName}":`, err.message);
      errorCount++;
    }
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log('🎉 RESUMEN DE EJECUCIÓN DEL PIPELINE:');
  console.log(`   - Imágenes procesadas a WebP y subidas: ${uploadedCount}`);
  console.log(`   - Nuevos productos insertados: ${insertedCount}`);
  console.log(`   - Productos existentes actualizados: ${updatedCount}`);
  console.log(`   - Errores: ${errorCount}`);
  console.log('────────────────────────────────────────────────────────');
}

main().catch(console.error);
