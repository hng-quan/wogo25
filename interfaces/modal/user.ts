export interface User {
    id: string;
    phone: string;
    name: string;
    email?: string; // operator '?' means this field is optional
}