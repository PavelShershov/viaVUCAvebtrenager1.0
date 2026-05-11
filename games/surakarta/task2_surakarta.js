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
    const OBVIOUS_PAIRS = [[2, 7], [5, 12], [25, 32], [30, 35]];

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
        attackedPositions(color) {
            const opponent = color === 'P' ? 'G' : 'P';
            const attacked = new Set();
            for (const pos of this.piecesOfColor(opponent)) {
                for (const target of this._iterCapturePaths(pos, color)) attacked.add(target);
            }
            return attacked;
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

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ============== ГЕНЕРАТОР ПОЗИЦИИ ДЛЯ НОВОЙ ЗАДАЧИ ==============
    function generatePurpleUnderAttackTask(maxAttempts = 10000) {
        // Веса количества фиолетовых фишек
        const cntWeights = { 4: 1, 5: 2, 6: 2, 7: 2, 8: 2, 9: 1, 10: 1 };
        const purpleCnt = randomChoice(
            Object.keys(cntWeights).map(Number),
            Object.values(cntWeights)
        );

        // Веса количества атакованных фиолетовых (обрезаем до purpleCnt)
        const attWeights = { 1: 1.5, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 2, 9: 1.5, 10: 1.5 };
        const possibleAtt = Object.keys(attWeights).map(Number).filter(k => k <= purpleCnt);
        const attW = possibleAtt.map(k => attWeights[k]);
        const targetAttacked = randomChoice(possibleAtt, attW);

        // Количество серых фишек (4-10)
        const grayCnt = randomInt(4, 10);
        const total = purpleCnt + grayCnt;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const board = new SurakartaBoard();
            const allCells = Array.from({ length: 36 }, (_, i) => i + 1)
                .filter(p => !CORNER_CELLS.has(p));
            if (allCells.length < total) {
                const corners = Array.from(CORNER_CELLS);
                shuffle(corners);
                allCells.push(...corners.slice(0, total - allCells.length));
            }
            shuffle(allCells);
            const chosen = allCells.slice(0, total);

            const purplePositions = chosen.slice(0, purpleCnt);
            const grayPositions = chosen.slice(purpleCnt);

            for (const pos of purplePositions) board.placePiece(pos, 'P');
            for (const pos of grayPositions) board.placePiece(pos, 'G');

            const attackedSet = board.attackedPositions('P');
            if (attackedSet.size !== targetAttacked) continue;

            // Фильтр очевидных пар при единственной атаке
            if (targetAttacked === 1) {
                const onlyPos = [...attackedSet][0];
                let obvious = false;
                for (const [a, b] of OBVIOUS_PAIRS) {
                    if (a === onlyPos || b === onlyPos) {
                        const other = a === onlyPos ? b : a;
                        if (board.getColor(other) === 'G') {
                            obvious = true;
                            break;
                        }
                    }
                }
                if (obvious) continue;
            }

            // Нумерация фиолетовых в случайном порядке
            const purpleList = [...purplePositions];
            shuffle(purpleList);
            const purpleNumbers = {};
            purpleList.forEach((pos, i) => {
                purpleNumbers[pos] = i + 1;
            });

            // Формируем position (словарь позиция -> цвет)
            const position = {};
            for (const pos of purplePositions) position[pos] = 'purple';
            for (const pos of grayPositions) position[pos] = 'gray';

            // Заполняем attackedNumbers
            const attackedNumbers = [...attackedSet]
                .map(pos => purpleNumbers[pos])
                .sort((a, b) => a - b);

            // Варианты ответа: все фиолетовые номера
            const options = purpleList.map((pos, idx) => ({
                id: 'p' + (idx + 1),
                text: String(idx + 1)
            }));

            // Правильный ответ: массив id, соответствующих атакованным номерам
            const correctIds = attackedNumbers.map(num => 'p' + num);

            // Пояснение
            const explanation = attackedNumbers.length > 0
                ? 'Под ударом фиолетовые фишки №' + attackedNumbers.join(', ')
                : 'Нет фиолетовых под ударом.';

            return {
                question: 'Какие фиолетовые фишки находятся под потенциальной атакой серых?',
                answer_type: 'multi',
                options,
                correct: correctIds,
                position,
                purpleNumbers,
                explanation,
                totalPurple: purpleCnt,
                attackedNumbers
            };
        }

        throw new Error('Не удалось сгенерировать задачу "Фиолетовые под атакой"');
    }

    // Экспорт
    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["2"] = generatePurpleUnderAttackTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["2"] = "🎯 Суракарта: Фиолетовые под атакой";
    window.originalCenters = cellCenters;
})();