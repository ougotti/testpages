'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ToDoリスト',
};

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [doneItems, setDoneItems] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const addTodo = () => {
    if (inputValue.trim() !== '') {
      const newTodo: TodoItem = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completeTodo = (id: number) => {
    const todoToComplete = todos.find(todo => todo.id === id);
    if (todoToComplete) {
      setTodos(todos.filter(todo => todo.id !== id));
      setDoneItems([...doneItems, { ...todoToComplete, completed: true }]);
    }
  };

  const deleteDoneItem = (id: number) => {
    setDoneItems(doneItems.filter(item => item.id !== id));
  };

  const incompleteTodo = (id: number) => {
    const doneItemToIncomplete = doneItems.find(item => item.id === id);
    if (doneItemToIncomplete) {
      setDoneItems(doneItems.filter(item => item.id !== id));
      setTodos([...todos, { ...doneItemToIncomplete, completed: false }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  // Filter todos and done items based on search query
  const filteredTodos = todos.filter(todo =>
    todo.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredDoneItems = doneItems.filter(item =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-500 underline block mb-4">
          ホームに戻る
        </Link>
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          ToDoリスト
        </h1>
        
        {/* Search Filter */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="タイトルで検索..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        {/* Add Todo Form */}
        <div className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="新しいタスクを入力..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              onClick={addTodo}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              追加
            </button>
          </div>
        </div>

        {/* ToDo List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            ToDo ({filteredTodos.length})
          </h2>
          {filteredTodos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchQuery ? '検索結果がありません' : 'リストは空です'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => completeTodo(todo.id)}
                    className="flex-shrink-0 w-6 h-6 border-2 border-gray-300 rounded-full hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    title="完了"
                  >
                    <span className="sr-only">完了</span>
                  </button>
                  <span className="flex-1 text-foreground">{todo.text}</span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="flex-shrink-0 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DONE List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            DONE ({filteredDoneItems.length})
          </h2>
          {filteredDoneItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchQuery ? '検索結果がありません' : '完了したタスクはありません'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredDoneItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg shadow-sm border border-green-200 dark:border-green-700"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="flex-1 text-foreground line-through opacity-75">{item.text}</span>
                  <button
                    onClick={() => incompleteTodo(item.id)}
                    className="flex-shrink-0 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                  >
                    未完了に戻す
                  </button>
                  <button
                    onClick={() => deleteDoneItem(item.id)}
                    className="flex-shrink-0 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
