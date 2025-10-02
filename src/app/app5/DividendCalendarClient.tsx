'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// データモデル
type Holding = {
  id: string;
  name: string;
  ticker?: string;
  shares: number;
  costPerShare: number;
  annualDividendPerShare: number; // 税引前
  payoutMonths: number[]; // 1-12
  sector?: string;
  memo?: string;
};

// 税係数プリセット
const TAX_PRESETS = {
  domestic: 0.79685, // 国内: 20.315%
  foreign: 0.7971, // 外国: 20.315% (外国税額控除考慮せず)
  custom: 1.0,
};

const STORAGE_KEY = 'dividend-calendar-holdings';
const SETTINGS_KEY = 'dividend-calendar-settings';

// サンプルデータ
const SAMPLE_DATA: Holding[] = [
  {
    id: '1',
    name: 'サンプル銘柄A',
    ticker: '1234',
    shares: 100,
    costPerShare: 1000,
    annualDividendPerShare: 50,
    payoutMonths: [3, 9],
    sector: '情報通信',
  },
  {
    id: '2',
    name: 'サンプル銘柄B',
    ticker: '5678',
    shares: 200,
    costPerShare: 500,
    annualDividendPerShare: 20,
    payoutMonths: [6, 12],
    sector: '金融',
  },
];

