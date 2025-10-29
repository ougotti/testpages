// Radiko API レスポンスのサンプルデータ（テスト用）
// 実際のRadiko APIのXMLレスポンス形式を模擬

export const sampleRadikoXML = `<?xml version="1.0" encoding="UTF-8"?>
<radiko>
  <stations>
    <station id="TBS">
      <name>TBSラジオ</name>
      <progs>
        <prog ft="1735030800" to="1735034400">
          <title>生島ヒロシのおはよう一直線</title>
          <desc>朝の情報番組。ニュース、天気、交通情報などをお届けします。</desc>
        </prog>
        <prog ft="1735034400" to="1735041600">
          <title>伊集院光とらじおと</title>
          <desc>伊集院光が日常の出来事や最新ニュースについて独自の視点でトーク。</desc>
        </prog>
        <prog ft="1735041600" to="1735048800">
          <title>ジェーン・スー 生活は踊る</title>
          <desc>音楽とトークで日々の生活を彩る番組。リスナーとの交流も楽しい。</desc>
        </prog>
      </progs>
    </station>
    <station id="QRR">
      <name>文化放送</name>
      <progs>
        <prog ft="1735030800" to="1735034400">
          <title>くにまるジャパン 極</title>
          <desc>野村邦丸がニュースや話題を分かりやすく解説する朝の番組。</desc>
        </prog>
        <prog ft="1735034400" to="1735041600">
          <title>大竹まことのゴールデンラジオ</title>
          <desc>大竹まことが政治、社会問題について鋭く切り込むトーク番組。</desc>
        </prog>
        <prog ft="1735041600" to="1735048800">
          <title>斉藤一美 ニュースワイド SAKIDORI!</title>
          <desc>その日のニュースを深掘り。専門家の解説も交えてお届け。</desc>
        </prog>
      </progs>
    </station>
    <station id="LFR">
      <name>ニッポン放送</name>
      <progs>
        <prog ft="1735030800" to="1735034400">
          <title>飯田浩司のOK! Cozy up!</title>
          <desc>飯田浩司アナウンサーが朝のニュースをお届けする情報番組。</desc>
        </prog>
        <prog ft="1735034400" to="1735041600">
          <title>辛坊治郎 ズーム そこまで言うか!</title>
          <desc>辛坊治郎が時事問題について本音でトーク。リスナーの意見も紹介。</desc>
        </prog>
        <prog ft="1735041600" to="1735048800">
          <title>垣花正 あなたとハッピー!</title>
          <desc>垣花正アナウンサーが音楽とトークでお届けする午後の番組。</desc>
        </prog>
      </progs>
    </station>
    <station id="FMT">
      <name>TOKYO FM</name>
      <progs>
        <prog ft="1735030800" to="1735034400">
          <title>ONE MORNING</title>
          <desc>朝の音楽とニュースで1日をスタート。最新のヒット曲もお届け。</desc>
        </prog>
        <prog ft="1735034400" to="1735041600">
          <title>Blue Ocean</title>
          <desc>音楽とライフスタイル情報で心地よいひとときを。</desc>
        </prog>
        <prog ft="1735041600" to="1735048800">
          <title>Skyrocket Company</title>
          <desc>音楽とトークで夕方を彩る番組。リスナー参加型のコーナーも人気。</desc>
        </prog>
      </progs>
    </station>
    <station id="FMJ">
      <name>J-WAVE</name>
      <progs>
        <prog ft="1735030800" to="1735034400">
          <title>J-WAVE TOKYO MORNING RADIO</title>
          <desc>朝の東京を音楽とトークでお届け。最新情報満載。</desc>
        </prog>
        <prog ft="1735034400" to="1735041600">
          <title>STEP ONE</title>
          <desc>音楽とカルチャー情報で充実した昼のひとときを。</desc>
        </prog>
        <prog ft="1735041600" to="1735048800">
          <title>SONAR MUSIC</title>
          <desc>最新の音楽シーンを紹介。アーティストのインタビューも。</desc>
        </prog>
      </progs>
    </station>
  </stations>
</radiko>`;

// プロキシ経由でRadiko APIを呼び出す場合の例
export const PROXY_URL = 'https://your-worker.workers.dev';

// エリアコードと都道府県の対応（完全版は App8Client.tsx に実装済み）
export const SAMPLE_AREA_CODES = [
  { code: 'JP13', name: '東京都' },
  { code: 'JP27', name: '大阪府' },
  { code: 'JP14', name: '神奈川県' },
];

// テスト用のヘルパー関数
export function createMockFetch(xmlResponse: string) {
  return async () => {
    // モックレスポンス
    return {
      ok: true,
      status: 200,
      text: async () => xmlResponse,
    } as Response;
  };
}
