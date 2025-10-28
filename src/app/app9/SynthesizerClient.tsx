'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface Note {
  freq: number;
  name: string;
}

export default function SynthesizerClient() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [volume, setVolume] = useState(0.3);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // 音階の定義（C4からB4まで）
  const notes: Note[] = [
    { freq: 261.63, name: 'C' },
    { freq: 277.18, name: 'C#' },
    { freq: 293.66, name: 'D' },
    { freq: 311.13, name: 'D#' },
    { freq: 329.63, name: 'E' },
    { freq: 349.23, name: 'F' },
    { freq: 369.99, name: 'F#' },
    { freq: 392.00, name: 'G' },
    { freq: 415.30, name: 'G#' },
    { freq: 440.00, name: 'A' },
    { freq: 466.16, name: 'A#' },
    { freq: 493.88, name: 'B' },
  ];

  // AudioContextの初期化
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);
    gainNodeRef.current.gain.value = volume;

    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    analyserRef.current.connect(gainNodeRef.current);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ボリュームの更新
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // ビジュアライゼーション
  const visualize = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      canvasContext.fillStyle = 'rgb(20, 20, 30)';
      canvasContext.fillRect(0, 0, canvas.width, canvas.height);

      canvasContext.lineWidth = 2;
      canvasContext.strokeStyle = 'rgb(100, 200, 255)';
      canvasContext.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasContext.moveTo(x, y);
        } else {
          canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasContext.lineTo(canvas.width, canvas.height / 2);
      canvasContext.stroke();
    };

    draw();
  };

  const playNote = (frequency: number, noteName: string) => {
    if (!audioContextRef.current || !gainNodeRef.current || !analyserRef.current) return;

    stopNote();

    oscillatorRef.current = audioContextRef.current.createOscillator();
    oscillatorRef.current.type = waveform;
    oscillatorRef.current.frequency.value = frequency;
    oscillatorRef.current.connect(analyserRef.current);
    oscillatorRef.current.start();

    setIsPlaying(true);
    setCurrentNote(noteName);

    if (!animationRef.current) {
      visualize();
    }
  };

  const stopNote = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
    setCurrentNote(null);
  };

  const handleKeyDown = (note: Note) => {
    playNote(note.freq, note.name);
  };

  const handleKeyUp = () => {
    stopNote();
  };

  const waveforms: { type: OscillatorType; label: string }[] = [
    { type: 'sine', label: '正弦波' },
    { type: 'square', label: '矩形波' },
    { type: 'sawtooth', label: 'のこぎり波' },
    { type: 'triangle', label: '三角波' },
  ];

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">音楽シンセサイザー</h1>
        <p className="text-center text-gray-400 mb-8">キーを押して音を鳴らそう</p>

        {/* ビジュアライザー */}
        <div className="mb-8 bg-gray-950 rounded-lg p-4 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={800}
            height={200}
            className="w-full rounded"
          />
        </div>

        {/* コントロールパネル */}
        <div className="mb-8 bg-gray-800 rounded-lg p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 波形選択 */}
            <div>
              <label className="block text-sm font-medium mb-3">波形</label>
              <div className="grid grid-cols-2 gap-2">
                {waveforms.map((wave) => (
                  <button
                    key={wave.type}
                    onClick={() => setWaveform(wave.type)}
                    className={`px-4 py-2 rounded transition-colors ${
                      waveform === wave.type
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {wave.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ボリューム */}
            <div>
              <label className="block text-sm font-medium mb-3">
                音量: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* 現在の音符表示 */}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-400">現在の音符: </span>
            <span className="text-2xl font-bold text-blue-400">
              {currentNote || '-'}
            </span>
          </div>
        </div>

        {/* ピアノキーボード */}
        <div className="mb-8">
          <div className="flex justify-center gap-1 bg-gray-900 p-4 rounded-lg shadow-2xl">
            {notes.map((note, index) => {
              const isBlackKey = note.name.includes('#');
              return (
                <button
                  key={index}
                  onMouseDown={() => handleKeyDown(note)}
                  onMouseUp={handleKeyUp}
                  onMouseLeave={handleKeyUp}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleKeyDown(note);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleKeyUp();
                  }}
                  className={`
                    relative select-none transition-all
                    ${
                      isBlackKey
                        ? 'w-12 h-32 bg-gray-950 hover:bg-gray-800 -mx-3 z-10 border-2 border-gray-700'
                        : 'w-16 h-48 bg-white hover:bg-gray-100 border-2 border-gray-300'
                    }
                    ${
                      currentNote === note.name && isPlaying
                        ? isBlackKey
                          ? 'bg-blue-700 border-blue-500'
                          : 'bg-blue-200 border-blue-400'
                        : ''
                    }
                    rounded-b-lg shadow-lg active:translate-y-1
                  `}
                >
                  <span
                    className={`
                      absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-medium
                      ${isBlackKey ? 'text-white' : 'text-gray-700'}
                    `}
                  >
                    {note.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-3">使い方</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>ピアノキーをクリックまたはタップして音を鳴らします</li>
            <li>波形を変更して異なる音色を楽しめます</li>
            <li>音量スライダーで音の大きさを調整できます</li>
            <li>上部のビジュアライザーで音の波形を確認できます</li>
          </ul>
        </div>

        <Link href="/" className="text-blue-400 hover:text-blue-300 underline block text-center">
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}
