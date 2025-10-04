import type { Metadata } from 'next';
import ShooterClient from './ShooterClient';

export const metadata: Metadata = {
  title: 'シューティングゲーム',
};

export default function App6Page() {
  return (
    <main>
      <ShooterClient />
    </main>
  );
}
