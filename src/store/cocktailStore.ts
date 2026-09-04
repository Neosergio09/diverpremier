import { atom } from 'nanostores';

export interface Ingredient {
  item: string;
  qty: string;
}

export interface Cocktail {
  id: string;
  name: string;
  base_liquor?: string;
  description?: string;
  glass_type: string;
  image_url: string;
  ingredients: Ingredient[];
  history: string;
  how_to_mix?: string;
  how_to_serve?: string;
  how_to_garnish?: string;
  instructions: string[];
}

export const isCocktailModalOpen = atom<boolean>(false);
export const selectedCocktail = atom<Cocktail | null>(null);

export function openCocktailModal(cocktail: Cocktail) {
  selectedCocktail.set(cocktail);
  isCocktailModalOpen.set(true);
}

export function closeCocktailModal() {
  isCocktailModalOpen.set(false);
  setTimeout(() => {
    selectedCocktail.set(null);
  }, 300); // Matches the exit animation duration usually
}
