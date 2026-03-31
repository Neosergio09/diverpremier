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
    is_active?: boolean;
}
