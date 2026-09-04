# Diverpremier Application Knowledge Base & Architecture Map

This document serves as the official, machine-readable architectural map and knowledge base for the **Diverpremier Astro Application**. It describes the configuration, file layout, dependency graph, component indexing, and design patterns utilized in this project.

---

## 1. Directory Structure Tree
The plain-text tree below represents the file structure of the Diverpremier project. Folders like `node_modules`, `.git`, `.astro`, `.vercel`, and `dist` have been excluded for clarity.

```text
Diverpremier/
├── README.md
├── KNOWLEDGE_BASE.md                      # [THIS FILE] Project architecture & mapping
├── astro.config.mjs                      # Astro config (SSR, Vercel Adapter, remote assets)
├── package-lock.json                     # Lockfile for reproducible builds
├── package.json                          # Dependencies & build scripts (Astro v6, Tailwind v4, Nano Stores)
├── tsconfig.json                         # TypeScript compiler & path alias configurations
├── public/                               # Static assets served from the root
│   ├── favicon.ico
│   ├── favicon.svg
│   └── images/                           # Local images and icons
│       ├── aguardiente_category_1773765783024.png
│       ├── beer_category_1773765817013.png
│       ├── snacks_category_1773765832831.png
│       ├── whisky_category_1773765800177.png
│       └── products/                     # Product fallback image assets
│           ├── aguardiente.png
│           ├── cerveza.png
│           └── whisky.png
├── src/                                  # Main application source directory
│   ├── middleware.ts                     # Protects `/admin` paths & verifies Supabase authentication
│   ├── components/                       # Shared UI building blocks
│   │   ├── cart/
│   │   │   └── CartDrawer.astro          # [ACTIVE] Main slider drawer containing checkout
│   │   ├── checkout/
│   │   │   └── CheckoutForm.astro        # Checkout payment and address module
│   │   ├── store/
│   │   │   └── CartDrawer.astro          # [DEPRECATED] Unused duplicate of CartDrawer
│   │   └── ui/
│   │       ├── AgeGate.astro             # Adult-only modal checks (saves to localStorage)
│   │       ├── CocktailModal.astro       # Detailed view for cocktails (Nano Stores trigger)
│   │       ├── FloatingCocktailCard.astro# UI element showcasing a cocktail recipe card
│   │       ├── Footer.astro              # Global footer component
│   │       ├── LiquidBackground.astro    # High-performance HTML5 canvas effervescent bubbles & liquid waves (Dark/Light aware)
│   │       ├── MagicNavbar.astro         # Float dock or supplementary navigations
│   │       ├── Navbar.astro              # Primary navigation header
│   │       └── ThemeToggle.astro         # Light / Dark mode switcher button
│   ├── layouts/                          # Core page shell designs
│   │   ├── AdminLayout.astro             # Core layout with admin sidebar (Dashboard, Pedidos, Inventario)
│   │   └── MainLayout.astro              # Core layout for client-facing public view
│   ├── lib/                              # Logic utilities & API connectors
│   │   ├── formatters.ts                 # Currency (COP) formatters & numeric filters
│   │   └── supabase.ts                   # Client-side Supabase client initialization
│   ├── pages/                            # Endpoint mapping directory (Routing)
│   │   ├── cocteleria.astro              # Public Cocktail Recipes section
│   │   ├── index.astro                   # Public Homepage (Arsenal, Favoritos)
│   │   ├── login.astro                   # Admin Auth Entry portal
│   │   ├── mapa.astro                    # Logistics & location mapping information
│   │   ├── nosotros.astro                # Brand background page
│   │   ├── productos.astro               # Product Catalog browser with interactive filters
│   │   ├── admin/                        # SSR Admin panels (Requires Authentication)
│   │   │   ├── index.astro               # Stats overview and KPI panel
│   │   │   ├── inventario.astro          # Catalog editor (supports editing and CSV uploads)
│   │   │   └── pedidos.astro             # Orders manager (status selector and validation)
│   │   └── api/                          # Serverless SSR API endpoints
│   │       ├── bulk-products.ts          # POST - Bulk uploads products & inserts categories
│   │       ├── create-order.ts           # POST - Submits newly created carts to db
│   │       ├── update-order.ts           # PATCH - Updates order verification statuses
│   │       └── update-product.ts         # PATCH - Updates attributes of products
│   ├── store/                            # Client-side global reactive state
│   │   ├── cartStore.ts                  # Cart items, counts, totals, and mutations (Nano Stores)
│   │   └── cocktailStore.ts              # Selection state for cocktail detail modals (Nano Stores)
│   ├── styles/                           # Stylings
│   │   └── global.css                    # Tailwind CSS imports & custom variables/classes
│   └── types/                            # Type safety declarations
│       ├── database.ts                   # Generated/Inferred DB schema definitions
│       └── index.ts                      # Shared TypeScript domain models
└── supabase/                             # Database infrastructure
    └── migrations/
        └── 20260325000000_bunker_logic.sql # Database schema (tables, triggers, and views)
```

