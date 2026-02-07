// ==================== 消消乐游戏模块 ====================
// 独立模块，被 game.js 中 mi2（军事生活管理）课程调用

var Match3Game = (function () {
    'use strict';

    var COLS = 7;
    var ROWS = 7;
    var ICONS = ['🪥', '🧹', '🪣', '🧺', '🍶', '🧤', '🪒'];
    var ICON_COUNT = ICONS.length;

    var state = {
        canvas: null,
        ctx: null,
        cellSize: 0,
        board: null,        // 二维数组 [row][col] = 图标索引
        isRunning: false,
        onEndCallback: null,

        // 选中
        selected: null,     // {row, col} 或 null

        // 分数和时间
        score: 0,
        timeLeft: 30,
        timer: null,
        comboCount: 0,

        // 动画
        animating: false,
        animFrame: null,
        fallingCells: [],   // 下落动画中的格子
        removingCells: [],  // 消除动画中的格子
        removeAlpha: 1,

        // 输入
        touchHandler: null,
        clickHandler: null
    };

    // ========== 初始化 ==========
    function start(canvas, onEndCallback) {
        state.canvas = canvas;
        state.ctx = canvas.getContext('2d');
        state.onEndCallback = onEndCallback;
        state.score = 0;
        state.timeLeft = 30;
        state.selected = null;
        state.animating = false;
        state.comboCount = 0;
        state.fallingCells = [];
        state.removingCells = [];
        state.removeAlpha = 1;

        // 计算 cellSize
        var container = canvas.parentElement;
        var containerWidth = container ? container.offsetWidth : window.innerWidth;
        var maxWidth = Math.min(containerWidth - 30, 420);
        state.cellSize = Math.max(30, Math.floor(maxWidth / COLS));
        canvas.width = COLS * state.cellSize;
        canvas.height = ROWS * state.cellSize;
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';

        // 生成棋盘（确保初始无三连）
        generateBoard();

        // 绑定输入
        bindInput();

        // 开始计时
        startTimer();

        state.isRunning = true;
        updateUI();
        drawLoop();
    }

    // ========== 棋盘生成 ==========
    function generateBoard() {
        state.board = [];
        for (var r = 0; r < ROWS; r++) {
            state.board[r] = [];
            for (var c = 0; c < COLS; c++) {
                var icon;
                do {
                    icon = Math.floor(Math.random() * ICON_COUNT);
                } while (wouldMatch(r, c, icon));
                state.board[r][c] = icon;
            }
        }
    }

    // 检查放置 icon 到 (r,c) 是否会产生三连
    function wouldMatch(r, c, icon) {
        // 水平检查：左边两个
        if (c >= 2 && state.board[r][c - 1] === icon && state.board[r][c - 2] === icon) return true;
        // 垂直检查：上面两个
        if (r >= 2 && state.board[r - 1][c] === icon && state.board[r - 2][c] === icon) return true;
        return false;
    }

    // ========== 输入 ==========
    function bindInput() {
        unbindInput();

        var getCell = function (clientX, clientY) {
            var rect = state.canvas.getBoundingClientRect();
            var x = clientX - rect.left;
            var y = clientY - rect.top;
            // 考虑 canvas 缩放
            var scaleX = state.canvas.width / rect.width;
            var scaleY = state.canvas.height / rect.height;
            x *= scaleX;
            y *= scaleY;
            var col = Math.floor(x / state.cellSize);
            var row = Math.floor(y / state.cellSize);
            if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
                return { row: row, col: col };
            }
            return null;
        };

        state.clickHandler = function (e) {
            if (!state.isRunning || state.animating) return;
            var cell = getCell(e.clientX, e.clientY);
            if (cell) handleCellClick(cell);
        };

        state.touchHandler = function (e) {
            e.preventDefault();
            if (!state.isRunning || state.animating) return;
            var touch = e.touches[0];
            if (!touch) return;
            var cell = getCell(touch.clientX, touch.clientY);
            if (cell) handleCellClick(cell);
        };

        state.canvas.addEventListener('click', state.clickHandler);
        state.canvas.addEventListener('touchstart', state.touchHandler, { passive: false });
    }

    function unbindInput() {
        if (state.clickHandler && state.canvas) {
            state.canvas.removeEventListener('click', state.clickHandler);
            state.clickHandler = null;
        }
        if (state.touchHandler && state.canvas) {
            state.canvas.removeEventListener('touchstart', state.touchHandler);
            state.touchHandler = null;
        }
    }

    // ========== 点击处理 ==========
    function handleCellClick(cell) {
        if (!state.selected) {
            // 第一次点击：选中
            state.selected = cell;
        } else {
            // 第二次点击
            var sel = state.selected;
            var dr = Math.abs(sel.row - cell.row);
            var dc = Math.abs(sel.col - cell.col);

            if (dr + dc === 1) {
                // 相邻：尝试交换
                state.selected = null;
                trySwap(sel, cell);
            } else if (sel.row === cell.row && sel.col === cell.col) {
                // 点击同一个：取消选中
                state.selected = null;
            } else {
                // 不相邻：改为选中新的
                state.selected = cell;
            }
        }
    }

    // ========== 交换与匹配 ==========
    function trySwap(a, b) {
        // 交换
        swap(a, b);

        // 检查是否产生匹配
        var matches = findMatches();
        if (matches.length > 0) {
            // 有匹配：开始消除
            state.comboCount = 0;
            processMatches(matches);
        } else {
            // 无匹配：换回去
            swap(a, b);
        }
    }

    function swap(a, b) {
        var temp = state.board[a.row][a.col];
        state.board[a.row][a.col] = state.board[b.row][b.col];
        state.board[b.row][b.col] = temp;
    }

    // ========== 查找匹配 ==========
    function findMatches() {
        var matched = [];
        // 初始化标记数组
        var mark = [];
        for (var r = 0; r < ROWS; r++) {
            mark[r] = [];
            for (var c = 0; c < COLS; c++) {
                mark[r][c] = false;
            }
        }

        // 水平匹配
        for (var r2 = 0; r2 < ROWS; r2++) {
            for (var c2 = 0; c2 < COLS - 2; c2++) {
                var icon = state.board[r2][c2];
                if (icon < 0) continue; // 空格
                if (state.board[r2][c2 + 1] === icon && state.board[r2][c2 + 2] === icon) {
                    // 找到3连，继续扩展
                    var end = c2 + 2;
                    while (end + 1 < COLS && state.board[r2][end + 1] === icon) end++;
                    for (var cc = c2; cc <= end; cc++) {
                        mark[r2][cc] = true;
                    }
                    c2 = end; // 跳过已匹配的
                }
            }
        }

        // 垂直匹配
        for (var c3 = 0; c3 < COLS; c3++) {
            for (var r3 = 0; r3 < ROWS - 2; r3++) {
                var icon2 = state.board[r3][c3];
                if (icon2 < 0) continue;
                if (state.board[r3 + 1][c3] === icon2 && state.board[r3 + 2][c3] === icon2) {
                    var endR = r3 + 2;
                    while (endR + 1 < ROWS && state.board[endR + 1][c3] === icon2) endR++;
                    for (var rr = r3; rr <= endR; rr++) {
                        mark[rr][c3] = true;
                    }
                    r3 = endR;
                }
            }
        }

        // 收集匹配位置
        for (var r4 = 0; r4 < ROWS; r4++) {
            for (var c4 = 0; c4 < COLS; c4++) {
                if (mark[r4][c4]) {
                    matched.push({ row: r4, col: c4 });
                }
            }
        }

        return matched;
    }

    // ========== 消除 + 下落 + 连锁 ==========
    function processMatches(matches) {
        state.animating = true;
        state.comboCount++;
        state.removingCells = matches;
        state.removeAlpha = 1;

        // 消除动画
        var removeAnim = setInterval(function () {
            state.removeAlpha -= 0.1;
            if (state.removeAlpha <= 0) {
                clearInterval(removeAnim);

                // 计分：每个消除的格子 10 分，连击加成
                var points = matches.length * 10 * state.comboCount;
                state.score += points;
                updateUI();

                // 清除已匹配的格子
                for (var i = 0; i < matches.length; i++) {
                    state.board[matches[i].row][matches[i].col] = -1; // 标记为空
                }
                state.removingCells = [];

                // 下落填充
                applyGravity();
                fillEmpty();

                // 延迟后检查连锁
                setTimeout(function () {
                    var newMatches = findMatches();
                    if (newMatches.length > 0) {
                        processMatches(newMatches); // 连锁
                    } else {
                        state.animating = false;
                        // 检查是否有可用移动
                        if (!hasValidMove()) {
                            shuffleBoard();
                        }
                    }
                }, 150);
            }
        }, 30);
    }

    // 下落：空格上方的格子往下掉
    function applyGravity() {
        for (var c = 0; c < COLS; c++) {
            var writeRow = ROWS - 1;
            for (var r = ROWS - 1; r >= 0; r--) {
                if (state.board[r][c] >= 0) {
                    state.board[writeRow][c] = state.board[r][c];
                    if (writeRow !== r) {
                        state.board[r][c] = -1;
                    }
                    writeRow--;
                }
            }
            // 顶部剩下的标记为空
            for (var r2 = writeRow; r2 >= 0; r2--) {
                state.board[r2][c] = -1;
            }
        }
    }

    // 顶部填充新图标
    function fillEmpty() {
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                if (state.board[r][c] < 0) {
                    state.board[r][c] = Math.floor(Math.random() * ICON_COUNT);
                }
            }
        }
    }

    // 检查是否有可用移动
    function hasValidMove() {
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                // 尝试向右交换
                if (c + 1 < COLS) {
                    swap({ row: r, col: c }, { row: r, col: c + 1 });
                    if (findMatches().length > 0) {
                        swap({ row: r, col: c }, { row: r, col: c + 1 });
                        return true;
                    }
                    swap({ row: r, col: c }, { row: r, col: c + 1 });
                }
                // 尝试向下交换
                if (r + 1 < ROWS) {
                    swap({ row: r, col: c }, { row: r + 1, col: c });
                    if (findMatches().length > 0) {
                        swap({ row: r, col: c }, { row: r + 1, col: c });
                        return true;
                    }
                    swap({ row: r, col: c }, { row: r + 1, col: c });
                }
            }
        }
        return false;
    }

    // 无可用移动时洗牌
    function shuffleBoard() {
        // 收集所有图标
        var icons = [];
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                icons.push(state.board[r][c]);
            }
        }
        // 洗牌
        for (var i = icons.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = icons[i];
            icons[i] = icons[j];
            icons[j] = tmp;
        }
        // 放回棋盘
        var idx = 0;
        for (var r2 = 0; r2 < ROWS; r2++) {
            for (var c2 = 0; c2 < COLS; c2++) {
                state.board[r2][c2] = icons[idx++];
            }
        }
        // 如果洗牌后还有三连或无可用移动，重新生成
        if (findMatches().length > 0 || !hasValidMove()) {
            generateBoard();
        }
    }

    // ========== 计时 ==========
    function startTimer() {
        if (state.timer) clearInterval(state.timer);
        state.timer = setInterval(function () {
            if (!state.isRunning) return;
            state.timeLeft--;
            updateUI();
            if (state.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // ========== UI 更新 ==========
    function updateUI() {
        var scoreEl = document.getElementById('tidyingScore');
        var timerEl = document.getElementById('tidyingTimer');
        if (scoreEl) scoreEl.textContent = state.score;
        if (timerEl) timerEl.textContent = state.timeLeft;
    }

    // ========== 绘制 ==========
    function drawLoop() {
        if (!state.isRunning && !state.animating) return;
        draw();
        state.animFrame = requestAnimationFrame(drawLoop);
    }

    function draw() {
        var ctx = state.ctx;
        var cs = state.cellSize;
        var w = state.canvas.width;
        var h = state.canvas.height;

        // 背景
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        // 棋盘网格
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (var r = 0; r <= ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * cs);
            ctx.lineTo(w, r * cs);
            ctx.stroke();
        }
        for (var c = 0; c <= COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(c * cs, 0);
            ctx.lineTo(c * cs, h);
            ctx.stroke();
        }

        // 正在消除的格子集合
        var removingSet = {};
        for (var i = 0; i < state.removingCells.length; i++) {
            var rc = state.removingCells[i];
            removingSet[rc.row + ',' + rc.col] = true;
        }

        // 绘制图标
        var fontSize = Math.floor(cs * 0.55);
        ctx.font = fontSize + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (var r2 = 0; r2 < ROWS; r2++) {
            for (var c2 = 0; c2 < COLS; c2++) {
                var icon = state.board[r2][c2];
                if (icon < 0) continue;

                var cx = c2 * cs + cs / 2;
                var cy = r2 * cs + cs / 2;

                // 选中高亮
                if (state.selected && state.selected.row === r2 && state.selected.col === c2) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
                    ctx.fillRect(c2 * cs + 2, r2 * cs + 2, cs - 4, cs - 4);
                    // 边框
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(c2 * cs + 2, r2 * cs + 2, cs - 4, cs - 4);
                }

                // 消除动画
                var key = r2 + ',' + c2;
                if (removingSet[key]) {
                    ctx.globalAlpha = Math.max(0, state.removeAlpha);
                    var scale = 0.5 + state.removeAlpha * 0.5;
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.scale(scale, scale);
                    ctx.fillText(ICONS[icon], 0, 0);
                    ctx.restore();
                    ctx.globalAlpha = 1;
                } else {
                    ctx.fillText(ICONS[icon], cx, cy);
                }
            }
        }
    }

    // ========== 游戏结束 ==========
    function endGame() {
        state.isRunning = false;
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
        if (state.animFrame) {
            cancelAnimationFrame(state.animFrame);
            state.animFrame = null;
        }
        unbindInput();

        if (state.onEndCallback) {
            state.onEndCallback({
                score: state.score
            });
        }
    }

    function stop() {
        state.isRunning = false;
        state.animating = false;
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
        if (state.animFrame) {
            cancelAnimationFrame(state.animFrame);
            state.animFrame = null;
        }
        unbindInput();
    }

    return {
        start: start,
        stop: stop
    };
})();
