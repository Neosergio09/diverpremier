import requests
import json

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

queries = [
    "mani la especial sal 200",
    "mani especial sal",
    "mani moto 40",
    "mani moto",
    "festival recreo",
    "galletas recreo",
    "saltinas 3 tacos",
    "saltinas noel",
    "chocoramo 65",
    "chocoramo",
    "papas margarita mega familiar",
    "papas margarita 150",
    "papas margarita natural",
    "trululu aros",
    "chocolatina jet 12",
    "chocolatina jet display",
    "chocolatina jet 24",
    "trident menta 18",
    "trident menta",
    "bon bon bum fresa",
    "bon bon bum 24"
]

results = {}

for q in queries:
    ft = q.replace(" ", "+")
    for base in ["https://www.exito.com", "https://www.carulla.com", "https://www.olimpica.com"]:
        url = f"{base}/api/catalog_system/pub/products/search?ft={ft}&_from=0&_to=5"
        try:
            r = requests.get(url, headers=headers, timeout=8)
            if r.status_code in [200, 206]:
                for item in r.json():
                    name = item.get("productName", "").strip()
                    skus = item.get("items", [])
                    if skus and skus[0].get("images"):
                        img = skus[0]["images"][0].get("imageUrl")
                        if name and img and name not in results:
                            results[name] = {
                                "name": name,
                                "imageUrl": img,
                                "source": base,
                                "query": q
                            }
        except Exception:
            pass

print(f"Found {len(results)} candidate snack/candy products in VTEX!")

with open("scripts/snack_candidates.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
