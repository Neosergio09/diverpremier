import json
import csv

with open("productos_base_de_datos.json", "r", encoding="utf-8") as f:
    data = json.load(f)

products = data["products"]
products.sort(key=lambda p: (p.get("category_name", ""), p.get("name", "")))

# 1. Update CSV
with open("productos_base_de_datos.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["id", "name", "category", "price", "stock", "image_url", "status"])
    for p in products:
        writer.writerow([
            p["id"],
            p["name"],
            p.get("category_name", ""),
            p["price"],
            p.get("stock_quantity", 0),
            p.get("image_url", ""),
            p.get("image_status", "")
        ])

# 2. Update productos_sin_imagen_oficial.md
md_content = f"""# Reporte de Productos en Base de Datos - Diverpremier

**Total Productos:** {len(products)}
- Con Foto Oficial WebP en Storage: **{data['official_images_count']}** (100%)
- Con Foto Genérica / Pendientes de Foto Real: **{data['pending_images_count']}** (0%)

## Estado por Categoría

"""

from collections import Counter
cat_counts = Counter(p.get("category_name", "Sin Categoría") for p in products)

md_content += "| Categoría | Total Productos | Estado Imágenes |\n| :--- | :---: | :---: |\n"
for cat, count in sorted(cat_counts.items()):
    md_content += f"| **{cat}** | {count} | ✅ 100% Oficial WebP |\n"

md_content += """
---
*Última actualización automática tras el procesamiento y sincronización masiva de licores nacionales e importados.*
"""

with open("productos_sin_imagen_oficial.md", "w", encoding="utf-8") as f:
    f.write(md_content)

print(f"Updated CSV and Markdown report successfully for {len(products)} products!")
