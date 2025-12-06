import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('[tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  if (process.env.EXPO_PUBLIC_BASE_URL) {
    console.log('[tRPC] Using EXPO_PUBLIC_BASE_URL:', process.env.EXPO_PUBLIC_BASE_URL);
    return process.env.EXPO_PUBLIC_BASE_URL;
  }

  console.warn('[tRPC] No base URL configured. Backend features will not work.');
  return "";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        const baseUrl = getBaseUrl();
        if (!baseUrl) {
          console.error('[tRPC Client] ERROR: No base URL configured');
          console.error('[tRPC Client] Please set EXPO_PUBLIC_RORK_API_BASE_URL or EXPO_PUBLIC_BASE_URL');
          return Promise.reject(new Error(
            'Backend not configured. Please set up your backend URL in environment variables.'
          ));
        }
        
        console.log('[tRPC Client] Fetching:', url);
        return fetch(url, options).then(async (response) => {
          const contentType = response.headers.get('content-type');
          console.log('[tRPC Client] Response status:', response.status);
          console.log('[tRPC Client] Response content-type:', contentType);
          
          if (response.status === 404) {
            const text = await response.clone().text();
            console.error('[tRPC Client] 404 Not Found:', text.substring(0, 500));
            console.error('[tRPC Client] Base URL:', baseUrl);
            console.error('[tRPC Client] Full URL:', url);
            console.error('[tRPC Client] Make sure your backend is deployed and accessible');
          }
          
          if (!contentType?.includes('application/json')) {
            const text = await response.clone().text();
            console.error('[tRPC Client] Non-JSON response:', text.substring(0, 500));
          }
          
          return response;
        }).catch(error => {
          console.error('[tRPC Client] Fetch error:', error);
          console.error('[tRPC Client] URL:', url);
          console.error('[tRPC Client] Base URL:', baseUrl);
          throw error;
        });
      },
    }),
  ],
});
