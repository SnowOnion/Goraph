// https://stackoverflow.com/a/18053642/2801663
function getCursorPosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return [x, y];
}

let global = {
    next: 1,
    oppoColor: function (myColor) {
        return 3 - myColor;
    },
    isEmpty: function (colorNum) {
        return colorNum === 0;
    },
    flip: function () {
        this.next = this.oppoColor(this.next); // hmmm use "this"?
        let nextDom = document.getElementById("next");
        nextDom.innerHTML = this.next === 1 ? "黑" : "白";
    },
    _nextStoneStringID: 0,
    nextStoneStringID: function () {
        return global._nextStoneStringID++;
    }
};

/**
 * stone string id -> {chi: int; chiSet: [node id]; nodes:[node id]}
 * Damn JS type system
 * @type {{}}
 */
let stoneStrings = {};

let gameStatus = {
    0: {s: 0, stoneStringID: null},
    1: {s: 0, stoneStringID: null},
    2: {s: 0, stoneStringID: null},
    3: {s: 0, stoneStringID: null},
    4: {s: 0, stoneStringID: null},
    5: {s: 0, stoneStringID: null},
    6: {s: 0, stoneStringID: null},
    7: {s: 0, stoneStringID: null}
};

function init() {
    drawAccordingToStatus();

    let canvas = document.getElementById('canvas');
    // alert("Touching screen DOES emit mousedown. But, standard-compliant? ( ﾟ∀。)");
    canvas.addEventListener("mousedown", function (e) {
        let x, y;
        [x, y] = getCursorPosition(canvas, e);
        // n for normalized. 还是想转成棋盘的原位置数据来做计算。
        let xn = x / canvas.scrollWidth * canvas.width,
            yn = y / canvas.scrollHeight * canvas.height;

        // n for both nearest / node
        let nid = findNearestNodeID(xn, yn);
        console.log("before update",nid, gameStatus, stoneStrings);
        if (notOccupied(nid) && validWrtRuleAndUpdate(nid, global.next)) {
            // gameStatus[nid].s = global.next; // done by validWrtRuleAndUpdate TODO
            global.flip();
            drawAccordingToStatus();
            infoLog();
            console.log("after update",nid, gameStatus, stoneStrings);
        } else {
            infoLog("这一手不合规则");
        }

    });
}

/**
 * 游戏状态又与棋盘形状无关……
 */
let positionedNodes = {
    0: {x: 250, y: 250},
    1: {x: 500, y: 250},
    2: {x: 750, y: 250},
    3: {x: 250, y: 500},
    4: {x: 750, y: 500},
    5: {x: 250, y: 750},
    6: {x: 500, y: 750},
    7: {x: 750, y: 750}
};

function findNearestNodeID(xn, yn) {
    let dSquare = Number.MAX_VALUE,
        result;
    for (let id in positionedNodes) {
        let pNode = positionedNodes[id];
        let x = pNode.x,
            y = pNode.y,
            newDSquare = (x - xn) * (x - xn) + (y - yn) * (y - yn);
        if (newDSquare < dSquare) {
            dSquare = newDSquare;
            result = id;
        }
    }
    return parseInt(result); // !! key is string. but not bug cause i'm finding
}

function notOccupied(nodeID) {
    return gameStatus[nodeID].s === 0;
}

/**
 * 拓扑与坐标无关……
 * */
let adj0 = {
    0: [1, 3],
    1: [0, 2, 3, 4],
    2: [1, 4],
    3: [0, 1, 5, 6],
    4: [1, 2, 6, 7],
    5: [3, 6],
    6: [3, 4, 5, 7],
    7: [4, 6]
};

function findDistinctNeighborSSs(nodeID, colorNum) {
    // 先找出所有 distinct 邻居棋串（避免对同一棋串重复操作），按敌我分开；
    // SS for stone string
    let neighborMySSs = [], neighborOppoSSs = [];
    for (let nid of adj0[nodeID]) {
        let neighborColor = gameStatus[nid].s,
            neighborSSID = gameStatus[nid].stoneStringID;
        if (colorNum === neighborColor) {
            if (!(neighborSSID in neighborMySSs)) {
                neighborMySSs.push(neighborSSID);
            }
        } else if (colorNum === global.oppoColor(neighborColor)) {
            if (!(neighborSSID in neighborOppoSSs)) {
                neighborOppoSSs.push(neighborSSID);
            }
        } else {
            // empty neighborhood
        }
    }
    return [neighborMySSs, neighborOppoSSs];
}

function maybeRemoveOpponents(nodeID, neighborOppoSSs, myColorNum) {
    // 邻居敌方各棋串气 -=1。若有气 =0 者，逐个提子()——有提子就不会回滚
    for (let ssid of neighborOppoSSs) {
        stoneStrings[ssid].chiSet.splice(stoneStrings[ssid].chiSet.indexOf(nodeID));
        if (stoneStrings[ssid].chiSet.length === 0) {
            removeStoneString(ssid, global.oppoColor(myColorNum));
        }
    }
}

function calculateNewSingleStoneChiSet(nodeID) {
    // 在提掉敌子（如果能）后，计算新落子自己的气集合
    let myChiSet = [];
    for (let nid of adj0[nodeID]) {
        let neighborColor = gameStatus[nid].s;
        if (global.isEmpty(neighborColor)) {
            myChiSet.push(nid);
        }
    }
    return myChiSet;
}

/**
 * If this move is valid, update data, else keep the data as is and return null
 *
 * see doc/chi.txt
 *
 * Interface for different rules (Chinese, Japanese,...)
 *
 * 中国规则：禁止全盘同形再现（蕴含了打劫规则？）TODO
 * 日本规则：TODO
 *
 * @param nodeID 此次落子处
 * @param colorNum 1 black 2 white
 *
 * */
