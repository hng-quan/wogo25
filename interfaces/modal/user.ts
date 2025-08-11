export interface User {
    id: number;
    phone: string;
    fullName: string;
    avatarUrl?: string; // operator '?' means this field is optional
}