'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// 型定義
interface ExpenseRecord {
  date: string;
  store: string;
  category: string;
  amount: number;
  memo?: string;
}

interface ColumnMapping {
  date: string;
  store: string;
  category: string;
  amount: string;
  memo?: string;
}

interface FilterState {
  startDate: string;
  endDate: string;
  category: string;
  searchStore: string;
}

export default function App4Client() {
  const [data, setData] = useState<ExpenseRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ExpenseRecord[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<unknown[][]>([]);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    category: '',
    searchStore: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // データの集計
  const calculateStats = useCallback(() => {
    if (filteredData.length === 0) {
      return { total: 0, count: 0, average: 0 };
    }
    const total = filteredData.reduce((sum, record) => sum + record.amount, 0);
    const count = filteredData.length;
    const average = total / count;
    return { total, count, average };
  }, [filteredData]);

  // カテゴリ別集計
  const getCategoryData = useCallback(() => {
    const categoryMap = new Map<string, number>();
    filteredData.forEach(record => {
      const current = categoryMap.get(record.category) || 0;
      categoryMap.set(record.category, current + record.amount);
    });
    
    const labels = Array.from(categoryMap.keys());
    const values = Array.from(categoryMap.values());
    
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ],
      }]
    };
  }, [filteredData]);

  // 店別ランキング（上位10）
  const getStoreRanking = useCallback(() => {
    const storeMap = new Map<string, number>();
    filteredData.forEach(record => {
      const current = storeMap.get(record.store) || 0;
      storeMap.set(record.store, current + record.amount);
    });
    
    const sorted = Array.from(storeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: sorted.map(([store]) => store),
      datasets: [{
        label: '支出額',
        data: sorted.map(([, amount]) => amount),
        backgroundColor: '#36A2EB',
      }]
    };
  }, [filteredData]);

  // 店別テーブル用データ
  const getStoreTableData = useCallback(() => {
    const storeMap = new Map<string, { amount: number; count: number }>();
    filteredData.forEach(record => {
      const current = storeMap.get(record.store) || { amount: 0, count: 0 };
      storeMap.set(record.store, {
        amount: current.amount + record.amount,
        count: current.count + 1
      });
    });
    
    return Array.from(storeMap.entries())
      .map(([store, data]) => ({ store, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredData]);

  // フィルタ適用
  useEffect(() => {
    let result = [...data];
    
    // 期間フィルタ
    if (filters.startDate) {
      result = result.filter(r => r.date >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter(r => r.date <= filters.endDate);
    }
    
    // カテゴリフィルタ
    if (filters.category) {
      result = result.filter(r => r.category === filters.category);
    }
    
    // 店名検索
    if (filters.searchStore) {
      const search = filters.searchStore.toLowerCase();
      result = result.filter(r => r.store.toLowerCase().includes(search));
    }
    
    setFilteredData(result);
    setCurrentPage(1);
  }, [data, filters]);

  // localStorage保存
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem('app4_expense_data', JSON.stringify(data));
    }
  }, [data]);

  // localStorage読込
  useEffect(() => {
    const saved = localStorage.getItem('app4_expense_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
  }, []);

  // CSVファイル処理
  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = results.data[0] as string[];
          const dataRows = results.data.slice(1) as unknown[][];
          setRawHeaders(headers);
          setRawData(dataRows);
          setShowMappingDialog(true);
        }
      },
      error: (error) => {
        alert(`CSVの解析に失敗しました: ${error.message}`);
      }
    });
  };

  // ドラッグ&ドロップ処理
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    } else {
      alert('CSVファイルをドロップしてください');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // ファイル選択処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 列マッピング確定
  const applyColumnMapping = () => {
    if (!columnMapping) {
      alert('列マッピングを設定してください');
      return;
    }

    // 必須列チェック
    if (!columnMapping.date || !columnMapping.store || !columnMapping.category || !columnMapping.amount) {
      alert('日付、店名、カテゴリ、金額の列は必須です');
      return;
    }

    const dateIndex = rawHeaders.indexOf(columnMapping.date);
    const storeIndex = rawHeaders.indexOf(columnMapping.store);
    const categoryIndex = rawHeaders.indexOf(columnMapping.category);
    const amountIndex = rawHeaders.indexOf(columnMapping.amount);
    const memoIndex = columnMapping.memo ? rawHeaders.indexOf(columnMapping.memo) : -1;

    const parsed: ExpenseRecord[] = rawData
      .filter(row => row.length > 0 && row[0]) // 空行をスキップ
      .map(row => {
        const amountStr = String(row[amountIndex] || '0').replace(/[^\d.-]/g, '');
        return {
          date: String(row[dateIndex] || ''),
          store: String(row[storeIndex] || ''),
          category: String(row[categoryIndex] || ''),
          amount: parseFloat(amountStr) || 0,
          memo: memoIndex >= 0 ? String(row[memoIndex] || '') : undefined,
        };
      })
      .filter(record => record.date && record.store && record.amount !== 0);

    setData(parsed);
    setShowMappingDialog(false);
    setColumnMapping(null);
  };

  // CSVエクスポート
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert('エクスポートするデータがありません');
      return;
    }

    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `家計簿_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // サンプルCSV読み込み
  const loadSampleData = () => {
    const sampleData: ExpenseRecord[] = [
      { date: '2024-01-05', store: 'スーパーA', category: '食費', amount: 3500, memo: '週末の買い物' },
      { date: '2024-01-08', store: 'ドラッグストアB', category: '日用品', amount: 1200, memo: '洗剤など' },
      { date: '2024-01-10', store: 'レストランC', category: '外食', amount: 2800, memo: '家族で夕食' },
      { date: '2024-01-12', store: 'スーパーA', category: '食費', amount: 4200, memo: '' },
      { date: '2024-01-15', store: 'コンビニD', category: '食費', amount: 800, memo: '昼食' },
      { date: '2024-01-18', store: '書店E', category: '娯楽', amount: 1500, memo: '雑誌' },
      { date: '2024-01-20', store: 'ガソリンスタンドF', category: '交通費', amount: 5000, memo: '満タン給油' },
      { date: '2024-01-22', store: 'スーパーA', category: '食費', amount: 3800, memo: '' },
      { date: '2024-01-25', store: 'レストランC', category: '外食', amount: 3200, memo: '記念日' },
      { date: '2024-01-28', store: 'ドラッグストアB', category: '医療費', amount: 2500, memo: '風邪薬' },
      { date: '2024-02-02', store: 'スーパーA', category: '食費', amount: 4500, memo: '' },
      { date: '2024-02-05', store: 'コンビニD', category: '食費', amount: 600, memo: '' },
      { date: '2024-02-08', store: '家電量販店G', category: '家電', amount: 15000, memo: '掃除機' },
      { date: '2024-02-10', store: 'レストランC', category: '外食', amount: 2600, memo: '' },
      { date: '2024-02-12', store: 'スーパーA', category: '食費', amount: 3900, memo: '' },
    ];
    setData(sampleData);
  };

  // データクリア
  const clearData = () => {
    if (confirm('すべてのデータを削除しますか？')) {
      setData([]);
      localStorage.removeItem('app4_expense_data');
    }
  };

  const stats = calculateStats();
  const categoryData = getCategoryData();
  const storeRanking = getStoreRanking();
  const storeTableData = getStoreTableData();
  const paginatedTableData = storeTableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(storeTableData.length / itemsPerPage);

  // カテゴリ一覧（フィルタ用）
  const categories = Array.from(new Set(data.map(r => r.category)));

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <Link href="/" className="text-blue-500 underline block mb-4">
        ホームに戻る
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold mb-6">家計CSVビューワ</h1>

      {/* ファイル投入エリア */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 mb-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-lg mb-2">CSVファイルをドラッグ&ドロップ</p>
        <p className="text-sm text-gray-600">またはクリックしてファイルを選択</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* サンプルデータとクリアボタン */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={loadSampleData}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          サンプルデータを読み込み
        </button>
        <button
          onClick={clearData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          disabled={data.length === 0}
        >
          データをクリア
        </button>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={filteredData.length === 0}
        >
          CSVエクスポート
        </button>
      </div>

      {/* フィルタ */}
      {data.length > 0 && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">フィルタ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">開始日</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">終了日</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">カテゴリ</label>
              <select
                value={filters.category}
                onChange={e => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">すべて</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">店名検索</label>
              <input
                type="text"
                value={filters.searchStore}
                onChange={e => setFilters({ ...filters, searchStore: e.target.value })}
                placeholder="店名を入力"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', category: '', searchStore: '' })}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            フィルタをクリア
          </button>
        </div>
      )}

      {/* 集計カード */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">総額</h3>
            <p className="text-3xl font-bold">¥{stats.total.toLocaleString()}</p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">件数</h3>
            <p className="text-3xl font-bold">{stats.count.toLocaleString()}</p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">平均</h3>
            <p className="text-3xl font-bold">¥{Math.round(stats.average).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* グラフ */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">カテゴリ別支出</h2>
            <div className="max-w-md mx-auto">
              <Pie data={categoryData} options={{ maintainAspectRatio: true }} />
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">店別ランキング（上位10）</h2>
            <Bar
              data={storeRanking}
              options={{
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
              height={300}
            />
          </div>
        </div>
      )}

      {/* テーブル */}
      {storeTableData.length > 0 && (
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">店別集計</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4">店名</th>
                  <th className="text-right py-3 px-4">支出額</th>
                  <th className="text-right py-3 px-4">件数</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTableData.map((row, index) => (
                  <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">{row.store}</td>
                    <td className="text-right py-3 px-4">¥{row.amount.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* ページング */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                前へ
              </button>
              <span className="px-3 py-1">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      )}

      {/* データなし表示 */}
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <p className="text-lg">データがありません</p>
          <p className="text-sm mt-2">CSVファイルをドロップするか、サンプルデータを読み込んでください</p>
        </div>
      )}

      {/* 列マッピングダイアログ */}
      {showMappingDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">列マッピング設定</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              CSVの列を対応するフィールドに割り当ててください
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">日付 *</label>
                <select
                  value={columnMapping?.date || ''}
                  onChange={e => setColumnMapping({ ...columnMapping as ColumnMapping, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">選択してください</option>
                  {rawHeaders.map((header, i) => (
                    <option key={i} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">店名 *</label>
                <select
                  value={columnMapping?.store || ''}
                  onChange={e => setColumnMapping({ ...columnMapping as ColumnMapping, store: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">選択してください</option>
                  {rawHeaders.map((header, i) => (
                    <option key={i} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">カテゴリ *</label>
                <select
                  value={columnMapping?.category || ''}
                  onChange={e => setColumnMapping({ ...columnMapping as ColumnMapping, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">選択してください</option>
                  {rawHeaders.map((header, i) => (
                    <option key={i} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">金額 *</label>
                <select
                  value={columnMapping?.amount || ''}
                  onChange={e => setColumnMapping({ ...columnMapping as ColumnMapping, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">選択してください</option>
                  {rawHeaders.map((header, i) => (
                    <option key={i} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">メモ（オプション）</label>
                <select
                  value={columnMapping?.memo || ''}
                  onChange={e => setColumnMapping({ ...columnMapping as ColumnMapping, memo: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">選択しない</option>
                  {rawHeaders.map((header, i) => (
                    <option key={i} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowMappingDialog(false);
                  setColumnMapping(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                キャンセル
              </button>
              <button
                onClick={applyColumnMapping}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                適用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