---

## 2. Core Config & Global Dependency Map

### 2.1 Dependencies (`package.json`)
* **Framework:** `astro` (^7.3.1) running in **Server Side Rendering (SSR)** mode (`output: "server"`), using Vite 8 and Rolldown with Rust compiler.
* **Styling:** `tailwindcss` (^4.3.3) using the Vite plugin `@tailwindcss/vite` (^4.3.3).
* **State Management:** `nanostores` (^1.5.3) for reactive client-side store sync.
* **Database client:** `@supabase/supabase-js` (^2.114.0) for direct connections to Supabase.
* **Animation & Icons:** `gsap` (^3.15.0) for animations, and `lucide-astro` (^0.556.0) for iconography.
* **Deployment Adapter:** `@astrojs/vercel` (^11.0.10) to compile Astro API routes and SSR pages for Vercel.
* **Type Checking:** `typescript` (^6.0.3) and `@astrojs/check` (^0.9.10).

### 2.2 Compilation Path Mapping (`tsconfig.json`)
The application defines compile aliases to support clean import paths across components:
* `@styles/*` $\rightarrow$ `src/styles/*`
* `@components/*` $\rightarrow$ `src/components/*`
* `@layouts/*` $\rightarrow$ `src/layouts/*`
* `@lib/*` $\rightarrow$ `src/lib/*`

### 2.3 Astro Settings (`astro.config.mjs`)
* Configured in dynamic server mode: `output: 'server'`.
* Powered by `vercel()` adapter for serverless deployment.
* Configured image optimization domains: `placehold.co`, `images.unsplash.com`, `upload.wikimedia.org`, and Supabase domain `**.supabase.co`.
* Embedded Vite plugin config: `plugins: [tailwindcss()]`.

---

## 3. JSON Dependency Graph

This JSON object represents the static import graph of the source files in `src/`. Each node contains the relative path, a list of resolved local imports, and external/framework imports.

