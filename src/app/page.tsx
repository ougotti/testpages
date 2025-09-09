import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'アプリメニュー',
};

export default function MenuPage() {
  return (
    <main className="min-h-screen p-8 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8 text-center">アプリメニュー</h1>
      <ul className="space-y-4 max-w-md mx-auto">
        {[
          'ToDoリスト',
          'テトリス',
          ...Array.from({ length: 8 }, (_, i) => `アプリ${i + 3}`)
        ].map((name, i) => (
          <li key={i} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <Link href={`/app${i + 1}`} className="block text-center">
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
