const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const SIZE = 512;

export const avatarAccept = ACCEPTED.join(",");

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Şəkil oxunmadı. Başqa fayl seçin."));
    };
    image.src = url;
  });

export const preparePhoto = async (file: File, maxEdge = 1280) => {
  if (!ACCEPTED.includes(file.type)) throw new Error("Yalnız PNG, JPG və ya WEBP şəkil seçin");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Şəkil 10 MB-dan böyük olmamalıdır");
  const image = await loadImage(file);
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Brauzer şəkli emal edə bilmədi");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  const webp = canvas.toDataURL("image/webp", 0.82);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85);
};

export const prepareAvatar = async (file: File) => {
  if (!ACCEPTED.includes(file.type)) throw new Error("Yalnız PNG, JPG və ya WEBP şəkil seçin");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Şəkil 10 MB-dan böyük olmamalıdır");
  const image = await loadImage(file);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  if (!side) throw new Error("Şəkil oxunmadı. Başqa fayl seçin.");
  const target = Math.min(SIZE, side);
  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Brauzer şəkli emal edə bilmədi");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, target, target);
  const webp = canvas.toDataURL("image/webp", 0.86);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.88);
};
