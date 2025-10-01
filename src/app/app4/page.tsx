import type { Metadata } from 'next';
import App4Client from './App4Client';

export const metadata: Metadata = {
  title: '家計CSVビューワ',
};

export default function App4Page() {
  return (
    <main>
      <App4Client />
    </main>
  );
}
