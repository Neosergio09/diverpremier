import os
import sys
import json
import re
import requests
import io
from PIL import Image

def get_env():
    env = {}
    with open(".env") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def normalize_text(text):
    text = text.lower()
    replacements = [
        ('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'), ('ñ', 'n'),
        ("'", ""), ("’", ""), ('"', ''), ('.', ' '), (',', ' '), ('-', ' ')
    ]
    for a, b in replacements:
        text = text.replace(a, b)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_volume(text):
    # look for ml or l
    m = re.search(r'(\d+)\s*(ml|cc|l|lt|litro|litros|onzas|oz)', text.lower())
    if m:
        val = int(m.group(1))
        unit = m.group(2)
        if unit in ['l', 'lt', 'litro', 'litros'] and val < 20:
            return val * 1000
        return val
    if 'garrafa' in text.lower():
        return 2000
    if 'media' in text.lower():
        return 375
    if 'cuarto' in text.lower():
        return 250
    return None

def is_box_presentation(text):
    t = text.lower()
    return 'caja' in t or 'tetra' in t or 'pack' in t

def sanitize_filename(name):
    name = name.lower()
    replacements = [('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'), ('ñ', 'n')]
    for a, b in replacements:
        name = name.replace(a, b)
    name = re.sub(r'[^a-z0-9_-]', '_', name)
    name = re.sub(r'_+', '_', name)
    return name.strip('_')

print("Pipeline helper loaded.")
