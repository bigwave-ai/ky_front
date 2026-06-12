'use client';

import React, { useMemo } from 'react';
import { RecoilRoot } from 'recoil';
import { Provider as JotaiProvider } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useQueryError from '../services/hooks/user-query-error';

/*
 * 01. 구분     : View 컴포넌트
 * 02. 타입     : Client Component (SSR)
 * 03. 업무구분  : 멤버권한 - Layout
 * 03. 설명     : 메인 레이아웃 집합 + styled-components SSR
 * 04. 작성일자  : 2025.02.18
 * 05. 작성자   : 이우창
 */

export default function Providers({ children }: { children: React.ReactNode }) {
  const { fnQueryError } = useQueryError();

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnMount: true,
            refetchOnWindowFocus: false,
            retryDelay: 0,
            staleTime: 0,
            cacheTime: 0,
            onError(err) {
              fnQueryError(err);
            },
          },
          mutations: {
            retry: false,
            cacheTime: 0,
            retryDelay: 0,
            onError(err) {
              fnQueryError(err);
            },
          },
        },
      }),
    [fnQueryError]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <JotaiProvider>{children}</JotaiProvider>
      </RecoilRoot>
    </QueryClientProvider>
  );
}
