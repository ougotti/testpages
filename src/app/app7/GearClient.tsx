'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export default function GearClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotationX, setRotationX] = useState(0.5);
  const [rotationY, setRotationY] = useState(0.5);
  const [rotationZ, setRotationZ] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [numTeeth, setNumTeeth] = useState(12);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const rotationRef = useRef({ x: 0.5, y: 0.5, z: 0 });

  // 3D変換関数
  const rotateX = (point: Vec3, angle: number): Vec3 => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x,
      y: point.y * cos - point.z * sin,
      z: point.y * sin + point.z * cos,
    };
  };

  const rotateY = (point: Vec3, angle: number): Vec3 => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos + point.z * sin,
      y: point.y,
      z: -point.x * sin + point.z * cos,
    };
  };

  const rotateZ = (point: Vec3, angle: number): Vec3 => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos,
      z: point.z,
    };
  };

  const project = (point: Vec3): { x: number; y: number } => {
    const scale = 200 / (point.z + 5);
    return {
      x: CANVAS_WIDTH / 2 + point.x * scale,
      y: CANVAS_HEIGHT / 2 - point.y * scale,
    };
  };

  // ギアの頂点を生成
  const createGearVertices = (teeth: number): Vec3[] => {
    const vertices: Vec3[] = [];
    const innerRadius = 1.0;
    const outerRadius = 1.5;
    const thickness = 0.3;
    
    // 前面と背面の歯を生成
    for (let face = 0; face < 2; face++) {
      const z = face === 0 ? thickness / 2 : -thickness / 2;
      
      for (let i = 0; i < teeth * 4; i++) {
        const angle = (i * Math.PI) / (teeth * 2);
        const isOuter = i % 2 === 0;
        const radius = isOuter ? outerRadius : innerRadius;
        
        vertices.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          z: z,
        });
      }
    }
    
    return vertices;
  };

  const drawGear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentRotationX = rotationRef.current.x;
    const currentRotationY = rotationRef.current.y;
    const currentRotationZ = rotationRef.current.z;

    // 背景をクリア
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // ギアの頂点を生成
    const vertices = createGearVertices(numTeeth);
    
    // 回転を適用
    const rotatedVertices = vertices.map(v => {
      let rotated = rotateX(v, currentRotationX);
      rotated = rotateY(rotated, currentRotationY);
      rotated = rotateZ(rotated, currentRotationZ);
      return rotated;
    });

    // 前面を描画
    const frontVertices = rotatedVertices.slice(0, numTeeth * 4);
    const projected = frontVertices.map(v => project(v));
    
    // ギアの本体を描画
    ctx.beginPath();
    ctx.moveTo(projected[0].x, projected[0].y);
    for (let i = 1; i < projected.length; i++) {
      ctx.lineTo(projected[i].x, projected[i].y);
    }
    ctx.closePath();
    
    // グラデーションで塗りつぶし
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 200
    );
    gradient.addColorStop(0, '#4a90e2');
    gradient.addColorStop(1, '#2c5f9e');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 輪郭線
    ctx.strokeStyle = '#1a3a5e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 背面を描画（少し暗く）
    const backVertices = rotatedVertices.slice(numTeeth * 4);
    const projectedBack = backVertices.map(v => project(v));
    
    ctx.beginPath();
    ctx.moveTo(projectedBack[0].x, projectedBack[0].y);
    for (let i = 1; i < projectedBack.length; i++) {
      ctx.lineTo(projectedBack[i].x, projectedBack[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = '#2c5f9e';
    ctx.fill();
    ctx.strokeStyle = '#1a3a5e';
    ctx.stroke();

    // 中心の穴を描画
    const centerHoleRadius = 0.5;
    for (let face = 0; face < 2; face++) {
      const z = face === 0 ? 0.15 : -0.15;
      const holeVertices: Vec3[] = [];
      
      for (let i = 0; i < 32; i++) {
        const angle = (i * 2 * Math.PI) / 32;
        holeVertices.push({
          x: centerHoleRadius * Math.cos(angle),
          y: centerHoleRadius * Math.sin(angle),
          z: z,
        });
      }
      
      const rotatedHole = holeVertices.map(v => {
        let rotated = rotateX(v, currentRotationX);
        rotated = rotateY(rotated, currentRotationY);
        rotated = rotateZ(rotated, currentRotationZ);
        return rotated;
      });
      
      const projectedHole = rotatedHole.map(v => project(v));
      
      ctx.beginPath();
      ctx.moveTo(projectedHole[0].x, projectedHole[0].y);
      for (let i = 1; i < projectedHole.length; i++) {
        ctx.lineTo(projectedHole[i].x, projectedHole[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = '#0d0d1a';
      ctx.fill();
      ctx.strokeStyle = '#1a3a5e';
      ctx.stroke();
    }

    // 側面の歯を接続する線を描画
    ctx.strokeStyle = '#1a3a5e';
    ctx.lineWidth = 1;
    for (let i = 0; i < numTeeth * 4; i++) {
      const front = project(rotatedVertices[i]);
      const back = project(rotatedVertices[i + numTeeth * 4]);
      ctx.beginPath();
      ctx.moveTo(front.x, front.y);
      ctx.lineTo(back.x, back.y);
      ctx.stroke();
    }
  }, [numTeeth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    let isRunning = true;
    
    const animate = () => {
      if (!isRunning) return;
      
      if (autoRotate) {
        rotationRef.current.y += 0.01;
        rotationRef.current.z += 0.005;
      }
      drawGear();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoRotate, numTeeth, drawGear]);

  // Sync state with ref when manually changed
  useEffect(() => {
    rotationRef.current.x = rotationX;
    rotationRef.current.y = rotationY;
    rotationRef.current.z = rotationZ;
  }, [rotationX, rotationY, rotationZ]);

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <Link href="/" className="text-blue-500 underline block mb-4">
        ホームに戻る
      </Link>
      
      <h1 className="text-3xl font-bold mb-4">3Dギア表示・操作</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-4 py-2 rounded ${
              autoRotate 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-500 hover:bg-gray-600'
            } text-white transition-colors`}
          >
            {autoRotate ? '自動回転: ON' : '自動回転: OFF'}
          </button>
          
          <button
            onClick={() => {
              setRotationX(0.5);
              setRotationY(0.5);
              setRotationZ(0);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            リセット
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-sm mb-1">
              X軸回転: {rotationX.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.01"
              value={rotationX}
              onChange={(e) => setRotationX(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Y軸回転: {rotationY.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.01"
              value={rotationY}
              onChange={(e) => setRotationY(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Z軸回転: {rotationZ.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.01"
              value={rotationZ}
              onChange={(e) => setRotationZ(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              歯の数: {numTeeth}
            </label>
            <input
              type="range"
              min="6"
              max="24"
              step="1"
              value={numTeeth}
              onChange={(e) => setNumTeeth(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded shadow-lg"
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      <div className="mt-6 text-sm text-gray-600">
        <h2 className="font-bold mb-2">使い方:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>スライダーで各軸の回転角度を調整できます</li>
          <li>自動回転ボタンでギアが自動的に回転します</li>
          <li>リセットボタンで初期角度に戻します</li>
          <li>歯の数を変更してギアの形状を調整できます</li>
        </ul>
      </div>
    </div>
  );
}
