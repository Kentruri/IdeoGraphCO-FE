import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Theme = "light" | "dark";

interface PreferencesState {
  theme: Theme;
  /** true cuando el tema ya se leyó del DOM tras la hidratación. */
  themeHydrated: boolean;
}

const initialState: PreferencesState = {
  theme: "light",
  themeHydrated: false,
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    themeHydrated(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      state.themeHydrated = true;
    },
    themeToggled(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
  },
});

export const { themeHydrated, themeToggled } = preferencesSlice.actions;
export default preferencesSlice.reducer;
