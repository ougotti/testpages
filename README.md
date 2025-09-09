# testpages

これは[Next.js](https://nextjs.org)プロジェクトで、[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)でブートストラップされ、GitHub Pagesへのデプロイメント用に設定されています。

## ライブサイト

🚀 **[ライブサイトを表示](https://ougotti.github.io/testpages/)**

## GitHub Pagesデプロイメント

このアプリケーションはGitHub Actionsを使用してGitHub Pagesに自動デプロイされます。デプロイメントワークフローは`main`ブランチに変更がプッシュされたときに実行されます。

### 設定

このアプリケーションは以下の設定でstatic exportが構成されています：
- Static export有効化（`output: 'export'`）
- GitHub Pages用のベースパス設定（`/testpages`）
- 静的ホスティング用の画像最適化無効化
- 互換性向上のためのtrailing slash有効化

## はじめに

まず、開発サーバーを実行してください：

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで[http://localhost:3000](http://localhost:3000)を開いて結果を確認してください。

`app/page.tsx`を変更することでページの編集を開始できます。ファイルを編集すると、ページが自動更新されます。

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用アプリケーションをビルド
- `npm run export` - アプリケーションをビルドし、静的ファイルとしてエクスポート
- `npm run lint` - ESLintを実行してコード品質をチェック

## デプロイメント

このアプリケーションはmainブランチに変更がプッシュされたときに、GitHub Pagesに自動デプロイされます。デプロイメントプロセス：

1. Next.jsアプリケーションをビルド
2. 静的ファイルとしてエクスポート
3. GitHub Pagesにデプロイ

ライブサイトは以下のURLで利用可能です：[https://ougotti.github.io/testpages/](https://ougotti.github.io/testpages/)

## さらに詳しく

Next.jsについてさらに詳しく学ぶには、以下のリソースをご覧ください：

- [Next.js Documentation](https://nextjs.org/docs) - Next.jsの機能とAPIについて学習
- [Learn Next.js](https://nextjs.org/learn) - インタラクティブなNext.jsチュートリアル
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports) - static exportに関する情報

[Next.js GitHubリポジトリ](https://github.com/vercel/next.js)もチェックしてみてください。フィードバックやコントリビューションを歓迎します！
