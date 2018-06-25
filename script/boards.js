/*
0   1   2

3       4

5   6   7
*/
/**
 * 拓扑与坐标无关……
 * */
const adj0 = {
    0: [1, 3],
    1: [0, 2, 3, 4],
    2: [1, 4],
    3: [0, 1, 5, 6],
    4: [1, 2, 6, 7],
    5: [3, 6],
    6: [3, 4, 5, 7],
    7: [4, 6]
};

/**
 * 游戏状态又与棋盘形状无关……
 */
const positions0 = {
    0: {x: 250, y: 250},
    1: {x: 500, y: 250},
    2: {x: 750, y: 250},
    3: {x: 250, y: 500},
    4: {x: 750, y: 500},
    5: {x: 250, y: 750},
    6: {x: 500, y: 750},
    7: {x: 750, y: 750}
};

/*
0   1   2
  8   9
3       4
  10  11
5   6   7
*/
const adj1 = {
    0: [1, 3],
    1: [0, 2, 8, 9],
    2: [1, 4],
    3: [0, 8, 10, 5],
    4: [2, 9, 11, 7],
    5: [3, 6],
    6: [10, 11, 5, 7],
    7: [4, 6],

    8: [1, 9, 10, 3],
    9: [1, 8, 11, 4],
    10: [3, 8, 11, 6],
    11: [9, 4, 10, 6]
};

/**
 * 游戏状态又与棋盘形状无关……
 */
const positions1 = {
    0: {x: 250, y: 250},
    1: {x: 500, y: 250},
    2: {x: 750, y: 250},
    3: {x: 250, y: 500},
    4: {x: 750, y: 500},
    5: {x: 250, y: 750},
    6: {x: 500, y: 750},
    7: {x: 750, y: 750},

    8: {x: 375, y: 375},
    9: {x: 625, y: 375},
    10: {x: 375, y: 625},
    11: {x: 625, y: 625}
};

/*
0  1  2  ... 8
9  10 11 ... 17
.            .
.            .
.            .
72 73 74 ... 80
*/
/**
 * @param n
 */
function buildNxNAdj(n) {
    let adj = {};
    // 角
    adj[0] = [1, n];
    adj[n - 1] = [n - 2, 2 * n - 1];
    adj[n * (n - 1)] = [(n - 1) * (n - 1), n * (n - 1) + 1];
    adj[n * n - 1] = [n * n - 2, n * n - 1 - n];
    // 边
    for (let ij = 1; ij <= n - 2; ij++) {
        let topi = ij;
        adj[topi] = [topi - 1, topi + 1, topi + n];
        let boti = n * (n - 1) + ij;
        adj[boti] = [boti - 1, boti + 1, boti - n];
        let lfti = ij * n;
        adj[lfti] = [lfti - n, lfti + n, lfti + 1];
        let rgti = ij * n + n - 1;
        adj[rgti] = [rgti - n, rgti + n, rgti - 1];
    }
    // 肚皮
    for (let i = 1; i <= n - 2; i++) {
        for (let j = 1; j <= n - 2; j++) {
            let id = n * i + j;
            adj[id] = [id - 1, id + 1, id - n, id + n];
        }
    }
    return adj;
}

/**
 * 除去 padding 之后均分吧
 * @param n
 * @param padding 默认 wh / (n + 1);
 * @param wh 默认 1000
 */
function buildNxNPositions(n, padding, wh) {
    wh = wh || 1000; // 到处都使用的 magic number 就不是 magic number 而是常识了（（（
    let w = wh / (n + 1);
    padding = padding || w;

    let positions = {};
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            let id = n * i + j;
            positions[id] = {x: padding + w * j, y: padding + w * i}; // Attention! i j
        }
    }
    return positions;
}

// const adj2 = {};


export const boards = [
    {
        name: "福",
        adj: adj0,
        p: positions0
    },
    {
        name: "玫瑰",
        adj: adj1,
        p: positions1
    },
    {
        name: "9×9",
        adj: buildNxNAdj(9),
        p: buildNxNPositions(9)
    },
];