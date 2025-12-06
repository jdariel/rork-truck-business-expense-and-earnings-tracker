import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  if (process.env.EXPO_PUBLIC_BASE_URL) {
    return process.env.EXPO_PUBLIC_BASE_URL;
  }

  return "";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        console.log('[tRPC Client] Fetching:', url);
        return fetch(url, options).then(async (response) => {
          const contentType = response.headers.get('content-type');
          console.log('[tRPC Client] Response status:', response.status);
          console.log('[tRPC Client] Response content-type:', contentType);
          
          if (!contentType?.includes('application/json')) {
            const text = await response.clone().text();
            console.error('[tRPC Client] Non-JSON response:', text.substring(0, 500));
          }
          
          return response;
        });
      },
    }),
  ],
});
