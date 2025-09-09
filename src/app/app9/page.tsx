import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'アプリ9',
};

export default function App9() {
  return (
    <main className="min-h-screen p-8 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-4">アプリ9</h1>
      <p>このアプリは準備中です。</p>
      <Link href="/" className="text-blue-500 underline block mt-4">
        ホームに戻る
      </Link>
    </main>
  );
}
