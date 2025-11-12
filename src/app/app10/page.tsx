import type { Metadata } from 'next';
import App10Client from './App10Client';

export const metadata: Metadata = {
  title: 'ポモドーロタイマー',
};

export default function App10() {
  return (
    <main className="min-h-screen p-8 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-6">ポモドーロタイマー</h1>
      <App10Client />
    </main>
  );
}
