'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMLParser } from 'fast-xml-parser';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// データ型定義
type RadikoProgram = {
  stationId: string;
  stationName: string;
  title: string;
  desc: string;
  start: Date;
  end: Date;
};

// IndexedDB スキーマ
interface RadikoDB extends DBSchema {
  programs: {
    key: string;
    value: {
      id: string;
      area: string;
      date: string;
      data: RadikoProgram[];
      timestamp: number;
    };
  };
}

// エリアコードと都道府県名のマッピング
const AREA_CODES = [
  { code: 'JP1', name: '北海道' },
  { code: 'JP2', name: '青森県' },
  { code: 'JP3', name: '岩手県' },
  { code: 'JP4', name: '宮城県' },
  { code: 'JP5', name: '秋田県' },
  { code: 'JP6', name: '山形県' },
  { code: 'JP7', name: '福島県' },
  { code: 'JP8', name: '茨城県' },
  { code: 'JP9', name: '栃木県' },
  { code: 'JP10', name: '群馬県' },
  { code: 'JP11', name: '埼玉県' },
  { code: 'JP12', name: '千葉県' },
  { code: 'JP13', name: '東京都' },
  { code: 'JP14', name: '神奈川県' },
  { code: 'JP15', name: '新潟県' },
  { code: 'JP16', name: '富山県' },
  { code: 'JP17', name: '石川県' },
  { code: 'JP18', name: '福井県' },
  { code: 'JP19', name: '山梨県' },
  { code: 'JP20', name: '長野県' },
  { code: 'JP21', name: '岐阜県' },
  { code: 'JP22', name: '静岡県' },
  { code: 'JP23', name: '愛知県' },
  { code: 'JP24', name: '三重県' },
  { code: 'JP25', name: '滋賀県' },
  { code: 'JP26', name: '京都府' },
  { code: 'JP27', name: '大阪府' },
  { code: 'JP28', name: '兵庫県' },
  { code: 'JP29', name: '奈良県' },
  { code: 'JP30', name: '和歌山県' },
  { code: 'JP31', name: '鳥取県' },
  { code: 'JP32', name: '島根県' },
  { code: 'JP33', name: '岡山県' },
  { code: 'JP34', name: '広島県' },
  { code: 'JP35', name: '山口県' },
  { code: 'JP36', name: '徳島県' },
  { code: 'JP37', name: '香川県' },
  { code: 'JP38', name: '愛媛県' },
  { code: 'JP39', name: '高知県' },
  { code: 'JP40', name: '福岡県' },
  { code: 'JP41', name: '佐賀県' },
  { code: 'JP42', name: '長崎県' },
  { code: 'JP43', name: '熊本県' },
  { code: 'JP44', name: '大分県' },
  { code: 'JP45', name: '宮崎県' },
  { code: 'JP46', name: '鹿児島県' },
  { code: 'JP47', name: '沖縄県' },
];

