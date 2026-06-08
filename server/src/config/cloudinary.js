// src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 or buffer image to Cloudinary
 * Returns the secure URL
 */
export const uploadImage = async (file, folder = "udyog/products") => {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 800, height: 800, crop: "limit" }, // max 800x800
      { quality: "auto", fetch_format: "auto" },   // auto compress + webp
    ],
  });
  return result.secure_url;
};

/**
 * Delete an image from Cloudinary by URL
 */
export const deleteImage = async (url) => {
  try {
    // Extract public_id from URL
    const parts = url.split("/");
    const file = parts[parts.length - 1].split(".")[0];
    const folder = parts[parts.length - 2];
    const public_id = `${folder}/${file}`;
    await cloudinary.uploader.destroy(public_id);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

export default cloudinary;