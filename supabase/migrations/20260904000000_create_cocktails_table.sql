-- ==============================================================================
-- Migración: Tabla de Coctelería de Autor (cocktails)
-- Proyecto: Diverpremier Búnker
-- Descripción: Almacenamiento estructurado de recetas de mixología premium, 
--              incluyendo licor base, cristalería, ingredientes en JSONB, 
--              técnica de mezcla (how_to_mix), servicio (how_to_serve) y decoración (how_to_garnish).
--              Todo el contenido y etiquetas se encuentran 100% en español.
-- ==============================================================================

-- 1. Creación Idempotente de la Tabla cocktails
CREATE TABLE IF NOT EXISTS cocktails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    base_liquor TEXT,
    description TEXT,
    history TEXT,
    glass_type TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    how_to_mix TEXT,
    how_to_serve TEXT,
    how_to_garnish TEXT,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Comentarios de Documentación de Columnas
COMMENT ON TABLE cocktails IS 'Catálogo de cócteles de autor y mixología insignia de Diverpremier';
COMMENT ON COLUMN cocktails.id IS 'Identificador único UUID del cóctel';
COMMENT ON COLUMN cocktails.name IS 'Nombre del cóctel (ej: El Patriarca, Atardecer Guambiano)';
COMMENT ON COLUMN cocktails.base_liquor IS 'Destilado insignia base (ej: Ron Viejo de Caldas, Aguardiente Amarillo, Tequila José Cuervo)';
COMMENT ON COLUMN cocktails.description IS 'Descripción sensorial y tributo del cóctel';
COMMENT ON COLUMN cocktails.history IS 'Compatibilidad retroactiva con UI: historia o contexto del cóctel';
COMMENT ON COLUMN cocktails.glass_type IS 'Tipo de cristalería recomendada (ej: Vaso Corto, Vaso Alto Collins, Copa Balón, Copa Coupé)';
COMMENT ON COLUMN cocktails.ingredients IS 'Arreglo JSONB con objetos estructurados: [{"qty": "2 oz", "item": "Ron Viejo de Caldas"}]';
COMMENT ON COLUMN cocktails.how_to_mix IS 'Técnica de preparación y agite (coctelera, built, muddle, tiempos)';
COMMENT ON COLUMN cocktails.how_to_serve IS 'Método de colado (doble colado, colado simple) y temperatura';
COMMENT ON COLUMN cocktails.how_to_garnish IS 'Decoración, twist cítrico, activación de hierbas y aromáticos';
COMMENT ON COLUMN cocktails.instructions IS 'Pasos secuenciales en español con etiquetas (AGITAR, MACERAR, PREPARAR EN VASO, REMOVER, SERVIR, DECORAR)';
COMMENT ON COLUMN cocktails.image_url IS 'Ruta relativa o URL pública de la imagen del producto para render 3D';

-- 3. Configuración de Seguridad por Nivel de Fila (RLS)
ALTER TABLE cocktails ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'cocktails' AND policyname = 'Public read cocktails'
    ) THEN
        CREATE POLICY "Public read cocktails" ON cocktails FOR SELECT USING (true);
    END IF;
END $$;