```json
{
  "src/components/cart/CartDrawer.astro": {
    "path": "src/components/cart/CartDrawer.astro",
    "imports": [
      {
        "raw": "../checkout/CheckoutForm.astro",
        "resolved": "src/components/checkout/CheckoutForm.astro"
      },
      {
        "raw": "../../store/cartStore",
        "resolved": "src/store/cartStore.ts"
      },
      {
        "raw": "../../lib/formatters",
        "resolved": "src/lib/formatters.ts"
      }
    ],
    "external": [
      "lucide-astro"
    ]
  },
  "src/components/checkout/CheckoutForm.astro": {
    "path": "src/components/checkout/CheckoutForm.astro",
    "imports": [
      {
        "raw": "../../store/cartStore",
        "resolved": "src/store/cartStore.ts"
      },
      {
        "raw": "../../lib/formatters",
        "resolved": "src/lib/formatters.ts"
      }
    ],
    "external": []
  },
  "src/components/store/CartDrawer.astro": {
    "path": "src/components/store/CartDrawer.astro",
    "imports": [
      {
        "raw": "../../store/cartStore",
        "resolved": "src/store/cartStore.ts"
      }
    ],
    "external": [
      "lucide-astro"
    ]
  },
  "src/components/ui/AgeGate.astro": {
    "path": "src/components/ui/AgeGate.astro",
    "imports": [],
    "external": []
  },
  "src/components/ui/CocktailModal.astro": {
    "path": "src/components/ui/CocktailModal.astro",
    "imports": [
      {
        "raw": "../../store/cocktailStore",
        "resolved": "src/store/cocktailStore.ts"
      }
    ],
    "external": []
  },
  "src/components/ui/FloatingCocktailCard.astro": {
    "path": "src/components/ui/FloatingCocktailCard.astro",
    "imports": [],
    "external": []
  },
  "src/components/ui/Footer.astro": {
    "path": "src/components/ui/Footer.astro",
    "imports": [],
    "external": []
  },
  "src/components/ui/LiquidBackground.astro": {
    "path": "src/components/ui/LiquidBackground.astro",
    "imports": [],
    "external": []
  },
  "src/components/ui/MagicNavbar.astro": {
    "path": "src/components/ui/MagicNavbar.astro",
    "imports": [],
    "external": [
      "lucide-astro"
    ]
  },
  "src/components/ui/Navbar.astro": {
    "path": "src/components/ui/Navbar.astro",
    "imports": [
      {
        "raw": "./ThemeToggle.astro",
        "resolved": "src/components/ui/ThemeToggle.astro"
      }
    ],
    "external": [
      "lucide-astro"
    ]
  },
  "src/components/ui/ThemeToggle.astro": {
    "path": "src/components/ui/ThemeToggle.astro",
    "imports": [],
    "external": [
      "lucide-astro"
    ]
  },
  "src/layouts/AdminLayout.astro": {
    "path": "src/layouts/AdminLayout.astro",
    "imports": [
      {
        "raw": "@styles/global.css",
        "resolved": "src/styles/global.css"
      }
    ],
    "external": [
      "astro:transitions"
    ]
  },
  "src/layouts/MainLayout.astro": {
    "path": "src/layouts/MainLayout.astro",
    "imports": [
      {
        "raw": "@components/ui/Navbar.astro",
        "resolved": "src/components/ui/Navbar.astro"
      },
      {
        "raw": "@components/ui/LiquidBackground.astro",
        "resolved": "src/components/ui/LiquidBackground.astro"
      },
      {
        "raw": "@components/ui/MagicNavbar.astro",
        "resolved": "src/components/ui/MagicNavbar.astro"
      },
      {
        "raw": "@components/ui/AgeGate.astro",
        "resolved": "src/components/ui/AgeGate.astro"
      },
      {
        "raw": "@components/cart/CartDrawer.astro",
        "resolved": "src/components/cart/CartDrawer.astro"
      },
      {
        "raw": "@components/ui/Footer.astro",
        "resolved": "src/components/ui/Footer.astro"
      },
      {
        "raw": "@styles/global.css",
        "resolved": "src/styles/global.css"
      }
    ],
    "external": [
      "astro:transitions"
    ]
  },
  "src/lib/formatters.ts": {
    "path": "src/lib/formatters.ts",
    "imports": [],
    "external": []
  },
  "src/lib/supabase.ts": {
    "path": "src/lib/supabase.ts",
    "imports": [],
    "external": [
      "@supabase/supabase-js"
    ]
  },
  "src/middleware.ts": {
    "path": "src/middleware.ts",
    "imports": [
      {
        "raw": "./lib/supabase",
        "resolved": "src/lib/supabase.ts"
      }
    ],
    "external": [
      "astro:middleware"
    ]
  },
  "src/pages/admin/index.astro": {
    "path": "src/pages/admin/index.astro",
    "imports": [
      {
        "raw": "@layouts/AdminLayout.astro",
        "resolved": "src/layouts/AdminLayout.astro"
      },
      {
        "raw": "@lib/supabase",
        "resolved": "src/lib/supabase.ts"
      }
    ],
    "external": []
  },
  "src/pages/admin/inventario.astro": {
    "path": "src/pages/admin/inventario.astro",
    "imports": [
      {
        "raw": "@layouts/AdminLayout.astro",
        "resolved": "src/layouts/AdminLayout.astro"
      },
      {
        "raw": "@lib/supabase",
        "resolved": "src/lib/supabase.ts"
      },
      {
        "raw": "@lib/formatters",
        "resolved": "src/lib/formatters.ts"
      }
    ],
    "external": []
  },
  "src/pages/admin/pedidos.astro": {
    "path": "src/pages/admin/pedidos.astro",
    "imports": [
      {
        "raw": "@layouts/AdminLayout.astro",
        "resolved": "src/layouts/AdminLayout.astro"
      },
      {
        "raw": "@lib/supabase",
        "resolved": "src/lib/supabase.ts"
      },
      {
        "raw": "@lib/formatters",
        "resolved": "src/lib/formatters.ts"
      }
    ],
    "external": []
  },
  "src/pages/api/bulk-products.ts": {
    "path": "src/pages/api/bulk-products.ts",
    "imports": [],
    "external": [
      "astro",
      "@supabase/supabase-js"
    ]
  },
  "src/pages/api/create-order.ts": {
    "path": "src/pages/api/create-order.ts",
    "imports": [],
    "external": [
      "astro",
      "@supabase/supabase-js"
    ]
  },
  "src/pages/api/update-order.ts": {
    "path": "src/pages/api/update-order.ts",
    "imports": [],
    "external": [
      "astro",
      "@supabase/supabase-js"
    ]
  },
  "src/pages/api/update-product.ts": {
    "path": "src/pages/api/update-product.ts",
    "imports": [],
    "external": [
      "astro",
      "@supabase/supabase-js"
    ]
  },
  "src/pages/cocteleria.astro": {
    "path": "src/pages/cocteleria.astro",
    "imports": [
      {
        "raw": "@layouts/MainLayout.astro",
        "resolved": "src/layouts/MainLayout.astro"
      },
      {
        "raw": "@components/ui/CocktailModal.astro",
        "resolved": "src/components/ui/CocktailModal.astro"
      },
      {
        "raw": "@components/ui/FloatingCocktailCard.astro",
        "resolved": "src/components/ui/FloatingCocktailCard.astro"
      },
      {
        "raw": "@lib/supabase",
        "resolved": "src/lib/supabase.ts"
      },
      {
        "raw": "../store/cocktailStore",
        "resolved": "src/store/cocktailStore.ts"
      }
    ],
    "external": []
  },
  "src/pages/index.astro": {
    "path": "src/pages/index.astro",
    "imports": [
      {
        "raw": "../layouts/MainLayout.astro",
        "resolved": "src/layouts/MainLayout.astro"
      },
      {
        "raw": "@lib/formatters",
        "resolved": "src/lib/formatters.ts"
      }
    ],
    "external": [
      "astro:assets",
      "lucide-astro"
    ]
  },
  "src/pages/login.astro": {
    "path": "src/pages/login.astro",
    "imports": [
      {
        "raw": "@layouts/MainLayout.astro",
        "resolved": "src/layouts/MainLayout.astro"
      },
      {
        "raw": "@components/ui/LiquidBackground.astro",
        "resolved": "src/components/ui/LiquidBackground.astro"
      },
      {
        "raw": "../lib/supabase",
        "resolved": "src/lib/supabase.ts"
      }
    ],
    "external": []
  },
  "src/pages/mapa.astro": {
    "path": "src/pages/mapa.astro",
    "imports": [
      {
        "raw": "../layouts/MainLayout.astro",
        "resolved": "src/layouts/MainLayout.astro"
      }
    ],
    "external": [
      "lucide-astro"
    ]
  },
  "src/pages/nosotros.astro": {
    "path": "src/pages/nosotros.astro",
    "imports": [
      {
        "raw": "../layouts/MainLayout.astro",
        "resolved": "src/layouts/MainLayout.astro"
      }
    ],
    "external": [
      "lucide-astro"
    ]
  },
  "src/pages/productos.astro": {
    "path": "src/pages/productos.astro",
    "imports": [
      {
        "raw": "../layouts/MainLayout.astro",
        "resolved": "src/layouts/MainLayout.astro"
      },
      {
        "raw": "../lib/supabase",
        "resolved": "src/lib/supabase.ts"
      },
      {
        "raw": "../lib/formatters",
        "resolved": "src/lib/formatters.ts"
      },
      {
        "raw": "../store/cartStore",
        "resolved": "src/store/cartStore.ts"
      }
    ],
    "external": [
      "astro:assets"
    ]
  },
  "src/store/cartStore.ts": {
    "path": "src/store/cartStore.ts",
    "imports": [],
    "external": [
      "nanostores"
    ]
  },
  "src/store/cocktailStore.ts": {
    "path": "src/store/cocktailStore.ts",
    "imports": [],
    "external": [
      "nanostores"
    ]
  },
  "src/styles/global.css": {
    "path": "src/styles/global.css",
    "imports": [],
    "external": [
      "tailwindcss"
    ]
  },
  "src/types/database.ts": {
    "path": "src/types/database.ts",
    "imports": [],
    "external": []
  },
  "src/types/index.ts": {
    "path": "src/types/index.ts",
    "imports": [],
    "external": []
  }
}
```

