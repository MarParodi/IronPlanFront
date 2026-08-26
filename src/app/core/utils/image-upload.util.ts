const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function validateImageFile(file: File): string | null {
  const type = (file.type || '').toLowerCase();
  if (type && !type.startsWith('image/')) {
    return 'El archivo debe ser una imagen (JPEG, PNG o WebP).';
  }
  if (type && type.startsWith('image/') && !ALLOWED_TYPES.has(type)) {
    return 'Usa una imagen JPEG, PNG o WebP.';
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return 'La imagen supera 10 MB. Elige una más liviana.';
  }
  return null;
}

export async function compressImageToJpeg(file: File): Promise<File> {
  const dataUrl = await readAsDataUrl(file);
  const image = await loadImage(dataUrl);

  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;
  if (!width || !height) {
    throw new Error('No se pudo leer la imagen.');
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo procesar la imagen.');
  }
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  if (!blob) {
    throw new Error('No se pudo comprimir la imagen.');
  }
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('La imagen comprimida sigue siendo demasiado pesada.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Formato de imagen no soportado. Usa JPEG o PNG.'));
    image.src = src;
  });
}
