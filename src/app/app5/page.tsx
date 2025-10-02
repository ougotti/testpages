import type { Metadata } from 'next';
import DividendCalendarClient from './DividendCalendarClient';

export const metadata: Metadata = {
  title: '配当カレンダー & 利回りシミュレータ',
};

export default function App5() {
  return (
    <main>
      <DividendCalendarClient />
    </main>
  );
}
