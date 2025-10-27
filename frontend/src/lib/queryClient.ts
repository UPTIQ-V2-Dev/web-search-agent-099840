import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // Don't retry on 4xx errors (client errors)
                if (error && 'status' in error && typeof error.status === 'number') {
                    return error.status >= 500 && failureCount < 2;
                }
                return failureCount < 2;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: false
        },
        mutations: {
            retry: 1
        }
    }
});
