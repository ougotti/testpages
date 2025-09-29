import type { Metadata } from 'next';
import MandelbrotClient from './MandelbrotClient';

export const metadata: Metadata = {
  title: 'マンデルブロ集合',
};

export default function App3() {
  return (
    <main>
      <MandelbrotClient />
    </main>
  );
}
