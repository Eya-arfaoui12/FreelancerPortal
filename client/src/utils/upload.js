import axios from "axios";

export const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET); 
  
  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      data
    );
    
    const { secure_url } = res.data; // URL finale de l'image
    return secure_url;
  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    throw new Error("Failed to upload image");
  }
};