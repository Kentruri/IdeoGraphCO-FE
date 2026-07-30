import { configureStore } from "@reduxjs/toolkit";

import { articlesApi } from "@/store/services/articles.api";
import preferencesReducer from "@/store/slices/preferences.slice";

export function makeStore() {
  return configureStore({
    reducer: {
      preferences: preferencesReducer,
      [articlesApi.reducerPath]: articlesApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(articlesApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
