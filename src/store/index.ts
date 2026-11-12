import { configureStore } from "@reduxjs/toolkit";

import { articlesApi } from "@/store/services/articles.api";
import { classifierApi } from "@/store/services/classifier.api";
import preferencesReducer from "@/store/slices/preferences.slice";

export function makeStore() {
  return configureStore({
    reducer: {
      preferences: preferencesReducer,
      [articlesApi.reducerPath]: articlesApi.reducer,
      [classifierApi.reducerPath]: classifierApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        articlesApi.middleware,
        classifierApi.middleware
      ),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
