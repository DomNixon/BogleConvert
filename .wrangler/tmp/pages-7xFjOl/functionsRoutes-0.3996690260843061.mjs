import { onRequest as __api_batch_quote_ts_onRequest } from "D:\\Documents\\Development\\antigravity\\BogleConvert-1\\functions\\api\\batch-quote.ts"
import { onRequest as __api_refresh_data_ts_onRequest } from "D:\\Documents\\Development\\antigravity\\BogleConvert-1\\functions\\api\\refresh-data.ts"

export const routes = [
    {
      routePath: "/api/batch-quote",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_batch_quote_ts_onRequest],
    },
  {
      routePath: "/api/refresh-data",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_refresh_data_ts_onRequest],
    },
  ]