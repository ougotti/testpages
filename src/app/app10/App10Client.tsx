'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const PHASES = {
  focus: {
    label: '集中タイム',
    duration: 25 * 60,
    description: '25分間、タスクに全集中しましょう。',
  },
  break: {
    label: '休憩タイム',
    duration: 5 * 60,
    description: '5分間、肩の力を抜いて休憩しましょう。',
  },
} as const;

type PhaseKey = keyof typeof PHASES;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function App10Client() {
  const [phase, setPhase] = useState<PhaseKey>('focus');
  const [secondsLeft, setSecondsLeft] = useState(PHASES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);

  const phaseInfo = useMemo(() => PHASES[phase], [phase]);
  const progressRatio = useMemo(() => {
    const total = phaseInfo.duration;
    return Math.min(1, Math.max(0, 1 - secondsLeft / total));
  }, [phaseInfo.duration, secondsLeft]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || secondsLeft > 0) {
      return;
    }

    setIsRunning(false);

    setTimeout(() => {
      setPhase((currentPhase) => {
        const nextPhase: PhaseKey = currentPhase === 'focus' ? 'break' : 'focus';
        if (currentPhase === 'focus') {
          setCompletedFocus((count) => count + 1);
        }
        setSecondsLeft(PHASES[nextPhase].duration);
        setIsRunning(true);
        return nextPhase;
      });
    }, 500);
  }, [isRunning, secondsLeft]);

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('focus');
    setSecondsLeft(PHASES.focus.duration);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setPhase((currentPhase) => {
      const nextPhase: PhaseKey = currentPhase === 'focus' ? 'break' : 'focus';
      if (currentPhase === 'focus') {
        setCompletedFocus((count) => count + 1);
      }
      setSecondsLeft(PHASES[nextPhase].duration);
      return nextPhase;
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href="/" className="text-blue-500 underline inline-block">
        ホームに戻る
      </Link>

      <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 space-y-6">
        <header className="space-y-2 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">現在のモード</p>
          <h1 className="text-3xl font-semibold">{phaseInfo.label}</h1>
          <p className="text-gray-600 dark:text-gray-300">{phaseInfo.description}</p>
        </header>

        <div className="flex flex-col items-center space-y-4">
          <div className="text-6xl font-mono font-bold" aria-live="polite">
            {formatTime(secondsLeft)}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-rose-500 transition-all"
              style={{ width: `${progressRatio * 100}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progressRatio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={handleStartPause}
            className="px-4 py-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition"
          >
            {isRunning ? '一時停止' : '開始'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-full border border-rose-500 text-rose-500 hover:bg-rose-50 dark:hover:bg-gray-800 transition"
          >
            リセット
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 rounded-full border border-gray-400 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            スキップ
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 space-y-3">
        <h2 className="text-xl font-semibold">今日の進捗</h2>
        <p className="text-gray-700 dark:text-gray-200">
          完了した集中セッション：{completedFocus}回
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          4回達成するたびに長めの休憩を取り、心身をリフレッシュさせましょう。
        </p>
      </section>
    </div>
  );
}
