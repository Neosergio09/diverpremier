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
const STANDARDIZED_DIR = path.resolve(process.cwd(), 'temp_standardized');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Error: Credenciales de Supabase no encontradas.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const norm = (text) =>
  text.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const SNACK_CATEGORY_ID = 'cd3d3a51-6be1-4a78-8695-245cfa53caa5';

const itemsToProcess = [
  {
    type: 'EXISTING_UPDATE',
    matchNorm: norm("Buchanan's deluxe 12 años Botella (1000 ml)"),
    aliasMatch: norm("Buchanans Deluxe Litro (1000ml)"),
    name: "Buchanan's deluxe 12 años Botella (1000 ml)",
    newPrice: 180000,
    note: "Actualizar precio a 180.000 sin duplicar producto"
  },
  {
    type: 'NEW_INSERT',
    name: 'Maní La Especial (Sal) Grande (200g)',
    price: 12500,
    description: 'Ubicar cerca de la caja.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'mani_la_especial_sal_grande_200g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Maní Moto Personal (40g)',
    price: 2500,
    description: 'Producto de alta rotación.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'mani_moto_personal_40g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Galletas Festival Recreo Paquete Personal (4 und)',
    price: 1200,
    description: 'Sabor chocolate es el favorito.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'galletas_festival_recreo_paquete_personal_4_und.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Galletas Saltinas Noel Taco / Paquete (3 tacos)',
    price: 5800,
    description: 'Verificar sellado del empaque.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'galletas_saltinas_noel_taco_paquete_3_tacos.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Ponqués Chocoramo Unidad (65g)',
    price: 2800,
    description: 'Revisar fecha de vencimiento.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'ponques_chocoramo_unidad_65g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Paquetes Papas Margarita Mega familiar (150g)',
    price: 8000,
    description: 'Mantener lejos de la humedad.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'papas_margarita_mega_familiar_150g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Gomitas Trululu Aros Paquete de paqueticos 12 unidades',
    price: 14000,
    description: 'Venta por bolsa cerrada.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'gomitas_trululu_aros_paquete_12_unidades.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Gomitas Trululu Aros Unidad (Individual) 1 unidad',
    price: 1500,
    description: 'Se sacan de la bolsa de 12.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'gomitas_trululu_aros_unidad_individual_1_und.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Chocolates Chocolatina Jet Unidad (12g) 1 unidad',
    price: 700,
    description: 'Producto líder en caja.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'chocolates_chocolatina_jet_unidad_12g.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Chocolates Chocolatina Jet Display / Caja 24 unidades',
    price: 15000,
    description: 'Para venta mayorista o reserva.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'chocolates_chocolatina_jet_display_caja_24_und.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Chicles Trident Menta Paquete (Caja) 18 unidades',
    price: 4500,
    description: 'Ubicar en exhibidor frontal.',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'chicles_trident_menta_paquete_18_und.webp'
  },
  {
    type: 'NEW_INSERT',
    name: 'Caramelos Bon Bon Bum Paquete / Bolsa 24 unidades',
    price: 12000,
    description: 'Sabor original (Fresa).',
    categoryId: SNACK_CATEGORY_ID,
    filename: 'caramelos_bon_bon_bum_paquete_bolsa_24_und.webp'
  }
];

async function run() {
  console.log('🚀 Iniciando pipeline para nuevo lote de 13 productos (1 actualización de Buchanan, 12 snacks nuevos)...');

  // 1. Obtener productos existentes para validación estricta de no duplicados
  const { data: dbProducts, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price, description, category_id, image_url');

  if (prodErr) {
    console.error('❌ Error obteniendo productos:', prodErr);
    process.exit(1);
  }

  const existingMap = new Map();
  for (const p of dbProducts) {
    existingMap.set(norm(p.name), p);
  }

  let uploadedImages = 0;
  let insertedProducts = 0;
  let updatedProducts = 0;

  for (const item of itemsToProcess) {
    if (item.type === 'EXISTING_UPDATE') {
      let existing = existingMap.get(item.matchNorm) || existingMap.get(item.aliasMatch);
      if (!existing) {
        // buscar por inclusión
        for (const p of dbProducts) {
          if (p.name.toLowerCase().includes('buchanan') && p.name.includes('1000')) {
            existing = p;
            break;
          }
        }
      }

      if (existing) {
        console.log(`\n🔄 [NO DUPLICAR] Actualizando precio para: "${existing.name}" (ID: ${existing.id})`);
        console.log(`   Precio anterior: $${existing.price} -> Nuevo precio: $${item.newPrice}`);
        const { error: upErr } = await supabase
          .from('products')
          .update({ price: item.newPrice })
          .eq('id', existing.id);

        if (upErr) {
          console.error(`   ❌ Error al actualizar precio:`, upErr);
        } else {
          console.log(`   ✅ Precio actualizado exitosamente.`);
          updatedProducts++;
        }
      } else {
        console.warn(`   ⚠️ No se encontró el producto existente para: "${item.name}"`);
      }
    } else if (item.type === 'NEW_INSERT') {
      console.log(`\n📦 Procesando producto: "${item.name}" ($${item.price})`);

      // Verificar si ya existe en BD para no duplicar
      const itemNorm = norm(item.name);
      const alreadyExists = existingMap.get(itemNorm);
      if (alreadyExists) {
        console.log(`   ⚠️ [YA EXISTE] El producto ya existe con ID ${alreadyExists.id}. Omitiendo inserción duplicada.`);
        continue;
      }

      // 1. Copiar archivo WebP a imagenes/
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
      console.log(`   ➕ Creando registro en tabla 'products'...`);
      const { data: newRecord, error: insertErr } = await supabase
        .from('products')
        .insert({
          name: item.name,
          price: item.price,
          description: item.description,
          category_id: item.categoryId,
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
        existingMap.set(itemNorm, newRecord);
        console.log(`   ✅ Producto creado exitosamente con ID: ${newRecord.id}`);
      }
    }
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log('🎉 RESUMEN DE EJECUCIÓN PIPELINE DE SNACKS:');
  console.log(`   - Imágenes oficiales WebP subidas a Storage: ${uploadedImages}`);
  console.log(`   - Nuevos productos insertados en BD: ${insertedProducts}`);
  console.log(`   - Productos existentes actualizados (Buchanan): ${updatedProducts}`);
  console.log('────────────────────────────────────────────────────────');
}

run().catch(console.error);
