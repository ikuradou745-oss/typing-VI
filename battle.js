// このスクリプトにはバトルの事を書いてください（このコメントは消さないでね）

/**
 * タイピング出題データ
 * 8~15文字の単語を10個用意[cite: 1]
 */
const TYPING_WORDS = [
    { text: "タイピングゲーム", roma: "TAIPINGUGE-MU" },     // 13文字
    { text: "バトルスライム", roma: "BATORUSURAIMU" },       // 13文字
    { text: "にゃんこだいせんそう", roma: "NYANKODAISENSOU" }, // 15文字
    { text: "プログラミング", roma: "PUROGURAMINGU" },       // 13文字
    { text: "ジャバスクリプト", roma: "JABASUKURIPTO" },       // 13文字
    { text: "タワーディフェンス", roma: "TOWA-DIFENSU" },      // 12文字
    { text: "スライムしょうかん", roma: "SURAIMUSHOUKAN" },    // 14文字
    { text: "ゲームかいはつ", roma: "GE-MUKAIHATSU" },       // 13文字
    { text: "むてっぽうな", roma: "MUTETSUPOUNA" },          // 12文字
    { text: "ちょうしんせいきゅう", roma: "CHOUSHINSEIKYU" }   // 14文字
];

/**
 * フィールド上のキャラクター
 */
class BattleEntity {
    constructor(baseData, isPlayer) {
        this.id = Math.random().toString(36).substring(7);
        this.baseData = baseData;
        this.isPlayer = isPlayer;
        this.hp = baseData.hp;
        this.maxHp = baseData.hp;
        this.attack = baseData.attack;
        this.range = baseData.range || 50;
        
        // プレイヤーは右(1000)から左へ、敵は左(0)から右へ
        this.x = isPlayer ? 1000 : 0;
        this.speed = 1.5;
        this.lastAttackTime = 0;
        this.attackInterval = 1500; // 攻撃間隔は固定1.5秒

        // DOM生成
        this.element = document.createElement('div');
        this.element.className = `battle-entity ${isPlayer ? 'player' : 'enemy'}`;
        this.element.style.backgroundImage = `url('${baseData.image}')`;
        document.getElementById('battle-field').appendChild(this.element);
        this.updateDOM();
    }

    updateDOM() {
        this.element.style.left = `${this.x}px`;
    }

