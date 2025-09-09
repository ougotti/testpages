import type { Metadata } from 'next';
import TetrisClient from './TetrisClient';

export const metadata: Metadata = {
  title: 'テトリス',
};

export default function TetrisPage() {
  return (
    <main>
      <TetrisClient />
    </main>
  );
}
