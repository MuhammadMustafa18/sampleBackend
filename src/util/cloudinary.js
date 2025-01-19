import { v2 as cloudinary } from "cloudinary";
import fs from "fs" // filesystem

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        // upload
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" //img raw ye wo
        })
        console.log("File has been uploaded on cloudinary", response.url) 
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // ye kyun, remove locally saved file, yaani multer save karta, fail pe apne se bhi hatao
    }
}
export {uploadCloudinary}