// fanarona_max_capture.js — итоговая версия
// Задача: «Сколько максимум фишек могут съесть красные за один ход?»
// Генерация позиций с хаотичным распределением по полю для всех ответов (1–7)

(() => {
    // ---------- 1. Параметры поля и координаты ----------
    const startX = 49.4629;
    const startY = 230.6296;
    const dx = 90.2038;
    const dy = 90.1482;
    const scale = 3289 / 822.25;   // пересчёт в пиксели

    function getCenter(row, col) {
        const x = startX + (col - 1) * dx;
        const y = startY + (row - 1) * dy;
        return { x: x * scale, y: y * scale };
    }

    const originalCenters = {};
    let idx = 1;
    for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 9; col++) {
            originalCenters[idx] = getCenter(row, col);
            idx++;
        }
    }

    // ---------- 2. Граф соединений (точная копия Python‑словаря ADJ) ----------
    const ADJ = {
        1:  [2,10,11], 2:  [1,3,11], 3:  [2,4,11,12,13], 4:  [3,5,13],
        5:  [4,6,13,14,15], 6:  [5,7,15], 7:  [6,8,15,16,17], 8:  [7,9,17],
        9:  [8,17,18], 10: [1,11,19], 11: [1,2,3,10,12,19,20,21], 12: [3,11,13,21],
        13: [3,4,5,12,14,21,22,23], 14: [5,13,15,23], 15: [5,6,7,14,16,23,24,25],
        16: [7,15,17,25], 17: [7,8,9,16,18,25,26,27], 18: [9,17,27],
        19: [10,11,20,28,29], 20: [11,19,21,29], 21: [11,12,13,20,22,29,30,31],
        22: [13,21,23,31], 23: [13,14,15,22,24,31,32,33], 24: [15,23,25,33],
        25: [15,16,17,24,26,33,34,35], 26: [17,25,27,35], 27: [17,18,26,35,36],
        28: [19,29,37], 29: [19,20,21,28,30,37,38,39], 30: [21,29,31,39],
        31: [21,22,23,30,32,39,40,41], 32: [23,31,33,41], 33: [23,24,25,32,34,41,42,43],
        34: [25,33,35,43], 35: [25,26,27,34,36,43,44,45], 36: [27,35,45],
        37: [28,29,38], 38: [29,37,39], 39: [29,30,31,38,40,41], 40: [31,39,41],
        41: [31,32,33,39,40,42], 42: [33,41,43], 43: [33,34,35,42,44], 44: [35,43,45],
        45: [35,36,44]
    };
    // Дополняем граф до двустороннего
    for (let k in ADJ) {
        for (let nb of ADJ[k]) {
            if (!ADJ[nb]) ADJ[nb] = [];
            if (!ADJ[nb].includes(parseInt(k))) ADJ[nb].push(parseInt(k));
        }
    }

    // ---------- 3. Вспомогательные игровые функции ----------
    const ROWS = 5, COLS = 9;
    function rcToNum(row, col) { return row * COLS + col + 1; }
    function numToRc(num) {
        const row = Math.floor((num - 1) / COLS);
        const col = (num - 1) % COLS;
        return { row, col };
    }

    function getNextInLine(prev, cur) {
        const prevRc = numToRc(prev);
        const curRc = numToRc(cur);
        const dr = curRc.row - prevRc.row;
        const dc = curRc.col - prevRc.col;
        const nextR = curRc.row + dr;
        const nextC = curRc.col + dc;
        if (nextR < 0 || nextR >= ROWS || nextC < 0 || nextC >= COLS) return null;
        const nxt = rcToNum(nextR, nextC);
        return ADJ[cur] && ADJ[cur].includes(nxt) ? nxt : null;
    }

    function getAttackCaptures(board, cell, player) {
        if (board[cell] !== player) return [];
        const opponent = (player === 'red') ? 'yellow' : 'red';
        const captures = [];

        for (let nb of ADJ[cell]) {
            if (board[nb] !== undefined) continue;
            let firstOpp = null;
            let cur = nb, prev = cell;
            while (true) {
                const nxt = getNextInLine(prev, cur);
                if (nxt === null) break;
                const piece = board[nxt];
                if (piece === undefined) break;
                if (piece === opponent) {
                    firstOpp = nxt;
                    break;
                } else break;
                prev = cur;
                cur = nxt;
            }
            if (firstOpp === null) continue;
            const captured = [];
            let curPiece = firstOpp, prevPiece = nb;
            while (true) {
                captured.push(curPiece);
                const nxt = getNextInLine(prevPiece, curPiece);
                if (nxt === null) break;
                const piece = board[nxt];
                if (piece !== opponent) break;
                prevPiece = curPiece;
                curPiece = nxt;
            }
            captures.push({ from: cell, to: nb, captured });
        }
        return captures;
    }

    function getRetreatCaptures(board, cell, player) {
        if (board[cell] !== player) return [];
        const opponent = (player === 'red') ? 'yellow' : 'red';
        const captures = [];

        for (let nb of ADJ[cell]) {
            if (board[nb] !== opponent) continue;
            const rcFrom = numToRc(cell);
            const rcTo = numToRc(nb);
            const dr = rcFrom.row - rcTo.row;
            const dc = rcFrom.col - rcTo.col;
            const retreatR = rcFrom.row + dr;
            const retreatC = rcFrom.col + dc;
            if (retreatR < 0 || retreatR >= ROWS || retreatC < 0 || retreatC >= COLS) continue;
            const retreatCell = rcToNum(retreatR, retreatC);
            if (board[retreatCell] !== undefined) continue;
            const captured = [];
            let cur = nb, prev = cell;
            while (true) {
                captured.push(cur);
                const nxt = getNextInLine(prev, cur);
                if (nxt === null) break;
                const piece = board[nxt];
                if (piece !== opponent) break;
                prev = cur;
                cur = nxt;
            }
            captures.push({ from: cell, to: retreatCell, captured });
        }
        return captures;
    }

    function getAllCaptures(board, player) {
        let caps = [];
        for (let cell in board) {
            cell = parseInt(cell);
            if (board[cell] === player) {
                caps.push(...getAttackCaptures(board, cell, player));
                caps.push(...getRetreatCaptures(board, cell, player));
            }
        }
        return caps;
    }

    function maxCapturesForRed(board) {
        let best = 0;
        const caps = getAllCaptures(board, 'red');
        for (let cap of caps) best = Math.max(best, cap.captured.length);
        return best;
    }

    function getAllPossibleMoves(board, player) {
        let moves = getAllCaptures(board, player);
        if (moves.length > 0) return moves;
        for (let cell in board) {
            cell = parseInt(cell);
            if (board[cell] === player) {
                for (let nb of ADJ[cell]) {
                    if (board[nb] === undefined) {
                        moves.push({ from: cell, to: nb, captured: [] });
                    }
                }
            }
        }
        return moves;
    }

    function applyMove(board, move) {
        const newBoard = { ...board };
        const { from, to, captured } = move;
        const color = newBoard[from];
        delete newBoard[from];
        newBoard[to] = color;
        for (let c of captured) delete newBoard[c];
        return newBoard;
    }

    // ---------- 4. Старая начальная позиция (для генерации малых серий) ----------
    function initialPosition() {
        const pos = {};
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 9; col++) pos[rcToNum(row, col)] = 'yellow';
        }
        [19,21,24,26].forEach(c => pos[c] = 'yellow');
        [20,22,25,27].forEach(c => pos[c] = 'red');
        for (let n = 28; n <= 45; n++) pos[n] = 'red';
        delete pos[23];
        return pos;
    }

    // Дополнительная функция для “перемешивания” позиции – делает несколько случайных ходов без взятий,
    // чтобы разбросать фишки по полю, не меняя максимальное количество взятий.
    function shufflePosition(pos, targetMax, maxAttempts = 30) {
        let newPos = { ...pos };
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Случайно выбираем игрока
            const player = Math.random() < 0.5 ? 'yellow' : 'red';
            const moves = getAllPossibleMoves(newPos, player);
            if (moves.length === 0) continue;
            // Фильтруем ходы, которые не увеличивают maxCapture для красных
            const safeMoves = moves.filter(m => {
                const testPos = applyMove(newPos, m);
                return maxCapturesForRed(testPos) === targetMax;
            });
            if (safeMoves.length === 0) continue;
            const randomMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
            newPos = applyMove(newPos, randomMove);
        }
        return newPos;
    }

    // ---------- 5. Генерация позиции для заданного максимального взятия (1–7) ----------
    function generatePositionByTarget(target) {
        if (target <= 3) {
            // Старый метод: начальная позиция + несколько ходов + перемешивание
            for (let attempt = 0; attempt < 100; attempt++) {
                let pos = initialPosition();
                const numMoves = Math.floor(Math.random() * 12); // 0..11 ходов (чтобы больше перемешать)
                for (let i = 0; i < numMoves; i++) {
                    const player = (i % 2 === 0) ? 'yellow' : 'red';
                    const moves = getAllPossibleMoves(pos, player);
                    if (moves.length === 0) break;
                    pos = applyMove(pos, moves[Math.floor(Math.random() * moves.length)]);
                }
                const currentMax = maxCapturesForRed(pos);
                if (currentMax === target) {
                    // Дополнительно перемешиваем позицию, не изменяя target
                    const shuffled = shufflePosition(pos, target, 20);
                    if (maxCapturesForRed(shuffled) === target) return shuffled;
                    return pos;
                }
            }
            // fallback
            return generatePositionByLine(target);
        } else {
            // Для 4–7 используем конструктор линий (как было ранее)
            return generatePositionByLine(target);
        }
    }

    // Конструктор линий для длинных серий (4–7) и fallback для малых
    function generatePositionByLine(target) {
        const maxAttempts = 300;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const dirs = [[0,1],[1,0],[1,1],[1,-1]];
            const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
            let found = false;
            let redCell = null, yellowCells = [], emptyCell = null;
            for (let startRow = 1; startRow <= 5; startRow++) {
                for (let startCol = 1; startCol <= 9; startCol++) {
                    const endRow = startRow + dr * (target + 1);
                    const endCol = startCol + dc * (target + 1);
                    if (endRow < 1 || endRow > 5 || endCol < 1 || endCol > 9) continue;
                    const lineCells = [];
                    let ok = true;
                    for (let i = 0; i <= target + 1; i++) {
                        const r = startRow + dr * i;
                        const c = startCol + dc * i;
                        if (r < 1 || r > 5 || c < 1 || c > 9) { ok = false; break; }
                        lineCells.push(rcToNum(r-1, c-1));
                    }
                    if (!ok) continue;
                    redCell = lineCells[0];
                    yellowCells = lineCells.slice(1, target+1);
                    emptyCell = lineCells[target+1];
                    found = true;
                    break;
                }
                if (found) break;
            }
            if (!found) continue;

            let total = Math.floor(Math.random() * 11) + 15; // 15..25
            let redCount = Math.floor(Math.random() * 7) + 6; // 6..12
            let yellowCount = total - redCount;
            if (yellowCount < 8) yellowCount = 8;
            if (yellowCount > 15) yellowCount = 15;
            redCount = total - yellowCount;
            if (redCount < 6) redCount = 6;
            if (redCount > 12) redCount = 12;
            total = redCount + yellowCount;

            const pos = {};
            pos[redCell] = 'red';
            for (let yc of yellowCells) pos[yc] = 'yellow';
            const occupied = new Set(Object.keys(pos).map(Number));
            occupied.add(emptyCell);
            const allCells = Array.from({length:45}, (_,i)=>i+1);
            let freeCells = allCells.filter(c => !occupied.has(c));
            let needRed = redCount - 1;
            let needYellow = yellowCount - target;
            if (needRed < 0) needRed = 0;
            if (needYellow < 0) needYellow = 0;
            while (needRed + needYellow > freeCells.length) {
                if (needRed > 0) needRed--;
                else if (needYellow > 0) needYellow--;
            }
            for (let i = freeCells.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [freeCells[i], freeCells[j]] = [freeCells[j], freeCells[i]];
            }
            let idx = 0;
            for (let i = 0; i < needRed; i++) pos[freeCells[idx++]] = 'red';
            for (let i = 0; i < needYellow; i++) pos[freeCells[idx++]] = 'yellow';

            if (maxCapturesForRed(pos) === target) return pos;
        }
        // fallback
        const fallback = initialPosition();
        return shufflePosition(fallback, target, 30);
    }

    // ---------- 6. Основной генератор задачи ----------
    function generateMaxCaptureTask() {
        const targets = [1,2,3,4,5,6,7];
        const weights = [15,25,25,15,10,6,4];
        let r = Math.random() * 100;
        let cum = 0;
        let target = 1;
        for (let i = 0; i < targets.length; i++) {
            cum += weights[i];
            if (r < cum) { target = targets[i]; break; }
        }
        const pos = generatePositionByTarget(target);
        const actualMax = maxCapturesForRed(pos);
        // Генерация вариантов ответа
        let answers = new Set([actualMax, actualMax+1, actualMax-1, actualMax+2, actualMax-2]);
        answers = new Set([...answers].filter(v => v >= 1 && v <= 10));
        let answersArr = Array.from(answers);
        while (answersArr.length < 4) answersArr.push(actualMax + answersArr.length);
        answersArr.sort(() => Math.random() - 0.5);
        const options = answersArr.map(v => ({ id: String(v), text: String(v) }));
        return {
            question: "Сколько максимум фишек могут съесть красные за один ход?",
            answer_type: "single",
            options: options,
            correct: String(actualMax),
            position: pos,
            highlights: {}
        };
    }

    // ---------- 7. Регистрация ----------
    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["3"] = generateMaxCaptureTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["3"] = "🔥 Задача 3: Максимальная серия красных";
    window.originalCenters = originalCenters;
})();