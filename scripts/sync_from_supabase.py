import json
import os
import requests

def get_env():
    env = {}
    with open(".env") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

env = get_env()
url = env["PUBLIC_SUPABASE_URL"]
key = env["SUPABASE_SERVICE_ROLE_KEY"]

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

# Fetch categories
r_cat = requests.get(f"{url}/rest/v1/categories?select=*", headers=headers)
categories = r_cat.json()

# Fetch products
r_prod = requests.get(f"{url}/rest/v1/products?select=*", headers=headers)
products = r_prod.json()

cat_map = {c["id"]: c["name"] for c in categories}

for p in products:
    p["category_name"] = cat_map.get(p.get("category_id"), "Sin Categoría")
    img = p.get("image_url") or ""
    p["has_official_image"] = "diverpremier-assets" in img and img.endswith(".webp")
    p["image_status"] = "OFICIAL_WEBP" if p["has_official_image"] else "GENERICA_TEMPORAL"

official_count = sum(1 for p in products if p["has_official_image"])
pending_count = len(products) - official_count

output = {
    "total_products": len(products),
    "official_images_count": official_count,
    "pending_images_count": pending_count,
    "categories": categories,
    "products": products
}

with open("productos_base_de_datos.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"Synced from Supabase: {len(products)} products ({official_count} official, {pending_count} pending)")
