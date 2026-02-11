/**
 * Image upload utility using Cloudinary
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqqxfdb5z';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export const ImageLib = {
    /**
     * Upload image to Cloudinary
     */
    async uploadImage(file: File): Promise<string> {
        if (!CLOUD_NAME) {
            throw new Error('Cloudinary Cloud Name is not configured');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Cloudinary Upload Error:', errorData);
                throw new Error(errorData.error?.message || 'Failed to upload image');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error: any) {
            console.error('Image upload error:', error.message);
            throw new Error('Failed to upload image to Cloudinary');
        }
    }
};
