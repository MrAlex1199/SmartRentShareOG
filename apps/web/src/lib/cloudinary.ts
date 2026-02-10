import axios from 'axios';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = 'ml_default'; // We will ask user to create this or perform signed upload

export const CloudinaryLib = {
    async uploadImage(file: File): Promise<string> {
        if (!CLOUD_NAME) {
            throw new Error('Cloudinary Cloud Name is not configured');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                formData
            );
            return response.data.secure_url;
        } catch (error: any) {
            console.error('Cloudinary Upload Error:', error.response?.data || error.message);
            throw new Error('Failed to upload image');
        }
    }
};
