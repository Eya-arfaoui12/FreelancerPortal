import axios from "axios";

export const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "freelacer_portal"); //preset exact
  
  try {
    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/dhja77zhk/image/upload", // cloud name
      data
    );
    
    const { secure_url } = res.data; // URL finale de l'image
    return secure_url;
  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    throw new Error("Failed to upload image");
  }
};