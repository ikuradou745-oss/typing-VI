// ============================================================================
// システム管理クラス群 (メモリ維持対象)
// ============================================================================

class GameDataManager {
    constructor() {
        this.playerName = localStorage.getItem('playerName') || null;
        // 初期データとしてスライム、オレンジスライム、グリーンスライムを所持し、スライムを装備にセット
        this.ownedSlimes = ["slime_01", "slime_02", "slime_03"];
        this.equippedSlimes = ["slime_01"]; 
    }

    savePlayerName(name) {
        this.playerName = name;
        localStorage.setItem('playerName', name);
    }

    getPlayerName() {
        return this.playerName;
    }
}

class BrainrotCollectionService {
    constructor() {
        this.collectionData = [];
    }
    logCollection(item) {
        console.log(`[BrainrotCollectionService] Collected: ${item}`);
    }
}

class BrainrotCarryService {
    constructor() {
        this.carryStatus = false;
    }
    updateCarryStatus(status) {
        this.carryStatus = status;
        console.log(`[BrainrotCarryService] Status updated to: ${status}`);
    }
}

class MoneyDisplayController {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.currentMoney = 0;
    }
    updateDisplay() {
        if (this.element) {
            this.element.textContent = `所持金 ${this.currentMoney}円`;
        }
    }
}

// ============================================================================
// キャラクターデータ
// メモ: キャラクター画像の入手・参照方法は 「gazou/（キャラの名前）.png」 となります。
// ============================================================================

const characterDatabase = [
    {
        id: "slime_01",
        name: "スライム",
        rarity: "コモン",
        hp: 10,
        attack: 1,
        ability: "一回だけ死んでもHPを半分にして復活する",
        image: "gazou/スライム.png"
    },
    {
        id: "slime_02",
        name: "オレンジスライム",
        rarity: "コモン",
        hp: 7,
        attack: 1,
        ability: "3回目の攻撃は攻撃力3倍（最大30までアップ可能）",
        image: "gazou/オレンジスライム.png"
    },
    {
        id: "slime_03",
        name: "グリーンスライム",
        rarity: "アンコモン",
        hp: 10,
        attack: 1,
        ability: "相手を3ターン毒状態にする（毒状態になると毎ターン1ダメージ喰らいます。）",
        image: "gazou/グリーンスライム.png"
    }
];

// レアリティ定義
const rarityRank = {
    "コモン": 1,
    "アンコモン": 2
};

// ============================================================================
// メインゲームロジック・UI制御
// ============================================================================

const gameData = new GameDataManager();
const collectionService = new BrainrotCollectionService();
const carryService = new BrainrotCarryService();
const moneyController = new MoneyDisplayController('money-display');

