import type { Metadata } from 'next';
import GearClient from './GearClient';

export const metadata: Metadata = {
  title: '3Dギア',
};

export default function App7() {
  return (
    <main>
      <GearClient />
    </main>
  );
}