    remove() {
        if(this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

/**
 * バトル全体を管理するマネージャー
 */
const BattleManager = {
    isRunning: false,
    money: 0,
    playerBaseHp: 300,
    enemyBaseHp: 300,
    entities: [],
    
    // タイピング状態
    currentWordIndex: 0,
    currentRomaIndex: 0,
    
    // 敵スポーンタイマー
    enemySpawnTimer: 0,
    enemyFirstSpawnDone: false,

    // UIコントローラー
    moneyDisplay: null,
    cooldowns: {}, // { slimeId: remainingTime }
    
    lastFrameTime: 0,
    animationFrameId: null,

    init() {
        this.moneyDisplay = new MoneyDisplayController('money-display');
        window.addEventListener('keydown', this.handleTyping.bind(this));
    },

    startBattle() {
        this.isRunning = true;
        this.money = 0;
        this.playerBaseHp = 300;
        this.enemyBaseHp = 300;
        this.entities.forEach(e => e.remove());
        this.entities = [];
        this.cooldowns = {};
        this.enemySpawnTimer = 0;
        this.enemyFirstSpawnDone = false;
        
        // UI初期化
        this.moneyDisplay.update(this.money);
        this.updateBaseHpUI();
        this.renderSummonButtons();
        
        // タイピング初期化
        this.currentWordIndex = Math.floor(Math.random() * TYPING_WORDS.length);
        this.currentRomaIndex = 0;
        this.updateTypingUI();

        // ループ開始
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    },

    stopBattle(isWin) {
        this.isRunning = false;
        cancelAnimationFrame(this.animationFrameId);
        
        const overlay = document.getElementById('battle-result-overlay');
        const textEl = document.getElementById('battle-result-text');
        overlay.classList.remove('hidden');
        if(isWin) {
            textEl.textContent = "VICTORY!";
            textEl.className = "result-text rbx-text result-win";
        } else {
            textEl.textContent = "DEFEAT...";
            textEl.className = "result-text rbx-text result-lose";
        }
    },

    // --- タイピング処理 ---
    handleTyping(e) {
        if(!this.isRunning) return;
        const key = e.key.toUpperCase();
        const wordData = TYPING_WORDS[this.currentWordIndex];
        
        if (key === wordData.roma[this.currentRomaIndex]) {
            this.currentRomaIndex++;
            this.updateTypingUI();
            
            // 単語クリア判定
            if (this.currentRomaIndex >= wordData.roma.length) {
                this.addMoney(20); // 打ち終わったら20円ゲット[cite: 1]
                this.currentWordIndex = (this.currentWordIndex + 1) % TYPING_WORDS.length;
                this.currentRomaIndex = 0;
                this.updateTypingUI();
            }
        }
    },

    updateTypingUI() {
        const wordData = TYPING_WORDS[this.currentWordIndex];
        document.getElementById('typing-text-jp').textContent = wordData.text;
        
        const romaContainer = document.getElementById('typing-text-roma');
        romaContainer.innerHTML = '';
        for(let i=0; i<wordData.roma.length; i++) {
            const span = document.createElement('span');
            span.textContent = wordData.roma[i];
            if(i < this.currentRomaIndex) span.className = 'typing-typed';
            romaContainer.appendChild(span);
        }
    },

    // --- お金処理 ---
    addMoney(amount) {
        this.money += amount;
        this.moneyDisplay.update(this.money);
        this.updateSummonButtonsState();
    },

    // --- UI更新 ---
    updateBaseHpUI() {
        document.getElementById('player-hp-text').textContent = `${Math.ceil(this.playerBaseHp)} / 300`;
        document.getElementById('player-hp-fill').style.width = `${Math.max(0, (this.playerBaseHp/300)*100)}%`;
        
        document.getElementById('enemy-hp-text').textContent = `${Math.ceil(this.enemyBaseHp)} / 300`;
        document.getElementById('enemy-hp-fill').style.width = `${Math.max(0, (this.enemyBaseHp/300)*100)}%`;
    },

    renderSummonButtons() {
        const container = document.getElementById('summon-slots-container');
        container.innerHTML = '';
        const equipped = PlayerDataManager.getEquippedSlimes();
        
        for(let i = 0; i < 8; i++) {
            const btn = document.createElement('div');
            btn.className = 'summon-btn';
            
            if (i < equipped.length) {
                const slime = equipped[i];
                btn.id = `summon-btn-${slime.id}`;
                btn.innerHTML = `
                    <img src="${slime.image}" class="summon-img">
                    <div class="summon-cost">${slime.cost}円</div>
                    <div id="cooldown-overlay-${slime.id}" class="cooldown-overlay"></div>
                `;
                btn.addEventListener('click', () => this.trySummonPlayer(slime));
            } else {
                btn.classList.add('disabled');
                btn.innerHTML = `<div style="margin:auto; color:#666;">EMPTY</div>`;
            }
            container.appendChild(btn);
        }
        this.updateSummonButtonsState();
    },

    updateSummonButtonsState() {
        if(!this.isRunning) return;
        const equipped = PlayerDataManager.getEquippedSlimes();
        equipped.forEach(slime => {
            const btn = document.getElementById(`summon-btn-${slime.id}`);
            if(!btn) return;
            
            // お金不足またはクールダウン中なら無効化風表示
            if (this.money < slime.cost || this.cooldowns[slime.id] > 0) {
                btn.style.filter = 'brightness(0.5)';
            } else {
                btn.style.filter = 'brightness(1)';
            }
        });
    },

    // --- 召喚処理 ---
    trySummonPlayer(slimeData) {
        if (!this.isRunning) return;
        if (this.cooldowns[slimeData.id] > 0) return;
        if (this.money < slimeData.cost) return;

        this.addMoney(-slimeData.cost);
        this.cooldowns[slimeData.id] = slimeData.cooldown; // 準備タイム発生[cite: 1]
        
        const entity = new BattleEntity(slimeData, true);
        this.entities.push(entity);
        this.updateSummonButtonsState();
    },

    spawnEnemy() {
        // 最初は初期スライム
        const enemyData = MASTER_SLIMES.find(s => s.id === 'slime_green');
        if(enemyData) {
            const entity = new BattleEntity(enemyData, false);
            this.entities.push(entity);
        }
    },

    // --- メインループ ---
    gameLoop(timestamp) {
        if(!this.isRunning) return;
        const dt = (timestamp - this.lastFrameTime) / 1000; // 秒
        this.lastFrameTime = timestamp;

        // 1. クールダウン更新
        let cdUpdated = false;
        for (const id in this.cooldowns) {
            if (this.cooldowns[id] > 0) {
                this.cooldowns[id] -= dt;
                if (this.cooldowns[id] <= 0) this.cooldowns[id] = 0;
                cdUpdated = true;
                
                const overlay = document.getElementById(`cooldown-overlay-${id}`);
                const data = PlayerDataManager.getEquippedSlimes().find(s => s.id === id);
                if (overlay && data) {
                    const ratio = this.cooldowns[id] / data.cooldown;
                    overlay.style.height = `${ratio * 100}%`;
                }
            }
        }
        if(cdUpdated) this.updateSummonButtonsState();

        // 2. 敵の自動スポーン (最初5秒、その後15秒ごと)[cite: 1]
        this.enemySpawnTimer += dt;
        if (!this.enemyFirstSpawnDone) {
            if (this.enemySpawnTimer >= 5) {
                this.spawnEnemy();
                this.enemyFirstSpawnDone = true;
                this.enemySpawnTimer = 0;
            }
        } else {
            if (this.enemySpawnTimer >= 15) {
                this.spawnEnemy();
                this.enemySpawnTimer = 0;
            }
        }

        // 3. キャラクターの移動・攻撃処理
        const now = timestamp;
        this.entities.forEach(entity => {
            let target = null;
            let targetDist = Infinity;

            // ターゲット検索
            if (entity.isPlayer) {
                // 左へ進む。一番右(xが大きい)にいる敵を探す
                this.entities.forEach(e => {
                    if (!e.isPlayer && e.x < entity.x) {
                        const dist = entity.x - e.x;
                        if (dist < targetDist) { targetDist = dist; target = e; }
                    }
                });
                // 敵が射程内にいない場合、敵基地がターゲット
                if (!target && entity.x <= entity.range + 100) { // 基地幅考慮
                    targetDist = entity.x;
                    target = 'enemyBase';
                }
            } else {
                // 右へ進む。一番左(xが小さい)にいる味方を探す
                this.entities.forEach(e => {
                    if (e.isPlayer && e.x > entity.x) {
                        const dist = e.x - entity.x;
                        if (dist < targetDist) { targetDist = dist; target = e; }
                    }
                });
                // 味方が射程内にいない場合、味方基地がターゲット
                if (!target && (1000 - entity.x) <= entity.range + 100) {
                    targetDist = 1000 - entity.x;
                    target = 'playerBase';
                }
            }

            // 行動決定
            if (targetDist <= entity.range) {
                // 攻撃範囲内 -> 攻撃
                if (now - entity.lastAttackTime > entity.attackInterval) {
                    entity.lastAttackTime = now;
                    if (target === 'enemyBase') {
                        this.enemyBaseHp -= entity.attack;
                        this.updateBaseHpUI();
                    } else if (target === 'playerBase') {
                        this.playerBaseHp -= entity.attack;
                        this.updateBaseHpUI();
                    } else if (target) {
                        target.hp -= entity.attack;
                    }
                }
            } else {
                // 移動
                if (entity.isPlayer) entity.x -= entity.speed;
                else entity.x += entity.speed;
                entity.updateDOM();
            }
        });

        // 4. 死亡判定と報酬
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];
            if (e.hp <= 0) {
                if (!e.isPlayer) {
                    // 敵を倒したらコスト/2のお金[cite: 1]
                    this.addMoney(Math.floor(e.baseData.cost / 2));
                }
                e.remove();
                this.entities.splice(i, 1);
            }
        }

        // 5. 勝敗判定
        if (this.playerBaseHp <= 0) {
            this.stopBattle(false);
            return;
        }
        if (this.enemyBaseHp <= 0) {
            this.stopBattle(true);
            return;
        }

        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
};

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    BattleManager.init();
});
