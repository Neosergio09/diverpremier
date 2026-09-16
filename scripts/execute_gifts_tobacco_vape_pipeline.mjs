import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
const STANDARDIZED_DIR = path.resolve(process.cwd(), 'temp_standardized_batch3');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Error: Credenciales de Supabase no encontradas.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const norm = (text) =>
  text.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const requiredCategories = [
  { name: 'Peluches', slug: 'peluches', icon: 'Heart' },
  { name: 'Vasos y Mugs', slug: 'vasos-y-mugs', icon: 'Coffee' },
  { name: 'Empaques', slug: 'empaques', icon: 'Package' },
  { name: 'Tarjetas', slug: 'tarjetas', icon: 'Mail' },
  { name: 'Cigarrillos', slug: 'cigarrillos', icon: 'Flame' },
  { name: 'Encendedores', slug: 'encendedores', icon: 'Flame' },
  { name: 'Accesorios', slug: 'accesorios', icon: 'Sparkles' },
  { name: 'Vapeadores Desechables', slug: 'vapeadores-desechables', icon: 'Cloud' },
  { name: 'Esencias y E-Liquids', slug: 'esencias-y-e-liquids', icon: 'Droplet' },
  { name: 'Hardware y Equipos', slug: 'hardware-y-equipos', icon: 'Cpu' },
  { name: 'Repuestos Vapeo', slug: 'repuestos-vapeo', icon: 'RotateCcw' },
];

const itemsToProcess = [
  {
    name: 'Oso de felpa con corazón Café / Grande',
    categoryName: 'Peluches',
    price: 45000,
    description: 'Material antialérgico.',
    filename: 'oso_de_felpa_con_corazon_cafe_grande.webp'
  },
  {
    name: 'Personaje de Anime Pikachu Amarillo / Mediano',
    categoryName: 'Peluches',
    price: 32000,
    description: 'Alta rotación en jóvenes.',
    filename: 'personaje_anime_pikachu_amarillo_mediano.webp'
  },
  {
    name: 'Mug térmico oficina Negro Mate',
    categoryName: 'Vasos y Mugs',
    price: 25000,
    description: 'Incluye tapa hermética.',
    filename: 'mug_termico_oficina_negro_mate.webp'
  },
  {
    name: 'Pocillo decorado "Papá" Blanco / Cerámica',
    categoryName: 'Vasos y Mugs',
    price: 15000,
    description: 'Frágil, requiere burbuja.',
    filename: 'pocillo_decorado_papa_blanco_ceramica.webp'
  },
  {
    name: 'Bolsa de regalo Lujo Motivos Cumpleaños',
    categoryName: 'Empaques',
    price: 5000,
    description: 'Tamaño carta.',
    filename: 'bolsa_de_regalo_lujo_motivos_cumpleanos.webp'
  },
  {
    name: 'Tarjeta de felicitación Amor / Amistad',
    categoryName: 'Tarjetas',
    price: 3500,
    description: 'Diversos diseños.',
    filename: 'tarjeta_de_felicitacion_amor_amistad.webp'
  },
  {
    name: 'Cigarrillos Mustang Rojo Cajetilla (20)',
    categoryName: 'Cigarrillos',
    price: 8500,
    description: 'Mantener en estante cerrado.',
    filename: 'cigarrillos_mustang_rojo_cajetilla_20.webp'
  },
  {
    name: 'Cigarrillos Mustang Rojo Unidad (Suelto)',
    categoryName: 'Cigarrillos',
    price: 600,
    description: 'Se sacan de la cajetilla abierta.',
    filename: 'cigarrillos_mustang_rojo_unidad_suelto.webp'
  },
  {
    name: 'Cigarrillos Marlboro Gold Cajetilla (10)',
    categoryName: 'Cigarrillos',
    price: 5000,
    description: 'Versión "Pocket" o pequeña.',
    filename: 'cigarrillos_marlboro_gold_cajetilla_10.webp'
  },
  {
    name: 'Cigarrillos Rothmans Azul Cajetilla (20)',
    categoryName: 'Cigarrillos',
    price: 7800,
    description: 'Producto de rotación media.',
    filename: 'cigarrillos_rothmans_azul_cajetilla_20.webp'
  },
  {
    name: 'Encendedor Bic Grande Unidad (Maxi)',
    categoryName: 'Encendedores',
    price: 4500,
    description: 'Colores variados, alta rotación.',
    filename: 'encendedor_bic_grande_unidad_maxi.webp'
  },
  {
    name: 'Encendedor Cricket Mini Unidad',
    categoryName: 'Encendedores',
    price: 2500,
    description: 'Ubicar junto a los cigarrillos.',
    filename: 'encendedor_cricket_mini_unidad.webp'
  },
  {
    name: 'Gas Recarga para Encendedores (300ml)',
    categoryName: 'Accesorios',
    price: 3000,
    description: 'Complemento para encendedores.',
    filename: 'gas_recarga_para_encendedores_300ml.webp'
  },
  {
    name: 'Vapeador Elf Bar (5000 puffs) Blue Razz Ice 5%',
    categoryName: 'Vapeadores Desechables',
    price: 65000,
    description: 'Producto estrella, sabor frío.',
    filename: 'vapeador_elf_bar_5000_puffs_blue_razz_ice_5.webp'
  },
  {
    name: 'Vapeador Lost Mary (3000 puffs) Strawberry Kiwi 2%',
    categoryName: 'Vapeadores Desechables',
    price: 45000,
    description: 'Nivel bajo de nicotina.',
    filename: 'vapeador_lost_mary_3000_puffs_strawberry_kiwi_2.webp'
  },
  {
    name: 'Esencia Naked 100 (60ml) Lava Flow 3mg',
    categoryName: 'Esencias y E-Liquids',
    price: 75000,
    description: 'Frasco de vidrio, premium.',
    filename: 'esencia_naked_100_60ml_lava_flow_3mg.webp'
  },
  {
    name: 'Esencia SaltNic (30ml) Mint 35mg',
    categoryName: 'Esencias y E-Liquids',
    price: 55000,
    description: 'Solo para sistemas tipo Pod.',
    filename: 'esencia_saltnic_30ml_mint_35mg.webp'
  },
  {
    name: 'Kit Vaporesso XROS 3 Silver',
    categoryName: 'Hardware y Equipos',
    price: 140000,
    description: 'Incluye cable y pod de repuesto.',
    filename: 'kit_vaporesso_xros_3_silver.webp'
  },
  {
    name: 'Resistencia Vaporesso GTR 0.4 ohm',
    categoryName: 'Repuestos Vapeo',
    price: 18000,
    description: 'Compatible con serie Vaporesso.',
    filename: 'resistencia_vaporesso_gtr_04_ohm.webp'
  }
];

