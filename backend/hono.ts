import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}));

app.onError((err, c) => {
  console.error('[Hono Error]', err);
  return c.json(
    {
      error: {
        message: err.message || 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    500
  );
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error);
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "API endpoint is running" });
});

app.get("/api/health", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Health check passed",
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/test-receipt", async (c) => {
  try {
    console.log('[Test Receipt] Endpoint called');
    const body = await c.req.json();
    console.log('[Test Receipt] Body received:', Object.keys(body));
    
    if (!process.env.OPENAI_API_KEY) {
      return c.json({
        error: 'OpenAI API key not configured',
        hasKey: false,
      }, 500);
    }
    
    return c.json({
      success: true,
      message: 'Test endpoint working',
      hasKey: true,
      imageLength: body.base64Image?.length || 0,
    });
  } catch (error: any) {
    console.error('[Test Receipt] Error:', error);
    return c.json({
      error: error.message,
      stack: error.stack,
    }, 500);
  }
});

export default app;
