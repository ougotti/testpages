import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'アプリメニュー',
};

export default function MenuPage() {
  const appNames = [
    'ToDoリスト',
    'テトリス',
    'マンデルブロ',
    'アプリ4',
    '配当カレンダー',
    'アプリ6',
    'アプリ7',
    'アプリ8',
    'アプリ9',
    'アプリ10',
  ];
  
  return (
    <main className="min-h-screen p-8 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8 text-center">アプリメニュー</h1>
      <ul className="space-y-4 max-w-md mx-auto">
        {appNames.map((name, i) => (
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
