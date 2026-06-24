'use client';

import './global.css';
import { Provider as JotaiProvider } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useQueryError from '../services/hooks/user-query-error';
import { LanguageProvider } from '../services/i18n/LanguageProvider';

/*
 * 01. 구분     : View 컴포넌트
 * 02. 타입     : Client Component
 * 03. 업무구분  : 멤버권한 - Layout
 * 03. 설명     : 메인 레이아웃 집합
 * 04. 작성일자  : 2025.02.18
 * 05. 작성자   : 이우창
 */

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
  return (
    <html lang="en">
      <body>
        {children}
        <div id="root"></div>
        <div id="modal-poopup"></div>
        <div id="modal-dialog"></div>
      </body>
    </html>
  );
};

export default function App({ children }: { children: React.ReactNode }) {
  const { fnQueryError } = useQueryError();
  const queryClient = new QueryClient({
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
  });

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <LanguageProvider>
          <RootLayout>{children}</RootLayout>
        </LanguageProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
}