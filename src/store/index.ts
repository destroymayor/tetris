import { create } from 'zustand';
import { createGameSlice, type GameSlice } from './slices/game.slice';
import { createThemeSlice, type ThemeSlice } from './slices/theme.slice';

type AppStore = GameSlice & ThemeSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createGameSlice(...a),
  ...createThemeSlice(...a),
}));
