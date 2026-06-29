// ゲーム定数定義
const BOARD_SIZE = 8; // 盤面サイズ (8x8)
const BLACK = 'black';
const WHITE = 'white';
const EMPTY = null;

// 盤面の状態を保持する配列（8行 x 8列の2次元配列）
let boardState = [];

// DOM要素の取得
const gameBoardEl = document.getElementById('gameBoard');
const statusPlayerEl = document.getElementById('current-player');
const resetButton = document.getElementById('reset-button');


/**
 * 1. ゲームボードの初期化処理
 */
function initializeGame() {
    boardState = [];
    // boardStateを8x8のEMPTYで満たす
    for (let i = 0; i < BOARD_SIZE; i++) {
        boardState[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            boardState[i][j] = EMPTY;
        }
    }

    // オセロの初期配置（中央4隅）
    boardState[3][3] = WHITE; // 左上：白
    boardState[3][4] = WHITE; // 右上：白
    boardState[4][3] = BLACK; // 左下：黒
    boardState[4][4] = BLACK; // 右下：黒

    // 盤面をHTMLに描画し、イベントリスナーを設定する
    renderBoard();

    // 初期プレイヤーの設定（通常は黒）
    currentPlayer = BLACK;
    updateStatus(BLACK);
}


/**
 * 2. HTMLボードを描画する関数
 */
function renderBoard() {
    gameBoardEl.innerHTML = ''; // 一度空にする
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            // クリックイベントを付与
            cell.addEventListener('click', () => handleCellClick(row, col));

            // 石が配置されているか確認し、クラスと石要素を追加
            if (boardState[row][col] !== EMPTY) {
                const stoneEl = document.createElement('div');
                stoneEl.classList.add('stone', boardState[row][col]);
                cell.appendChild(stoneEl);
            }

            gameBoardEl.appendChild(cell);
        }
    }
}


/**
 * 3. クリックされたマスを処理するハンドラー関数
 * @param {number} row - 行インデックス
 * @param {number} col - 列インデックス
 */
let currentPlayer = BLACK; // 現在の手番プレイヤー

function handleCellClick(row, col) {
    // すでに石がある場合や、現在の手番ではない場合は何もしない
    if (boardState[row][col] !== EMPTY || currentPlayer !== BLACK && currentPlayer !== WHITE) { 
        console.log("無効な場所です。");
        return;
    }

    // **** ★★★ ここが最重要ロジック：着手判定 ★★★ ****
    const flippedCoords = getFlippedPieces(row, col, currentPlayer); // この関数を実装する！

    if (flippedCoords.length === 0) {
        alert("この場所には置けない石です。");
        return;
    }

    // 着手処理の実行
    makeMove(row, col, flippedCoords);
}


/**
 * 4. 移動を実行し、盤面状態とターンを更新する関数
 * @param {number} row - 行インデックス
 * @param {number} col - 列インデックス
 * @param {Array<{r: number, c: number}>} flippedCoords - 反転させる石の座標リスト
 */
function makeMove(row, col, flippedCoords) {
    // 1. 盤面状態を更新する (現在のプレイヤーの色で配置し、反転させる)
    boardState[row][col] = currentPlayer;
    flippedCoords.forEach(coord => {
        boardState[coord.r][coord.c] = currentPlayer;
    });

    // 2. UIの再描画
    renderBoard();

    // 3. ターンを交代させる
    currentPlayer = (currentPlayer === BLACK) ? WHITE : BLACK;
    updateStatus(currentPlayer);

    // TODO: 勝敗判定ロジックをここに組み込む
}


/**
 * 5. 状態表示の更新
 * @param {string} player - 次のターンプレイヤーの色 ('black' or 'white')
 */
function updateStatus(player) {
    statusPlayerEl.textContent = player === BLACK ? "黒 (Black)" : "白 (White)";
    currentPlayer = player; // グローバル変数を更新
}


/**
 * 6. 【★★★ 実装が必要なコア機能 ★★★】
 * 指定座標に石を置いたときに、反転させられる敵の石の座標リストを取得する。
 * この関数がオセロの心臓部です。
 */
function getFlippedPieces(row, col, playerColor) {
    // 1. 周囲の8方向（上下左右斜め）を走査する。
    let opponent = (playerColor === BLACK) ? WHITE : BLACK;
    let flippedPieces = [];

    // 例：右下方向にチェックする場合
    const directions = [
        {dr: 1, dc: 1}, {dr: 1, dc: -1}, // 斜め（対角線）
        {dr: 0, dc: 1}, {dr: 0, dc: -1}, // 水平
        {dr: 1, dc: 0}, {dr: -1, dc: 0}  // 垂直
    ];

    for (const dir of directions) {
        let currentR = row + dir.dr;
        let currentC = col + dir.dc;
        let lineFlipped = []; // この方向に反転させるべき石のリスト

        // 直線上に進みながらチェック（最大8回）
        while (currentR >= 0 && currentR < BOARD_SIZE && currentC >= 0 && currentC < BOARD_SIZE) {
            const pieceColor = boardState[currentR][currentC];
            
            if (pieceColor === opponent) {
                // 敵の石を見つけたら、リストに追加してさらに進む
                lineFlipped.push({ r: currentR, c: currentC });
                currentR += dir.dr;
                currentC += dir.dc;

            } else if (pieceColor === playerColor) {
                // 自分の石を見つけた場合、これ以上は反転できないためループを抜ける
                break;
            } else if (pieceColor === EMPTY) {
                // 空きマスの場合、それが着手地点なら、前の敵の石群が完成したか確認する。
                if (lineFlipped.length > 0) {
                    // 反転させられる石群が見つかった！
                    flippedPieces.push(...lineFlipped);
                }
                break; // 空きマスなので探索終了
            } else {
                 // エラー処理または予期しない色の場合
                break;
            }
        }
    }

    return flippedPieces;
}


/**
 * 7. 初期化とイベントリスナーの設定（実行開始）
 */
let currentPlayer = BLACK; // ゲーム開始プレイヤーを設定
initializeGame();

// リセットボタンのイベント設定
resetButton.addEventListener('click', initializeGame);
