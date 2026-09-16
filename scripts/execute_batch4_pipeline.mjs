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
const STANDARDIZED_DIR = path.resolve(process.cwd(), 'temp_standardized_batch4');

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
  { name: 'Gaseosas', slug: 'gaseosas', icon: 'CupSoda' },
  { name: 'Jugos', slug: 'jugos', icon: 'Apple' },
  { name: 'Aguas', slug: 'aguas', icon: 'Droplet' },
  { name: 'Energizantes', slug: 'energizantes', icon: 'Zap' },
  { name: 'Té', slug: 'te', icon: 'Coffee' },
  { name: 'Coctelería', slug: 'cocteleria', icon: 'Wine' },
  { name: 'Despensa', slug: 'despensa', icon: 'ShoppingBag' }
];

const itemsToProcess = [
  // 1. Gaseosas
  {
    type: 'NEW_INSERT',
    name: 'Gaseosa Coca-Cola Botella (600ml)',
    categoryName: 'Gaseosas',
    price: 0,
    description: 'Mantener siempre fría. PET (Plástico).',
    filename: 'gaseosa_coca_cola_botella_600ml.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Gaseosa Postobón Manzana Litro y Medio (1500ml)',
    categoryName: 'Gaseosas',
    price: 0,
    description: 'Requiere envase de cambio. Retornable.',
    filename: 'gaseosa_postobon_manzana_litro_y_medio_1500ml.webp'
  },
  // 2. Jugos
  {
    type: 'NEW_INSERT',
    name: 'Jugo Hit Mora Cajita (200ml)',
    categoryName: 'Jugos',
    price: 0,
    description: 'Ideal para loncheras. Tetra Pak.',
    filename: 'jugo_hit_mora_cajita_200ml.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Jugo del Valle Naranja Botella (400ml)',
    categoryName: 'Jugos',
    price: 0,
    description: 'Revisar fecha vencimiento. PET.',
    filename: 'jugo_del_valle_naranja_botella_400ml.webp'
  },
  // 3. Aguas
  {
    type: 'NEW_INSERT',
    name: 'Agua Brisa con Gas Botella (600ml)',
    categoryName: 'Aguas',
    price: 0,
    description: 'Ubicar en estante bajo. Con Gas.',
    filename: 'agua_brisa_con_gas_botella_600ml.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Agua Cristal sin Gas Galón (5L)',
    categoryName: 'Aguas',
    price: 0,
    description: 'Venta para consumo hogar. Sin Gas.',
    filename: 'agua_cristal_sin_gas_galon_5l.webp'
  },
  // 4. Energizantes
  {
    type: 'NEW_INSERT',
    name: 'Bebida Energizante Vive 100 Botella (240ml)',
    categoryName: 'Energizantes',
    price: 0,
    description: 'Alta rotación en mañanas. PET.',
    filename: 'energizante_vive_100_botella_240ml.webp'
  },
  // 5. Té
  {
    type: 'NEW_INSERT',
    name: 'Té Mr. Tea Limón Botella (500ml)',
    categoryName: 'Té',
    price: 0,
    description: 'Preferido por jóvenes. PET.',
    filename: 'te_mr_tea_limon_botella_500ml.webp'
  },
  // 6. Ginebra Tanqueray - UPDATE EXISTING
  {
    type: 'EXISTING_UPDATE',
    matchNorm: norm('Tanqueray london dry gin Botella (700ml)'),
    aliasMatch: norm('Ginebra Tanqueray 750 ml'),
    name: 'Tanqueray london dry gin Botella (700ml)',
    newPrice: 0,
    description: 'Base para Gin Tonic. Precio pendiente por revisar con cliente.'
  },
  // 7. Coctelería
  {
    type: 'NEW_INSERT',
    name: 'Aperitivo Vermut Rosso Botella (750ml)',
    categoryName: 'Coctelería',
    price: 65000,
    description: 'Mantener refrigerado tras abrir.',
    filename: 'vermut_rosso_botella_750ml.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Licor Triple Sec Naranja Botella (700ml)',
    categoryName: 'Coctelería',
    price: 45000,
    description: 'Para Margaritas y Cosmos.',
    filename: 'licor_triple_sec_naranja_botella_700ml.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Bitters Angostura Aromatic (100ml)',
    categoryName: 'Coctelería',
    price: 95000,
    description: 'Uso por gotas. Alta duración.',
    filename: 'bitters_angostura_aromatic_100ml.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Agua Tónica Schweppes Botella (300ml)',
    categoryName: 'Coctelería',
    price: 4500,
    description: 'Venta por unidad.',
    filename: 'agua_tonica_schweppes_botella_300ml.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Jarabe de Goma Simple Syrup (1000ml)',
    categoryName: 'Coctelería',
    price: 22000,
    description: 'Elaboración propia o marca.',
    filename: 'jarabe_de_goma_simple_syrup_1000ml.webp'
  },
  // 8. Despensa
  {
    type: 'NEW_INSERT',
    name: 'Duraznos en almíbar Lata Grande (820g)',
    categoryName: 'Despensa',
    price: 15500,
    description: 'Ideal para postres y cenas.',
    filename: 'duraznos_en_almibar_lata_grande_820g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: "Atún Van Camp's Lomitos (160g)",
    categoryName: 'Despensa',
    price: 6800,
    description: 'Alta rotación, exhibir frente. Lata / Abrefácil.',
    filename: 'atun_van_camps_lomitos_160g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Sardinas en Tomate Lata Ovalada (425g)',
    categoryName: 'Despensa',
    price: 7500,
    description: 'Verificar que la lata no esté golpeada.',
    filename: 'sardinas_en_tomate_lata_ovalada_425g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Arroz Diana Bolsa (1 kg)',
    categoryName: 'Despensa',
    price: 4200,
    description: 'Alimento de primera necesidad. Bolsa Plástica.',
    filename: 'arroz_diana_bolsa_1kg.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Frijol Bola Roja Bolsa (500g)',
    categoryName: 'Despensa',
    price: 5500,
    description: 'Mantener en zona seca. Bolsa Plástica.',
    filename: 'frijol_bola_roja_bolsa_500g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Aceite Gourmet Botella (900ml)',
    categoryName: 'Despensa',
    price: 12000,
    description: 'Revisar sellado de tapa. PET.',
    filename: 'aceite_gourmet_botella_900ml.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Espagueti Doria Paquete (500g)',
    categoryName: 'Despensa',
    price: 3800,
    description: 'Ubicar junto a las salsas. Bolsa.',
    filename: 'espagueti_doria_paquete_500g.webp'
  }
];