-- 4. Sembrado Inicial de los 6 Cócteles Insignia (100% en Español)
INSERT INTO cocktails (
    name, 
    base_liquor, 
    description, 
    history, 
    glass_type, 
    ingredients, 
    how_to_mix, 
    how_to_serve, 
    how_to_garnish, 
    instructions, 
    image_url
)
VALUES 
-- 1. El Patriarca
(
    'El Patriarca',
    'Ron Viejo de Caldas',
    'Un tributo a la complejidad del ron añejo, balanceado con el dulzor profundo de la panela y el amargor del café colombiano.',
    'Un tributo a la complejidad del ron añejo, balanceado con el dulzor profundo de la panela y el amargor del café colombiano.',
    'Vaso Corto (Old Fashioned)',
    '[
        {"qty": "2 oz", "item": "Ron Viejo de Caldas"},
        {"qty": "1 oz", "item": "Melao de panela espeso (con toque de canela)"},
        {"qty": "3/4 oz", "item": "Zumo de limón de castilla fresco"},
        {"qty": "1 golpe (dash)", "item": "Bitters de café o chocolate"}
    ]'::jsonb,
    'En una coctelera con abundante hielo, añade el Ron Viejo de Caldas, el melao de panela, el zumo de limón y el dash de bitters. Agita enérgicamente (shake) durante 12-15 segundos hasta que la coctelera esté completamente helada por fuera.',
    'Haz un doble colado (usando el colador de la coctelera y un colador de malla fina) sobre un vaso corto (Old Fashioned) que tenga un único cubo de hielo grande para evitar la dilución rápida.',
    'Decora con una piel (twist) de naranja. Exprime los aceites de la piel sobre la superficie del cóctel y luego deposítala artísticamente sobre el hielo. Si quieres un toque extra, puedes raspar un grano de café tostado encima.',
    '[
        "AGITAR: En una coctelera con abundante hielo, añade el Ron Viejo de Caldas, el melao de panela, el zumo de limón y el dash de bitters. Agita enérgicamente durante 12-15 segundos hasta que esté bien helada.",
        "SERVIR: Haz un doble colado (usando el colador de la coctelera y malla fina) sobre un vaso corto con un único cubo de hielo grande para evitar la dilución rápida.",
        "DECORAR: Decora con una piel (twist) de naranja exprimiendo sus aceites sobre la superficie. Opcional: raspa un grano de café tostado encima."
    ]'::jsonb,
    '/images/products/whisky.png'
),
-- 2. Atardecer Guambiano
(
    'Atardecer Guambiano',
    'Aguardiente Amarillo de Manzanares',
    'El aguardiente amarillo tiene notas endulzadas y de caña que juegan perfecto con elementos cítricos y herbáceos, alejándose del clásico "shott".',
    'El aguardiente amarillo tiene notas endulzadas y de caña que juegan perfecto con elementos cítricos y herbáceos, alejándose del clásico "shott".',
    'Vaso Alto (Collins)',
    '[
        {"qty": "2 oz", "item": "Aguardiente Amarillo de Manzanares"},
        {"qty": "1 1/2 oz", "item": "Zumo de lulo natural (licuado y colado, sin azúcar)"},
        {"qty": "3/4 oz", "item": "Jarabe simple (agua y azúcar)"},
        {"qty": "4 o 5 hojas", "item": "Hierbabuena fresca"}
    ]'::jsonb,
    'En el fondo de la coctelera, presiona suavemente las hojas de hierbabuena con el jarabe simple usando un mortero (sin romperlas para que no amarguen). Añade el Aguardiente Amarillo, el zumo de lulo y hielo. Agita con fuerza para emulsionar la densidad del lulo.',
    'Sirve con un colado sencillo en un vaso alto (Collins) repleto de hielo picado (crushed ice).',
    'Corona el vaso con un cogollo abundante de hierbabuena (dale un aplauso previo entre tus manos para despertar los aromas) y una rodaja deshidratada de limón o lulo en el borde.',
    '[
        "MACERAR: En el fondo de la coctelera, presiona suavemente las hojas de hierbabuena con el jarabe simple usando un mortero (sin romperlas para que no amarguen).",
        "AGITAR: Añade el Aguardiente Amarillo, el zumo de lulo y hielo. Agita con fuerza para emulsionar la densidad del lulo.",
        "SERVIR: Sirve con colado sencillo en un vaso alto repleto de hielo picado.",
        "DECORAR: Corona el vaso con un cogollo abundante de hierbabuena (activado con un aplauso entre las manos) y una rodaja deshidratada de limón o lulo en el borde."
    ]'::jsonb,
    '/images/products/aguardiente.png'
),
-- 3. Pacífico Sunset
(
    'Pacífico Sunset',
    'Tequila José Cuervo',
    'Una fusión entre la potencia del agave mexicano y la frescura tropical del maracuyá colombiano, balanceado con un borde picante-salado.',
    'Una fusión entre la potencia del agave mexicano y la frescura tropical del maracuyá colombiano, balanceado con un borde picante-salado.',
    'Copa Margarita o Coupé',
    '[
        {"qty": "2 oz", "item": "Tequila José Cuervo (Blanco o Reposado)"},
        {"qty": "1 1/2 oz", "item": "Zumo de maracuyá puro (sin diluir en agua)"},
        {"qty": "3/4 oz", "item": "Licor de naranja (Triple Sec o Controy)"},
        {"qty": "1/2 oz", "item": "Jarabe de agave o jarabe simple"}
    ]'::jsonb,
    'Introduce todos los ingredientes en la coctelera junto con hielo plano. Agita con fuerza durante unos 10 segundos para lograr una buena integración y enfriamiento.',
    'Sirve en una copa tipo Margarita o copa Coupé previamente enfriada. El cóctel se sirve sin hielo en la copa.',
    'Antes de servir, escarcha la mitad del borde de la copa pasando un trozo de limón y pasándolo por una mezcla de sal marina y una pizca de ají en polvo o Tajín. Termina flotando una rodaja fina de limón verde.',
    '[
        "AGITAR: Introduce todos los ingredientes en la coctelera junto con hielo plano. Agita con fuerza durante unos 10 segundos para integrar y enfriar.",
        "SERVIR: Sirve en una copa tipo Margarita o copa Coupé previamente enfriada (sin hielo en la copa).",
        "DECORAR: Antes de servir, escarcha la mitad del borde de la copa con limón, sal marina y Tajín o ají en polvo. Termina flotando una rodaja fina de limón verde."
    ]'::jsonb,
    'https://upload.wikimedia.org/wikipedia/commons/3/32/MargaritaReal.jpg'
),
-- 4. Selva Británica
(
    'Selva Británica',
    'Ginebra Gordon''s',
    'Un perfil botánico y ultra refrescante que aprovecha la acidez limpia del limón mandarino para cortar las notas de enebro de la ginebra.',
    'Un perfil botánico y ultra refrescante que aprovecha la acidez limpia del limón mandarino para cortar las notas de enebro de la ginebra.',
    'Copa Balón o Vaso Alto',
    '[
        {"qty": "2 oz", "item": "Ginebra Gordon''s"},
        {"qty": "1 oz", "item": "Zumo de limón mandarino fresco"},
        {"qty": "3/4 oz", "item": "Jarabe simple"},
        {"qty": "Completar con", "item": "Agua tónica premium"}
    ]'::jsonb,
    'Este cóctel se construye directamente en el vaso (built). Llena una copa de balón o vaso alto con cubos de hielo grandes. Añade la ginebra, el zumo de limón mandarino y el jarabe simple. Remueve suavemente con la cuchara de bar para enfriar la base. Finalmente, añade el agua tónica lentamente para no perder la burbuja.',
    'Se sirve directamente en la copa de balón donde se preparó.',
    'Una rodaja gruesa de limón mandarino en el interior de la copa y una ramita de romero fresco ligeramente quemada en la punta con un encendedor para aportar un aroma ahumado brutal al primer sorbo.',
    '[
        "PREPARAR EN VASO: Llena una copa de balón o vaso alto con cubos de hielo grandes. Añade la ginebra, el zumo de limón mandarino y el jarabe simple.",
        "REMOVER: Remueve suavemente con la cuchara de bar para enfriar la base.",
        "SERVIR: Añade el agua tónica lentamente para no perder la burbuja.",
        "DECORAR: Agrega una rodaja gruesa de limón mandarino en el interior y una ramita de romero fresco ligeramente quemada en la punta con encendedor para aportar aroma ahumado."
    ]'::jsonb,
    'https://upload.wikimedia.org/wikipedia/commons/3/3d/Tanqueray_bottle.JPG'
),
-- 5. Refajo de Autor
(
    'Refajo de Autor',
    'Cerveza Lager / Rubia',
    'Llevamos el clásico refajo de las celebraciones colombianas a un nivel de coctelería estilizado, utilizando notas amargas y cítricas.',
    'Llevamos el clásico refajo de las celebraciones colombianas a un nivel de coctelería estilizado, utilizando notas amargas y cítricas.',
    'Vaso Cervecero / Pinta o Copón',
    '[
        {"qty": "4 oz", "item": "Cerveza Lager nacional o Rubia artesanal ligera"},
        {"qty": "2 oz", "item": "Gaseosa Colombiana tradicional"},
        {"qty": "1 oz", "item": "Bitter Rojo (tipo Campari)"},
        {"qty": "1/2 oz", "item": "Zumo de limón de castilla"}
    ]'::jsonb,
    'En un vaso cervecero o jarra helada, añade primero el zumo de limón y el Bitter Rojo. Incorpora la gaseosa Colombiana fría y, por último, vierte la cerveza inclinando el vaso para controlar la espuma. Remueve una sola vez de abajo hacia arriba de forma muy sutil con la cuchara de bar.',
    'Se sirve bien frío en un vaso tipo pinta o un copón cervecero con un par de cubos de hielo grandes si se desea mantener la temperatura exterior.',
    'Un borde sutil de sal de gusano o sal marina fina con pimienta, y una rodaja de limón cruzada en el borde del vaso.',
    '[
        "PREPARAR EN VASO: En un vaso cervecero o jarra helada, añade primero el zumo de limón y el Bitter Rojo.",
        "SERVIR: Incorpora la gaseosa Colombiana fría y vierte la cerveza inclinando el vaso para controlar la espuma.",
        "REMOVER: Remueve una sola vez de abajo hacia arriba de forma muy sutil con la cuchara de bar.",
        "DECORAR: Decora con un borde sutil de sal de gusano o sal marina fina con pimienta, y una rodaja de limón cruzada en el borde del vaso."
    ]'::jsonb,
    '/images/products/cerveza.png'
),
-- 6. Frailejón Frost
(
    'Frailejón Frost',
    'Vodka',
    'Aprovechando la neutralidad del vodka, creamos un cóctel sedoso, herbal y de notas andinas usando una infusión de té verde y el frescor del pepino.',
    'Aprovechando la neutralidad del vodka, creamos un cóctel sedoso, herbal y de notas andinas usando una infusión de té verde y el frescor del pepino.',
    'Vaso Corto o Copa Coupé Helada',
    '[
        {"qty": "2 oz", "item": "Vodka"},
        {"qty": "1 1/2 oz", "item": "Té verde concentrado (frío)"},
        {"qty": "3/4 oz", "item": "Zumo de limón común"},
        {"qty": "3 rodajas", "item": "Pepino cohombro"},
        {"qty": "3/4 oz", "item": "Jarabe simple"}
    ]'::jsonb,
    'En la coctelera, macera firmemente las rodajas de pepino junto con el jarabe simple y el zumo de limón. Agrega el vodka, el té verde concentrado y abundante hielo. Agita vigorosamente durante 12 segundos para romper el pepino e integrar su frescura con el alcohol.',
    'Pasa la mezcla a través de un doble colado (imprescindible para retirar las semillas y pulpa del pepino) y sírvelo en un vaso corto con hielo fresco picado o en una copa tipo Coupé helada sin hielo.',
    'Corta una lámina muy fina y alargada de pepino a lo largo con un pelador de papas y adhiérela a la pared interna del vaso antes de servir, logrando un efecto visual verde y elegante.',
    '[
        "MACERAR: En la coctelera, macera firmemente las rodajas de pepino junto con el jarabe simple y el zumo de limón.",
        "AGITAR: Agrega el vodka, el té verde concentrado y abundante hielo. Agita vigorosamente durante 12 segundos para integrar la frescura.",
        "SERVIR: Pasa por doble colado fino y sírvelo en un vaso corto con hielo fresco picado o en copa Coupé helada sin hielo.",
        "DECORAR: Corta una lámina muy fina y alargada de pepino y adhiérela a la pared interna del vaso antes de servir."
    ]'::jsonb,
    'https://upload.wikimedia.org/wikipedia/commons/b/b9/Grey_Goose_Bottle.jpg'
)
ON CONFLICT (name) DO UPDATE SET
    base_liquor = EXCLUDED.base_liquor,
    description = EXCLUDED.description,
    history = EXCLUDED.history,
    glass_type = EXCLUDED.glass_type,
    ingredients = EXCLUDED.ingredients,
    how_to_mix = EXCLUDED.how_to_mix,
    how_to_serve = EXCLUDED.how_to_serve,
    how_to_garnish = EXCLUDED.how_to_garnish,
    instructions = EXCLUDED.instructions,
    image_url = EXCLUDED.image_url;
