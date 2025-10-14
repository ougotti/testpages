# エージェント向け開発ガイド

## 適用範囲
この指示はリポジトリ全体に適用されます。

## テスト
- コミット前に `npm run lint` を実行してください。
- `npm test` を実行してください（現在テストはありませんが、コマンドを実行する習慣を保ってください）。

## 開発メモ
- ホームページ（`src/app/page.tsx`）は10個のアプリへのリンクを表示します。
- App2（`src/app/app2`）はキャンバスレンダリングとキーボード制御によるテトリスゲームを含んでいます。
- 各アプリページ（`src/app/appN/page.tsx`）は以下を満たす必要があります：
  - 日本語タイトルの `metadata` をエクスポートする
  - コンテンツを `<main>` 要素でラップする
  - ホームメニュー（`/`）への戻りリンクを提供する
  - UIラベルに日本語テキストを使用する

## アーキテクチャ仕様

### クライアント/サーバーコンポーネントの分離
アプリがサーバーサイドのメタデータとクライアントサイドのインタラクティブ機能の両方を必要とする場合：

1. **サーバーコンポーネントパターン**（`page.tsx`）：
   - メインページコンポーネントとして機能します
   - 日本語タイトルの `metadata` オブジェクトをエクスポートします
   - コンテンツを `<main>` 要素でラップします
   - クライアントコンポーネントをインポートしてレンダリングします
   - `'use client'` ディレクティブを使用しません

2. **クライアントコンポーネントパターン**（`[ComponentName]Client.tsx`）：
   - すべてのインタラクティブなロジック（useState、イベントハンドラなど）を含みます
   - ファイルの先頭で `'use client'` ディレクティブを使用します
   - メタデータをエクスポートしません（クライアントコンポーネントでは許可されていません）
   - すべてのReactフックとブラウザ固有の機能を処理します

### ファイル構造の例
```
src/app/appN/
├── page.tsx           # サーバーコンポーネント（メタデータ + メインラッパー）
└── ComponentClient.tsx # クライアントコンポーネント（インタラクティブ機能）
```

### 実装テンプレート
```tsx
// page.tsx（サーバーコンポーネント）
import type { Metadata } from 'next';
import ComponentClient from './ComponentClient';

export const metadata: Metadata = {
  title: '日本語タイトル',
};

export default function AppPage() {
  return (
    <main>
      <ComponentClient />
    </main>
  );
}
```

```tsx
// ComponentClient.tsx（クライアントコンポーネント）
'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ComponentClient() {
  // すべてのインタラクティブなロジックをここに記述
  return (
    <div>
      <Link href="/" className="text-blue-500 underline block mb-4">
        ホームに戻る
      </Link>
      {/* コンポーネントUI */}
    </div>
  );
}
```
