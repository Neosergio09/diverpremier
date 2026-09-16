import json
import re
from pipeline_utils import normalize_text, extract_volume, is_box_presentation, sanitize_filename

with open("scripts/target_catalog.json", "r", encoding="utf-8") as f:
    target_catalog = json.load(f)

with open("scripts/vtex_candidates.json", "r", encoding="utf-8") as f:
    vtex_candidates = json.load(f)

cand_list = list(vtex_candidates.values())

needs_search = [p for p in target_catalog if not (p["is_existing_in_db"] and p["existing_image"] and "diverpremier-assets" in p["existing_image"])]

BRAND_MAP = {
    "nectar": ["nectar"],
    "medellin": ["medellin"],
    "caldas": ["caldas"],
    "santa fe": ["santa fe"],
    "bacardi": ["bacardi"],
    "havana club": ["havana club", "havana"],
    "jimador": ["jimador"],
    "jose cuervo": ["jose cuervo", "cuervo"],
    "don julio": ["don julio"],
    "olmeca": ["olmeca"],
    "dobel": ["dobel", "maestro dobel"],
    "1800": ["1800"],
    "patron": ["patron"],
    "herradura": ["herradura"],
    "3 caballos": ["3 caballos", "tres caballos"],
    "smirnoff": ["smirnoff"],
    "convier": ["convier"],
    "coloma": ["coloma"],
    "absolut": ["absolut"],
    "wiborowa": ["wyborowa", "wiborowa"],
    "skyy": ["skyy"],
    "gordons": ["gordons", "gordon"],
    "beefeater": ["beefeater"],
    "bombay": ["bombay"],
    "hendrick": ["hendrick", "hendricks"],
    "tanqueray": ["tanqueray"],
    "whitley neill": ["whitley neill", "whitley"],
    "buchanan": ["buchanan", "buchanans"],
    "old parr": ["old parr"],
    "black label": ["black label"],
    "double black": ["double black"],
    "red label": ["red label"],
    "black and white": ["black and white", "black & white", "black white"],
    "jack daniels": ["jack daniels", "jack daniel"],
    "something special": ["something special", "something"],
    "macallan": ["macallan"],
    "glenlivet": ["glenlivet"]
}

def get_target_brand(text):
    t = normalize_text(text)
    for b_key, aliases in BRAND_MAP.items():
        for al in aliases:
            if re.search(r'\b' + re.escape(al) + r'\b', t):
                return b_key
    return None