async function run() {
  console.log('🚀 Iniciando pipeline para lote de 21 productos (Bebidas, Coctelería, Despensa)...');

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
  let updatedProducts = 0;

  for (const item of itemsToProcess) {
    if (item.type === 'EXISTING_UPDATE') {
      let existing = existingProductMap.get(item.matchNorm) || existingProductMap.get(item.aliasMatch);
      if (!existing) {
        for (const p of dbProducts) {
          if (p.name.toLowerCase().includes('tanqueray')) {
            existing = p;
            break;
          }
        }
      }

      if (existing) {
        console.log(`\n🔄 [NO DUPLICAR] Actualizando producto existente: "${existing.name}" (ID: ${existing.id})`);
        console.log(`   Precio anterior: $${existing.price} -> Nuevo precio: $${item.newPrice}`);
        const { error: upErr } = await supabase
          .from('products')
          .update({
            price: item.newPrice,
            description: item.description
          })
          .eq('id', existing.id);

        if (upErr) {
          console.error(`   ❌ Error al actualizar producto:`, upErr);
        } else {
          console.log(`   ✅ Producto actualizado exitosamente.`);
          updatedProducts++;
        }
      } else {
        console.warn(`   ⚠️ No se encontró el producto existente para: "${item.name}"`);
      }
    } else if (item.type === 'NEW_INSERT') {
      console.log(`\n📦 Procesando producto: "${item.name}" ($${item.price.toLocaleString('es-CO')})`);

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
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log('🎉 RESUMEN DE EJECUCIÓN LOTE 4:');
  console.log(`   - Imágenes oficiales WebP subidas a Storage: ${uploadedImages}/20`);
  console.log(`   - Nuevos productos insertados en BD: ${insertedProducts}/20`);
  console.log(`   - Productos existentes actualizados (Tanqueray): ${updatedProducts}/1`);
  console.log('────────────────────────────────────────────────────────');
}

run().catch(console.error);
