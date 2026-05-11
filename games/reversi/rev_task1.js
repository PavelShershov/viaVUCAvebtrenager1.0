// task_reversi_capturing_moves.js — задача "Сколько возможных ходов с рубкой у зелёного игрока"
// Диапазон ответов: 2-11 с весами: 4-7 (вес 2), 3,8,9 (вес 1.5), 2,10,11 (вес 1)

(() => {
    // ------------------------------------------------------------
    // 1. Координаты центров клеток (3426x3426) — без изменений
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

    // ------------------------------------------------------------
    // 2. Направления для проверки линий
    // ------------------------------------------------------------
    const DIRS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    // ------------------------------------------------------------
    // 3. Функция get_flips (какие фишки перевернутся при ходе)
    // ------------------------------------------------------------
    function getFlips(board, cell, color) {
        const opponent = color === 'green' ? 'purple' : 'green';
        if (board.hasOwnProperty(cell)) return [];
        const row = Math.floor((cell - 1) / 8);
        const col = (cell - 1) % 8;
        const flips = [];

        for (const [dr, dc] of DIRS) {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;
            const temp = [];

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const cur = r * 8 + c + 1;
                if (!board.hasOwnProperty(cur)) break;
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
    // 4. Функция получения всех ходов с переворотом для цвета
    // ------------------------------------------------------------
    function getCapturingMoves(board, color) {
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
    // 5. Генерация случайной открытой позиции (25–40 фишек)
    // ------------------------------------------------------------
    function randomOpenPosition(minPieces = 25, maxPieces = 40) {
        const total = Math.floor(Math.random() * (maxPieces - minPieces + 1)) + minPieces;
        let board = {
            28: 'green', 29: 'purple', 36: 'purple', 37: 'green'
        };
        const allCells = [];
        for (let i = 1; i <= 64; i++) allCells.push(i);
        const available = allCells.filter(c => !board.hasOwnProperty(c));
        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
        }
        let greenCnt = Object.values(board).filter(v => v === 'green').length;
        let purpleCnt = Object.values(board).filter(v => v === 'purple').length;
        const need = total - (greenCnt + purpleCnt);
        for (let i = 0; i < need; i++) {
            const cell = available[i];
            if (greenCnt < purpleCnt) {
                board[cell] = 'green';
                greenCnt++;
            } else if (purpleCnt < greenCnt) {
                board[cell] = 'purple';
                purpleCnt++;
            } else {
                const color = Math.random() < 0.5 ? 'green' : 'purple';
                board[cell] = color;
                if (color === 'green') greenCnt++;
                else purpleCnt++;
            }
        }
        return board;
    }

    // ------------------------------------------------------------
    // 6. Генератор задачи с новыми весами и диапазоном 2-11
    // ------------------------------------------------------------
    function generateCapturingMovesTask(maxAttempts = 800) {
        const freqWeights = {
            2: 1, 3: 1.5, 4: 2, 5: 2, 6: 2, 7: 2, 8: 1.5, 9: 1.5, 10: 1, 11: 1
        };
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const board = randomOpenPosition(25, 40);
            const moves = getCapturingMoves(board, 'green');
            const count = moves.length;
            if (count < 2 || count > 11) continue;
            const weight = freqWeights[count];
            const maxWeight = Math.max(...Object.values(freqWeights));
            if (Math.random() > weight / maxWeight) continue;

            // Генерация вариантов ответа
            const candidates = new Set([count, count+1, count-1, count+2, count-2]);
            candidates.forEach(v => { if (v < 2 || v > 11) candidates.delete(v); });
            let optionsArray = Array.from(candidates).sort((a,b) => a-b).slice(0,4);
            while (optionsArray.length < 4) {
                const r = Math.floor(Math.random() * (11 - 2 + 1)) + 2;
                if (r !== count && !optionsArray.includes(r)) optionsArray.push(r);
            }
            for (let i = optionsArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
            }
            const options = optionsArray.map(v => ({ id: v.toString(), text: v.toString() }));

            const moveDescriptions = moves.map(m => `${m.cell} (${m.flips.length})`).join(', ');
            const explanation = `Доступные ходы: ${moveDescriptions}. Всего ${count} ходов.`;

            return {
                question: "Сколько всего возможных ходов с рубкой на поле у зелёного игрока?",
                answer_type: "single",
                options: options,
                correct: count.toString(),
                position: board,
                highlights: {},
                explanation: explanation
            };
        }
        // fallback
        const fallbackBoard = randomOpenPosition(25, 40);
        const fallbackMoves = getCapturingMoves(fallbackBoard, 'green');
        const fallbackCount = fallbackMoves.length;
        return {
            question: "Сколько всего возможных ходов с рубкой на поле у зелёного игрока?",
            answer_type: "single",
            options: [{ id: "0", text: "0" }, { id: "1", text: "1" }, { id: "2", text: "2" }, { id: "3", text: "3" }],
            correct: fallbackCount.toString(),
            position: fallbackBoard,
            highlights: {},
            explanation: "Не удалось сгенерировать задачу с нужными параметрами. Эта позиция сгенерирована случайно."
        };
    }

    // ------------------------------------------------------------
    // 7. Регистрация в глобальном объекте
    // ------------------------------------------------------------
    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["1"] = generateCapturingMovesTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["1"] = "🎯 Сколько ходов с рубкой у зелёного? (Реверси)";
    window.reversiCenters = centers;
})();