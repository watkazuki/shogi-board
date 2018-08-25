(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const rule = require('./rule');

function Board() {
    this.init();
};

//  エラー: 駒を取った際
//  -> accessibleが削除されていないのが原因

//  todo: マジックナンバを減らす
Board.prototype.init = function () {

    //  共通要素
    this.m = {

        //  preloadjs
        loader: null,

        //  駒のサイズ
        PIECE_WIDTH: 36,
        PIECE_HEIGHT: 39
    };

    //  dom要素
    this.dom = {
        board: document.getElementById('ban'),
        piecestand_sente: document.getElementById("komadai-sente"),
        piecestand_gote: document.getElementById("komadai-gote"),
        txt_sente: document.getElementById("text-sente"),
        txt_gote: document.getElementById("text-gote")
    };

    //  盤の情報
    this.stat = {

        //  盤の情報
        position: [], //  盤のどの位置にどの駒があるか、の情報
        picked: null, //  選択した駒の記録用
        turn_list: ['sente', 'gote'], //  使う？ todo: 消すかどうか決める
        turn: 'sente', //  手番
        phase_select: false, //  駒が選択されたかどうか
        captured_select: false, //  持ち駒が選択されたかどうか

        //  駒台
        piecestand_sente: [], //  先手の持ち駒
        piecestand_gote: [] //  後手の持ち駒
    };

    //  駒の配置の初期化
    this.stat.position = this.initPosition(true);

    //  最初の手番は先手なので、後手のテキストを不透明にする
    if (this.stat.turn === 'sente') {
        this.dom.txt_gote.classList.add('half_transparent');
    } else {
        this.dom.txt_sente.classList.add('half_transparent');
    }

    //  駒の画像読み込み(preloadjs)
    const manifest = [{ "id": "1", src: "fu.png" }, { "id": "2", src: "to.png" }, { "id": "3", src: "kyo.png" }, { "id": "4", src: "nkyo.png" }, { "id": "5", src: "kei.png" }, { "id": "6", src: "nkei.png" }, { "id": "7", src: "gin.png" }, { "id": "8", src: "ngin.png" }, { "id": "9", src: "kin.png" }, { "id": "10", src: "hi.png" }, { "id": "11", src: "ryu.png" }, { "id": "12", src: "kaku.png" }, { "id": "13", src: "uma.png" }, { "id": "14", src: "ou.png" }];
    this.m.loader = new createjs.LoadQueue(false, "img/");

    //  読み込み終了時にrender()を走らせる
    this.m.loader.addEventListener("complete", this.render.bind(this));
    this.m.loader.loadManifest(manifest, true);
};

//  配列で盤の情報を管理
Board.prototype.initPosition = function (line_up_) {

    let array = [];
    //  すべての盤の場所の初期化
    for (let x = 0; x < 9; x++) {
        array[x] = [];
        for (let y = 0; y < 9; y++) {
            array[x][y] = {
                type: 0, //  どの駒が置かれているか(0は空)
                owner: '', //  持ち主は'sente', 'gote'のどちらか(手前側が)
                style: '', //  駒に色など装飾をつけるか
                accesible: false //  その場所に移動することができるか
            };
        }
    }

    //  初期配置
    //  todo: array[x][y].ownerを反映させる
    if (line_up_) {
        //  歩
        for (let i = 0; i < 9; i++) {
            array[i][2].type = 16;
            array[i][6].type = 1;
        }
        //  1段目、9段目
        for (let i = 0, j = 3, k = 18; i < 4; i++) {
            array[i][8].type = j;
            array[8 - i][8].type = j;
            j += 2;

            array[i][0].type = k;
            array[8 - i][0].type = k;
            k += 2;
        }
        //  飛車・角・玉
        array[1][1].type = 25;
        array[7][1].type = 27;
        array[4][0].type = 29;

        array[7][7].type = 10;
        array[1][7].type = 12;
        array[4][8].type = 14;
    }
    return array;
};

//  描画全般
//  todo: render.jsを作る
Board.prototype.render = function () {

    //  dom_boardの中身を空にする
    while (this.dom.board.firstChild) {
        this.dom.board.removeChild(this.dom.board.firstChild);
    }

    //  将棋盤の描画
    let tmp_board = new DocumentFragment();
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {

            let piece; //  駒のオブジェクト(画像)
            let piece_owner; //  駒の持ち主
            let piece_type; //  駒の種類(1から15まで)

            //  スタイルが付与されているかどうか
            const style = this.stat.position[x][y].style ? true : false;

            //  駒の中身がない場合空のdivオブジェクトを作る
            if (!this.stat.position[x][y].type) piece = document.createElement('div');

            //  駒が存在しないとき
            if (!this.stat.position[x][y].type) {
                piece_owner = 'empty';
            }
            //  駒が先手のとき
            else if (this.stat.position[x][y].type < 15) {
                    piece_owner = 'sente';
                    piece_type = String(this.stat.position[x][y].type);
                }
                //  駒が後手のとき
                else if (this.stat.position[x][y].type > 15) {
                        piece_owner = 'gote';
                        piece_type = String(this.stat.position[x][y].type - 15);
                    }

            //  駒の画像ノードを作成する
            piece = piece || this.m.loader.getResult(piece_type).cloneNode(false);
            piece.style.top = this.m.PIECE_HEIGHT * y + 'px';
            piece.style.left = this.m.PIECE_WIDTH * x + 'px';
            piece.classList.add('koma', piece_owner);
            if (style) {
                piece.classList.add(this.stat.position[x][y].style);
                this.stat.position[x][y].style = '';
            }

            //  クリック時のイベントを設定
            piece.addEventListener('click', event => {
                let piece_info = {
                    x: x,
                    y: y,
                    type: this.stat.position[x][y].type,
                    owner: piece_owner
                };
                this.run(event, piece_info);
            });

            //  挿入
            tmp_board.appendChild(piece);
        }
    }
    //  全て終わった後に一括で仮domからdomに反映させる
    this.dom.board.appendChild(tmp_board);

    //  駒台の描画

    //  先手の駒台
    while (this.dom.piecestand_sente.firstChild) {
        this.dom.piecestand_sente.removeChild(this.dom.piecestand_sente.firstChild);
    }

    if (this.stat.piecestand_sente.length) {
        let tmp_piecestand_sente = new DocumentFragment();

        for (let index in this.stat.piecestand_sente) {

            //  駒の画像ノードを作成
            const piece_type = String(this.stat.piecestand_sente[index].type);
            let piece = this.m.loader.getResult(piece_type).cloneNode(false);

            piece.classList.add('koma', 'sente');
            if (this.stat.piecestand_sente[index].style) piece.classList.add(this.stat.piecestand_sente[index].style);

            //  駒台の乗せる際の位置調整(駒台にちゃんと乗っかるように)
            let left = 0,
                top = 0;
            if (index < 3) {
                left = this.m.PIECE_WIDTH * index;
            } else if (index < 6) {
                left = this.m.PIECE_WIDTH * (index - 3);
                top = this.m.PIECE_HEIGHT * 1;
            } else {
                left = this.m.PIECE_WIDTH * (index - 6);
                top = this.m.PIECE_HEIGHT * 2;
            }
            piece.style.left = left + 'px';
            piece.style.top = top + 'px';

            //  クリック時のイベントを作成
            piece.addEventListener('click', () => {
                let piece_info = {
                    type: this.stat.piecestand_sente[index],
                    owner: 'sente',
                    index: index
                };
                this.pickFromPieceStand(event, piece_info);
            });
            //  仮domに駒を追加
            tmp_piecestand_sente.appendChild(piece);
        }
        //  全て終わった後に一括で仮domからdomに反映させる
        this.dom.piecestand_sente.appendChild(tmp_piecestand_sente);
    }

    //  後手の駒台
    while (this.dom.piecestand_gote.firstChild) {
        this.dom.piecestand_gote.removeChild(this.dom.piecestand_gote.firstChild);
    }

    if (this.stat.piecestand_gote.length) {
        let tmp_piecestand_gote = new DocumentFragment();

        for (let index in this.stat.piecestand_gote) {
            //  後手なので全ての駒が15されているのを補正
            //  todo: +15されているのは変なので構成を変える

            const piece_type = String(this.stat.piecestand_gote[index].type - 15);
            //  駒の画像のノードを作成
            let piece = this.m.loader.getResult(piece_type).cloneNode(false);
            piece.classList.add('koma', 'gote');
            if (this.stat.piecestand_gote[index].style) piece.classList.add(this.stat.piecestand_gote[index].style);

            //  駒台の乗せる際の位置調整(駒台にちゃんと乗っかるように)
            let left = 0,
                top = 0;
            if (index < 3) {
                left = this.m.PIECE_WIDTH * index;
            } else if (index < 6) {
                left = this.m.PIECE_WIDTH * (index - 3);
                top = this.m.PIECE_HEIGHT;
            } else {
                left = this.m.PIECE_WIDTH * (index - 6);
                top = this.m.PIECE_HEIGHT * 2;
            }
            piece.style.left = left + 'px';
            piece.style.top = top + 'px';

            //  クリック時のイベントを作成
            piece.addEventListener('click', () => {
                const piece_info = {
                    type: this.stat.piecestand_gote[index],
                    owner: 'gote',
                    index: index
                };
                this.pickFromPieceStand(event, piece_info);
            });
            //  仮domに駒を追加
            tmp_piecestand_gote.appendChild(piece);
        }
        //  全て終わった後に一括で仮domからdomに反映させる
        this.dom.piecestand_gote.appendChild(tmp_piecestand_gote);
    }
};