EXACT_OVERRIDES = {
    # Aguardiente Nectar reposado
    "nectar reposado sin azucar botella (700ml)": "https://exitocol.vteximg.com.br/arquivos/ids/32669105/Aguardiente-NECTAR-reposado-700-ml-3665384_a.jpg",
    # Ron Medellin
    "medellin 3 anos media (375ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449331/Ron-Medellin-3-Anos-X-375-ml-1151241_a.jpg",
    # Ron Juan de la Cruz
    "viejo de caldas juan de la cruz botella (750ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449298/Ron-VIEJO-DE-CALDAS-Juan-de-la-Cruz-750-ml-1151187_a.jpg",
    # Ron Santa Fe Litro caja y cuarto
    "santa fe litro caja (1000ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34391894/RON-ANEJO-TETRAPACK-LIT-258649_a.jpg",
    "santa fe cuarto (250ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34445484/RON-CUARTO-417553_a.jpg",
    # Havana Club
    "havana club 3 anos blanco botella (750ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449303/Ron-Havana-Club-3-Anos-700-ml-1151206_a.jpg",
    "havana club 7 anos oscuro botella (700ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449304/Ron-Havana-Club-7-Anos-700-ml-1151208_a.jpg",
    # Tequilas
    "jose cuervo reposado media (375ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449232/Tequila-JOSE-CUERVO-especial-reposada-media-375-ml-1151121_a.jpg",
    "jose cuervo plata botella (750ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449231/Tequila-JOSE-CUERVO-Silver-Blue-Agave-Especial-750-ml-1151120_a.jpg",
    "don julio 70 cristalino botella (700ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449226/Tequila-DON-JULIO-70-cristalino-anejo-700-ml-1151095_a.jpg",
    "olmeca silver botella (700ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449234/Tequila-OLMECA-blanco-silver-700-ml-1151124_a.jpg",
    "olmeca silver media (350ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449235/Tequila-OLMECA-reposado-350-ml-1151125_a.jpg",
    "herradura reposado botella (750ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/311651/303023-Tequila-Herradura-Reposado-700ml-ac.png",
    "3 caballos botella (1000ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/311650/303020-Tequila-Tres-Caballos-Gold-1000ml-ac.png",
    # Bacardi
    "bacardi mojito botella (1750ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449237/Coctel-BACARDI-mojito-750-ml-1151129_a.jpg",
    # Smirnoff
    "smirnoff lulo media (375 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449334/Smirnoff-Lulo-Media-X-375-ml-1151244_a.jpg",
    # Convier
    "convier triple sec botella (750ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34463483/Licor-Triple-Sec-X-750ml-53795_a.jpg",
    "convier triple sec blue botella (750ml)": "https://exitocol.vteximg.com.br/arquivos/ids/32369182/Licor-Crema-Triple-Sec-Azul-X-750ml-773710_a.jpg",
    # Vodka
    "wiborowa botella (700ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449249/Vodka-WYBOROWA-original-700-ml-1151147_a.jpg",
    "absolut peppar botella (750ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/344729/307067-VODKA-ABSOLUT-BLUE-700ML-ac.png",
    # Ginebra
    "bombay saphire botella (700ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449320/Ginebra-BOMBAY-sapphire-destilado-700-ml-1151139_a.jpg",
    "hendricks gin botella (750ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449322/Ginebra-HENDRICKS-rosas-pepinos-750-ml-1151142_a.jpg",
    "whitley neill original botella (700ml)": "https://exitocol.vteximg.com.br/arquivos/ids/32367857/Ginebra-Original-WHITLEY-NEILL-700-ml-3094116_a.jpg",
    "whitley neill blood orange gin botella (700ml)": "https://exitocol.vteximg.com.br/arquivos/ids/32669136/Ginebra-WHITLEY-NEILL-Blood-Orange-700-ml-3674559_a.jpg",
    "whitley neill quince gin botella (700ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/311660/306051-Ginebra-Whitley-Neill-Quince-700ml-ac.png",
    # Whisky
    "black label botella (375 ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/354698/002009-jw-BLACK-LABEL-0375.png",
    "double black botella (750 ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/369340/2348-JW-DOUBLE-BLACK-0.700L_1.png",
    "red label botella (750 ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/354675/002346-JOHNNIE_WALKER_RED_LABEL_BOTELLA_700ML.png",
    "red label botella (375 ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/354694/002019-JOHNNIE_WALKER_RED_LABEL_MEDIA_375ML.png",
    "red label botella (1000 ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/370391/002017-WHISKY-JOHNNIE-WALKER-RED-LABEL-1000ML-1.png",
    "red label botella (200 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/32669186/Whisky-JOHNNIE-WALKER-Mezclado-Escoces-Red-Label-200-ml-3709869_a.jpg",
    "black and white botella (750 ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/343888/002331-BLACK-_-WHITE-BLENDED-WHISKY-700ml.png",
    "black and white botella (375 ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/343900/002022-BLACK-_-WHITE-WHISKY-375L.png",
    "black and white botella (200 ml)": "https://dislicoresqa.vteximg.com.br/arquivos/ids/343900/002022-BLACK-_-WHITE-WHISKY-375L.png",
    "jack daniels tradicional botella (200 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449313/Whisky-JACK-DANIELS-Old-No-7-Thennessee-Sour-Mash-700-ml-1151131_a.jpg",
    "jack daniels honey botella (375 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449314/Whisky-JACK-DANIELS-Tennessee-Honey-700-ml-1151132_a.jpg",
    "jack daniels botella shot (50 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449313/Whisky-JACK-DANIELS-Old-No-7-Thennessee-Sour-Mash-700-ml-1151131_a.jpg",
    "something special botella (700 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449308/Whisky-SOMETHING-especial-blended-Scotch-750-ml-1151126_a.jpg",
    "something special botella (375 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449310/Whisky-SOMETHING-blended-Scotch-350-ml-1151128_a.jpg",
    "something special botella (200 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449308/Whisky-SOMETHING-especial-blended-Scotch-750-ml-1151126_a.jpg",
    "something special botella (1000 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449309/Whisky-SOMETHING-especial-blended-Scotch-1000-ml-1151127_a.jpg",
    "the glenlivet botella (700 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449294/Whisky-GLENLIVET-single-malt-12-anos-700-ml-1151183_a.jpg",
    "the glenlivet 12 years botella (700 ml)": "https://exitocol.vteximg.com.br/arquivos/ids/34449294/Whisky-GLENLIVET-single-malt-12-anos-700-ml-1151183_a.jpg"
}