function validWrtRuleAndUpdate(nodeID, colorNum) {
    let neighborMySSs, neighborOppoSSs;
    [neighborMySSs, neighborOppoSSs] = findDistinctNeighborSSs(nodeID, colorNum);
    maybeRemoveOpponents(nodeID, neighborOppoSSs, colorNum);
    let newSingleStoneChiSet = calculateNewSingleStoneChiSet(nodeID);

    // 无我方邻居棋串
    if (neighborMySSs.length === 0) {
        if (newSingleStoneChiSet.length === 0) {
            // 说明是一次自杀
            // 唯一回滚之处：邻居敌方各棋串气 +=1
            for (let ssid of neighborOppoSSs) {
                // stoneStrings[ssid].chi++;
                stoneStrings[ssid].chiSet.push(nodeID);
            }
            return null;
        } else {
            // 独立新建棋串
            let newSSID = global.nextStoneStringID();
            stoneStrings[newSSID] = {/*chi: newSingleStoneChi,*/ chiSet: newSingleStoneChiSet, nodes: [nodeID]};
            gameStatus[nodeID].s = colorNum;
            gameStatus[nodeID].stoneStringID = newSSID;
        }
    } else {// 合并相邻的我方 n(>0) 个棋串
        let newChiSet = newSingleStoneChiSet; // just mutate it...
        for (let ssid of neighborMySSs) {
            for (let chiEle of stoneStrings[ssid].chiSet) {
                if (!(chiEle in newChiSet)) {
                    newChiSet.push(chiEle);
                }
            }
        }
        newChiSet.splice(newChiSet.indexOf(nodeID));

        // 也是一次自杀（带着 neighborhood）
        if (newChiSet.length === 0) {
            // 唯一回滚之处：邻居敌方各棋串气 +=1
            for (let ssid of neighborOppoSSs) {

                stoneStrings[ssid].chiSet.push(nodeID);
            }
            return null;
        } else {
            // come into the new stone string!
            let newSSID = global.nextStoneStringID();
            gameStatus[nodeID].s = colorNum;
            gameStatus[nodeID].stoneStringID = newSSID;
            let newNodes = [nodeID];
            for (let ssid of neighborMySSs) {
                newNodes = newNodes.concat(stoneStrings[ssid].nodes); // TODO performance?
                for (let nid of stoneStrings[ssid].nodes) {
                    gameStatus[nid].stoneStrings = newSSID; // 新归属
                }
                delete stoneStrings[ssid];
            }
            stoneStrings[newSSID] = {/*chi: newChi,*/chiSet: newChiSet, nodes: newNodes};
        }
    }

    return true;
}

/**
 *
 * 提掉 ssid 所示的棋串的所有子
 *
 * 这个气维护，跟重新数一遍相比，哪个快？TODO
 *
 * @param ssid SSID to remove
 * @param colorToRemove 也能从全局状态里获取，但是麻烦，直接传进来好了
 */
function removeStoneString(ssid, colorToRemove) {

// 对每个提掉的子
    for (let removedNID of stoneStrings[ssid].nodes) {
        gameStatus[removedNID].s = 0;
        gameStatus[removedNID].stoneStringID = null;

        let neighborOppoSSs = []; // oppo 指 colorToRemove 所示颜色的对手
        for (let neighborNID of adj0[removedNID]) {
            let neighborColor = gameStatus[neighborNID].s;
            let neighborSSID = gameStatus[neighborNID].stoneStringID;
            if (colorToRemove === global.oppoColor(neighborColor)) {
                if (!(neighborSSID in neighborOppoSSs)) {
                    neighborOppoSSs.push(neighborSSID);
                }
            }
        } // neighborOppoSSs OK

        for (let neighborSSID of neighborOppoSSs) {
            stoneStrings[neighborSSID].chiSet.push(removedNID);
        }
    }

    delete stoneStrings[ssid];
}


/**
 * 结点画个小黑圆点；
 * 只从小 id 向大 id 画线，避免画两遍；
 */
function drawBoard(ctx) {
    for (let id1 in positionedNodes) {
        let x1 = positionedNodes[id1].x,
            y1 = positionedNodes[id1].y;
        drawLittleBlack(x1, y1);

        for (let id2 of adj0[id1]) {
            if (id1 <= id2) {
                let x2 = positionedNodes[id2].x,
                    y2 = positionedNodes[id2].y;
                drawLine(x1, y1, x2, y2);
            }
        }
    }

    /**
     * 嵌套定义 function 提升出去什么的……看看 TODO
     */
    function drawLine(x1, y1, x2, y2) {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke(); // 最后一起 stroke 以提升性能？……
    }

    function drawLittleBlack(x, y) {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawAccordingToStatus() {
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    if (canvas.getContext) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard(ctx);
        for (let id in gameStatus) {
            if (gameStatus[id].s !== 0) {
                let x = positionedNodes[id].x,
                    y = positionedNodes[id].y,
                    colorNum = gameStatus[id].s;
                drawStone(x, y, colorNum);
            }
        }
    }

    /**
     * @param x
     * @param y
     * @param colorEnum 1 black, 2 white 无防御
     */
    function drawStone(x, y, colorEnum) {
        ctx.fillStyle = colorEnum === 1 ? "black" : "white";
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();
    }
}

/**
 *
 * @param msg No argument = clear
 */
function infoLog(msg) {
    msg = msg || "　";
    let info = document.getElementById('info');
    info.innerHTML = msg;
}