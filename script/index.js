import {boards} from "./boards.js";

let boardID = 1;
const adj = boards[boardID].adj, positions = boards[boardID].p;
let global, gameStatus, stoneStrings;

function initData() {
    // SyntaxError: applying the 'delete' operator to an unqualified name is deprecated
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Delete_in_strict_mode
    // Set to null, wait for GC // Just Wait for setting to other objects?
    // stoneStrings = null;
    // gameStatus = null;
    // global = null;

    // calling for binding ( ﾟ∀。)
    let passButton = document.getElementById("pass");
    passButton.disabled = false;

    /**
     * stone string id -> {chiSet: Set<node id>; nodes: Set<node id>}
     * Damn JS type system
     * @type {{}}
     */
    stoneStrings = {};
    gameStatus = {};
    for (let id in adj) {
        gameStatus[id] = {s: 0, stoneStringID: null};
    }

    global = {
        next: 1,
        oppoColor: function (myColor) {
            return 3 - myColor;
        },
        isNextBlack: function () {
            return this.next === 1;
        },
        isNextWhite: function () {
            return this.next === 2;
        },
        isEmpty: function (color) {
            return color === 0;
        },
        flip: function () {
            this.next = this.oppoColor(this.next); // hmmm use "this"?
        },

        _nextStoneStringID: 0,
        nextStoneStringID: function () {
            return this._nextStoneStringID++;
        },

        passed: 0, // 双方共计连续放弃几次啦？===2 则终局
        ended: false
    };
}

function init() {
    initData();
    drawAccordingToStatus();

    let canvas = document.getElementById('canvas');
    // alert("Touching screen DOES emit mousedown. But, standard-compliant? ( ﾟ∀。)"); // It is being interesting (no
    canvas.addEventListener("touchstart", function (e) {
        e.preventDefault();
        let clientX = e.touches.item(0).clientX, clientY = e.touches.item(0).clientY;
        handlePlay(clientX, clientY)
    });
    canvas.addEventListener("mousedown", function (e) {
        e.preventDefault();
        let clientX = e.clientX, clientY = e.clientY;
        handlePlay(clientX, clientY)
    });

    function handlePlay(clientX, clientY) {
        if (!global.ended) {
            let x, y;
            [x, y] = getCursorPosition(clientX, clientY);
            // n for normalized. 还是想转成棋盘的原位置数据来做计算。
            let xn = x / canvas.scrollWidth * canvas.width,
                yn = y / canvas.scrollHeight * canvas.height;

            // n for both nearest / node
            let nid = findNearestNodeID(xn, yn);
            if (notOccupied(nid) && validWrtRuleAndUpdate(nid, global.next)) {
                global.flip();
                global.passed = 0;
                drawAccordingToStatus();
                infoLog();
                console.log("after update", nid, gameStatus, stoneStrings);
            } else {
                infoLog("这一手不合规则。");
            }
        }
    }


    // https://stackoverflow.com/a/18053642/2801663
    function getCursorPosition(clientX, clientY) {
        let rect = canvas.getBoundingClientRect();
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        return [x, y];
    }


    function findNearestNodeID(xn, yn) {
        let dSquare = Number.MAX_VALUE,
            result;
        for (let id in positions) {
            let pNode = positions[id];
            let x = pNode.x,
                y = pNode.y,
                newDSquare = (x - xn) * (x - xn) + (y - yn) * (y - yn);
            if (newDSquare < dSquare) {
                dSquare = newDSquare;
                result = id;
            }
        }
        return parseInt(result); // not a big deal?
    }
}


