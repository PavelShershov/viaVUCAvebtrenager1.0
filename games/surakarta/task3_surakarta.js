// task2_surakarta_safe.js — генератор задачи «Сколько безопасных ходов у фишки А?»

(() => {
    // ============== КОНСТАНТЫ ПОЛЯ ==============
    const SCALE = 4;
    const x_coords = [198.5747 * SCALE, 283.5562 * SCALE, 368.5176 * SCALE,
                      453.2119 * SCALE, 538.4826 * SCALE, 623.4546 * SCALE];
    const y_coords = [199.0346 * SCALE, 284.1168 * SCALE, 369.2626 * SCALE,
                      453.9480 * SCALE, 538.8127 * SCALE, 623.8693 * SCALE];
    const SHIFT_X = 0.2 * SCALE;
    const SHIFT_Y = 0;

    const cellCenters = {};
    for (let row = 1; row <= 6; row++) {
        const y = y_coords[row - 1] + SHIFT_Y;
        for (let col = 1; col <= 6; col++) {
            const x = x_coords[col - 1] + SHIFT_X;
            const pos = (row - 1) * 6 + col;
            cellCenters[pos] = { x, y };
        }
    }

    // ============== ИГРОВАЯ ЛОГИКА СУРАКАРТЫ ==============
    const BIG_LINES = {
        'col_3': [3, 9, 15, 21, 27, 33],
        'col_4': [4, 10, 16, 22, 28, 34],
        'row_3': [13, 14, 15, 16, 17, 18],
        'row_4': [19, 20, 21, 22, 23, 24]
    };

    const SMALL_LINES = {
        'col_2': [2, 8, 14, 20, 26, 32],
        'col_5': [5, 11, 17, 23, 29, 35],
        'row_2': [7, 8, 9, 10, 11, 12],
        'row_5': [25, 26, 27, 28, 29, 30]
    };

    const BIG_TRANSITIONS = {
        'col_3,UP':    ['row_3', 13, 'RIGHT'],
        'col_3,DOWN':  ['row_4', 19, 'RIGHT'],
        'col_4,UP':    ['row_3', 18, 'LEFT'],
        'col_4,DOWN':  ['row_4', 24, 'LEFT'],
        'row_3,LEFT':  ['col_3', 3, 'DOWN'],
        'row_3,RIGHT': ['col_4', 4, 'DOWN'],
        'row_4,LEFT':  ['col_3', 33, 'UP'],
        'row_4,RIGHT': ['col_4', 34, 'UP']
    };

    const SMALL_TRANSITIONS = {
        'col_2,UP':    ['row_2', 7, 'RIGHT'],
        'col_2,DOWN':  ['row_5', 25, 'RIGHT'],
        'col_5,UP':    ['row_2', 12, 'LEFT'],
        'col_5,DOWN':  ['row_5', 30, 'LEFT'],
        'row_2,LEFT':  ['col_2', 2, 'DOWN'],
        'row_2,RIGHT': ['col_5', 5, 'DOWN'],
        'row_5,LEFT':  ['col_2', 32, 'UP'],
        'row_5,RIGHT': ['col_5', 35, 'UP']
    };

    const CORNER_CELLS = new Set([1, 6, 31, 36]);

    function posToRC(pos) {
        return { row: Math.floor((pos - 1) / 6) + 1, col: (pos - 1) % 6 + 1 };
    }
    function rcToPos(row, col) {
        return (row - 1) * 6 + col;
    }

    // Предвычисление путей
    function buildFullCircle(start, line, lineName, dirEnd, transitions, allLines) {
        const path = [];
        let currentLine = line;
        let currentName = lineName;
        let direction = dirEnd;
        let idx = currentLine.indexOf(start);

        for (let step = 0; step < 24; step++) {
            if (direction === 'UP' || direction === 'LEFT') {
                let nextIdx = idx - 1;
                if (nextIdx < 0) {
                    const key = currentName + ',' + direction;
                    const trans = transitions[key];
                    if (!trans) break;
                    const [newName, entry, newDir] = trans;
                    const newLine = allLines[newName];
                    path.push({ pos: entry, afterLoop: true });
                    currentLine = newLine;
                    currentName = newName;
                    direction = newDir;
                    idx = currentLine.indexOf(entry);
                } else {
                    const pos = currentLine[nextIdx];
                    path.push({ pos, afterLoop: false });
                    idx = nextIdx;
                }
            } else {
                let nextIdx = idx + 1;
                if (nextIdx >= currentLine.length) {
                    const key = currentName + ',' + direction;
                    const trans = transitions[key];
                    if (!trans) break;
                    const [newName, entry, newDir] = trans;
                    const newLine = allLines[newName];
                    path.push({ pos: entry, afterLoop: true });
                    currentLine = newLine;
                    currentName = newName;
                    direction = newDir;
                    idx = currentLine.indexOf(entry);
                } else {
                    const pos = currentLine[nextIdx];
                    path.push({ pos, afterLoop: false });
                    idx = nextIdx;
                }
            }
        }
        return path;
    }

    const PATH_CACHE = {};
    (function initPathCache() {
        const systems = [
            { lines: BIG_LINES, transitions: BIG_TRANSITIONS },
            { lines: SMALL_LINES, transitions: SMALL_TRANSITIONS }
        ];
        for (const { lines, transitions } of systems) {
            for (const [lineName, line] of Object.entries(lines)) {
                for (const start of line) {
                    if (CORNER_CELLS.has(start)) continue;
                    const dirs = lineName.startsWith('col') ? ['UP', 'DOWN'] : ['LEFT', 'RIGHT'];
                    for (const dir of dirs) {
                        const key = start + '|' + lineName + '|' + dir;
                        PATH_CACHE[key] = buildFullCircle(start, line, lineName, dir, transitions, lines);
                    }
                }
            }
        }
    })();

    class SurakartaBoard {
        constructor() {
            this.board = new Array(37).fill(null);
        }
        placePiece(pos, color) { this.board[pos] = color; }
        getColor(pos) { return this.board[pos]; }
        piecesOfColor(color) {
            const result = [];
            for (let pos = 1; pos <= 36; pos++) if (this.board[pos] === color) result.push(pos);
            return result;
        }
        *_iterCapturePaths(start, opponent) {
            const myColor = this.board[start];
            if (!myColor) return;
            const systems = [
                { lines: BIG_LINES },
                { lines: SMALL_LINES }
            ];
            for (const { lines } of systems) {
                for (const [lineName, line] of Object.entries(lines)) {
                    if (!line.includes(start)) continue;
                    const dirs = lineName.startsWith('col') ? ['UP', 'DOWN'] : ['LEFT', 'RIGHT'];
                    for (const d of dirs) {
                        const cacheKey = start + '|' + lineName + '|' + d;
                        const path = PATH_CACHE[cacheKey];
                        if (!path) continue;
                        let passedLoop = false;
                        const idx = line.indexOf(start);
                        if ((d === 'UP' || d === 'LEFT') && idx === 0) passedLoop = true;
                        if ((d === 'DOWN' || d === 'RIGHT') && idx === line.length - 1) passedLoop = true;
                        for (const { pos, afterLoop } of path) {
                            if (afterLoop) passedLoop = true;
                            if (pos === start) continue;
                            const cell = this.board[pos];
                            if (cell === myColor) break;
                            if (cell === opponent) {
                                if (passedLoop) yield pos;
                                break;
                            }
                        }
                    }
                }
            }
        }
        fastTotalAttacked() {
            const attacked = new Set();
            for (const color of ['P', 'G']) {
                const opponent = color === 'P' ? 'G' : 'P';
                for (const pos of this.piecesOfColor(color)) {
                    for (const target of this._iterCapturePaths(pos, opponent)) attacked.add(target);
                }
            }
            return attacked.size;
        }
        captureMovesFor(color) {
            const opponent = color === 'P' ? 'G' : 'P';
            const moves = [];
            const seen = new Set();
            for (const pos of this.piecesOfColor(color)) {
                for (const target of this._iterCapturePaths(pos, opponent)) {
                    const key = pos + '-' + target;
                    if (!seen.has(key)) {
                        seen.add(key);
                        moves.push([color, pos, target]);
                    }
                }
            }
            return moves;
        }
        // Новый метод: получение маршрута от атакующего до цели
        _getRoute(attacker, target) {
            const opponent = this.board[attacker] === 'P' ? 'G' : 'P';
            for (const { lines, transitions } of [
                { lines: BIG_LINES, transitions: BIG_TRANSITIONS },
                { lines: SMALL_LINES, transitions: SMALL_TRANSITIONS }
            ]) {
                for (const [lineName, line] of Object.entries(lines)) {
                    if (!line.includes(attacker)) continue;
                    const dirs = lineName.startsWith('col') ? ['UP', 'DOWN'] : ['LEFT', 'RIGHT'];
                    for (const d of dirs) {
                        const cacheKey = attacker + '|' + lineName + '|' + d;
                        const path = PATH_CACHE[cacheKey];
                        if (!path) continue;
                        let passedLoop = false;
                        const idx = line.indexOf(attacker);
                        if ((d === 'UP' || d === 'LEFT') && idx === 0) passedLoop = true;
                        if ((d === 'DOWN' || d === 'RIGHT') && idx === line.length - 1) passedLoop = true;

                        const route = [];
                        for (const { pos, afterLoop } of path) {
                            if (afterLoop) passedLoop = true;
                            if (pos === attacker) continue;
                            route.push(pos);
                            const cell = this.board[pos];
                            if (cell === this.board[attacker]) break;  // своя фигура
                            if (cell === opponent) {
                                if (passedLoop && pos === target) return route;
                                break;
                            }
                        }
                    }
                }
            }
            return [];
        }
    }

    // ============== РАСШИРЕННАЯ ДОСКА (с динамическими ходами) ==============
    class DynamicBoard extends SurakartaBoard {
        get_all_moves(color) {
            const moves = [];
            for (const pos of this.piecesOfColor(color)) {
                const { row, col } = posToRC(pos);
                for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                    const nr = row + dr, nc = col + dc;
                    if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                        const target = rcToPos(nr, nc);
                        if (this.board[target] === null) {
                            moves.push([pos, target, false]); // false = обычный ход
                        }
                    }
                }
            }
            for (const [color, start, target] of this.captureMovesFor(color))
                moves.push([start, target, true]); // true = рубка
            return moves;
        }
        make_move(start, end) {
            const color = this.board[start];
            let captured = null;
            if (this.board[end] !== null) {
                captured = color === 'P' ? 'G' : 'P';
            }
            this.board[end] = color;
            this.board[start] = null;
            return captured;
        }
        copy() {
            const newBoard = new DynamicBoard();
            newBoard.board = [...this.board];
            return newBoard;
        }
        has_any_move(pos) {
            if (this.board[pos] === null) return false;
            const { row, col } = posToRC(pos);
            for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                    if (this.board[rcToPos(nr, nc)] === null) return true;
                }
            }
            for (const [color, start, target] of this.captureMovesFor(this.board[pos]))
                if (start === pos) return true;
            return false;
        }
    }

    // ============== ЗОНЫ ТЫЛА ==============
    const PURPLE_BACK_ZONE = new Set([31,32,33,34,35,36]);
    const GRAY_BACK_ZONE = new Set([1,2,3,4,5,6]);

    function isBackZoneViolation(board) {
        for (const pos of board.piecesOfColor('P'))
            if (PURPLE_BACK_ZONE.has(pos) && !board.has_any_move(pos)) return true;
        for (const pos of board.piecesOfColor('G'))
            if (GRAY_BACK_ZONE.has(pos) && !board.has_any_move(pos)) return true;
        return false;
    }

    // ============== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==============
    function randomChoice(arr, weights = null) {
        if (!weights) return arr[Math.floor(Math.random() * arr.length)];
        const totalW = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalW;
        for (let i = 0; i < arr.length; i++) {
            r -= weights[i];
            if (r <= 0) return arr[i];
        }
        return arr[arr.length - 1];
    }

    function maxNeighbors(pos) {
        if (CORNER_CELLS.has(pos)) return 3;
        const { row, col } = posToRC(pos);
        if (row === 1 || row === 6 || col === 1 || col === 6) return 5;
        return 8;
    }

    // ============== ГЕНЕРАТОР БЕЗОПАСНЫХ ХОДОВ ==============
    function getSafeMovesDetails(board, pos) {
        const color = board.getColor(pos);
        if (!color) return { safe: [], unsafe: [] };
        const opponent = color === 'P' ? 'G' : 'P';
        const { row, col } = posToRC(pos);
        const safe = [], unsafe = [];

        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                const target = rcToPos(nr, nc);
                if (board.board[target] === null) {
                    const bCopy = board.copy();
                    bCopy.make_move(pos, target);
                    // Проверяем, атакована ли позиция target после хода
                    if (bCopy.piecesOfColor(opponent).some(p => {
                        for (const t of bCopy._iterCapturePaths(p, color))
                            if (t === target) return true;
                        return false;
                    })) {
                        // Находим атакующего
                        let attacker = null;
                        for (const [col, aStart, aTgt] of bCopy.captureMovesFor(opponent)) {
                            if (aTgt === target) {
                                attacker = aStart;
                                break;
                            }
                        }
                        const route = attacker !== null ? bCopy._getRoute(attacker, target) : [];
                        unsafe.push({ pos: target, attacker, route });
                    } else {
                        safe.push(target);
                    }
                }
            }
        }
        return { safe, unsafe };
    }

    function choosePieceA(board) {
        const central = new Set([8,9,10,11,14,15,16,17,20,21,22,23,26,27,28,29]);
        const edge = new Set([2,3,4,5,7,13,19,25,12,18,24,30,32,33,34,35]);
        const candidates = [], weights = [];
        for (const color of ['P', 'G']) {
            for (const pos of board.piecesOfColor(color)) {
                const { row, col } = posToRC(pos);
                let hasFree = false;
                for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                    const nr = row + dr, nc = col + dc;
                    if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                        if (board.board[rcToPos(nr, nc)] === null) { hasFree = true; break; }
                    }
                }
                if (!hasFree) continue;
                if (CORNER_CELLS.has(pos)) { candidates.push({pos, color}); weights.push(1); }
                else if (edge.has(pos))     { candidates.push({pos, color}); weights.push(3); }
                else if (central.has(pos))  { candidates.push({pos, color}); weights.push(6); }
                else                        { candidates.push({pos, color}); weights.push(3); }
            }
        }
        if (candidates.length === 0) return null;
        return randomChoice(candidates, weights);
    }

    // ============== ГЕНЕРАТОРЫ РАССТАНОВОК (light, mid, dense) ==============
    function generateLightPosition(purpleCnt, grayCnt, boardClass = SurakartaBoard) {
        const board = new boardClass();
        const total = purpleCnt + grayCnt;
        const allCells = Array.from({length: 36}, (_, i) => i + 1).filter(p => !CORNER_CELLS.has(p));
        // перемешивание
        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }
        const chosen = allCells.slice(0, total);
        const shuffled = [...chosen];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        for (const pos of shuffled.slice(0, purpleCnt)) board.placePiece(pos, 'P');
        for (const pos of shuffled.slice(purpleCnt)) board.placePiece(pos, 'G');
        return board;
    }

    function generateMidgamePosition(boardClass = DynamicBoard) {
        const board = new boardClass();
        for (let pos = 1; pos <= 12; pos++) board.placePiece(pos, 'P');
        for (let pos = 25; pos <= 36; pos++) board.placePiece(pos, 'G');
        let currentColor = 'P';
        for (let i = 0; i < 30; i++) {
            const moves = board.get_all_moves(currentColor);
            if (moves.length === 0) break;
            const move = moves[Math.floor(Math.random() * moves.length)];
            board.make_move(move[0], move[1]);
            currentColor = currentColor === 'P' ? 'G' : 'P';
            const total = board.piecesOfColor('P').length + board.piecesOfColor('G').length;
            if (total >= 14 && total <= 20 && Math.random() < 0.3) break; // иногда выходим раньше
        }
        return board;
    }

    function generateDensePosition(boardClass = SurakartaBoard) {
        for (let attempt = 0; attempt < 2000; attempt++) {
            const board = new boardClass();
            const poolP = Array.from({length: 18}, (_, i) => i + 1);
            const poolG = Array.from({length: 18}, (_, i) => i + 19);
            for (let i = poolP.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [poolP[i], poolP[j]] = [poolP[j], poolP[i]];
            }
            for (let i = poolG.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [poolG[i], poolG[j]] = [poolG[j], poolG[i]];
            }
            const purpleCells = poolP.slice(0, 12);
            const grayCells = poolG.slice(0, 12);
            if (new Set([...purpleCells, ...grayCells]).size < 24) continue;
            for (const pos of purpleCells) board.placePiece(pos, 'P');
            for (const pos of grayCells) board.placePiece(pos, 'G');
            return board;
        }
        return null;
    }

    // ============== ГЛАВНЫЙ ГЕНЕРАТОР ЗАДАЧИ ==============
    function generateSafeMovesTask() {
        const mode = randomChoice(['light', 'mid', 'dense'], [1.5, 1, 1]);
        const maxAttempts = 5000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let board;
            if (mode === 'light') {
                const purpleCnt = 2 + Math.floor(Math.random() * 4);
                const grayCnt = 2 + Math.floor(Math.random() * 4);
                const total = purpleCnt + grayCnt;
                if (total < 6 || total > 8) continue;
                board = generateLightPosition(purpleCnt, grayCnt, DynamicBoard);
            } else if (mode === 'mid') {
                board = generateMidgamePosition(DynamicBoard);
                const total = board.piecesOfColor('P').length + board.piecesOfColor('G').length;
                if (total < 14 || total > 20) continue;
            } else { // dense
                board = generateDensePosition(DynamicBoard);
                if (!board) continue;
            }

            const pieceA = choosePieceA(board);
            if (!pieceA) continue;
            const { pos: posA, color: colorA } = pieceA;

            const { safe, unsafe } = getSafeMovesDetails(board, posA);
            const safeCount = safe.length;
            const maxN = maxNeighbors(posA);

            // Целевое количество безопасных ходов с весами
            let targetSafe;
            if (CORNER_CELLS.has(posA)) {
                targetSafe = randomChoice([1, 2], [1, 1]);
            } else if ([2,3,4,5,7,13,19,25,12,18,24,30,32,33,34,35].includes(posA)) {
                targetSafe = randomChoice([1, 2, 3, 4], [2, 3, 3, 2]);
            } else {
                targetSafe = randomChoice([1, 2, 3, 4, 5, 6, 7], [2, 3, 3, 3, 3, 2, 0.3]);
            }

            if (safeCount !== targetSafe) continue;

            // Проверка на не все свободные клетки безопасны
            const { row, col } = posToRC(posA);
            let totalFree = 0;
            for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                    if (board.board[rcToPos(nr, nc)] === null) totalFree++;
                }
            }
            if (safeCount === totalFree) continue; // слишком простая

            // Проверка тыловых нарушений
            if (isBackZoneViolation(board)) continue;

            // Формируем вывод
            const positionDict = {};
            for (const pos of board.piecesOfColor('P')) positionDict[pos] = 'purple';
            for (const pos of board.piecesOfColor('G')) positionDict[pos] = 'gray';

            // Пояснение
            let explanation = '';
            if (safe.length > 0) explanation += 'Безопасные: ' + safe.join(', ') + '. ';
            if (unsafe.length > 0) {
                explanation += 'Небезопасные: ';
                const unsafeDescs = [];
                for (const { pos, attacker, route } of unsafe) {
                    if (attacker !== null) {
                        unsafeDescs.push(`поз.${pos} атакована фигурой с ${attacker}, маршрут: ${route.join(' → ')}`);
                    } else {
                        unsafeDescs.push(`поз.${pos} под ударом (атакующий не определён)`);
                    }
                }
                explanation += unsafeDescs.join('; ');
            }

            // Варианты ответа (числа от 1 до maxN, исключая 8, если есть)
            const possibleRange = [];
            for (let i = 1; i <= maxN; i++) if (i !== 8) possibleRange.push(i);
            const generateOptions = (correct, range, numOpt = 4) => {
                const candidates = range.filter(v => v !== correct);
                // перемешиваем
                for (let i = candidates.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
                }
                const distractors = candidates.slice(0, numOpt - 1);
                while (distractors.length < numOpt - 1) {
                    const extra = randomChoice(range.filter(v => v !== correct && !distractors.includes(v)));
                    if (extra !== undefined) distractors.push(extra);
                }
                const opts = [correct, ...distractors];
                for (let i = opts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [opts[i], opts[j]] = [opts[j], opts[i]];
                }
                return opts.map(v => ({ id: v.toString(), text: v.toString() }));
            };

            return {
                question: 'Сколько безопасных ходов (не ведущих под рубку) есть у фишки А?',
                answer_type: 'single',
                options: generateOptions(safeCount, possibleRange),
                correct: safeCount.toString(),
                position: positionDict,
                explanation,
                highlights: { [posA]: 'A' },
                targetPos: posA,
                targetColor: colorA,
                safeCount
            };
        }
        throw new Error('Не удалось сгенерировать задачу');
    }

    // ============== ЭКСПОРТ ==============
    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["3"] = generateSafeMovesTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["3"] = "🎯 Суракарта: Безопасные ходы фигуры";
    window.originalCenters = cellCenters;
})();