---

## 4. Architectural Building Blocks Index

The Diverpremier architecture is organized into four main layers (Pages/Endpoints, UI Components, Layout Wrappers, and API Integrations):

### 4.1 Routes & Endpoints (`src/pages/`)
All page files in `src/pages/` are resolved dynamically as routes on the server:
* [index.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/index.astro): Public homepage presenting drink categories ("El arsenal") and popular items ("Los Favoritos").
* [productos.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/productos.astro): Searchable, filterable interactive inventory list. Uses reactive Nano Stores cart additions.
* [cocteleria.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/cocteleria.astro): Displays a recipe board of cocktails. Leverages state modals.
* [nosotros.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/nosotros.astro) and [mapa.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/mapa.astro): Standard informational pages showcasing brand history and delivery map parameters.
* [login.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/login.astro): Safe authentication bridge. Captures access tokens and stores them in cookies (`sb-access-token`, `sb-refresh-token`).
* [admin/index.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/admin/index.astro): SSR dashboard. Gathers key operational metrics.
* [admin/inventario.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/admin/inventario.astro): Real-time stock monitor allowing bulk CSV parsing and dynamic updates.
* [admin/pedidos.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/admin/pedidos.astro): Central control for tracking pending, verified, and payment-waiting orders.

### 4.2 UI Components (`src/components/`)
* **Cart Flow Module:**
  * [CartDrawer.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/cart/CartDrawer.astro): Slider drawer handling layout lists and checkout display toggles.
  * [CheckoutForm.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/checkout/CheckoutForm.astro): Collects user delivery addresses, sets payment method (Nequi, Daviplata, PSE), issues order ticket IDs, handles PATCH payments to the API, and links to WhatsApp.