//  盤上のマスのタッチイベント
//  todo: switchで分岐させて別のjsファイルに飛ばしたい
//  todo: piece_obj -> piece
Board.prototype.run = function (e_, piece_) {

    // argument
    // let piece_obj = {
    //     x: x,
    //     y: y,
    //     type: this.stat.position[x][y],
    //     owner: piece_owner
    // };

    //  移動先
    const destination = this.stat.position[piece_.x][piece_.y];

    //  駒が選択されていない状態なら
    if (!this.stat.phase_select) {

        //  自分の駒のみ選択可
        if (piece_.owner !== this.stat.turn) return;

        //  駒の状態を記録
        this.stat.picked = piece_;

        //  選択された駒のスタイルを変更
        destination.style = 'red';

        //  進むことのできる場所のスタイルを変更する(rule.js)
        const accesible = rule.listAccesible(this.stat.position, piece_);
        accesible.forEach(value_ => {
            this.stat.position[value_[0]][value_[1]].style = 'orange';
            this.stat.position[value_[0]][value_[1]].accesible = true;
        });
    }
    //  駒が選択された状態
    else {

            //  移動可能な場所のみ選択可
            if (!destination.accesible) {
                this.stat.phase_select = false;
                this.render();
                return;
            }

            //  進んだ先に駒がある場合は駒台へ
            if (destination.type) this.bringPieceStand(piece_);

            //  駒を移動
            destination.type = this.stat.picked.type;

            //  持ち駒を利用しているなら、持ち駒から駒を削除する
            if (this.stat.phase_captured) {
                const piece_stand = this.stat.turn === 'sente' ? this.stat.piecestand_sente : this.stat.piecestand_gote;
                for (let index in piece_stand) {
                    if (piece_stand[index] === this.stat.picked.type) {
                        piece_stand.splice(index, 1);
                        break;
                    }
                }
                this.stat.phase_captured = false;
            }
            //  駒が移動しているなら、駒が元々いた場所を初期化する
            else {
                    const departure = this.stat.position[this.stat.picked.x][this.stat.picked.y];
                    departure.type = 0;
                    departure.style = "";
                    departure.accesible = false;
                }

            //  先手・後手の入れ替え
            this.dom.txt_gote.classList.toggle('half_transparent');
            this.dom.txt_sente.classList.toggle('half_transparent');
            this.stat.turn = this.stat.turn === 'sente' ? 'gote' : 'sente';
        }

    //  盤の状態の更新
    this.render();

    this.stat.phase_select = !this.stat.phase_select;
};

