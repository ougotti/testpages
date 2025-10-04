'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 30;
const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 30;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 10;
const POWERUP_SIZE = 20;
const BOSS_WIDTH = 100;
const BOSS_HEIGHT = 80;

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Player extends GameObject {
  speed: number;
  firepower: number;
}

interface Enemy extends GameObject {
  speed: number;
  hp: number;
  color: string;
}

interface Bullet extends GameObject {
  speed: number;
}

interface PowerUp extends GameObject {
  hp: number;
}

interface Boss extends GameObject {
  speed: number;
  hp: number;
  maxHp: number;
}

export default function ShooterClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stage, setStage] = useState(1);
  const [paused, setPaused] = useState(false);
  const gameStateRef = useRef({
    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: 5,
      firepower: 1,
    } as Player,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    powerups: [] as PowerUp[],
    boss: null as Boss | null,
    keys: {} as Record<string, boolean>,
    lastShot: 0,
    shootDelay: 200,
    enemySpawnTimer: 0,
    enemySpawnDelay: 1000,
    bossSpawned: false,
    enemiesDefeated: 0,
    gameOver: false,
    paused: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const gameState = gameStateRef.current;
    let animationId: number;
    let lastTime = Date.now();

    // ゲームオブジェクトの描画関数
    const drawPlayer = () => {
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(
        gameState.player.x,
        gameState.player.y,
        gameState.player.width,
        gameState.player.height
      );
      // プレイヤーの砲塔
      ctx.fillStyle = '#00cc00';
      ctx.fillRect(
        gameState.player.x + gameState.player.width / 2 - 5,
        gameState.player.y - 10,
        10,
        10
      );
    };

    const drawBullets = () => {
      ctx.fillStyle = '#ffff00';
      gameState.bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      });
    };

    const drawEnemies = () => {
      gameState.enemies.forEach((enemy) => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        // 敵の目
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
        ctx.fillRect(enemy.x + 20, enemy.y + 5, 5, 5);
      });
    };

    const drawPowerUps = () => {
      gameState.powerups.forEach((powerup) => {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
        // パワーアップマーク
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('P', powerup.x + 6, powerup.y + 15);
      });
    };

    const drawBoss = () => {
      if (!gameState.boss) return;
      const boss = gameState.boss;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
      // ボスの目
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(boss.x + 20, boss.y + 20, 15, 15);
      ctx.fillRect(boss.x + 65, boss.y + 20, 15, 15);
      // ボスのHP表示
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
      ctx.fillStyle = '#ff0000';
      const hpWidth = (boss.hp / boss.maxHp) * boss.width;
      ctx.fillRect(boss.x, boss.y - 10, hpWidth, 5);
    };

    const drawUI = () => {
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText(`スコア: ${score}`, 10, 30);
      ctx.fillText(`ステージ: ${stage}`, 10, 60);
      ctx.fillText(`火力: ${gameState.player.firepower}`, 10, 90);
      
      if (gameState.paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ffffff';
        ctx.font = '40px Arial';
        ctx.fillText('一時停止', CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2);
      }
    };

    // ゲームロジック
    const spawnEnemy = () => {
      const enemy: Enemy = {
        x: Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH),
        y: -ENEMY_HEIGHT,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        speed: 1 + Math.random() * 2,
        hp: 1,
        color: '#ff6600',
      };
      gameState.enemies.push(enemy);
    };

    const spawnPowerUp = (x: number, y: number) => {
      const powerup: PowerUp = {
        x,
        y,
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
        hp: 3,
      };
      gameState.powerups.push(powerup);
    };

    const spawnBoss = () => {
      const boss: Boss = {
        x: CANVAS_WIDTH / 2 - BOSS_WIDTH / 2,
        y: 50,
        width: BOSS_WIDTH,
        height: BOSS_HEIGHT,
        speed: 2,
        hp: 50,
        maxHp: 50,
      };
      gameState.boss = boss;
      gameState.bossSpawned = true;
    };

    const shoot = () => {
      const now = Date.now();
      if (now - gameState.lastShot < gameState.shootDelay) return;
      
      gameState.lastShot = now;
      const firepower = gameState.player.firepower;
      
      // 火力に応じて弾の数と配置を変更
      if (firepower === 1) {
        gameState.bullets.push({
          x: gameState.player.x + gameState.player.width / 2 - BULLET_WIDTH / 2,
          y: gameState.player.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: 10,
        });
      } else if (firepower === 2) {
        gameState.bullets.push(
          {
            x: gameState.player.x + 10,
            y: gameState.player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: 10,
          },
          {
            x: gameState.player.x + gameState.player.width - 14,
            y: gameState.player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: 10,
          }
        );
      } else {
        gameState.bullets.push(
          {
            x: gameState.player.x + 5,
            y: gameState.player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: 10,
          },
          {
            x: gameState.player.x + gameState.player.width / 2 - BULLET_WIDTH / 2,
            y: gameState.player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: 10,
          },
          {
            x: gameState.player.x + gameState.player.width - 9,
            y: gameState.player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: 10,
          }
        );
      }
    };

    const checkCollision = (a: GameObject, b: GameObject): boolean => {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    };

    const update = (deltaTime: number) => {
      if (gameState.gameOver || gameState.paused) return;

      // プレイヤー移動
      if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
        gameState.player.x = Math.max(0, gameState.player.x - gameState.player.speed);
      }
      if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
        gameState.player.x = Math.min(
          CANVAS_WIDTH - gameState.player.width,
          gameState.player.x + gameState.player.speed
        );
      }

      // 連射
      if (gameState.keys[' '] || gameState.keys['z']) {
        shoot();
      }

      // 弾の更新
      gameState.bullets = gameState.bullets.filter((bullet) => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
      });

      // 敵の更新
      gameState.enemies = gameState.enemies.filter((enemy) => {
        enemy.y += enemy.speed;
        
        // 敵が下に到達したらゲームオーバー
        if (enemy.y > CANVAS_HEIGHT) {
          gameState.gameOver = true;
          setGameOver(true);
          return false;
        }
        
        return true;
      });

      // ボスの更新
      if (gameState.boss) {
        gameState.boss.x += gameState.boss.speed;
        if (gameState.boss.x <= 0 || gameState.boss.x >= CANVAS_WIDTH - gameState.boss.width) {
          gameState.boss.speed *= -1;
        }
      }

      // パワーアップの更新
      gameState.powerups = gameState.powerups.filter((powerup) => {
        powerup.y += 2;
        
        // プレイヤーとの衝突判定
        if (checkCollision(powerup, gameState.player)) {
          gameState.player.firepower = Math.min(3, gameState.player.firepower + 1);
          return false;
        }
        
        return powerup.y < CANVAS_HEIGHT;
      });

      // 弾と敵の衝突判定
      gameState.bullets.forEach((bullet) => {
        gameState.enemies = gameState.enemies.filter((enemy) => {
          if (checkCollision(bullet, enemy)) {
            enemy.hp--;
            bullet.y = -100; // 弾を削除
            if (enemy.hp <= 0) {
              setScore((s) => s + 10);
              gameState.enemiesDefeated++;
              
              // 10体倒すごとにパワーアップを出現
              if (gameState.enemiesDefeated % 10 === 0) {
                spawnPowerUp(enemy.x, enemy.y);
              }
              return false;
            }
          }
          return true;
        });

        // 弾とボスの衝突判定
        if (gameState.boss && checkCollision(bullet, gameState.boss)) {
          gameState.boss.hp--;
          bullet.y = -100;
          if (gameState.boss.hp <= 0) {
            setScore((s) => s + 500);
            setStage((s) => s + 1);
            gameState.boss = null;
            gameState.bossSpawned = false;
            gameState.enemiesDefeated = 0;
          }
        }
      });

      // 敵の生成
      if (!gameState.bossSpawned) {
        gameState.enemySpawnTimer += deltaTime;
        if (gameState.enemySpawnTimer > gameState.enemySpawnDelay) {
          spawnEnemy();
          gameState.enemySpawnTimer = 0;
        }

        // 30体倒したらボス出現
        if (gameState.enemiesDefeated >= 30) {
          spawnBoss();
        }
      }
    };

    const draw = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawPlayer();
      drawBullets();
      drawEnemies();
      drawPowerUps();
      drawBoss();
      drawUI();
    };

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      update(deltaTime);
      draw();

      if (!gameState.gameOver) {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        gameState.paused = !gameState.paused;
        setPaused(gameState.paused);
        return;
      }
      gameState.keys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [score, stage, paused]);

  const handleRestart = () => {
    setScore(0);
    setStage(1);
    setGameOver(false);
    setPaused(false);
    gameStateRef.current = {
      player: {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: CANVAS_HEIGHT - 100,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        speed: 5,
        firepower: 1,
      },
      bullets: [],
      enemies: [],
      powerups: [],
      boss: null,
      keys: {},
      lastShot: 0,
      shootDelay: 200,
      enemySpawnTimer: 0,
      enemySpawnDelay: 1000,
      bossSpawned: false,
      enemiesDefeated: 0,
      gameOver: false,
      paused: false,
    };
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center text-foreground">
      <Link href="/" className="text-blue-500 underline mb-4 self-start">
        ホームに戻る
      </Link>
      
      <h1 className="text-3xl font-bold mb-4">シューティングゲーム</h1>
      
      <div className="mb-4">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-600"
          style={{ backgroundColor: '#000' }}
        />
      </div>

      {gameOver && (
        <div className="mb-4 p-4 bg-red-600 text-white rounded">
          <h2 className="text-2xl font-bold mb-2">ゲームオーバー</h2>
          <p className="mb-2">最終スコア: {score}</p>
          <p className="mb-4">到達ステージ: {stage}</p>
          <button
            onClick={handleRestart}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            もう一度プレイ
          </button>
        </div>
      )}

      <div className="text-sm text-gray-300 max-w-xl">
        <h2 className="font-bold mb-2">操作方法:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>移動: 左右矢印キー または A/Dキー</li>
          <li>射撃: スペースキー または Zキー（連射可能）</li>
          <li>一時停止: Pキー</li>
        </ul>
        
        <h2 className="font-bold mt-4 mb-2">ゲームルール:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>敵を倒してスコアを稼ぎましょう</li>
          <li>敵が画面下に到達するとゲームオーバー</li>
          <li>10体倒すごとにパワーアップアイテムが出現</li>
          <li>パワーアップで火力が増加（最大3段階）</li>
          <li>30体倒すとボスが出現</li>
          <li>ボスを倒すと次のステージへ</li>
        </ul>
      </div>
    </div>
  );
}