function drawAccordingToStatus() {
    let nextDom = document.getElementById("next");
    nextDom.innerHTML = global.next === 1 ? "黑" : "白";

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    if (canvas.getContext) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard(ctx);
        for (let id in gameStatus) {
            if (gameStatus[id].s !== 0) {
                let x = positions[id].x,
                    y = positions[id].y,
                    color = gameStatus[id].s;
                drawStone(x, y, color);
            }
        }
    }

    /**
     * 结点画个小黑圆点；
     * 只从小 id 向大 id 画线，避免画两遍；
     */
    function drawBoard(ctx) {
        for (let id1 in positions) {
            let x1 = positions[id1].x,
                y1 = positions[id1].y;
            drawLittleBlack(x1, y1);

            for (let id2 of adj[id1]) {
                if (id1 <= id2) {
                    let x2 = positions[id2].x,
                        y2 = positions[id2].y;
                    drawLine(x1, y1, x2, y2);
                }
            }
        }

        /**
         * 嵌套定义 function 提升出去什么的……看看 MetaTODO
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


    /**
     * @param x
     * @param y
     * @param colorEnum 1 black, 2 white 无防御
     */
    function drawStone(x, y, colorEnum) {
        ctx.fillStyle = colorEnum === 1 ? "black" : "white";
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.arc(x, y, 35, 0, Math.PI * 2);
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

function restart() {
    initData();
    drawAccordingToStatus();
    infoLog("请点击或触摸下棋。");
}

function pass() {
    infoLog((global.isNextBlack() ? "黑" : "白") + "棋放弃一手。");
    global.flip();
    global.passed++;
    if (global.passed === 2) {
        infoLog("双方连续放弃，本局结束。");
        global.ended = true;

        // call for binding
        let passButton = document.getElementById("pass");
        passButton.disabled = true;
    } else {
        drawAccordingToStatus();
    }
}


function notOccupied(nodeID) {
    return gameStatus[nodeID].s === 0;
}

/**
 * If this move is valid, update data, else keep the data as is and return null
 *
 * Interface for different rules (Chinese, Japanese,...)
 *
 * 中国规则：禁止全盘同形再现（蕴含了打劫规则？）TODO
 * 日本规则：TODO
 *
 * @param nodeID 此次落子处
 * @param color 1 black 2 white
 *
 * */
function validWrtRuleAndUpdate(nodeID, color) {
    let neighborMySSs, neighborOppoSSs, // Set<Int>
        directChi; // Int
    [neighborMySSs, neighborOppoSSs, directChi] = findNeighborSSnChi(nodeID, color);

    let existsEnemyToRemove = neighborOppoSSs.some(function (ssid) {
        return stoneStrings[ssid].chiSet.size === 1;
    });

    let existsFriendChiMoreThanTwo = neighborMySSs.some(function (ssid) {
        return stoneStrings[ssid].chiSet.size >= 2;
    });

    let validMove = (directChi > 0) || existsEnemyToRemove || existsFriendChiMoreThanTwo;
    if (validMove) {
        // 既然不会回滚，那么可以先连自己（或新建棋串），再提敌子儿。提敌子儿时也会更新我方气集的。
        // 相连之后的新气集：旧棋串气集、新落子气集的（可交）union - {nodeID}
        // 相连之后的新子儿集：旧棋串子儿集的（不交）union ∪ {nodeID}
        buildOrMergeSS(nodeID, color, neighborMySSs);

        // 给敌方紧气，maybe 提子儿
        affectOpponents(nodeID, color, neighborOppoSSs);

        return true;
    }
    else {
        return null;
    }
}


function findNeighborSSnChi(nodeID, color) {
    // 先找出所有 distinct 邻居棋串（避免对同一棋串重复操作），按敌我分开；也同时算出直接的气数
    // SS for stone string
    let neighborMySSs = new Set(), neighborOppoSSs = new Set();
    let directChi = 0;
    for (let nid of adj[nodeID]) {
        let neighborColor = gameStatus[nid].s,
            neighborSSID = gameStatus[nid].stoneStringID;
        if (color === neighborColor) {
            neighborMySSs.add(neighborSSID);
        } else if (color === global.oppoColor(neighborColor)) {
            neighborOppoSSs.add(neighborSSID);

        } else {
            // empty neighborhood
            directChi++;
        }
    }
    return [[...neighborMySSs], [...neighborOppoSSs], directChi];
}

function buildOrMergeSS(nodeID, color, neighborMySSs) {
    // 两种情形都要做的事情
    let newStoneChiSet = calcNewStoneChiSet(nodeID);
    let newSSID = global.nextStoneStringID();
    gameStatus[nodeID].s = color;
    gameStatus[nodeID].stoneStringID = newSSID;

    // 无我方邻居棋串，则新建棋串
    if (neighborMySSs.length === 0) {
        stoneStrings[newSSID] = {chiSet: newStoneChiSet, nodes: new Set([nodeID])};
    } else {// 有我方邻居棋串，则合并相邻的我方 n(>0) 个棋串
        let newNodeSet = new Set([nodeID]), newChiSet = new Set(newStoneChiSet);
        for (let ssid of neighborMySSs) {
            stoneStrings[ssid].nodes.forEach(function (nidOfExistingFriend) {
                // Last (hope so) graph algorithm bug here: `nidOfExistingFriend` was `ele` then, and I did `gameStatus[ele].s = color;`. 成了给黑子涂黑色。
                newNodeSet.add(nidOfExistingFriend);
                gameStatus[nidOfExistingFriend].stoneStringID = newSSID;
            });
            stoneStrings[ssid].chiSet.forEach(function (chiEle) {
                newChiSet.add(chiEle)
            });
            delete stoneStrings[ssid];
        }
        newChiSet.delete(nodeID);
        // newNodeSet, newChiSet OK

        stoneStrings[newSSID] = {chiSet: newChiSet, nodes: newNodeSet};
    }

    /**
     * 在提掉敌子前，计算新落子自己的气集合
     * @param nodeID
     * @returns {Set}
     */
    function calcNewStoneChiSet(nodeID) {
        return new Set(adj[nodeID].filter(function (nid) {
            let neighborColor = gameStatus[nid].s;
            return global.isEmpty(neighborColor);
        }));
    }
}

/**
 * // 邻居敌方各棋串气集 -= 新落子。若有气 =0 者，逐个提子；提子使敌方的敌方邻居气集增员……
 *
 * @param nodeID
 * @param neighborOppoSSs
 * @param newStoneColor 新落子的颜色，与现在要提走的子儿的相反
 */
function affectOpponents(nodeID, newStoneColor, neighborOppoSSs) {
    for (let ssid of neighborOppoSSs) {
        stoneStrings[ssid].chiSet.delete(nodeID);
        if (stoneStrings[ssid].chiSet.size === 0) {
            removeStoneString(ssid, global.oppoColor(newStoneColor));
            delete stoneStrings[ssid];
        }
    }
}

/**
 *
 * 提掉 ssidToRemove 所示的棋串的所有子
 *
 * 这个气维护，跟重新数一遍相比，哪个快？TODO
 *
 * @param newNodeID
 * @param ssidToRemove SSID to remove
 * @param colorToRemove 也能从全局状态里获取，但是麻烦，直接传进来好了
 */
function removeStoneString(ssidToRemove, colorToRemove) {
    // 对每个提掉的子
    stoneStrings[ssidToRemove].nodes.forEach(function (nid) {
        // 自己安排好
        gameStatus[nid].s = 0;
        gameStatus[nid].stoneStringID = null;

        // 影响到的敌（敌の敌）邻棋串
        let neighborOppoSSs = new Set(); // oppo 指 colorToRemove 所示颜色的对手
        adj[nid].filter(function (nidToAddChi) {
            let neighborColor = gameStatus[nidToAddChi].s;
            return colorToRemove === global.oppoColor(neighborColor);
        }).forEach(function (nidToAddChi) {
            let neighborSSID = gameStatus[nidToAddChi].stoneStringID;
            neighborOppoSSs.add(neighborSSID);
        });  // neighborOppoSSs OK

        neighborOppoSSs.forEach(function (ssid) {
            // Bug was here: 成了把新落子加进气集合
            // 类型是人类的好朋友：想在编译阶段区分 这个nid 那个nid。希望是真最后 bug
            stoneStrings[ssid].chiSet.add(nid);
        });

    });
}

// 1. do not want to mix html with js (<body onload=...)
// 2. want to add touch event handler to button
// 3. do not want to "export" to global scope (?) like
// window.init = init;
// window.restart = restart;
// window.pass = pass;
// so:

// Don't want to use JQuery for now. https://www.sitepoint.com/jquery-document-ready-plain-javascript/
document.addEventListener("DOMContentLoaded", init);
// If don't preventDefault: one touch => two clicks
document.getElementById("restart").addEventListener("mousedown", function (e) {
    e.preventDefault();
    restart();
});
document.getElementById("restart").addEventListener("touchstart", function (e) {
    e.preventDefault();
    restart();
});
document.getElementById("pass").addEventListener("mousedown", function (e) {
    e.preventDefault();
    pass();
});
document.getElementById("pass").addEventListener("touchstart", function (e) {
    e.preventDefault();
    pass();
});