async function run() {
  console.log('🚀 Iniciando pipeline para lote de 19 productos (Regalos/Mugs, Tabaco/Fuego, Vapeo)...');

  // 1. Obtener y asegurar categorías
  const { data: existingCategories, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug, icon');

  if (catErr) {
    console.error('❌ Error obteniendo categorías:', catErr);
    process.exit(1);
  }

  const categoryMap = new Map();
  for (const c of existingCategories) {
    categoryMap.set(c.name.toLowerCase().trim(), c.id);
  }

  console.log(`\n📂 Verificando / creando categorías necesarias...`);
  for (const reqCat of requiredCategories) {
    const key = reqCat.name.toLowerCase().trim();
    if (!categoryMap.has(key)) {
      console.log(`   ➕ Creando categoría: "${reqCat.name}" (${reqCat.slug})...`);
      const { data: newCat, error: insertCatErr } = await supabase
        .from('categories')
        .insert({
          name: reqCat.name,
          slug: reqCat.slug,
          icon: reqCat.icon
        })
        .select()
        .single();

      if (insertCatErr) {
        console.error(`   ❌ Error creando categoría "${reqCat.name}":`, insertCatErr);
      } else {
        categoryMap.set(key, newCat.id);
        console.log(`   ✅ Categoría creada: ID ${newCat.id}`);
      }
    } else {
      console.log(`   ✓ Categoría ya existe: "${reqCat.name}" (ID: ${categoryMap.get(key)})`);
    }
  }

  // 2. Obtener productos existentes para validación estricta de no duplicados
  const { data: dbProducts, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price, description, category_id, image_url');

  if (prodErr) {
    console.error('❌ Error obteniendo productos:', prodErr);
    process.exit(1);
  }

  const existingProductMap = new Map();
  for (const p of dbProducts) {
    existingProductMap.set(norm(p.name), p);
  }

  let uploadedImages = 0;
  let insertedProducts = 0;

  for (const item of itemsToProcess) {
    console.log(`\n📦 Procesando: "${item.name}" ($${item.price.toLocaleString('es-CO')})`);

    // Comprobar si ya existe
    const itemNorm = norm(item.name);
    const alreadyExists = existingProductMap.get(itemNorm);
    if (alreadyExists) {
      console.log(`   ⚠️ [YA EXISTE] El producto ya existe con ID ${alreadyExists.id}. Omitiendo inserción.`);
      continue;
    }

    const catId = categoryMap.get(item.categoryName.toLowerCase().trim());
    if (!catId) {
      console.error(`   ❌ Error: No se encontró ID para categoría "${item.categoryName}"`);
      continue;
    }

    // 1. Copiar WebP estandarizado a imagenes/
    const srcWebp = path.join(STANDARDIZED_DIR, item.filename);
    const destWebp = path.join(IMAGES_DIR, item.filename);
    fs.copyFileSync(srcWebp, destWebp);

    const buffer = fs.readFileSync(destWebp);

    // 2. Subir a Supabase Storage
    const storagePath = `products/${item.filename}`;
    console.log(`   ☁️ Subiendo imagen a Supabase Storage: ${storagePath}...`);
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadErr) {
      console.error(`   ❌ Error subiendo imagen a Storage:`, uploadErr);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    uploadedImages++;
    console.log(`   ✅ Imagen subida: ${publicUrl}`);

    // 3. Insertar producto en base de datos
    console.log(`   ➕ Insertando en tabla 'products'...`);
    const { data: newRecord, error: insertErr } = await supabase
      .from('products')
      .insert({
        name: item.name,
        price: item.price,
        description: item.description,
        category_id: catId,
        stock_quantity: 10,
        is_active: true,
        image_url: publicUrl
      })
      .select()
      .single();

    if (insertErr) {
      console.error(`   ❌ Error creando producto en base de datos:`, insertErr);
    } else {
      insertedProducts++;
      existingProductMap.set(itemNorm, newRecord);
      console.log(`   ✅ Producto creado exitosamente con ID: ${newRecord.id}`);
    }
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log('🎉 RESUMEN DE EJECUCIÓN DEL LOTE:');
  console.log(`   - Imágenes oficiales WebP subidas a Storage: ${uploadedImages}/19`);
  console.log(`   - Nuevos productos insertados en BD: ${insertedProducts}/19`);
  console.log('────────────────────────────────────────────────────────');
}

run().catch(console.error);
