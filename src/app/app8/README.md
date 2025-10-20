# Radikoプログラム検索アプリ（App8）

## 概要

Radiko APIを使用して、日本全国の地域別ラジオ番組表を検索できるWebアプリケーションです。

## 主な機能

### 検索機能
- **エリア選択**: 47都道府県（JP1〜JP47）から選択可能
- **日付選択**: 今日または明日の番組表を取得
- **キーワード検索**: 
  - スペース区切りで複数キーワード入力可能
  - AND検索（全キーワード一致）/ OR検索（いずれか一致）の切り替え
  - 全角半角、カナ大小文字の自動正規化

### データ可視化
- **ヒートマップ**: 時間帯別（0時〜23時）のヒット件数を棒グラフで表示
- **検索結果テーブル**: 
  - 局名、番組名、開始/終了時刻、説明を表形式で表示
  - キーワードの自動ハイライト

### データ管理
- **CSV出力**: 検索結果をCSVファイルとしてダウンロード可能
- **IndexedDB保存**: 取得したデータをブラウザに保存し、オフライン時にも利用可能
- **キャッシュ機能**: API取得失敗時に自動的にキャッシュから読み込み

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **XML解析**: fast-xml-parser
- **データベース**: IndexedDB (idb)
- **グラフ描画**: Chart.js + react-chartjs-2
- **CSV処理**: papaparse
- **スタイル**: Tailwind CSS

## CORS問題と対策

### 問題
Radiko APIは環境によってCORS制限があり、ブラウザから直接アクセスできない場合があります。

### 解決策：Cloudflare Workersプロキシ

Cloudflare Workersを使用して、CORS制限を回避するプロキシサーバーを構築できます。

#### Cloudflare Workers セットアップ手順

1. **Cloudflare アカウント作成**
   - https://workers.cloudflare.com/ にアクセス
   - 無料プランで十分（1日10万リクエストまで）

2. **新しいWorkerを作成**
   - ダッシュボードから「Create a Worker」をクリック
   - 以下のコードを貼り付け

```javascript
export default {
  async fetch(request) {
    // URLパラメータからRadiko APIのURLを取得
    const url = new URL(request.url).searchParams.get("url");
    
    // セキュリティチェック：radiko.jpのURLのみ許可
    if (!url?.startsWith("https://radiko.jp/")) {
      return new Response("Bad Request: Only radiko.jp URLs are allowed", { 
        status: 400 
      });
    }
    
    try {
      // Radiko APIにリクエスト
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      
      // XMLデータを取得
      const xml = await response.text();
      
      // CORSヘッダーを追加してレスポンス
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { 
        status: 500 
      });
    }
  }
};
```

3. **Workerをデプロイ**
   - 「Save and Deploy」をクリック
   - デプロイされたURLをコピー（例: `https://radiko-proxy.your-subdomain.workers.dev`）

4. **アプリケーションコードを更新**

`App8Client.tsx`の`fetchRadikoData`関数を以下のように変更：

```typescript
const fetchRadikoData = async () => {
  setLoading(true);
  setError(null);

  try {
    const radikoUrl = `https://radiko.jp/v3/program/${dateType}/${selectedArea}.xml`;
    
    // Cloudflare Workersプロキシを使用
    const proxyUrl = 'https://radiko-proxy.your-subdomain.workers.dev';
    const url = `${proxyUrl}?url=${encodeURIComponent(radikoUrl)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    // ... 以降は同じ
  } catch (err) {
    // ... エラー処理
  }
};
```

## 使用API

### Radiko API エンドポイント

- **エリア別ステーション一覧**
  ```
  https://radiko.jp/v3/station/list/{AREA_CODE}.xml
  例: https://radiko.jp/v3/station/list/JP13.xml (東京)
  ```

- **エリア別番組表（本日）**
  ```
  https://radiko.jp/v3/program/today/{AREA_CODE}.xml
  例: https://radiko.jp/v3/program/today/JP13.xml
  ```

- **エリア別番組表（明日）**
  ```
  https://radiko.jp/v3/program/tomorrow/{AREA_CODE}.xml
  例: https://radiko.jp/v3/program/tomorrow/JP13.xml
  ```

- **局×日付別番組表**
  ```
  https://radiko.jp/v3/program/station/date/{YYYYMMDD}/{STATION_ID}.xml
  例: https://radiko.jp/v3/program/station/date/20231225/FMT.xml (TOKYO FM)
  ```

## データ構造

```typescript
type RadikoProgram = {
  stationId: string;      // 局ID (例: "FMT")
  stationName: string;    // 局名 (例: "TOKYO FM")
  title: string;          // 番組タイトル
  desc: string;           // 番組説明
  start: Date;            // 開始時刻
  end: Date;              // 終了時刻
};
```

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リンター実行
npm run lint
```

## 制限事項

- Radiko APIは過去7日間のデータと地域制約があります
- 番組表は「today」「tomorrow」のみ対応（「now」は未実装）
- CORS制限により、本番環境ではプロキシサーバーが必要です

## 将来の拡張案

- [ ] GPS位置情報から自動的にエリアコード判定
- [ ] 「現在放送中」の番組表示（now APIの活用）
- [ ] 局×日付での詳細検索機能
- [ ] お気に入り局の登録機能
- [ ] 番組アラート/通知機能
- [ ] 複数日にわたる検索機能
- [ ] 番組の詳細情報表示（公式サイトへのリンクなど）

## ライセンス

このアプリケーションはRadiko APIを使用していますが、Radikoの利用規約に従ってご使用ください。
