import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '이유식 큐브 트래커',
  description: '냉동 이유식 큐브 재고 관리',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 font-sans text-gray-900 antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
