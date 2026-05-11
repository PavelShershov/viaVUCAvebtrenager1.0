// task_hnefatafl_max_capture.js (оптимизированная версия)
(() => {
    const real_size = 3289;
    const margin = 150;
    const step = (real_size - 2 * margin) / 10;
    const THRONE = 61;
    const FORTRESSES = new Set([1, 11, 111, 121]);

    const originalCenters = {};
    let cellId = 1;
    for (let row = 1; row <= 11; row++) {
        for (let col = 1; col <= 11; col++) {
            const x = margin + (col - 1) * step;
            const y = margin + (row - 1) * step;
            originalCenters[cellId++] = { x, y };
        }
    }

    function initialPosition() {
        const pos = {};
        pos[THRONE] = 'king';
        const defenders = [39, 49, 50, 51, 59, 60, 62, 63, 71, 72, 73, 83];
        defenders.forEach(c => pos[c] = 'green');
        const vikings = [
            4,5,6,7,8,17, 34,45,56,57,67,78,
            44,55,66,77,88,65, 105,114,115,116,117,118
        ];
        vikings.forEach(c => pos[c] = 'red');
        return pos;
    }

    function numToRc(num) {
        const row = Math.floor((num - 1) / 11);
        const col = (num - 1) % 11;
        return { row, col };
    }
    function rcToNum(row, col) {
        return row * 11 + col + 1;
    }

    function getMoves(pos, cell) {
        if (!pos.hasOwnProperty(cell)) return [];
        const piece = pos[cell];
        const { row: r, col: c } = numToRc(cell);
        const moves = [];
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
            if (piece === 'king') {
                for (let step = 1; step <= 2; step++) {
                    const nr = r + dr * step, nc = c + dc * step;
                    if (nr < 0 || nr >= 11 || nc < 0 || nc >= 11) break;
                    const ncell = rcToNum(nr, nc);
                    if (ncell === THRONE) continue;
                    if (pos.hasOwnProperty(ncell)) break;
                    moves.push(ncell);
                }
            } else {
                // ограничиваем шаги до 10 (максимальное расстояние на доске 10)
                for (let step = 1; step <= 10; step++) {
                    const nr = r + dr * step, nc = c + dc * step;
                    if (nr < 0 || nr >= 11 || nc < 0 || nc >= 11) break;
                    const ncell = rcToNum(nr, nc);
                    if (ncell === THRONE) break;
                    if (pos.hasOwnProperty(ncell)) break;
                    moves.push(ncell);
                }
            }
        }
        return moves;
    }

    function isEnemyOrFortress(cell, attackerColor, pos) {
        if (cell === undefined) return false;
        if (FORTRESSES.has(cell)) return true;
        if (cell === THRONE) return !pos.hasOwnProperty(cell);
        return pos[cell] === attackerColor;
    }

    function isCapturedOrdinary(cell, pos, attackerColor) {
        if (!pos.hasOwnProperty(cell) || pos[cell] === 'king') return false;
        const { row: r, col: c } = numToRc(cell);
        const left = c > 0 ? rcToNum(r, c-1) : undefined;
        const right = c < 10 ? rcToNum(r, c+1) : undefined;
        const up = r > 0 ? rcToNum(r-1, c) : undefined;
        const down = r < 10 ? rcToNum(r+1, c) : undefined;
        const leftOk = isEnemyOrFortress(left, attackerColor, pos);
        const rightOk = isEnemyOrFortress(right, attackerColor, pos);
        if (leftOk && rightOk) return true;
        const upOk = isEnemyOrFortress(up, attackerColor, pos);
        const downOk = isEnemyOrFortress(down, attackerColor, pos);
        if (upOk && downOk) return true;
        return false;
    }

    function isCapturedKing(cell, pos, attackerColor) {
        if (pos[cell] !== 'king') return false;
        if (cell === THRONE) return false;
        const { row: r, col: c } = numToRc(cell);
        let enemyCount = 0;
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= 11 || nc < 0 || nc >= 11) {
                enemyCount++;
            } else {
                const ncell = rcToNum(nr, nc);
                if (isEnemyOrFortress(ncell, attackerColor, pos)) enemyCount++;
            }
        }
        return enemyCount >= 4;
    }

    function wouldBeCapturedAfterMove(pos, fromCell, toCell, playerColor) {
        if (pos.hasOwnProperty(toCell)) return new Set();
        const newPos = { ...pos };
        const piece = newPos[fromCell];
        delete newPos[fromCell];
        newPos[toCell] = piece;
        const opponentColor = playerColor === 'green' ? 'red' : 'green';
        const captured = new Set();
        const cellsToCheck = new Set();
        for (const cell of [toCell, fromCell]) {
            const { row: r, col: c } = numToRc(cell);
            for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < 11 && nc >= 0 && nc < 11) {
                    cellsToCheck.add(rcToNum(nr, nc));
                }
            }
        }
        for (const cell of cellsToCheck) {
            if (!newPos.hasOwnProperty(cell)) continue;
            const col = newPos[cell];
            if (col === opponentColor) {
                if (isCapturedOrdinary(cell, newPos, playerColor)) captured.add(cell);
            } else if (col === 'king' && playerColor === opponentColor) {
                if (isCapturedKing(cell, newPos, playerColor)) captured.add(cell);
            }
        }
        return captured;
    }

    function getMaxCaptureForBoard(pos) {
        let maxCap = 0;
        let bestMoves = [];
        for (const [cell, color] of Object.entries(pos)) {
            if (color === 'king') continue;
            const fromCell = Number(cell);
            const moves = getMoves(pos, fromCell);
            for (const toCell of moves) {
                const caps = wouldBeCapturedAfterMove(pos, fromCell, toCell, color);
                if (caps.size > maxCap) {
                    maxCap = caps.size;
                    bestMoves = [{ from: fromCell, to: toCell, captured: Array.from(caps), player: color }];
                } else if (caps.size === maxCap && maxCap > 0) {
                    bestMoves.push({ from: fromCell, to: toCell, captured: Array.from(caps), player: color });
                }
            }
        }
        return { maxCap, bestMoves };
    }

    function isValidPosition(pos) {
        if (pos[THRONE] !== 'king') return false;
        for (const fort of FORTRESSES) if (pos[fort]) return false;
        let red = 0, green = 0;
        for (const col of Object.values(pos)) {
            if (col === 'red') red++;
            else if (col === 'green') green++;
        }
        if (red < 5 || red > 24) return false;
        if (green < 4 || green > 14) return false;
        return true;
    }

    function randomizePosition(basePos, steps = 25) {
        const pos = { ...basePos };
        for (let s = 0; s < steps; s++) {
            const cells = Object.keys(pos).map(Number);
            const movable = cells.filter(cell => getMoves(pos, cell).length > 0);
            if (movable.length === 0) break;
            const cell = movable[Math.floor(Math.random() * movable.length)];
            const moves = getMoves(pos, cell);
            const toCell = moves[Math.floor(Math.random() * moves.length)];
            const piece = pos[cell];
            delete pos[cell];
            pos[toCell] = piece;
        }
        return pos;
    }

    function generateEarlyPosition() {
        const steps = Math.floor(Math.random() * 12) + 4; // 4-15 ходов
        const pos = randomizePosition(initialPosition(), steps);
        return isValidPosition(pos) ? pos : null;
    }

    function generateSparsePosition() {
        for (let attempt = 0; attempt < 15; attempt++) {
            const total = Math.floor(Math.random() * 13) + 12;
            const base = initialPosition();
            const pieces = Object.entries(base);
            for (let i = pieces.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
            }
            const newPos = {};
            newPos[THRONE] = 'king';
            let count = 1;
            for (const [cell, color] of pieces) {
                if (color === 'king') continue;
                if (count < total) {
                    newPos[cell] = color;
                    count++;
                } else break;
            }
            const pos = randomizePosition(newPos, 25);
            if (isValidPosition(pos)) return pos;
        }
        return null;
    }

    function generateLongLinePosition(target) {
        for (let attempt = 0; attempt < 25; attempt++) {
            const startCell = Math.floor(Math.random() * 121) + 1;
            let { row: sr, col: sc } = numToRc(startCell);
            const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
            const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
            const line = [];
            let ok = true;
            for (let step = 1; step <= target; step++) {
                const nr = sr + dr * step, nc = sc + dc * step;
                if (nr < 0 || nr >= 11 || nc < 0 || nc >= 11) { ok = false; break; }
                const ncell = rcToNum(nr, nc);
                if (FORTRESSES.has(ncell) || ncell === THRONE) { ok = false; break; }
                line.push(ncell);
            }
            if (!ok) continue;
            const startLineCell = rcToNum(sr, sc);
            if (FORTRESSES.has(startLineCell) || startLineCell === THRONE) continue;
            const pos = {};
            pos[THRONE] = 'king';
            line.forEach(cell => pos[cell] = 'green');
            pos[startLineCell] = 'red';
            const extra = Math.floor(Math.random() * 12) + 6;
            const allCells = [];
            for (let i = 1; i <= 121; i++) if (!pos[i] && i !== THRONE && !FORTRESSES.has(i)) allCells.push(i);
            for (let i = 0; i < Math.min(extra, allCells.length); i++) {
                pos[allCells[i]] = Math.random() < 0.6 ? 'red' : 'green';
            }
            const finalPos = randomizePosition(pos, 20);
            if (isValidPosition(finalPos)) return finalPos;
        }
        return null;
    }

    let lastAnswers = [];

    function generateMaxCaptureTask() {
        const weights = {3:6, 4:6, 5:6, 6:3, 7:2};
        for (let attempt = 0; attempt < 100; attempt++) {
            let pos;
            const r = Math.random();
            if (r < 0.4) {
                pos = generateEarlyPosition();
            } else if (r < 0.7) {
                pos = generateSparsePosition();
            } else {
                const target = [3,4,5,6,7][Math.floor(Math.random() * 5)];
                pos = generateLongLinePosition(target);
                if (!pos) pos = generateSparsePosition();
            }
            if (!pos || !isValidPosition(pos)) continue;
            const { maxCap, bestMoves } = getMaxCaptureForBoard(pos);
            if (maxCap < 3 || maxCap > 7) continue;
            if (lastAnswers.length >= 2 && lastAnswers[lastAnswers.length-1] === maxCap && lastAnswers[lastAnswers.length-2] === maxCap) continue;
            const prob = (weights[maxCap] || 1) / 6;
            if (Math.random() > prob) continue;
            lastAnswers.push(maxCap);
            if (lastAnswers.length > 5) lastAnswers.shift();
            const answerSet = new Set([maxCap, maxCap+1, maxCap-1, maxCap+2, maxCap-2]);
            let answers = Array.from(answerSet).filter(v => v >= 1 && v <= 8).slice(0,4);
            while (answers.length < 4) answers.push(maxCap + answers.length);
            for (let i = answers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [answers[i], answers[j]] = [answers[j], answers[i]];
            }
            const options = answers.map(v => ({ id: String(v), text: String(v) }));
            const bestMovesDesc = bestMoves.slice(0,3).map(m => {
                const playerName = m.player === 'red' ? 'Красная' : 'Зелёная';
                return `${playerName} фишка с ${m.from} → ${m.to}, срубает: ${m.captured.join(', ')}`;
            });
            return {
                question: "Ход с максимальной рубкой какого количества фишек есть на поле?",
                answer_type: "single",
                options: options,
                correct: String(maxCap),
                position: pos,
                best_moves: bestMovesDesc,
                highlights: {}
            };
        }
        const pos = randomizePosition(initialPosition(), 20);
        const { maxCap, bestMoves } = getMaxCaptureForBoard(pos);
        const finalCap = maxCap >= 3 ? maxCap : 3;
        const answers = [finalCap, finalCap+1, finalCap-1, finalCap+2].filter(v => v>=1 && v<=8).slice(0,4);
        while (answers.length < 4) answers.push(finalCap);
        const options = answers.map(v => ({ id: String(v), text: String(v) }));
        return {
            question: "Ход с максимальной рубкой какого количества фишек есть на поле?",
            answer_type: "single",
            options: options,
            correct: String(finalCap),
            position: pos,
            best_moves: [],
            highlights: {}
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["2"] = generateMaxCaptureTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["2"] = "⚡ Максимальная рубка (Хнефатафл)";
    window.originalCenters = originalCenters;
})();