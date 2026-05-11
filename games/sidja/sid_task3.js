// seega_total_capturing_moves.js
// Задача: "Сколько всего возможных ходов с рубкой (зажимом) есть на поле для обоих игроков?" (Сиджа 7×7)
(() => {
    // ---------- 1. Параметры поля и координаты (7x7) – копируем из рабочего примера ----------
    const small_start_x = 64.5648;
    const small_start_y = 66.0;
    const small_dx = 114.1482;
    const small_dy = 114.0;
    const real_width = 3426;
    const real_height = 3426;

    const max_small_x = small_start_x + 6 * small_dx;
    const max_small_y = small_start_y + 6 * small_dy;
    const scale = real_width / max_small_x;   // ≈4.58

    const start_x = small_start_x * scale;
    const start_y = small_start_y * scale;
    const base_dx = small_dx * scale;
    const base_dy = small_dy * scale;

    const step_factor_x = 0.90;
    const step_factor_y = 0.91;
    const dx = base_dx * step_factor_x;
    const dy = base_dy * step_factor_y;
    const SHIFT_X = -15;
    const SHIFT_Y = 0;

    const originalCenters = {};
    for (let row = 1; row <= 7; row++) {
        for (let col = 1; col <= 7; col++) {
            const cell = (row - 1) * 7 + col;
            const x = start_x + (col - 1) * dx + SHIFT_X;
            const y = start_y + (row - 1) * dy + SHIFT_Y;
            originalCenters[cell] = { x, y };
        }
    }

    // ---------- 2. Вспомогательные функции ----------
    function rcToNum(r, c) { return (r - 1) * 7 + c; }
    function numToRc(num) {
        const row = Math.floor((num - 1) / 7) + 1;
        const col = (num - 1) % 7 + 1;
        return { row, col };
    }

    // 8 направлений
    const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];

    // Подсчёт срубленных фишек для хода (центр не прерывает, но сам не снимается)
    function countCapturesForMove(pos, fromCell, toCell, player) {
        if (toCell in pos) return { count: 0, captured: [] };
        const newPos = { ...pos };
        const color = newPos[fromCell];
        if (color !== player) return { count: 0, captured: [] };
        delete newPos[fromCell];
        newPos[toCell] = color;

        const { row: r, col: c } = numToRc(toCell);
        const capturedSet = new Set();

        for (const [dr, dc] of DIRS) {
            let step = 1;
            while (true) {
                const nr = r + dr * step;
                const nc = c + dc * step;
                if (nr < 1 || nr > 7 || nc < 1 || nc > 7) break;
                const ncell = rcToNum(nr, nc);
                if (ncell in newPos) {
                    if (newPos[ncell] === color) {
                        let allOpponent = true;
                        for (let k = 1; k < step; k++) {
                            const kr = r + dr * k;
                            const kc = c + dc * k;
                            const kcell = rcToNum(kr, kc);
                            if (kcell === 25) continue; // центр не снимается, но линия продолжается
                            const piece = newPos[kcell];
                            if (piece !== (color === 'red' ? 'yellow' : 'red')) {
                                allOpponent = false;
                                break;
                            }
                        }
                        if (allOpponent) {
                            for (let k = 1; k < step; k++) {
                                const kr = r + dr * k;
                                const kc = c + dc * k;
                                const kcell = rcToNum(kr, kc);
                                if (kcell !== 25) capturedSet.add(kcell);
                            }
                        }
                        break;
                    } else {
                        step++;
                        continue;
                    }
                } else {
                    break;
                }
                step++;
            }
        }
        return { count: capturedSet.size, captured: Array.from(capturedSet) };
    }

    // Получение всех рубящих ходов для игрока
    function getAllCapturingMoves(pos, player) {
        const moves = [];
        const cells = Object.keys(pos).filter(cell => pos[cell] === player).map(Number);
        for (const fromCell of cells) {
            const { row: r, col: c } = numToRc(fromCell);
            for (const [dr, dc] of DIRS) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 1 && nr <= 7 && nc >= 1 && nc <= 7) {
                    const toCell = rcToNum(nr, nc);
                    if (!(toCell in pos)) {
                        const { count, captured } = countCapturesForMove(pos, fromCell, toCell, player);
                        if (count > 0) {
                            moves.push({ from: fromCell, to: toCell, captured });
                        }
                    }
                }
            }
        }
        return moves;
    }

    // Общее количество рубящих ходов (оба игрока)
    function countTotalCapturingMoves(pos) {
        const redMoves = getAllCapturingMoves(pos, 'red');
        const yellowMoves = getAllCapturingMoves(pos, 'yellow');
        return redMoves.length + yellowMoves.length;
    }

    // Генерация пояснений
    function getCapturingDescriptions(pos) {
        const redMoves = getAllCapturingMoves(pos, 'red');
        const yellowMoves = getAllCapturingMoves(pos, 'yellow');
        const desc = [];
        for (const m of redMoves) {
            desc.push(`Красная фишка с ${m.from} на ${m.to}, срублены: [${m.captured.join(', ')}]`);
        }
        for (const m of yellowMoves) {
            desc.push(`Жёлтая фишка с ${m.from} на ${m.to}, срублены: [${m.captured.join(', ')}]`);
        }
        return desc;
    }

    // ---------- 3. Генерация позиции (плотная, случайная) ----------
    function randomPosition(total) {
        const allCells = [...Array(49).keys()].map(i => i + 1);
        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }
        const selected = allCells.slice(0, total);
        const redCount = Math.floor(total / 2);
        const yellowCount = total - redCount;
        const colors = [...Array(redCount).fill('red'), ...Array(yellowCount).fill('yellow')];
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        const pos = {};
        for (let i = 0; i < selected.length; i++) pos[selected[i]] = colors[i];
        return pos;
    }

    function generateRichPosition() {
        const total = Math.floor(Math.random() * 5) + 20; // 20-24
        let pos = randomPosition(total);
        for (let attempt = 0; attempt < 5; attempt++) {
            const redCells = Object.keys(pos).filter(cell => pos[cell] === 'red').map(Number);
            if (redCells.length === 0) break;
            const fromCell = redCells[Math.floor(Math.random() * redCells.length)];
            const { row: r1, col: c1 } = numToRc(fromCell);
            for (const [dr, dc] of DIRS) {
                for (let step = 3; step <= 6; step++) {
                    const r2 = r1 + dr * step;
                    const c2 = c1 + dc * step;
                    if (r2 < 1 || r2 > 7 || c2 < 1 || c2 > 7) continue;
                    const toCell = rcToNum(r2, c2);
                    if (pos[toCell] === 'red') {
                        for (let k = 1; k < step; k++) {
                            const kr = r1 + dr * k;
                            const kc = c1 + dc * k;
                            const kcell = rcToNum(kr, kc);
                            if (kcell !== 25) pos[kcell] = 'yellow';
                        }
                        break;
                    }
                }
            }
        }
        return pos;
    }

    // ---------- 4. Генератор задачи ----------
    function generateTotalCapturingMovesTask() {
        // Желаемые частоты ответов (2-8)
        const weightMap = { 2: 2, 3: 6, 4: 8, 5: 8, 6: 6, 7: 3, 8: 1 };
        const maxWeight = Math.max(...Object.values(weightMap));
        const maxAttempts = 500;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos;
            if (Math.random() < 0.8) pos = generateRichPosition();
            else pos = randomPosition(Math.floor(Math.random() * 5) + 20); // 20-24
            const total = countTotalCapturingMoves(pos);
            if (total < 2 || total > 8) continue;
            const prob = (weightMap[total] || 1) / maxWeight;
            if (Math.random() > prob) continue;

            // Формируем варианты ответа
            const answersSet = new Set([total, total+1, total-1, total+2, total-2, total+3, total-3]);
            const answersArr = Array.from(answersSet).filter(v => v >= 2 && v <= 8).slice(0, 4);
            while (answersArr.length < 4) answersArr.push(Math.min(8, Math.max(2, total + answersArr.length)));
            for (let i = answersArr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [answersArr[i], answersArr[j]] = [answersArr[j], answersArr[i]];
            }
            const options = answersArr.map(v => ({ id: String(v), text: String(v) }));

            // Пояснения
            const descriptions = getCapturingDescriptions(pos);
            let explanation = descriptions.length ? descriptions.join('; ') : 'На поле нет возможных ходов с рубкой.';

            return {
                question: 'Сколько всего возможных ходов с рубкой (зажимом) есть на поле для обоих игроков?',
                answer_type: 'single',
                options: options,
                correct: String(total),
                position: pos,
                highlights: {},
                explanation: explanation,
                green_numbers: null
            };
        }
        // fallback
        return {
            question: 'Сколько всего возможных ходов с рубкой (зажимом) есть на поле для обоих игроков?',
            answer_type: 'single',
            options: [{ id: '0', text: '0' }],
            correct: '0',
            position: {},
            highlights: {},
            explanation: 'Не удалось сгенерировать задачу.'
        };
    }

    // ---------- 5. Экспорт ----------
    window.taskGenerators = window.taskGenerators || {};
    // Используем ключ "6" (можно любой, но в HTML нужно добавить соответствующий пункт)
    window.taskGenerators["6"] = generateTotalCapturingMovesTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["6"] = "📊 Сиджа: подсчёт всех ходов с зажимом";
    window.originalCenters = originalCenters;
})();