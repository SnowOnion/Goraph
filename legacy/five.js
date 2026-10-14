/**
 * 在围棋落子规则判定、生效后调用，检查是否符合五子棋结束条件。
 *
 * ……这就依赖矩形棋盘编号约定了。
 *
 * @param gameStatus
 * @param w
 * @param h
 * @param nodeID 刚才下哪儿了。有这个参数比较经济，只向 8 个方向各检查 4 个子即可。
 *
 * @return int 0不结束 1黑胜 2白胜
 *
 */
export function checkFiveWinning(gameStatus, w, h, nodeID) {
    function oneToTwo(n) {
        return {i: Math.floor(n / w), j: n % w}
    }

    function twoToOne(p) {
        return p.i * w + p.j;
    }

    function inside(p) {
        return (p.j >= 0) && (p.j < w) && (p.i >= 0) && (p.i < h);
    }

    let newColor = gameStatus[nodeID].s;

    /*
    0 1 2
    3 4 5
    6 7 8
    */
    let e0 = 0, e45 = 0, e90 = 0, e135 = 0, e180 = 0, e225 = 0, e270 = 0, e315 = 0;
    let p = oneToTwo(nodeID);
    let pp;
    for (let k = 1; k <= 4; k++) {
        if (inside(pp = {i: p.i, j: p.j + k}) && gameStatus[twoToOne(pp)].s === newColor) e0++;
        if (inside(pp = {i: p.i + k, j: p.j + k}) && gameStatus[twoToOne(pp)].s === newColor) e45++;
        if (inside(pp = {i: p.i + k, j: p.j}) && gameStatus[twoToOne(pp)].s === newColor) e90++;
        if (inside(pp = {i: p.i + k, j: p.j - k}) && gameStatus[twoToOne(pp)].s === newColor) e135++;
        if (inside(pp = {i: p.i, j: p.j - k}) && gameStatus[twoToOne(pp)].s === newColor) e180++;
        if (inside(pp = {i: p.i - k, j: p.j - k}) && gameStatus[twoToOne(pp)].s === newColor) e225++;
        if (inside(pp = {i: p.i - k, j: p.j}) && gameStatus[twoToOne(pp)].s === newColor) e270++;
        if (inside(pp = {i: p.i - k, j: p.j + k}) && gameStatus[twoToOne(pp)].s === newColor) e315++;

        // console.log(e0, e45, e90, e135, e180, e225, e270, e315);
        if (e0 + e180 >= 4 || e45 + e225 >= 4 || e90 + e270 >= 4 || e135 + e315 >= 4) {
            return newColor;
        }
    }
    return 0;
}