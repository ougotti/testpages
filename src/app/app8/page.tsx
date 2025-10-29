import type { Metadata } from 'next';
import App8Client from './App8Client';

export const metadata: Metadata = {
  title: 'Radikoプログラム検索',
};

export default function App8() {
  return (
    <main>
      <App8Client />
    </main>
  );
}