//  駒台のタッチイベント
Board.prototype.bringPieceStand = function (piece_) {

    //  argument
    // let piece_ = {
    //     x: x,
    //     y: y,
    //     type: [x][y],
    //     owner: piece_owner
    // };

    //  成り駒であれば戻す
    //  todo: マジックナンバを減らす
    const promotion_list = [2, 4, 6, 8, 11, 13, 17, 19, 21, 23, 26, 28];
    for (let a in promotion_list) {
        if (piece_.type === promotion_list[a]) {
            piece_type--;
            break;
        }
    }

    //  駒台に追加、整理
    if (piece_.owner === 'sente') {
        this.stat.piecestand_gote.push({
            type: piece_.type + 15,
            style: ''
        });
        this.stat.piecestand_gote.sort((x, y) => {
            return x - y;
        });
    } else {
        this.stat.piecestand_sente.push({
            type: piece_.type - 15,
            style: ''
        });
        this.stat.piecestand_sente.sort((x, y) => {
            return x - y;
        });
    }
};

//  持ち駒を盤に打つ時
//  todo: 駒台の駒をクリックしたあとのキャンセルが難しい
Board.prototype.pickFromPieceStand = function (e_, piece_) {

    /*
    let piece_args = {
        type: this.stat.piecestand_sente[index],
        owner: 'sente',
        index: index
    };
    */

    //  すでに選択状態なら選択不可
    if (this.stat.phase_select) return;

    //  todo: すでに持ち駒を選択しているなら選択解除
    // if (this.stat.phase_captured) {
    //     this.stat.phase_captured = false;
    //     return;
    // }

    //  自分の持ち駒のみ選択可
    if (piece_.owner !== this.stat.turn) return;

    //  持ち駒の種類を記録
    this.stat.picked = piece_;

    //  piecestandをオブジェクト形式で
    let piecestand = owner === 'sente' ? this.stat.piecestand_sente : this.stat.piecestand_gote;
    piecestand[piecestand.index] = {
        type: piece_.type,
        style: 'red'
    };

    //  選択状態へ移行
    this.stat.phase_select = true;
    //  持ち駒の選択状態に移行
    this.stat.phase_captured = true;
    //  todo: stat.phase_select か stat.phase_captured のどちらかだけで良い
};

