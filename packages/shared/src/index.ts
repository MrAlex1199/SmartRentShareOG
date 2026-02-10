export const SITE_NAME = "Smart Rent & Share";

export interface User {
    _id: string;
    lineId: string;
    displayName: string;
    pictureUrl?: string;
    email?: string;
    role: 'student' | 'admin';
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export * from './types/item';
