import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface ProcessedImage {
  buffer: Buffer;
  format: 'webp';
  contentType: 'image/webp';
  width?: number;
  height?: number;
  sizeBytes: number;
}

/**
 * Procesa cualquier buffer de imagen (JPG, PNG, GIF, BMP, TIFF, HEIC, etc.)
 * y lo convierte obligatoriamente a WebP optimizado para e-commerce.
 */
export async function processToWebp(
  input: Buffer | Uint8Array | ArrayBuffer,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 85
): Promise<ProcessedImage> {
  let imageBuffer: Buffer;
  if (Buffer.isBuffer(input)) {
    imageBuffer = input;
  } else if (input instanceof ArrayBuffer) {
    imageBuffer = Buffer.from(input);
  } else {
    imageBuffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  }

  const pipeline = sharp(imageBuffer)
    .rotate() // Auto-orienta según orientación EXIF de cámaras de celulares
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 4,
      lossless: false,
    });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    format: 'webp',
    contentType: 'image/webp',
    width: info.width,
    height: info.height,
    sizeBytes: info.size,
  };
}

/**
 * Convierte un texto a un nombre de archivo seguro y limpio
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Procesa y sube una imagen a Supabase Storage en formato .webp garantizado
 */
export async function uploadProductImageToStorage(
  imageInput: Buffer | Uint8Array | ArrayBuffer,
  destinationName: string
): Promise<string> {
  // 1. Forzar procesamiento a WebP
  const processed = await processToWebp(imageInput);

  // 2. Formatear nombre con extensión .webp
  const baseName = sanitizeFilename(destinationName.replace(/\.[^/.]+$/, ''));
  const finalFilename = `${baseName}.webp`;
  const storagePath = `products/${finalFilename}`;

  // 3. Subir a Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('diverpremier-assets')
    .upload(storagePath, processed.buffer, {
      contentType: processed.contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Error al subir imagen a Supabase Storage: ${uploadError.message}`);
  }

  // 4. Retornar URL pública
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('diverpremier-assets')
    .getPublicUrl(storagePath);

  return publicUrl;
}
