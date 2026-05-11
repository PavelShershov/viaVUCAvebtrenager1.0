// task_reversi_max_capture.js
(() => {
    // ------------------------------------------------------------
    // Координаты центров клеток (3426x3426) из Python (центры)
    // ------------------------------------------------------------
    const centers = {
        1: [473, 479], 2: [834, 480], 3: [1184, 479], 4: [1540, 476],
        5: [1898, 481], 6: [2251, 481], 7: [2603, 483], 8: [2971, 475],
        9: [475, 830], 10: [825, 830], 11: [1199, 828], 12: [1538, 827],
        13: [1891, 824], 14: [2244, 826], 15: [2607, 823], 16: [2941, 826],
        17: [476, 1174], 18: [830, 1177], 19: [1182, 1178], 20: [1533, 1178],
        21: [1891, 1175], 22: [2242, 1185], 23: [2597, 1181], 24: [2958, 1176],
        25: [476, 1540], 26: [825, 1541], 27: [1179, 1544], 28: [1540, 1537],
        29: [1904, 1540], 30: [2246, 1537], 31: [2600, 1543], 32: [2954, 1543],
        33: [474, 1893], 34: [818, 1888], 35: [1177, 1890], 36: [1541, 1890],
        37: [1881, 1887], 38: [2236, 1884], 39: [2592, 1886], 40: [2950, 1888],
        41: [481, 2249], 42: [824, 2242], 43: [1187, 2252], 44: [1542, 2258],
        45: [1898, 2244], 46: [2247, 2242], 47: [2602, 2242], 48: [2958, 2253],
        49: [473, 2608], 50: [829, 2595], 51: [1181, 2602], 52: [1527, 2605],
        53: [1891, 2604], 54: [2246, 2608], 55: [2596, 2604], 56: [2961, 2606],
        57: [478, 2956], 58: [826, 2956], 59: [1185, 2956], 60: [1531, 2959],
        61: [1894, 2949], 62: [2240, 2954], 63: [2599, 2956], 64: [2948, 2955]
    };
    // Преобразуем в формат { cell: {x, y} } для совместимости с рендерером
    const cellCenters = {};
    for (let [k, v] of Object.entries(centers)) {
        cellCenters[parseInt(k)] = { x: v[0], y: v[1] };
    }

    // ------------------------------------------------------------
    // Направления для проверки линий (8 направлений)
    // ------------------------------------------------------------
    const DIRS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1],  [1, 0], [1, 1]
    ];

    // ------------------------------------------------------------
    // Функция: получить список клеток, которые будут перевёрнуты
    // ------------------------------------------------------------
    function getFlips(board, cell, color) {
        const opponent = (color === 'green') ? 'purple' : 'green';
        if (board[cell] !== undefined) return [];
        const row = Math.floor((cell - 1) / 8);
        const col = (cell - 1) % 8;
        let flips = [];
        for (let [dr, dc] of DIRS) {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;
            let temp = [];
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const cur = r * 8 + c + 1;
                if (!(cur in board)) break;
                if (board[cur] === opponent) {
                    temp.push(cur);
                    foundOpponent = true;
                } else { // своя фишка
                    if (foundOpponent) flips.push(...temp);
                    break;
                }
                r += dr;
                c += dc;
            }
        }
        return flips;
    }

    // ------------------------------------------------------------
    // Функция: получить все легальные ходы для цвета
    // ------------------------------------------------------------
    function getLegalMoves(board, color) {
        const moves = [];
        for (let cell = 1; cell <= 64; cell++) {
            const flips = getFlips(board, cell, color);
            if (flips.length > 0) {
                moves.push({ cell, flips });
            }
        }
        return moves;
    }

    // ------------------------------------------------------------
    // Генерация случайной сбалансированной позиции (плотность 35-60)
    // ------------------------------------------------------------
    function randomBalancedPosition(minPieces = 35, maxPieces = 60) {
        const total = minPieces + Math.floor(Math.random() * (maxPieces - minPieces + 1));
        // Начальная расстановка: 4 центральные фишки
        let board = {
            28: 'green', 29: 'purple', 36: 'purple', 37: 'green'
        };
        const allCells = [];
        for (let i = 1; i <= 64; i++) {
            if (!(i in board)) allCells.push(i);
        }
        // Перемешиваем доступные клетки
        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }
        let greenCount = Object.values(board).filter(c => c === 'green').length;
        let purpleCount = Object.values(board).filter(c => c === 'purple').length;
        const need = total - (greenCount + purpleCount);
        for (let i = 0; i < need; i++) {
            const cell = allCells[i];
            if (greenCount < purpleCount) {
                board[cell] = 'green';
                greenCount++;
            } else if (purpleCount < greenCount) {
                board[cell] = 'purple';
                purpleCount++;
            } else {
                const col = Math.random() < 0.5 ? 'green' : 'purple';
                board[cell] = col;
                if (col === 'green') greenCount++;
                else purpleCount++;
            }
        }
        return board;
    }

    // ------------------------------------------------------------
    // Генератор задачи
    // ------------------------------------------------------------
    function generateMaxCaptureTask() {
        // Веса частоты ответов (7-9 такие же частые как 5-6)
        const freqWeights = {
            3: 2, 4: 6, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9,
            10: 4, 11: 4, 12: 4, 13: 2, 14: 2, 15: 2,
            16: 1, 17: 1, 18: 1, 19: 1, 20: 1
        };
        const maxWeight = Math.max(...Object.values(freqWeights));
        const maxAttempts = 800;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const board = randomBalancedPosition(35, 60);
            const legalMoves = getLegalMoves(board, 'green');
            if (legalMoves.length < 2) continue;

            let maxCaptures = 0;
            let bestMoves = [];
            for (let move of legalMoves) {
                const captureCount = move.flips.length;
                if (captureCount > maxCaptures) {
                    maxCaptures = captureCount;
                    bestMoves = [move.cell];
                } else if (captureCount === maxCaptures && captureCount > 0) {
                    bestMoves.push(move.cell);
                }
            }
            if (maxCaptures < 3 || maxCaptures > 20) continue;

            const weight = freqWeights[maxCaptures] || 1;
            if (Math.random() > weight / maxWeight) continue;

            const bestCell = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            const bestFlips = getFlips(board, bestCell, 'green');

            // Генерация вариантов ответа
            const correct = maxCaptures;
            const answersSet = new Set([correct, correct+1, correct-1, correct+2, correct-2]);
            const answers = Array.from(answersSet).filter(a => a >= 0).sort((a,b)=>a-b).slice(0,4);
            const options = answers.map(v => ({ id: v.toString(), text: v.toString() }));
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: "Какое максимальное количество фишек может срубить за один ход зелёный игрок?",
                answer_type: "single",
                options: options,
                correct: correct.toString(),
                position: board,
                highlights: {},
                // дополнительные поля для вывода (не обязательны)
                best_move: bestCell,
                captured: bestFlips
            };
        }
        // fallback
        return {
            question: "⚠️ Задача: не удалось сгенерировать позицию. Попробуйте ещё раз.",
            answer_type: "single",
            options: [{ id: "0", text: "0" }],
            correct: "0",
            position: {},
            highlights: {}
        };
    }

    // Экспорт для интерфейса
    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["2"] = generateMaxCaptureTask;   // ключ для выбора в HTML
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["2"] = "🎯 Реверси: Максимальный захват зелёным";
    // Передаём центры для отрисовки (если рендерер использует window.originalCenters)
    window.originalCenters = cellCenters;
})();