const Game = new Board();

},{"./rule":2}],2:[function(require,module,exports){

//  指定された駒の情報、全体の駒の位置をもとに進める場所を配列として返す。
exports.listAccesible = function (pos_, piece_obj_) {

    /*
    argument
    let piece_obj = {
        x: x,
        y: y,
        type: pos_[x][y],
        owner: koma_owner
    };
    */

    /*
     return
     let result = [
        [2,3],
        [3,4]
    ];
     */

    // 歩なら一つ前の場所
    let result = [];

    //  簡略化
    const x = piece_obj_.x;
    const y = piece_obj_.y;

    //  駒の種類を取得
    const sente = piece_obj_.owner === 'sente';
    const type = sente ? piece_obj_.type : piece_obj_.type - 15;

    //  向き
    let stright = sente ? [x, y - 1] : [x, y + 1];
    let back = sente ? [x, y + 1] : [x, y - 1];
    let right = sente ? [x + 1, y] : [x - 1, y];
    let left = sente ? [x - 1, y] : [x + 1, y];
    let upper_right = sente ? [x + 1, y - 1] : [x - 1, y + 1];
    let upper_left = sente ? [x - 1, y - 1] : [x + 1, y + 1];
    let down_right = sente ? [x + 1, y + 1] : [x - 1, y - 1];
    let down_left = sente ? [x - 1, y + 1] : [x + 1, y + 1];
    //  桂馬
    let kei_right = sente ? [x + 1, y - 2] : [x - 1, y + 2];
    let kei_left = sente ? [x - 1, y - 2] : [x + 1, y + 2];

    //  前と縦
    let forward = [];
    let vertical = [];
    for (let i = y - 1; i >= 0; i--) {
        if (sente) forward.push([x, i]);
        vertical.push([x, i]);
        if (pos_[x][i].type !== 0) break;
    }
    for (let i = y + 1; i < 9; i++) {
        if (!sente) forward.push([x, i]);
        vertical.push([x, i]);
        if (pos_[x][i].type !== 0) break;
    }

    //  横
    let horizonal = [];
    for (let i = x + 1; i < 9; i++) {
        horizonal.push([i, y]);
        if (pos_[i][y].type !== 0) break;
    }
    for (let i = x - 1; i >= 0; i--) {
        horizonal.push([i, y]);
        if (pos_[i][y].type !== 0) break;
    }

    //  斜め
    let slant = [];
    // 右下
    for (let i = x, a = 1; i < 8; i++) {
        slant.push([x + a, y + a]);
        if (pos_[x + a][y + a] === undefined || pos_[x + a][y + a].type !== 0) break;
        a++;
    }
    // 左上
    for (let i = x, a = 1; i > 0; i--) {
        if (x - a < 0) break;
        slant.push([x - a, y - a]);
        if (pos_[x - a][y - a] === undefined || pos_[x - a][y - a].type !== 0) {
            break;
        }
        a++;
    }
    // 右上
    for (let i = x, a = 1; i < 8; i++) {
        slant.push([x + a, y - a]);
        if (pos_[x + a][y - a] === undefined || pos_[x + a][y - a].type !== 0) break;
        a++;
    }
    // 右下
    for (let i = x, a = 1; i > 0; i--) {
        if (x - a < 0) break;
        slant.push([x - a, y + a]);
        if (pos_[x - a][y + a] === undefined || pos_[x - a][y + a].type !== 0) break;
        a++;
    }

    /*
    {"id": "1", src: "fu.png"},
    {"id": "2", src: "to.png"},
    {"id": "3", src: "kyo.png"},
    {"id": "4", src: "nkyo.png"},
    {"id": "5", src: "kei.png"},
    {"id": "6", src: "nkei.png"},
    {"id": "7", src: "gin.png"},
    {"id": "8", src: "ngin.png"},
    {"id": "9", src: "kin.png"},
    {"id": "10", src: "hi.png"},
    {"id": "11", src: "ryu.png"},
    {"id": "12", src: "kaku.png"},
    {"id": "13", src: "uma.png"},
    {"id": "14", src: "ou.png"}
    */

    //  todo: 角・馬追加
    switch (type) {
        //  歩
        case 1:
            result.push(stright);
            break;
        //  金、金と同じ動きの成り駒
        case 2:
        case 4:
        case 6:
        case 8:
        case 9:
            result.push(stright);
            result.push(right);
            result.push(left);
            result.push(upper_right);
            result.push(upper_left);
            result.push(back);
            break;
        //  香車
        case 3:
            forward.forEach(function (value_) {
                result.push(value_);
            });
            break;
        //  桂馬
        case 5:
            result.push(kei_right);
            result.push(kei_left);
            break;
        //  銀
        case 7:
            result.push(stright);
            result.push(upper_right);
            result.push(upper_left);
            result.push(down_right);
            result.push(down_left);
            break;
        //  飛車
        case 10:
            vertical.forEach(value_ => {
                result.push(value_);
            });
            horizonal.forEach(value_ => {
                result.push(value_);
            });
            break;
        //  龍
        case 11:
            vertical.forEach(value_ => {
                result.push(value_);
            });
            horizonal.forEach(value_ => {
                result.push(value_);
            });
            result.push(upper_right);
            result.push(upper_left);
            result.push(down_right);
            result.push(down_left);
            break;
        //  角
        case 12:
            slant.forEach(value_ => {
                result.push(value_);
            });
            break;
        //  馬
        case 13:
            slant.forEach(value_ => {
                result.push(value_);
            });
            result.push(stright);
            result.push(right);
            result.push(left);
            result.push(back);
            break;
        //  玉
        case 14:
            result.push(stright);
            result.push(right);
            result.push(left);
            result.push(upper_right);
            result.push(upper_left);
            result.push(down_right);
            result.push(down_left);
            result.push(back);
            break;
    }

    //  盤上でない場所、味方の駒がいる場所は除外
    result = result.filter(elm_ => {
        const is_undefined = pos_[elm_[0]][elm_[1]] === undefined;
        if (is_undefined) return false;

        const empty = pos_[elm_[0]][elm_[1]].type === 0;
        const enemy = sente ? 14 < pos_[elm_[0]][elm_[1]].type : pos_[elm_[0]][elm_[1]].type <= 14;
        if (!(empty || enemy)) return false;

        return true;
    });

    return result;
};

//  todo: 完成させる
exports.forPieceStand = function (pos_, picked_obj_) {

    /*
    argument
    let piece_obj = {
        type: pos_[x][y],
        owner: koma_owner
    };
    */

    console.log("this is rule for piecestand");
};

},{}]},{},[1]);