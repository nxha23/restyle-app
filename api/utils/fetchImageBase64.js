import axios from "axios";

/**
 * Fetch an image from a remote URL (e.g. Firebase) and return a data URI
 * @param {string} imageUrl - the remote image URL
 * @returns {string} data URI (e.g. "data:image/png;base64,AAABBB...")
 */
export async function fetchImageBase64(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const contentType = response.headers["content-type"] || "image/png";
  const base64 = Buffer.from(response.data, "binary").toString("base64");
  return `data:${contentType};base64,${base64}`;
}