* **Store Flow Module (Deprecated/Audited):**
  * [store/CartDrawer.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/store/CartDrawer.astro): An older iteration referencing WhatsApp redirects rather than structured DB endpoints. Safely identified as **unused**.
* **Global Widgets & Utility UI:**
  * [ui/AgeGate.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/ui/AgeGate.astro): Enforces a age restriction layer. Reads/writes to client-side localStorage.
  * [ui/CocktailModal.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/ui/CocktailModal.astro) & [FloatingCocktailCard.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/ui/FloatingCocktailCard.astro): Handles detail display triggers for drink recipes.
  * [ui/Navbar.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/ui/Navbar.astro) & [MagicNavbar.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/ui/MagicNavbar.astro): Navigation bars including support triggers and theme variables.
  * [ui/ThemeToggle.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/ui/ThemeToggle.astro) & [LiquidBackground.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/components/ui/LiquidBackground.astro): Handles theme switching and premium SVG animations.

### 4.3 Layout Wrappers (`src/layouts/`)
* [MainLayout.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/layouts/MainLayout.astro): Embeds client scripts (Astro page transition `ClientRouter`, initial theme settings), global font sheets, custom stylings, and inserts public headers/footers (`Navbar`, `Footer`, `AgeGate`, `CartDrawer`).
* [AdminLayout.astro](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/layouts/AdminLayout.astro): Restricts visualization bounds, loads the administrative navigation drawer (links to dashboard, inventory, orders, and analytics), and monitors backend connectivity state.

