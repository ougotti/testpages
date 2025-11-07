import type { Metadata } from 'next';
import SynthesizerClient from './SynthesizerClient';

export const metadata: Metadata = {
  title: '音楽シンセサイザー',
};

export default function App9() {
  return (
    <main>
      <SynthesizerClient />
    </main>
  );
}
