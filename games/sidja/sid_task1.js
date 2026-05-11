// task_seega_max_capture.js
// Задача: "Какое максимальное количество фишек может срубить за один ход красный игрок?" (Сиджа 7×7)
(() => {
    // ---------- 1. Параметры поля и координаты (7x7) ----------
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

    // ---------- 2. Граф соединений (8 направлений) ----------
    const ADJ = {};
    for (let r = 1; r <= 7; r++) {
        for (let c = 1; c <= 7; c++) {
            const cell = (r - 1) * 7 + c;
            ADJ[cell] = [];
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 1 && nr <= 7 && nc >= 1 && nc <= 7) {
                        const nb = (nr - 1) * 7 + nc;
                        ADJ[cell].push(nb);
                    }
                }
            }
        }
    }

    // ---------- 3. Функции захвата ----------
    function rcToNum(r, c) { return (r - 1) * 7 + c; }
    function numToRc(num) {
        const row = Math.floor((num - 1) / 7) + 1;
        const col = (num - 1) % 7 + 1;
        return { row, col };
    }

    // Возвращает количество срубленных фишек и список (для отладки)
    function countCapturesForMove(pos, fromCell, toCell, player) {
        if (toCell in pos) return { count: 0, captured: [] };
        const newPos = { ...pos };
        const color = newPos[fromCell];
        delete newPos[fromCell];
        newPos[toCell] = color;

        const { row: r, col: c } = numToRc(toCell);
        const capturedSet = new Set();

        // 8 направлений
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, dc] of dirs) {
            let step = 1;
            while (true) {
                const nr = r + dr * step;
                const nc = c + dc * step;
                if (nr < 1 || nr > 7 || nc < 1 || nc > 7) break;
                const ncell = rcToNum(nr, nc);
                if (ncell in newPos) {
                    if (newPos[ncell] === color) {
                        // Нашли свою фишку – проверяем промежуток
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
                        // Встретили фишку противника – продолжаем
                        step++;
                        continue;
                    }
                } else {
                    // Пустая клетка – прерываем
                    break;
                }
                step++;
            }
        }
        return { count: capturedSet.size, captured: Array.from(capturedSet) };
    }

    function maxCapturesForRed(pos) {
        let best = 0;
        const redCells = Object.keys(pos).filter(cell => pos[cell] === 'red').map(Number);
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const fromCell of redCells) {
            const { row: r, col: c } = numToRc(fromCell);
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 1 && nr <= 7 && nc >= 1 && nc <= 7) {
                    const toCell = rcToNum(nr, nc);
                    if (!(toCell in pos)) {
                        const { count } = countCapturesForMove(pos, fromCell, toCell, 'red');
                        if (count > best) best = count;
                    }
                }
            }
        }
        return best;
    }

    // ---------- 4. Генераторы позиций ----------
    // Генерирует случайную позицию с заданным количеством фишек (20-24)
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

    // Создаёт позиции с длинными линиями (для больших ответов)
    function generateRichPosition() {
        const total = Math.floor(Math.random() * 5) + 20; // 20-24
        let pos = randomPosition(total);
        // Несколько попыток создать длинные линии
        for (let attempt = 0; attempt < 5; attempt++) {
            const redCells = Object.keys(pos).filter(cell => pos[cell] === 'red').map(Number);
            if (redCells.length === 0) break;
            // Берём случайную красную фишку
            const r1Idx = Math.floor(Math.random() * redCells.length);
            const fromCell = redCells[r1Idx];
            const { row: r1, col: c1 } = numToRc(fromCell);
            const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
            for (const [dr, dc] of dirs) {
                // Ищем вторую красную на расстоянии 3-6
                for (let step = 3; step <= 6; step++) {
                    const r2 = r1 + dr * step;
                    const c2 = c1 + dc * step;
                    if (r2 < 1 || r2 > 7 || c2 < 1 || c2 > 7) continue;
                    const toCell = rcToNum(r2, c2);
                    if (pos[toCell] === 'red') {
                        // Заполняем промежуток жёлтыми
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

    // Генератор позиции с целевым максимальным взятием (используется фильтрация)
    function generatePositionByTarget(target, maxAttempts = 300) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos;
            if (Math.random() < 0.8) pos = generateRichPosition();
            else pos = randomPosition(Math.floor(Math.random() * 5) + 20);
            const maxCap = maxCapturesForRed(pos);
            if (maxCap === target) return pos;
        }
        // fallback
        return randomPosition(22);
    }

    // ---------- 5. Генератор задачи ----------
    function generateMaxCaptureTask() {
        // Веса для ответов (сильный перекос в сторону 5,6,7)
        const targets = [1,2,3,4,5,6,7,8];
        const weights = [1,1,3,5,20,20,20,1];
        let r = Math.random() * weights.reduce((a,b)=>a+b,0);
        let cum = 0, target = 3;
        for (let i = 0; i < targets.length; i++) {
            cum += weights[i];
            if (r < cum) { target = targets[i]; break; }
        }
        const pos = generatePositionByTarget(target);
        const correct = maxCapturesForRed(pos);
        // Генерация вариантов ответа (4 числа)
        const answers = new Set([correct, correct+1, correct-1, correct+2, correct-2]);
        for (let v of [...answers]) if (v < 0) answers.delete(v);
        let answersArr = Array.from(answers).slice(0,4);
        while (answersArr.length < 4) answersArr.push(correct + answersArr.length);
        for (let i = answersArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [answersArr[i], answersArr[j]] = [answersArr[j], answersArr[i]];
        }
        const options = answersArr.map(v => ({ id: String(v), text: String(v) }));
        // Сохраняем позицию для отрисовки (рендерер использует originalCenters)
        return {
            question: "Какое максимальное количество фишек может срубить за один ход красный игрок?",
            answer_type: "single",
            options: options,
            correct: String(correct),
            position: pos,
            highlights: {}
        };
    }

    // ---------- 6. Регистрация в глобальном объекте ----------
    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["4"] = generateMaxCaptureTask;   // тип 4 – для селекта
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["4"] = "🔥 Максимальная рубка красных (Сиджа)";
    window.originalCenters = originalCenters;  // для отрисовки
})();