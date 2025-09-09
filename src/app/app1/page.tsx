import type { Metadata } from 'next';
import TodoClient from './TodoClient';

export const metadata: Metadata = {
  title: 'ToDoリスト',
};

export default function TodoApp() {
  return (
    <main>
      <TodoClient />
    </main>
  );
}
