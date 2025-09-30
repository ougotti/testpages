'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MAX_ITERATIONS = 100;

interface ViewPort {
  centerX: number;
  centerY: number;
  zoom: number;
}

export default function MandelbrotClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<ViewPort>({
    centerX: -0.5,
    centerY: 0,
    zoom: 1,
  });
  const [isRendering, setIsRendering] = useState(false);

  const mandelbrot = (x: number, y: number): number => {
    let zx = 0;
    let zy = 0;
    let iterations = 0;

    while (zx * zx + zy * zy < 4 && iterations < MAX_ITERATIONS) {
      const xtemp = zx * zx - zy * zy + x;
      zy = 2 * zx * zy + y;
      zx = xtemp;
      iterations++;
    }

    return iterations;
  };

  const getColor = (iterations: number): string => {
    if (iterations === MAX_ITERATIONS) {
      return '#000000'; // Black for points in the set
    }

    // Create a rainbow color palette
    const hue = (iterations * 10) % 360;
    const saturation = 100;
    const lightness = 50;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const renderMandelbrot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    setIsRendering(true);

    const imageData = context.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data;

    // Calculate the complex plane bounds
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    const range = 4 / viewport.zoom;
    const xMin = viewport.centerX - (range * aspectRatio) / 2;
    const xMax = viewport.centerX + (range * aspectRatio) / 2;
    const yMin = viewport.centerY - range / 2;
    const yMax = viewport.centerY + range / 2;

    for (let px = 0; px < CANVAS_WIDTH; px++) {
      for (let py = 0; py < CANVAS_HEIGHT; py++) {
        // Map pixel coordinates to complex plane
        const x = xMin + (px / CANVAS_WIDTH) * (xMax - xMin);
        const y = yMin + (py / CANVAS_HEIGHT) * (yMax - yMin);

        const iterations = mandelbrot(x, y);
        const color = getColor(iterations);

        // Convert HSL to RGB for ImageData
        const hsl = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (hsl) {
          const h = parseInt(hsl[1]) / 360;
          const s = parseInt(hsl[2]) / 100;
          const l = parseInt(hsl[3]) / 100;

          const rgb = hslToRgb(h, s, l);
          const index = (py * CANVAS_WIDTH + px) * 4;
          data[index] = rgb[0];     // Red
          data[index + 1] = rgb[1]; // Green
          data[index + 2] = rgb[2]; // Blue
          data[index + 3] = 255;    // Alpha
        } else {
          // Fallback for black color
          const index = (py * CANVAS_WIDTH + px) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 255;
        }
      }
    }

    context.putImageData(imageData, 0, 0);
    setIsRendering(false);
  }, [viewport]);

  // Helper function to convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // Achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    // Convert pixel coordinates to complex plane coordinates
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    const range = 4 / viewport.zoom;
    const xMin = viewport.centerX - (range * aspectRatio) / 2;
    const xMax = viewport.centerX + (range * aspectRatio) / 2;
    const yMin = viewport.centerY - range / 2;
    const yMax = viewport.centerY + range / 2;

    const newCenterX = xMin + (px / CANVAS_WIDTH) * (xMax - xMin);
    const newCenterY = yMin + (py / CANVAS_HEIGHT) * (yMax - yMin);

    setViewport(prev => ({
      ...prev,
      centerX: newCenterX,
      centerY: newCenterY,
    }));
  };

  const handleZoomIn = () => {
    setViewport(prev => ({
      ...prev,
      zoom: prev.zoom * 2,
    }));
  };

  const handleZoomOut = () => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 2, 0.1),
    }));
  };

  const handleReset = () => {
    setViewport({
      centerX: -0.5,
      centerY: 0,
      zoom: 1,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }, []);

  useEffect(() => {
    renderMandelbrot();
  }, [renderMandelbrot]);

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <Link href="/" className="text-blue-500 underline block mb-4">
        ホームに戻る
      </Link>
      
      <h1 className="text-3xl font-bold mb-4">マンデルブロ集合</h1>
      
      <div className="mb-4 space-x-4">
        <button
          onClick={handleZoomIn}
          disabled={isRendering}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          拡大
        </button>
        <button
          onClick={handleZoomOut}
          disabled={isRendering}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          縮小
        </button>
        <button
          onClick={handleReset}
          disabled={isRendering}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          リセット
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          クリックして中心を移動 | 拡大率: {viewport.zoom.toFixed(2)}x
        </p>
        <p className="text-sm text-gray-600">
          中心: ({viewport.centerX.toFixed(6)}, {viewport.centerY.toFixed(6)})
        </p>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border border-gray-300 cursor-crosshair"
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      {isRendering && (
        <p className="mt-4 text-yellow-600">レンダリング中...</p>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <h2 className="font-bold mb-2">使い方:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>画像をクリックしてその点を中心に移動</li>
          <li>「拡大」ボタンで詳細を表示</li>
          <li>「縮小」ボタンで全体を表示</li>
          <li>「リセット」ボタンで初期状態に戻る</li>
        </ul>
      </div>
    </div>
  );
}