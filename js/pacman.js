// ==================== 吃豆人游戏模块 ====================
// 独立模块，被 game.js 中 mi3（步兵战术）课程调用

var PacmanGame = (function () {
    'use strict';

    // ========== 3 张地图 ==========
    // 1=墙, 0=通道(有豆子), 2=能量豆, 3=空通道(无豆子，用于初始位置)
    var MAPS = [
        // 地图 1：经典对称迷宫
        [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,0,0,0,0,0,1,0,0,0,0,0,2,1],
            [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,0,1,0,1,1,1,0,1,0,1,1,1],
            [1,0,0,0,1,0,3,3,3,0,1,0,0,0,1],
            [1,1,1,0,1,0,1,1,1,0,1,0,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
            [1,2,0,0,0,0,0,1,0,0,0,0,0,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        // 地图 2：十字交叉型
        [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
            [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,1,0,0,1,0,0,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,0,0,1,1,1,0,0,0,1,0,1],
            [1,0,1,0,1,0,1,3,1,0,1,0,1,0,1],
            [1,0,1,0,0,0,3,3,3,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,1,0,0,1,0,0,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
            [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        // 地图 3：回廊型
        [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
            [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
            [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
            [1,0,0,0,1,1,0,1,0,1,1,0,0,0,1],
            [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
            [1,0,1,0,1,0,1,3,1,0,1,0,1,0,1],
            [1,0,0,0,0,0,3,3,3,0,0,0,0,0,1],
            [1,0,1,0,1,0,1,3,1,0,1,0,1,0,1],
            [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
            [1,0,0,0,1,1,0,1,0,1,1,0,0,0,1],
            [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
            [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
            [1,2,0,0,0,0,0,0,0,0,0,0,0,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    ];

    var MAP_ROWS = 15;
    var MAP_COLS = 15;

    // 颜色定义
    var COLORS = {
        bg: '#000',
        wall: '#1a237e',
        wallBorder: '#283593',
        dot: '#ffffff',
        powerDot: '#FFD700',
        player: '#FFD700',
        enemy1: '#FF0000',
        enemy2: '#FF69B4',
        enemyScared: '#4169E1',
        text: '#ffffff'
    };

    // ========== 游戏状态 ==========
    var state = {
        canvas: null,
        ctx: null,
        cellSize: 0,
        map: null,           // 当前地图的副本
        mapIndex: 0,
        isRunning: false,
        onEndCallback: null,

        // 帧计数器（控制移动节奏）
        frameCount: 0,
        playerMoveInterval: 8,   // 玩家每 8 帧移动一格（约每秒7.5格）
        enemyMoveInterval: 18,   // 敌人每 18 帧移动一格（约每秒3.3格，更慢更友好）

        // 玩家
        player: { x: 1, y: 1, dir: 'right', nextDir: 'right' },

        // 敌人
        enemies: [],

        // 豆子（用二维数组记录）
        // 0=无豆子, 1=普通豆子, 2=能量豆
        dotMap: null,
        totalDots: 0,
        collectedDots: 0,

        // 能量模式
        powerMode: false,
        powerTimer: 0,
        powerDuration: 300, // 帧数（约5秒@60fps）

        // 分数
        score: 0,

        // 动画
        animFrame: null,
        mouthAngle: 0,
        mouthDir: 1,

        // 控制
        touchStartX: 0,
        touchStartY: 0,
        keyHandler: null,
        touchStartHandler: null,
        touchEndHandler: null,
        touchMoveHandler: null
    };

    // ========== 初始化 ==========
    function start(canvas, mapIndex, onEndCallback) {
        state.canvas = canvas;
        state.ctx = canvas.getContext('2d');
        state.mapIndex = mapIndex % MAPS.length;
        state.onEndCallback = onEndCallback;

        // 计算 cellSize（响应式）
        var container = canvas.parentElement;
        var containerWidth = container ? container.offsetWidth : window.innerWidth;
        var maxWidth = Math.min(containerWidth - 30, 450);
        state.cellSize = Math.max(18, Math.floor(maxWidth / MAP_COLS));
        canvas.width = MAP_COLS * state.cellSize;
        canvas.height = MAP_ROWS * state.cellSize;
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';

        // 深拷贝地图
        state.map = [];
        for (var r = 0; r < MAP_ROWS; r++) {
            state.map[r] = MAPS[state.mapIndex][r].slice();
        }

        // 初始化豆子
        initDots();

        // 初始化玩家（左上角第一个通道）
        initPlayer();

        // 初始化敌人（地图中标记为3的位置）
        initEnemies();

        // 重置状态
        state.score = 0;
        state.collectedDots = 0;
        state.powerMode = false;
        state.powerTimer = 0;
        state.frameCount = 0;
        state.mouthAngle = 0;
        state.mouthDir = 1;
        state.isRunning = true;

        // 绑定控制
        bindInput();

        // 更新UI
        updateUI();

        // 启动游戏循环
        gameLoop();
    }

    function initDots() {
        state.dotMap = [];
        state.totalDots = 0;
        for (var r = 0; r < MAP_ROWS; r++) {
            state.dotMap[r] = [];
            for (var c = 0; c < MAP_COLS; c++) {
                var tile = state.map[r][c];
                if (tile === 0) {
                    state.dotMap[r][c] = 1; // 普通豆子
                    state.totalDots++;
                } else if (tile === 2) {
                    state.dotMap[r][c] = 2; // 能量豆
                    state.totalDots++;
                } else {
                    state.dotMap[r][c] = 0; // 无豆子
                }
            }
        }
    }

    function initPlayer() {
        // 找到左上区域第一个通道格子
        for (var r = 1; r < MAP_ROWS; r++) {
            for (var c = 1; c < MAP_COLS; c++) {
                if (state.map[r][c] !== 1) {
                    state.player.x = c;
                    state.player.y = r;
                    state.player.dir = 'right';
                    state.player.nextDir = 'right';
                    // 移除该位置的豆子（起始位置）
                    state.dotMap[r][c] = 0;
                    return;
                }
            }
        }
    }

    function initEnemies() {
        state.enemies = [];
        var positions = [];
        // 找到所有标记为3的格子
        for (var r = 0; r < MAP_ROWS; r++) {
            for (var c = 0; c < MAP_COLS; c++) {
                if (state.map[r][c] === 3) {
                    positions.push({ x: c, y: r });
                }
            }
        }
        // 创建2个敌人
        var colors = [COLORS.enemy1, COLORS.enemy2];
        for (var i = 0; i < 2; i++) {
            var pos = positions[i] || positions[0] || { x: 7, y: 7 };
            state.enemies.push({
                x: pos.x,
                y: pos.y,
                homeX: pos.x,
                homeY: pos.y,
                dir: 'up',
                prevDir: 'up',
                color: colors[i],
                scared: false
            });
        }
    }

    // ========== 输入控制 ==========
    function bindInput() {
        unbindInput(); // 先清理旧的

        // 键盘
        state.keyHandler = function (e) {
            if (!state.isRunning) return;
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W':
                    state.player.nextDir = 'up'; e.preventDefault(); break;
                case 'ArrowDown': case 's': case 'S':
                    state.player.nextDir = 'down'; e.preventDefault(); break;
                case 'ArrowLeft': case 'a': case 'A':
                    state.player.nextDir = 'left'; e.preventDefault(); break;
                case 'ArrowRight': case 'd': case 'D':
                    state.player.nextDir = 'right'; e.preventDefault(); break;
            }
        };
        document.addEventListener('keydown', state.keyHandler);

        // Canvas 滑动（手机端优化）
        state.touchStartHandler = function (e) {
            e.preventDefault();
            e.stopPropagation();
            var touch = e.touches[0];
            state.touchStartX = touch.clientX;
            state.touchStartY = touch.clientY;
        };
        state.touchEndHandler = function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (!state.isRunning) return;
            var touch = e.changedTouches[0];
            if (!touch) return;
            var dx = touch.clientX - state.touchStartX;
            var dy = touch.clientY - state.touchStartY;
            var ax = Math.abs(dx);
            var ay = Math.abs(dy);
            // 降低最小滑动距离，让操作更灵敏
            if (ax < 10 && ay < 10) return;
            if (ax > ay) {
                state.player.nextDir = dx > 0 ? 'right' : 'left';
            } else {
                state.player.nextDir = dy > 0 ? 'down' : 'up';
            }
        };
        state.canvas.addEventListener('touchstart', state.touchStartHandler, { passive: false });
        state.canvas.addEventListener('touchend', state.touchEndHandler, { passive: false });
        // 防止触摸时页面滚动
        state.touchMoveHandler = function(e) {
            e.preventDefault();
        };
        state.canvas.addEventListener('touchmove', state.touchMoveHandler, { passive: false });

        // 方向按钮（手机端优化）
        var buttons = document.querySelectorAll('.pacman-btn');
        for (var i = 0; i < buttons.length; i++) {
            (function (btn) {
                var handler = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!state.isRunning) return;
                    var dir = btn.dataset.direction;
                    if (dir) {
                        state.player.nextDir = dir;
                        // 视觉反馈：按钮按下效果
                        btn.style.opacity = '0.7';
                        setTimeout(function() {
                            btn.style.opacity = '1';
                        }, 100);
                    }
                };
                btn._pacmanHandler = handler;
                // 移动端：touchstart 和 touchend 都绑定，确保响应
                btn.addEventListener('touchstart', handler, { passive: false });
                btn.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }, { passive: false });
                // 桌面端：mousedown
                btn.addEventListener('mousedown', handler);
            })(buttons[i]);
        }
    }

    function unbindInput() {
        if (state.keyHandler) {
            document.removeEventListener('keydown', state.keyHandler);
            state.keyHandler = null;
        }
        if (state.touchStartHandler && state.canvas) {
            state.canvas.removeEventListener('touchstart', state.touchStartHandler);
            state.touchStartHandler = null;
        }
        if (state.touchEndHandler && state.canvas) {
            state.canvas.removeEventListener('touchend', state.touchEndHandler);
            state.touchEndHandler = null;
        }
        if (state.touchMoveHandler && state.canvas) {
            state.canvas.removeEventListener('touchmove', state.touchMoveHandler);
            state.touchMoveHandler = null;
        }
        var buttons = document.querySelectorAll('.pacman-btn');
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i]._pacmanHandler) {
                buttons[i].removeEventListener('touchstart', buttons[i]._pacmanHandler);
                buttons[i].removeEventListener('mousedown', buttons[i]._pacmanHandler);
                buttons[i]._pacmanHandler = null;
            }
        }
    }

    // ========== 地图查询 ==========
    function isWall(x, y) {
        if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return true;
        return state.map[y][x] === 1;
    }

    function getNextPos(x, y, dir) {
        switch (dir) {
            case 'up':    return { x: x, y: y - 1 };
            case 'down':  return { x: x, y: y + 1 };
            case 'left':  return { x: x - 1, y: y };
            case 'right': return { x: x + 1, y: y };
        }
        return { x: x, y: y };
    }

    function oppositeDir(dir) {
        switch (dir) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
        }
        return dir;
    }

    // ========== 游戏循环 ==========
    function gameLoop() {
        if (!state.isRunning) return;
        state.frameCount++;

        // 更新玩家
        if (state.frameCount % state.playerMoveInterval === 0) {
            movePlayer();
        }

        // 更新敌人（能量模式下更慢，更容易被吃掉）
        var enemyInterval = state.powerMode ? state.enemyMoveInterval + 12 : state.enemyMoveInterval;
        if (state.frameCount % enemyInterval === 0) {
            moveEnemies();
        }

        // 能量模式倒计时
        if (state.powerMode) {
            state.powerTimer--;
            if (state.powerTimer <= 0) {
                state.powerMode = false;
                for (var i = 0; i < state.enemies.length; i++) {
                    state.enemies[i].scared = false;
                }
            }
        }

        // 嘴巴动画
        state.mouthAngle += 0.15 * state.mouthDir;
        if (state.mouthAngle > 0.8) state.mouthDir = -1;
        if (state.mouthAngle < 0.05) state.mouthDir = 1;

        // 绘制
        draw();

        state.animFrame = requestAnimationFrame(gameLoop);
    }

    // ========== 玩家移动 ==========
    function movePlayer() {
        var p = state.player;

        // 尝试转向
        var next = getNextPos(p.x, p.y, p.nextDir);
        if (!isWall(next.x, next.y)) {
            p.dir = p.nextDir;
        }

        // 沿当前方向前进
        var ahead = getNextPos(p.x, p.y, p.dir);
        if (!isWall(ahead.x, ahead.y)) {
            p.x = ahead.x;
            p.y = ahead.y;
        }

        // 吃豆子
        if (state.dotMap[p.y] && state.dotMap[p.y][p.x]) {
            var dotType = state.dotMap[p.y][p.x];
            state.dotMap[p.y][p.x] = 0;
            state.collectedDots++;
            if (dotType === 2) {
                // 能量豆
                state.score += 5;
                state.powerMode = true;
                state.powerTimer = state.powerDuration;
                for (var i = 0; i < state.enemies.length; i++) {
                    state.enemies[i].scared = true;
                }
            } else {
                state.score += 1;
            }
            updateUI();

            // 检查胜利
            if (state.collectedDots >= state.totalDots) {
                endGame(true);
                return;
            }
        }

        // 检查与敌人碰撞
        checkPlayerEnemyCollision();
    }

    // ========== 敌人移动 ==========
    function moveEnemies() {
        for (var i = 0; i < state.enemies.length; i++) {
            var e = state.enemies[i];
            var dirs = ['up', 'down', 'left', 'right'];
            var possible = [];
            var opp = oppositeDir(e.dir);

            // 找到可走的方向（排除掉头，除非没有其他选择）
            for (var j = 0; j < dirs.length; j++) {
                if (dirs[j] === opp) continue; // 不掉头
                var np = getNextPos(e.x, e.y, dirs[j]);
                if (!isWall(np.x, np.y)) {
                    possible.push(dirs[j]);
                }
            }

            // 如果没有可走方向（死胡同），允许掉头
            if (possible.length === 0) {
                var np2 = getNextPos(e.x, e.y, opp);
                if (!isWall(np2.x, np2.y)) {
                    possible.push(opp);
                }
            }

            if (possible.length > 0) {
                var chosen;
                if (e.scared) {
                    // 害怕模式：完全随机
                    chosen = possible[Math.floor(Math.random() * possible.length)];
                } else {
                    // 正常模式：40% 概率选最优方向，60% 随机（降低追踪强度，让游戏更容易）
                    if (Math.random() < 0.4) {
                        var bestDir = possible[0];
                        var bestDist = Infinity;
                        for (var k = 0; k < possible.length; k++) {
                            var tp = getNextPos(e.x, e.y, possible[k]);
                            var dist = Math.abs(tp.x - state.player.x) + Math.abs(tp.y - state.player.y);
                            if (dist < bestDist) {
                                bestDist = dist;
                                bestDir = possible[k];
                            }
                        }
                        chosen = bestDir;
                    } else {
                        chosen = possible[Math.floor(Math.random() * possible.length)];
                    }
                }
                e.prevDir = e.dir;
                e.dir = chosen;
                var moveTarget = getNextPos(e.x, e.y, chosen);
                e.x = moveTarget.x;
                e.y = moveTarget.y;
            }
        }

        // 移动后检查碰撞
        checkPlayerEnemyCollision();
    }

    // ========== 碰撞检测 ==========
    function checkPlayerEnemyCollision() {
        var p = state.player;
        for (var i = 0; i < state.enemies.length; i++) {
            var e = state.enemies[i];
            if (e.x === p.x && e.y === p.y) {
                if (state.powerMode && e.scared) {
                    // 吃掉敌人
                    state.score += 10;
                    e.x = e.homeX;
                    e.y = e.homeY;
                    e.scared = false;
                    updateUI();
                } else {
                    // 被敌人抓住
                    endGame(false);
                }
            }
        }
    }

    // ========== 绘制 ==========
    function draw() {
        var ctx = state.ctx;
        var cs = state.cellSize;
        var w = state.canvas.width;
        var h = state.canvas.height;

        // 背景
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, w, h);

        // 地图
        for (var r = 0; r < MAP_ROWS; r++) {
            for (var c = 0; c < MAP_COLS; c++) {
                var tile = state.map[r][c];
                if (tile === 1) {
                    // 墙壁
                    ctx.fillStyle = COLORS.wall;
                    ctx.fillRect(c * cs, r * cs, cs, cs);
                    // 边框
                    ctx.strokeStyle = COLORS.wallBorder;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(c * cs + 0.5, r * cs + 0.5, cs - 1, cs - 1);
                }
            }
        }

        // 豆子
        for (var r2 = 0; r2 < MAP_ROWS; r2++) {
            for (var c2 = 0; c2 < MAP_COLS; c2++) {
                var dot = state.dotMap[r2][c2];
                if (dot === 1) {
                    // 普通豆子
                    ctx.fillStyle = COLORS.dot;
                    ctx.beginPath();
                    ctx.arc(c2 * cs + cs / 2, r2 * cs + cs / 2, cs / 8, 0, Math.PI * 2);
                    ctx.fill();
                } else if (dot === 2) {
                    // 能量豆（闪烁）
                    var alpha = 0.5 + 0.5 * Math.sin(state.frameCount * 0.1);
                    ctx.fillStyle = 'rgba(255, 215, 0, ' + alpha + ')';
                    ctx.beginPath();
                    ctx.arc(c2 * cs + cs / 2, r2 * cs + cs / 2, cs / 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // 敌人
        for (var i = 0; i < state.enemies.length; i++) {
            var e = state.enemies[i];
            var ex = e.x * cs + cs / 2;
            var ey = e.y * cs + cs / 2;
            var eRadius = cs / 2.5;

            if (state.powerMode && e.scared) {
                // 快结束时闪烁
                if (state.powerTimer < 90 && state.frameCount % 10 < 5) {
                    ctx.fillStyle = '#ffffff';
                } else {
                    ctx.fillStyle = COLORS.enemyScared;
                }
            } else {
                ctx.fillStyle = e.color;
            }

            // 画敌人主体（半圆+矩形底部+波浪）
            ctx.beginPath();
            ctx.arc(ex, ey - eRadius * 0.2, eRadius, Math.PI, 0, false);
            ctx.lineTo(ex + eRadius, ey + eRadius * 0.8);
            // 波浪底部
            var waveCount = 3;
            var waveWidth = (eRadius * 2) / waveCount;
            for (var ww = 0; ww < waveCount; ww++) {
                var waveX = ex + eRadius - ww * waveWidth;
                ctx.quadraticCurveTo(
                    waveX - waveWidth / 2, ey + eRadius * 1.3,
                    waveX - waveWidth, ey + eRadius * 0.8
                );
            }
            ctx.closePath();
            ctx.fill();

            // 眼睛
            var eyeOffX = eRadius * 0.3;
            var eyeR = eRadius * 0.22;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ex - eyeOffX, ey - eRadius * 0.3, eyeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex + eyeOffX, ey - eRadius * 0.3, eyeR, 0, Math.PI * 2);
            ctx.fill();
            // 瞳孔
            ctx.fillStyle = e.scared ? '#fff' : '#000';
            var pupilR = eyeR * 0.55;
            ctx.beginPath();
            ctx.arc(ex - eyeOffX, ey - eRadius * 0.3, pupilR, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex + eyeOffX, ey - eRadius * 0.3, pupilR, 0, Math.PI * 2);
            ctx.fill();
        }

        // 玩家（吃豆人）
        var p = state.player;
        var px = p.x * cs + cs / 2;
        var py = p.y * cs + cs / 2;
        var pRadius = cs / 2.5;
        var mouth = state.mouthAngle * 0.5; // 嘴巴角度（弧度）

        // 根据方向旋转
        var rotAngle = 0;
        switch (p.dir) {
            case 'right': rotAngle = 0; break;
            case 'down':  rotAngle = Math.PI / 2; break;
            case 'left':  rotAngle = Math.PI; break;
            case 'up':    rotAngle = -Math.PI / 2; break;
        }

        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(px, py, pRadius, rotAngle + mouth, rotAngle + Math.PI * 2 - mouth);
        ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fill();

        // 能量模式光环
        if (state.powerMode) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, pRadius + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // ========== UI 更新 ==========
    function updateUI() {
        var progressEl = document.getElementById('tacticsProgress');
        var totalEl = document.getElementById('tacticsTotal');
        var scoreEl = document.getElementById('tacticsScore');
        if (progressEl) progressEl.textContent = state.collectedDots;
        if (totalEl) totalEl.textContent = state.totalDots;
        if (scoreEl) scoreEl.textContent = state.score;
    }

    // ========== 游戏结束 ==========
    function endGame(won) {
        state.isRunning = false;
        if (state.animFrame) {
            cancelAnimationFrame(state.animFrame);
            state.animFrame = null;
        }
        unbindInput();

        if (state.onEndCallback) {
            state.onEndCallback({
                won: won,
                score: state.score,
                collected: state.collectedDots,
                total: state.totalDots
            });
        }
    }

    function stop() {
        state.isRunning = false;
        if (state.animFrame) {
            cancelAnimationFrame(state.animFrame);
            state.animFrame = null;
        }
        unbindInput();
    }

    // ========== 公开 API ==========
    return {
        start: start,
        stop: stop
    };
})();