export default function DividendCalendarClient() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [taxRate, setTaxRate] = useState<number>(TAX_PRESETS.domestic);
  const [taxPreset, setTaxPreset] = useState<'domestic' | 'foreign' | 'custom'>('domestic');
  const [customTaxRate, setCustomTaxRate] = useState<number>(0.79685);
  const [targetMonthly, setTargetMonthly] = useState<number>(10000);
  const [showTaxAdjusted, setShowTaxAdjusted] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // localStorage から読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (saved) {
      try {
        setHoldings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load holdings:', e);
      }
    } else {
      setHoldings(SAMPLE_DATA);
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        const preset: 'domestic' | 'foreign' | 'custom' = settings.taxPreset || 'domestic';
        setTaxPreset(preset);
        setCustomTaxRate(settings.customTaxRate || 0.79685);
        setTargetMonthly(settings.targetMonthly || 10000);
        setShowTaxAdjusted(settings.showTaxAdjusted !== false);
        
        if (preset === 'custom') {
          setTaxRate(settings.customTaxRate || 0.79685);
        } else {
          setTaxRate(TAX_PRESETS[preset]);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // localStorage に保存
  useEffect(() => {
    if (holdings.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    }
  }, [holdings]);

  useEffect(() => {
    const settings = {
      taxPreset,
      customTaxRate,
      targetMonthly,
      showTaxAdjusted,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [taxPreset, customTaxRate, targetMonthly, showTaxAdjusted]);

  // 月別配当計算
  const calculateMonthlyDividends = () => {
    const monthly = Array(12).fill(0);
    
    holdings.forEach((holding) => {
      const payoutCount = holding.payoutMonths.length;
      if (payoutCount === 0) return;
      
      const perPayoutDividend = (holding.shares * holding.annualDividendPerShare) / payoutCount;
      const adjustedDividend = showTaxAdjusted ? perPayoutDividend * taxRate : perPayoutDividend;
      
      holding.payoutMonths.forEach((month) => {
        if (month >= 1 && month <= 12) {
          monthly[month - 1] += adjustedDividend;
        }
      });
    });
    
    return monthly;
  };

  const monthlyDividends = calculateMonthlyDividends();
  const totalAnnual = monthlyDividends.reduce((sum, val) => sum + val, 0);
  const avgMonthly = totalAnnual / 12;
  const maxMonthly = Math.max(...monthlyDividends);

  // YOC計算（税引前）
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.costPerShare, 0);
  const totalAnnualBeforeTax = holdings.reduce((sum, h) => sum + h.shares * h.annualDividendPerShare, 0);
  const yoc = totalCost > 0 ? (totalAnnualBeforeTax / totalCost) * 100 : 0;

  // 新規行追加
  const addRow = () => {
    const newHolding: Holding = {
      id: Date.now().toString(),
      name: '',
      shares: 0,
      costPerShare: 0,
      annualDividendPerShare: 0,
      payoutMonths: [],
    };
    setHoldings([...holdings, newHolding]);
  };

  // 行削除
  const deleteRow = (id: string) => {
    setHoldings(holdings.filter((h) => h.id !== id));
  };

  // 行更新
  const updateHolding = (id: string, field: keyof Holding, value: string | number | number[] | undefined) => {
    setHoldings(
      holdings.map((h) =>
        h.id === id ? { ...h, [field]: value } : h
      )
    );
  };

  // 配当月の切替
  const togglePayoutMonth = (id: string, month: number) => {
    const holding = holdings.find((h) => h.id === id);
    if (!holding) return;

    const months = holding.payoutMonths.includes(month)
      ? holding.payoutMonths.filter((m) => m !== month)
      : [...holding.payoutMonths, month].sort((a, b) => a - b);

    updateHolding(id, 'payoutMonths', months);
  };

  // CSV エクスポート
  const exportCSV = () => {
    const headers = ['銘柄名', 'ティッカー', '株数', '取得単価', '年間配当/株', '配当月', 'セクター', 'メモ'];
    const rows = holdings.map((h) => [
      h.name,
      h.ticker || '',
      h.shares,
      h.costPerShare,
      h.annualDividendPerShare,
      h.payoutMonths.join(';'),
      h.sector || '',
      h.memo || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dividend-holdings.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV インポート
  const importCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // BOM除去
        const cleanText = text.replace(/^\uFEFF/, '');
        const lines = cleanText.split('\n').filter((line) => line.trim());
        
        if (lines.length < 2) {
          alert('CSVファイルが空です');
          return;
        }

        const data: Holding[] = [];
        // ヘッダー行をスキップして2行目から処理
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length < 6) continue;

          const payoutMonths = cols[5]
            ? cols[5].split(';').map((m) => parseInt(m.trim(), 10)).filter((m) => !isNaN(m))
            : [];

          data.push({
            id: Date.now().toString() + i,
            name: cols[0] || '',
            ticker: cols[1] || undefined,
            shares: parseFloat(cols[2]) || 0,
            costPerShare: parseFloat(cols[3]) || 0,
            annualDividendPerShare: parseFloat(cols[4]) || 0,
            payoutMonths,
            sector: cols[6] || undefined,
            memo: cols[7] || undefined,
          });
        }

        if (data.length > 0) {
          setHoldings(data);
          alert(`${data.length}件のデータをインポートしました`);
        }
      } catch (err) {
        console.error('CSV import error:', err);
        alert('CSVの読み込みに失敗しました');
      }
    };
    reader.readAsText(file, 'UTF-8');
    
    // ファイル入力をリセット（同じファイルを再度選択可能に）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 税率プリセット変更
  const handleTaxPresetChange = (preset: 'domestic' | 'foreign' | 'custom') => {
    setTaxPreset(preset);
    if (preset === 'custom') {
      setTaxRate(customTaxRate);
    } else {
      setTaxRate(TAX_PRESETS[preset]);
    }
  };

  // Chart.js データ
  const chartData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    datasets: [
      {
        label: showTaxAdjusted ? '税引後配当' : '税引前配当',
        data: monthlyDividends,
        backgroundColor: monthlyDividends.map((val) =>
          val < targetMonthly ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'
        ),
        borderColor: monthlyDividends.map((val) =>
          val < targetMonthly ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '月別配当カレンダー',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // 達成率計算
  const achievementRate = targetMonthly > 0 ? (avgMonthly / targetMonthly) * 100 : 0;
  const shortfallMonths = monthlyDividends.filter((val) => val < targetMonthly).length;

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <Link href="/" className="text-blue-500 underline block mb-4">
        ホームに戻る
      </Link>

      <h1 className="text-3xl font-bold mb-6">配当カレンダー &amp; 利回りシミュレータ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: 銘柄リスト */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">保有銘柄</h2>
              <div className="space-x-2">
                <button
                  onClick={addRow}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  + 追加
                </button>
                <button
                  onClick={exportCSV}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  CSV出力
                </button>
                <label className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm cursor-pointer inline-block">
                  CSV読込
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={importCSV}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">銘柄名</th>
                    <th className="p-2 text-left">株数</th>
                    <th className="p-2 text-left">取得単価</th>
                    <th className="p-2 text-left">年配当/株</th>
                    <th className="p-2 text-left">配当月</th>
                    <th className="p-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.id} className="border-b dark:border-gray-700">
                      <td className="p-2">
                        <input
                          type="text"
                          value={holding.name}
                          onChange={(e) => updateHolding(holding.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="銘柄名"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={holding.shares || ''}
                          onChange={(e) => updateHolding(holding.id, 'shares', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={holding.costPerShare || ''}
                          onChange={(e) => updateHolding(holding.id, 'costPerShare', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={holding.annualDividendPerShare || ''}
                          onChange={(e) => updateHolding(holding.id, 'annualDividendPerShare', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                            <button
                              key={month}
                              onClick={() => togglePayoutMonth(holding.id, month)}
                              className={`w-6 h-6 text-xs rounded ${
                                holding.payoutMonths.includes(month)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => deleteRow(holding.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 右側: KPI とグラフ */}
        <div className="space-y-4">
          {/* KPI カード */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">KPI</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-300">年間配当</div>
                <div className="text-2xl font-bold">
                  {totalAnnual.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}円
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-300">YOC</div>
                <div className="text-2xl font-bold">{yoc.toFixed(2)}%</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-300">平均/月</div>
                <div className="text-2xl font-bold">
                  {avgMonthly.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}円
                </div>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-300">最大/月</div>
                <div className="text-2xl font-bold">
                  {maxMonthly.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}円
                </div>
              </div>
            </div>
          </div>

          {/* 設定 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">設定</h2>
            
            <div className="space-y-3">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTaxAdjusted}
                    onChange={(e) => setShowTaxAdjusted(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>税引き後で表示</span>
                </label>
              </div>

              <div>
                <label className="block text-sm mb-1">税率プリセット</label>
                <select
                  value={taxPreset}
                  onChange={(e) => handleTaxPresetChange(e.target.value as 'domestic' | 'foreign' | 'custom')}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="domestic">国内 (79.685%)</option>
                  <option value="foreign">外国 (79.71%)</option>
                  <option value="custom">カスタム</option>
                </select>
              </div>

              {taxPreset === 'custom' && (
                <div>
                  <label className="block text-sm mb-1">カスタム税率 (0.0-1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={customTaxRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setCustomTaxRate(val);
                      setTaxRate(val);
                    }}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-1">目標月額 (円)</label>
                <input
                  type="number"
                  value={targetMonthly || ''}
                  onChange={(e) => setTargetMonthly(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="10000"
                />
              </div>

              <div className="pt-2">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  目標達成率: <span className="font-bold text-lg">{achievementRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full ${achievementRate >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${Math.min(achievementRate, 100)}%` }}
                  ></div>
                </div>
                {shortfallMonths > 0 && (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    不足月: {shortfallMonths}ヶ月
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* グラフ */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div style={{ height: '400px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* ヒートマップ風表示 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">月別ヒートマップ</h2>
            <div className="grid grid-cols-4 gap-2">
              {monthlyDividends.map((amount, index) => {
                const isShortfall = amount < targetMonthly;
                const intensity = Math.min(amount / (targetMonthly * 2), 1);
                const bgColor = isShortfall
                  ? `rgba(239, 68, 68, ${intensity * 0.8 + 0.2})`
                  : `rgba(34, 197, 94, ${intensity * 0.8 + 0.2})`;

                return (
                  <div
                    key={index}
                    className="p-3 rounded text-center"
                    style={{ backgroundColor: bgColor }}
                  >
                    <div className="text-xs font-bold">{index + 1}月</div>
                    <div className="text-sm font-bold mt-1">
                      {amount.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}円
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