### 4.4 Serverless SSR API Routes (`src/pages/api/`)
* [api/create-order.ts](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/api/create-order.ts): Processes incoming JSON carts, generates default status (`pending_payment`), and persists the dataset in Supabase.
* [api/update-order.ts](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/api/update-order.ts): Handles patching order statuses (updates from `pending_payment` to `verification_pending`, then to `verified`).
* [api/update-product.ts](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/api/update-product.ts): Exposes patch utilities for administrators to modify name, pricing, stock levels, and associated categories.
* [api/bulk-products.ts](file:///mnt/e069394d-1499-490f-8c02-e3d8d80039a1/Proyectos/Diverpremier/src/pages/api/bulk-products.ts): Accepts product feeds, identifies non-existent category strings, inserts them first to secure relational IDs, and appends products dynamically using SQL inserts.

---

## 5. Architectural Patterns & Infrastructure Overview

### 5.1 Dynamic Hybrid Rendering & Serverless Deployment
* **Pattern:** Astro **Server Side Rendering (SSR)** mode (`output: 'server'`) combined with Vercel serverless functions.
* **Why:** Dynamic routes (like admin portals and order checkouts) demand real-time data lookups. Running in SSR mode ensures API routes handle write actions securely, and dashboard pages are generated on the server on each request.
* **Pre-rendering Config:** API paths and admin panels declare `export const prerender = false;` to guarantee runtime execution.

### 5.2 Direct Data Persistence & RLS (Supabase Layer)
* **Client Configurations:**
  * Client-side views query Supabase using the anonymous key (`PUBLIC_SUPABASE_ANON_KEY`) which checks Row-Level Security (RLS).
  * Server actions (API routes `/api/create-order`, `/api/update-order`, `/api/update-product`, `/api/bulk-products`) initialize Supabase via the `SUPABASE_SERVICE_ROLE_KEY` bypass to execute write transactions.
* **Infrastructure Schema & Views (`supabase/migrations/`):**
  * `categories` $\rightarrow$ Parent table capturing unique names.
  * `products` $\rightarrow$ Holds name, price, stock, and foreign reference `category_id`.
  * `orders` $\rightarrow$ Captures transaction histories.
  * `order_items` $\rightarrow$ Relational association table mapping item quantities.
  * **View `view_product_catalog`:** A helper view mapping stock levels to visual categories (`IN STOCK`, `LOW STOCK`, `OUT OF STOCK`).
  * **Automated Stock Triggers (`trigger_verify_order`):** When order rows transition to the `verified` status, a PL/pgSQL function (`process_verified_order`) runs to subtract quantities from the `products` stock automatically:
    ```sql
    CREATE TRIGGER trigger_verify_order
    AFTER UPDATE OF status ON orders
    FOR EACH ROW EXECUTE FUNCTION process_verified_order();
    ```

### 5.3 Global Reactive State (Nano Stores & LocalStorage Sync)
* **Pattern:** Lightweight, framework-agnostic client state stores (`nanostores`).
* **Why:** High compatibility across Astro's isolated island architectures.
* **Cart state (`cartStore.ts`):** Maintains cart items map, item counting, and total calculation. Subscribes to changes to persist updates to localStorage (`bunker_cart`) so the shopper's items are retained on page refresh.
* **Cocktail Modal state (`cocktailStore.ts`):** Simplifies selection actions for recipes, allowing clean transition delays for opening and closing animations.

### 5.4 Edge Middleware Protection Flow
* **Pattern:** Intercepting request routing (`middleware.ts`).
* **Logic:** Any path request matching the `/admin/*` prefix checks for cookies `sb-access-token` and `sb-refresh-token`.
* If keys are missing, or validation with the Supabase client fails, cookies are wiped and the router redirects the client to the `/login` portal.

### 5.5 Dual-Cart Auditing
* **Findings:** The project contains a duplicate `CartDrawer` component: `src/components/store/CartDrawer.astro` vs `src/components/cart/CartDrawer.astro`.
* **Audit:** The store-nested file uses deprecated WhatsApp messages. The active page shell (`MainLayout.astro`) imports `src/components/cart/CartDrawer.astro`, which leverages the `/api/create-order` DB integration. The store drawer is unused.

---

> [!NOTE]
> This knowledge base was dynamically generated on **June 17, 2026**, by mapping active imports and checking configuration layouts. Refer to this schema when planning extensions, security audits, or database migrations.
