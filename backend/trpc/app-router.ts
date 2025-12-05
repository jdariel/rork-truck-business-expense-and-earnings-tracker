import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import scanReceiptRoute from "./routes/receipt/scan/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  receipt: createTRPCRouter({
    scan: scanReceiptRoute,
  }),
});

export type AppRouter = typeof appRouter;
