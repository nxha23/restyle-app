import axios from "axios";

export async function removeImageBackground(imageBase64) {
  try {
    const apiKey = process.env.API_KEY; 
    if (!apiKey) {
      throw new Error("No background removal API key found!");
    }

    const response = await axios.post(
      "https://api.withoutbg.com/v1.0/image-without-background-base64",
      { image_base64: imageBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    return response.data.img_without_background_base64;
  } catch (error) {
    console.error("Error removing background:", error.response?.data || error.message);
    throw error;
  }
}
