// https://stackoverflow.com/a/18053642/2801663
function getCursorPosition(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    return [x, y];
}

var global = {
    next: 1,
    flip: function () {
        global.next = 3 - global.next; // hmmm use "this"?
        var nextDom = document.getElementById("next");
        nextDom.innerHTML = global.next === 1 ? "黑" : "白";
    }
};

function init() {
    drawAccordingToStatus();

    var canvas = document.getElementById('canvas');
    // alert("Touching screen DOES emit mousedown. But, standard-compliant? ( ﾟ∀。)");
    canvas.addEventListener("mousedown", function (e) {
        var x, y;
        [x, y] = getCursorPosition(canvas, e);
        // n for normalized. 还是想转成棋盘的原位置数据来做计算。
        var xn = x / canvas.scrollWidth * canvas.width,
            yn = y / canvas.scrollHeight * canvas.height;
//                console.log(xn,yn)

        // n for both nearest / node
        var nid = findNearestNodeID(xn, yn);
        if (notOccupied(nid) && validWrtRule(nid)) {
            gameStatus[nid] = global.next;
            global.flip();
            drawAccordingToStatus();
            infoLog();
        } else {
            infoLog("这一手不合规则");
        }


    });
}

function findNearestNodeID(xn, yn) {
    var dSquare = Number.MAX_VALUE,
        result;
    for (var id in positionedNodes) {
        var x = positionedNodes[id].x,
            y = positionedNodes[id].y,
            newDSquare = (x - xn) * (x - xn) + (y - yn) * (y - yn);
        if (newDSquare < dSquare) {
            dSquare = newDSquare;
            result = id;
        }
    }
    return result;
}

function notOccupied(nodeID) {
    return gameStatus[nodeID] === 0;
}

/**
 * Interface for different rules (Chinese, Japanese,...)
 *
 * 中国规则：禁止全盘同形再现（蕴含了打劫规则？）
 *
 * 日本规则：TODO
 *
 * */
function validWrtRule(nodeID) {
    return true; // TODO impl
}

/**
 * 拓扑与坐标无关……
 * */
var adj0 = {
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
var positionedNodes = {
    0: {x: 250, y: 250},
    1: {x: 500, y: 250},
    2: {x: 750, y: 250},
    3: {x: 250, y: 500},
    4: {x: 750, y: 500},
    5: {x: 250, y: 750},
    6: {x: 500, y: 750},
    7: {x: 750, y: 750}
};

var gameStatus = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0
};

/**
 * 结点画个小黑圆点；
 * 只从小 id 向大 id 画线，避免画两遍；
 */
function drawBoard(ctx) {
    for (var id1 in positionedNodes) {
        var x1 = positionedNodes[id1].x,
            y1 = positionedNodes[id1].y;
        drawLittleBlack(x1, y1);

        for (var j in adj0[id1]) {
            var id2 = adj0[id1][j];
            if (id1 <= id2) {
                var x2 = positionedNodes[id2].x,
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
    var canvas = document.getElementById('canvas');
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard(ctx);
        for (id in gameStatus) {
            if (gameStatus[id] !== 0) {
                var x = positionedNodes[id].x,
                    y = positionedNodes[id].y,
                    colorNum = gameStatus[id];
                drawStone(x, y, colorNum);
            }
        }
    }

    /**
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
    var info = document.getElementById('info');
    info.innerHTML = msg;
}