document.addEventListener('DOMContentLoaded', () => {
    // ---- 画面要素の取得 ----
    const screenNameInput = document.getElementById('screen-name-input');
    const screenHome = document.getElementById('screen-home');
    const screenPlay = document.getElementById('screen-play');
    const screenEquip = document.getElementById('screen-equip');
    const screenBattle = document.getElementById('screen-battle');
    const matchmakingOverlay = document.getElementById('matchmaking-overlay');
    
    // ---- UI要素の取得 ----
    const inputName = document.getElementById('player-name-input');
    const btnDecideName = document.getElementById('btn-decide-name');
    const displayPlayerName = document.getElementById('display-player-name');
    
    const btnSettings = document.getElementById('btn-settings');
    const btnPlay = document.getElementById('btn-play');
    const btnShop = document.getElementById('btn-shop');
    const btnEquip = document.getElementById('btn-equip');
    const btnCloseEquip = document.getElementById('btn-close-equip');

    // プレイモード画面のボタン
    const btnClosePlay = document.getElementById('btn-close-play');
    const btnVsMode = document.getElementById('btn-vs-mode');
    const btnStoryMode = document.getElementById('btn-story-mode');

    // バトル画面要素
    const btnLeaveBattle = document.getElementById('btn-leave-battle');
    const battleEnemyTeam = document.getElementById('battle-enemy-team');
    const battlePlayerTeam = document.getElementById('battle-player-team');

    // 装備画面用
    const searchSlimeInput = document.getElementById('search-slime');
    const equippedList = document.getElementById('equipped-list');
    const ownedList = document.getElementById('owned-list');

    // モーダル関連（設定）
    const modalSettings = document.getElementById('modal-settings');
    const settingsNameInput = document.getElementById('settings-name-input');
    const btnUpdateName = document.getElementById('btn-update-name');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    // モーダル関連（キャラ詳細）
    const modalCharaDetail = document.getElementById('modal-chara-detail');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    const detailName = document.getElementById('detail-name');
    const detailRarity = document.getElementById('detail-rarity');
    const detailImage = document.getElementById('detail-image');
    const detailHp = document.getElementById('detail-hp');
    const detailAttack = document.getElementById('detail-attack');
    const detailAbility = document.getElementById('detail-ability');

    // モーダル関連（汎用メッセージ）
    const modalMessage = document.getElementById('modal-message');
    const messageText = document.getElementById('message-text');
    const btnCloseMessage = document.getElementById('btn-close-message');

    // ========================================================================
    // 基本関数
    // ========================================================================

    function showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        screenElement.classList.add('active');
        screenElement.style.display = 'flex';
    }

    function showMessage(text) {
        messageText.innerHTML = text;
        modalMessage.classList.add('active');
    }

    btnCloseMessage.addEventListener('click', () => {
        modalMessage.classList.remove('active');
    });

    function initGame() {
        moneyController.updateDisplay();
        
        if (gameData.getPlayerName()) {
            displayPlayerName.textContent = gameData.getPlayerName();
            showScreen(screenHome);
        } else {
            showScreen(screenNameInput);
        }
    }

    // ========================================================================
    // 名前入力・設定ロジック
    // ========================================================================

    function validateAndSaveName(nameString, isInitialRegistration) {
        const trimmedName = nameString.trim();
        if (trimmedName.length >= 3 && trimmedName.length <= 12) {
            gameData.savePlayerName(trimmedName);
            displayPlayerName.textContent = trimmedName;
            
            if (isInitialRegistration) {
                showScreen(screenHome);
            }
            return true;
        } else {
            showMessage('名前は3文字以上、<br>12文字以下で入力してください。');
            return false;
        }
    }

    btnDecideName.addEventListener('click', () => {
        validateAndSaveName(inputName.value, true);
    });

    btnSettings.addEventListener('click', () => {
        settingsNameInput.value = gameData.getPlayerName() || "";
        modalSettings.classList.add('active');
    });

    btnCloseSettings.addEventListener('click', () => {
        modalSettings.classList.remove('active');
    });

    btnUpdateName.addEventListener('click', () => {
        const success = validateAndSaveName(settingsNameInput.value, false);
        if (success) {
            modalSettings.classList.remove('active');
            showMessage('名前を変更しました！');
        }
    });

    // ========================================================================
    // ホーム画面とプレイモードのロジック
    // ========================================================================

    btnPlay.addEventListener('click', () => {
        showScreen(screenPlay);
    });

    btnClosePlay.addEventListener('click', () => {
        showScreen(screenHome);
    });

    // ストーリーモードを押した時（開発中表示）
    btnStoryMode.addEventListener('click', () => {
        showMessage('ストーリーモードは<br>開発中です！');
    });

    btnShop.addEventListener('click', () => {
        showMessage('ショップは<br>準備中です！');
    });

    // ========================================================================
    // 対戦モード・マッチング＆バトル生成ロジック
    // ========================================================================

    btnVsMode.addEventListener('click', () => {
        if (gameData.equippedSlimes.length === 0) {
            showMessage('スライムを少なくとも1体<br>装備してください！');
            return;
        }

        // 暗転・マッチング演出 (フェードイン)
        matchmakingOverlay.classList.add('active');

        setTimeout(() => {
            // 敵チームと味方チームを構築
            setupBattleField();

            // 画面切り替え（暗転裏でセットアップ）
            showScreen(screenBattle);

            // 暗転解除 (フェードアウト)
            setTimeout(() => {
                matchmakingOverlay.classList.remove('active');
            }, 300);
        }, 800);
    });

    btnLeaveBattle.addEventListener('click', () => {
        showScreen(screenHome);
    });

    // 対戦相手および味方の生成処理
    function setupBattleField() {
        battlePlayerTeam.innerHTML = "";
        battleEnemyTeam.innerHTML = "";

        // 1. 味方（自分の装備スライム）を右側に配置
        const playerCharaObjects = gameData.equippedSlimes.map(id => characterDatabase.find(c => c.id === id)).filter(Boolean);
        
        playerCharaObjects.forEach(chara => {
            battlePlayerTeam.appendChild(createBattleUnitDOM(chara));
        });

        // 2. 自分の最高レアリティを測定
        let maxRank = 1;
        playerCharaObjects.forEach(chara => {
            const rank = rarityRank[chara.rarity] || 1;
            if (rank > maxRank) maxRank = rank;
        });

        // 3. 敵キャラを「自分の装備数」と同数生成（レアリティ考慮）
        const enemyCount = playerCharaObjects.length;

        for (let i = 0; i < enemyCount; i++) {
            let targetRarity = "コモン";
            
            if (maxRank === 1) {
                // 手持ちがコモンのみの場合、約33%でアンコモンの敵が出現
                if (Math.random() < 0.33) {
                    targetRarity = "アンコモン";
                } else {
                    targetRarity = "コモン";
                }
            } else {
                // すでにアンコモンを持っている場合、アンコモン中心（またはランダム）
                targetRarity = Math.random() < 0.7 ? "アンコモン" : "コモン";
            }

            // 指定レアリティのプールから敵を選択
            let pool = characterDatabase.filter(c => c.rarity === targetRarity);
            if (pool.length === 0) pool = characterDatabase; // 万が一該当がない場合フォールバック

            const selectedEnemy = pool[Math.floor(Math.random() * pool.length)];
            battleEnemyTeam.appendChild(createBattleUnitDOM(selectedEnemy));
        }
    }

    // バトル画面用のキャラユニットDOM作成
    function createBattleUnitDOM(chara) {
        const unitDiv = document.createElement('div');
        unitDiv.className = 'battle-chara-unit';

        const hpBar = document.createElement('div');
        hpBar.className = 'battle-hp-bar';
        const hpFill = document.createElement('div');
        hpFill.className = 'battle-hp-fill';
        hpBar.appendChild(hpFill);

        const img = document.createElement('img');
        img.src = chara.image;
        img.alt = chara.name;
        img.onerror = function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90"%3E%3Crect fill="%23ddd" width="90" height="90"/%3E%3Ctext fill="%23555" x="45" y="45" font-family="sans-serif" font-size="12" text-anchor="middle" dy="4"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        unitDiv.appendChild(hpBar);
        unitDiv.appendChild(img);

        return unitDiv;
    }

    // ========================================================================
    // 装備画面のロジック (最大4体)
    // ========================================================================

    btnEquip.addEventListener('click', () => {
        renderEquipScreen();
        showScreen(screenEquip);
    });

    btnCloseEquip.addEventListener('click', () => {
        showScreen(screenHome);
    });

    function renderEquipScreen(filterText = "") {
        equippedList.innerHTML = "";
        ownedList.innerHTML = "";

        // ★最大4キャラ分の装備スロットを描画（アップデート要件）
        const MAX_EQUIP = 4;
        for (let i = 0; i < MAX_EQUIP; i++) {
            const slotId = gameData.equippedSlimes[i];
            if (slotId) {
                const charaInfo = characterDatabase.find(c => c.id === slotId);
                equippedList.appendChild(createCharaCard(charaInfo, true, i));
            } else {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'chara-slot';
                emptySlot.textContent = '空き';
                equippedList.appendChild(emptySlot);
            }
        }

        // 持っているスライムの描画（検索フィルター対応）
        const filteredSlimes = characterDatabase.filter(chara => {
            const isOwned = gameData.ownedSlimes.includes(chara.id);
            const matchesSearch = chara.name.includes(filterText);
            return isOwned && matchesSearch;
        });

        filteredSlimes.forEach(chara => {
            ownedList.appendChild(createCharaCard(chara, false));
        });
    }

    // キャラクターカードDOM生成（レアリティ表示＆背景色切り替え）
    function createCharaCard(chara, isEquipped, slotIndex = null) {
        const card = document.createElement('div');
        card.className = `chara-card rarity-${chara.rarity}`;
        
        // レアリティバッジ
        const badge = document.createElement('div');
        badge.className = 'rarity-badge';
        badge.textContent = chara.rarity;
        card.appendChild(badge);

        const img = document.createElement('img');
        img.src = chara.image;
        img.alt = chara.name;
        img.onerror = function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 65 65"%3E%3Crect fill="%23ddd" width="65" height="65"/%3E%3Ctext fill="%23555" x="32.5" y="32.5" font-family="sans-serif" font-size="10" text-anchor="middle" dy="3"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chara-name';
        nameSpan.textContent = chara.name;

        card.appendChild(img);
        card.appendChild(nameSpan);

        // タップでキャラ詳細モーダルを開く
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            detailName.textContent = chara.name;
            detailRarity.textContent = chara.rarity;
            detailImage.src = chara.image;
            detailHp.textContent = chara.hp;
            detailAttack.textContent = chara.attack;
            detailAbility.textContent = chara.ability;
            modalCharaDetail.classList.add('active');
        });

        return card;
    }

    btnCloseDetail.addEventListener('click', () => {
        modalCharaDetail.classList.remove('active');
    });

    searchSlimeInput.addEventListener('input', (e) => {
        renderEquipScreen(e.target.value);
    });

    // ゲーム開始
    initGame();
});
