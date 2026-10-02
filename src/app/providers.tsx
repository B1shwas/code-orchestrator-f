"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { isApiError } from "@/lib/api";

const defaultOptions: QueryClientConfig["defaultOptions"] = {
  queries: {
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Auth and gone/unlinked are terminal UI states, never worth retrying.
      if (isApiError(error, 401) || isApiError(error, 404)) return false;
      return failureCount < 2;
    },
  },
  mutations: {
    retry: false,
  },
};

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [client] = React.useState(() => new QueryClient({ defaultOptions }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
