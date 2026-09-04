export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category_id: string | null
          price: number
          stock_quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          price?: number
          stock_quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          price?: number
          stock_quantity?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          status: string
          created_at: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
        }
      }
      cocktails: {
        Row: {
          id: string
          name: string
          base_liquor?: string
          description?: string
          history?: string
          glass_type: string
          ingredients: Json
          how_to_mix?: string
          how_to_serve?: string
          how_to_garnish?: string
          instructions: Json
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          base_liquor?: string
          description?: string
          history?: string
          glass_type: string
          ingredients: Json
          how_to_mix?: string
          how_to_serve?: string
          how_to_garnish?: string
          instructions: Json
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          base_liquor?: string
          description?: string
          history?: string
          glass_type?: string
          ingredients?: Json
          how_to_mix?: string
          how_to_serve?: string
          how_to_garnish?: string
          instructions?: Json
          image_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      view_product_catalog: {
        Row: {
          uuid: string
          product_name: string
          category_name: string | null
          price: number
          stock_status: string
        }
      }
    }
  }
}
