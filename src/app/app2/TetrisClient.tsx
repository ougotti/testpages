'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

type Matrix = number[][];

interface Piece {
  matrix: Matrix;
  pos: { x: number; y: number };
  color: string;
}

const PIECES: Record<string, { matrix: Matrix; color: string }> = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#0ff',
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#00f',
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f60',
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: '#ff0',
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#0f0',
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a0f',
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f00',
  },
};

function createPiece(): Piece {
  const types = Object.keys(PIECES);
  const type = types[(Math.random() * types.length) | 0];
  const { matrix, color } = PIECES[type];
  return {
    matrix: matrix.map((row) => [...row]),
    color,
    pos: {
      x: Math.floor(COLS / 2 - matrix[0].length / 2),
      y: 0,
    },
  };
}

function rotate(matrix: Matrix): Matrix {
  return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
}

function collide(board: (string | 0)[][], piece: Piece): boolean {
  for (let y = 0; y < piece.matrix.length; y++) {
    for (let x = 0; x < piece.matrix[y].length; x++) {
      if (
        piece.matrix[y][x] !== 0 &&
        (board[y + piece.pos.y]?.[x + piece.pos.x] !== 0)
      ) {
        return true;
      }
    }
  }
  return false;
}

export default function TetrisClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;

    const board: (string | 0)[][] = Array.from({ length: ROWS }, () =>
      Array(COLS).fill(0)
    );
    let piece: Piece = createPiece();
    let scoreValue = 0;

    const drawCell = (x: number, y: number, color: string) => {
      context.fillStyle = color;
      context.fillRect(
        x * BLOCK_SIZE,
        y * BLOCK_SIZE,
        BLOCK_SIZE - 1,
        BLOCK_SIZE - 1
      );
    };

    const draw = () => {
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
          const cell = board[y][x];
          if (cell !== 0) {
            drawCell(x, y, cell as string);
          }
        }
      }

      piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            drawCell(x + piece.pos.x, y + piece.pos.y, piece.color);
          }
        });
      });
    };

    const merge = (board: (string | 0)[][], piece: Piece) => {
      piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            board[y + piece.pos.y][x + piece.pos.x] = piece.color;
          }
        });
      });
    };

    const sweep = () => {
      let lines = 0;
      for (let y = board.length - 1; y >= 0; y--) {
        if (board[y].every((v) => v !== 0)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(0));
          y++;
          lines++;
        }
      }
      if (lines > 0) {
        scoreValue += lines * 10;
        setScore(scoreValue);
      }
    };

    const resetPiece = () => {
      piece = createPiece();
      if (collide(board, piece)) {
        setGameOver(true);
        gameOverRef.current = true;
        clearInterval(dropTimer);
      }
    };

    const drop = () => {
      piece.pos.y++;
      if (collide(board, piece)) {
        piece.pos.y--;
        merge(board, piece);
        sweep();
        resetPiece();
      }
    };

    const move = (dir: number) => {
      piece.pos.x += dir;
      if (collide(board, piece)) {
        piece.pos.x -= dir;
      }
    };

    const rotatePiece = () => {
      const m = rotate(piece.matrix);
      const pos = piece.pos.x;
      let offset = 1;
      piece.matrix = m;
      while (collide(board, piece)) {
        piece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.matrix[0].length) {
          piece.matrix = rotate(rotate(rotate(m)));
          piece.pos.x = pos;
          return;
        }
      }
    };

    const hardDrop = () => {
      while (!collide(board, piece)) {
        piece.pos.y++;
      }
      piece.pos.y--;
      drop();
    };

    const keyListener = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;
      if (e.key === 'ArrowLeft') {
        move(-1);
      } else if (e.key === 'ArrowRight') {
        move(1);
      } else if (e.key === 'ArrowDown') {
        drop();
      } else if (e.key === 'ArrowUp') {
        rotatePiece();
      } else if (e.code === 'Space') {
        hardDrop();
      }
      draw();
    };

    window.addEventListener('keydown', keyListener);
    const dropTimer = setInterval(() => {
      drop();
      draw();
    }, 1000);
    draw();

    return () => {
      window.removeEventListener('keydown', keyListener);
      clearInterval(dropTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center text-foreground">
      <Link href="/" className="text-blue-500 underline mb-4 self-start">
        ホームに戻る
      </Link>
      <h1 className="text-3xl font-bold mb-4">テトリス</h1>
      <canvas ref={canvasRef} className="border border-gray-500 bg-black" />
      <p className="mt-4">スコア: {score}</p>
      {gameOver && <p className="mt-2 text-red-500">ゲームオーバー</p>}
      <p className="mt-4 text-sm text-gray-600">
        ←→: 移動 / ↑: 回転 / ↓: 落下 / スペース: 一気に落下
      </p>
    </div>
  );
}

