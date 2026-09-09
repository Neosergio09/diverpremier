export interface Category {
    id: string;
    name: string;
}

export interface Product {
    id: string; // usually a UUID
    name: string;
    description?: string;
    price: number;
    stock_quantity: number;
    category_id?: string;
    category_name?: string;
    image_url?: string | null;
    is_active?: boolean;
}