export default function App8Client() {
  const [selectedArea, setSelectedArea] = useState('JP13');
  const [dateType, setDateType] = useState<'today' | 'tomorrow'>('today');
  const [keywords, setKeywords] = useState('');
  const [searchMode, setSearchMode] = useState<'AND' | 'OR'>('AND');
  const [programs, setPrograms] = useState<RadikoProgram[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<RadikoProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<IDBPDatabase<RadikoDB> | null>(null);

  // IndexedDB 初期化
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB<RadikoDB>('radiko-db', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('programs')) {
              db.createObjectStore('programs', { keyPath: 'id' });
            }
          },
        });
        setDb(database);
      } catch (err) {
        console.error('IndexedDB初期化エラー:', err);
      }
    };
    initDB();
  }, []);

  // 文字列正規化（全角半角、カナ大小統一）
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0)
      )
      .replace(/[ァ-ン]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) + 0x60)
      );
  };

  // Radiko APIからデータ取得
  const fetchRadikoData = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `https://radiko.jp/v3/program/${dateType}/${selectedArea}.xml`;
      
      // 直接取得を試みる
      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });
      } catch (corsError) {
        // CORS エラーの場合は、プロキシ経由を試みる（将来的な実装）
        console.warn('CORS エラー、直接取得に失敗しました:', corsError);
        throw new Error('データの取得に失敗しました。CORS制限により、プロキシが必要な可能性があります。');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      });
      const result = parser.parse(xmlText);

      // XMLデータをRadikoProgramに変換
      const parsedPrograms: RadikoProgram[] = [];
      const stations = result.radiko?.stations?.station;

      if (!stations) {
        throw new Error('番組データが見つかりませんでした');
      }

      const stationArray = Array.isArray(stations) ? stations : [stations];

      for (const station of stationArray) {
        const stationId = station['@_id'] || '';
        const stationName = station.name || stationId;
        const progs = station.progs?.prog;

        if (progs) {
          const progArray = Array.isArray(progs) ? progs : [progs];
          for (const prog of progArray) {
            parsedPrograms.push({
              stationId,
              stationName,
              title: prog.title || '',
              desc: prog.desc || '',
              start: new Date(parseInt(prog['@_ft']) * 1000),
              end: new Date(parseInt(prog['@_to']) * 1000),
            });
          }
        }
      }

      setPrograms(parsedPrograms);

      // IndexedDBに保存
      if (db) {
        const cacheKey = `${selectedArea}-${dateType}`;
        await db.put('programs', {
          id: cacheKey,
          area: selectedArea,
          date: dateType,
          data: parsedPrograms,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');

      // キャッシュから読み込みを試みる
      if (db) {
        try {
          const cacheKey = `${selectedArea}-${dateType}`;
          const cached = await db.get('programs', cacheKey);
          if (cached) {
            setPrograms(cached.data);
            setError('キャッシュからデータを読み込みました');
          }
        } catch (dbErr) {
          console.error('キャッシュ読み込みエラー:', dbErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // キーワード検索
  useEffect(() => {
    if (keywords.trim() === '') {
      setFilteredPrograms(programs);
      return;
    }

    const keywordList = keywords
      .split(/\s+/)
      .filter((k) => k.length > 0)
      .map((k) => normalizeString(k));

    const filtered = programs.filter((prog) => {
      const normalizedTitle = normalizeString(prog.title);
      const normalizedDesc = normalizeString(prog.desc);
      const searchText = `${normalizedTitle} ${normalizedDesc}`;

      if (searchMode === 'AND') {
        return keywordList.every((keyword) => searchText.includes(keyword));
      } else {
        return keywordList.some((keyword) => searchText.includes(keyword));
      }
    });

    setFilteredPrograms(filtered);
  }, [keywords, searchMode, programs]);

  // ヒートマップデータ生成
  const generateHeatmapData = () => {
    const hourCounts = new Array(24).fill(0);
    
    filteredPrograms.forEach((prog) => {
      const hour = prog.start.getHours();
      hourCounts[hour]++;
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'ヒット件数',
          data: hourCounts,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '時間帯別ヒット件数',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // CSVエクスポート
  const exportToCSV = () => {
    const csvData = filteredPrograms.map((prog) => ({
      局ID: prog.stationId,
      局名: prog.stationName,
      番組名: prog.title,
      説明: prog.desc,
      開始時刻: prog.start.toLocaleString('ja-JP'),
      終了時刻: prog.end.toLocaleString('ja-JP'),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `radiko_programs_${selectedArea}_${dateType}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // キーワードハイライト
  const highlightKeyword = (text: string) => {
    if (keywords.trim() === '') return text;

    const keywordList = keywords.split(/\s+/).filter((k) => k.length > 0);
    let highlightedText = text;

    keywordList.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-300 dark:bg-yellow-700">$1</mark>'
      );
    });

    return highlightedText;
  };

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Radikoプログラム検索</h1>
          <Link href="/" className="text-blue-500 underline">
            ホームに戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：検索フォーム */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">検索条件</h2>

              {/* エリア選択 */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">エリア</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  {AREA_CODES.map((area) => (
                    <option key={area.code} value={area.code}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 日付選択 */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">日付</label>
                <div className="space-x-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="today"
                      checked={dateType === 'today'}
                      onChange={() => setDateType('today')}
                      className="mr-1"
                    />
                    今日
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="tomorrow"
                      checked={dateType === 'tomorrow'}
                      onChange={() => setDateType('tomorrow')}
                      className="mr-1"
                    />
                    明日
                  </label>
                </div>
              </div>

              {/* キーワード検索 */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">キーワード</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="スペース区切りで複数入力可"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* 検索モード */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">検索モード</label>
                <div className="space-x-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="AND"
                      checked={searchMode === 'AND'}
                      onChange={() => setSearchMode('AND')}
                      className="mr-1"
                    />
                    AND（全て含む）
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="OR"
                      checked={searchMode === 'OR'}
                      onChange={() => setSearchMode('OR')}
                      className="mr-1"
                    />
                    OR（いずれか含む）
                  </label>
                </div>
              </div>

              {/* 取得ボタン */}
              <button
                onClick={fetchRadikoData}
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '読み込み中...' : '番組表を取得'}
              </button>

              {error && (
                <div className="mt-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
                  {error}
                </div>
              )}

              {/* CSV出力 */}
              {filteredPrograms.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="w-full mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  CSV出力（{filteredPrograms.length}件）
                </button>
              )}
            </div>
          </div>

          {/* 右側：結果表示 */}
          <div className="lg:col-span-2 space-y-4">
            {/* ヒートマップ */}
            {filteredPrograms.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h2 className="text-xl font-bold mb-4">時間帯別ヒット件数</h2>
                <Bar data={generateHeatmapData()} options={chartOptions} />
              </div>
            )}

            {/* 番組リスト */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">
                ヒット番組リスト（{filteredPrograms.length}件）
              </h2>
              {filteredPrograms.length === 0 ? (
                <p className="text-gray-500">
                  {programs.length === 0
                    ? '番組表を取得してください'
                    : 'キーワードに一致する番組が見つかりません'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          局
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          番組名
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          開始
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          終了
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          説明
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredPrograms.map((prog, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {prog.stationName}
                          </td>
                          <td
                            className="px-4 py-2 text-sm font-medium"
                            dangerouslySetInnerHTML={{
                              __html: highlightKeyword(prog.title),
                            }}
                          />
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {prog.start.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {prog.end.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td
                            className="px-4 py-2 text-sm max-w-md truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightKeyword(prog.desc),
                            }}
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