def find_candidate_for_product(p):
    norm_full = normalize_text(p["full_name"])
    
    # Exact overrides
    for k, url in EXACT_OVERRIDES.items():
        if k in norm_full or norm_full in k:
            return {"candidate_name": f"VERIFIED: {k}", "imageUrl": url, "confidence": "EXACT_VERIFIED"}

    t_brand = get_target_brand(p["full_name"])
    t_vol = extract_volume(p["presentation"] or p["full_name"])
    t_box = is_box_presentation(p["full_name"])
    t_tokens = [tok for tok in norm_full.split() if tok not in ["de", "del", "la", "el", "en", "con", "y", "botella", "media", "cuarto", "litro", "garrafa", "ml", "personal"]]

    best_cand = None
    best_score = -100

    for c in cand_list:
        c_norm = normalize_text(c["name"])
        c_vol = extract_volume(c["name"])
        c_box = is_box_presentation(c["name"])
        
        # Mandatory brand match
        if t_brand:
            brand_aliases = BRAND_MAP[t_brand]
            if not any(re.search(r'\b' + re.escape(al) + r'\b', c_norm) for al in brand_aliases):
                continue
        else:
            if t_tokens and t_tokens[0] not in c_norm:
                continue
                
        if t_box != c_box and (t_box or c_box):
            continue
            
        if any(w in c_norm for w in ["caminadora", "trotadora", "cafe molido", "estuche vacio", "camiseta", "termo", "vaso", "sudadera", "desodorante", "vajilla", "reloj"]):
            continue

        score = 0
        if t_vol and c_vol and t_vol == c_vol:
            score += 40
        elif t_vol and c_vol and t_vol != c_vol:
            score -= 30

        overlap = sum(1 for tok in t_tokens if tok in c_norm)
        score += (overlap / len(t_tokens)) * 60

        for kw in ["3 anos", "5 anos", "8 anos", "12 anos", "18 anos", "reposado", "blanco", "plata", "silver", "anejo", "cristalino", "master", "two souls", "honey", "apple", "tamarindo", "lulo", "ice", "mojito", "mandarina", "limon", "pina colada", "triple sec", "amaretto", "cafe"]:
            if kw in norm_full and kw in c_norm:
                score += 30
            elif kw in norm_full and kw not in c_norm:
                score -= 40
            elif kw not in norm_full and kw in c_norm:
                score -= 30

        if score > best_score:
            best_score = score
            best_cand = c

    if best_cand and best_score >= 30:
        return {"candidate_name": best_cand["name"], "imageUrl": best_cand["imageUrl"], "confidence": f"AUTO_{best_score:.0f}"}
        
    return None

final_plan = []
unmapped = []

for p in needs_search:
    cand = find_candidate_for_product(p)
    if cand:
        final_plan.append({
            "target": p,
            "imageUrl": cand["imageUrl"],
            "candidate_name": cand["candidate_name"],
            "confidence": cand["confidence"],
            "dest_filename": f"{sanitize_filename(p['full_name'])}.webp"
        })
    else:
        unmapped.append(p)

print(f"Total targets: {len(needs_search)}")
print(f"Successfully mapped with images: {len(final_plan)}")
print(f"Unmapped: {len(unmapped)}")

with open("scripts/final_catalog_plan.json", "w", encoding="utf-8") as f:
    json.dump(final_plan, f, indent=2, ensure_ascii=False)
