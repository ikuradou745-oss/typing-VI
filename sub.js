// ============================================================================
// システム管理クラス群 (メモリ維持対象)
// ============================================================================

class GameDataManager {
    constructor() {
        this.playerName = localStorage.getItem('playerName') || null;
        // 初期データとしてスライムを所持し、装備している状態をセット
        this.ownedSlimes = ["slime_01"];
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
// ============================================================================

const characterDatabase = [
    {
        id: "slime_01",
        name: "スライム",
        hp: 10,
        attack: 1,
        ability: "一回だけ死んでもHPを半分にして復活する",
        image: "gazou/スライム.png"
    }
    // 今後新しいキャラを追加する場合はここに追記していきます
];

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
    const btnMainMode = document.getElementById('btn-main-mode');
    const btnSubMode = document.getElementById('btn-sub-mode');

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

    // 画面切り替え関数
    function showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');
    }

    // メッセージGUI表示関数（alertの代替）
    function showMessage(text) {
        messageText.innerHTML = text;
        modalMessage.classList.add('active');
    }

    btnCloseMessage.addEventListener('click', () => {
        modalMessage.classList.remove('active');
    });

    // 初期化処理
    function initGame() {
        moneyController.updateDisplay(); // 所持金表示を更新
        
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

    // 初回名前決定
    btnDecideName.addEventListener('click', () => {
        validateAndSaveName(inputName.value, true);
    });

    // 設定ボタンでGUIモーダルを開く
    btnSettings.addEventListener('click', () => {
        settingsNameInput.value = gameData.getPlayerName() || "";
        modalSettings.classList.add('active');
    });

    // 設定モーダルを閉じる
    btnCloseSettings.addEventListener('click', () => {
        modalSettings.classList.remove('active');
    });

    // モーダル内での名前更新
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

    // プレイ画面（全画面）を開く
    btnPlay.addEventListener('click', () => {
        showScreen(screenPlay);
    });

    // プレイ画面からホームに戻る
    btnClosePlay.addEventListener('click', () => {
        showScreen(screenHome);
    });

    btnMainMode.addEventListener('click', () => {
        showMessage('メインモードは<br>準備中です！');
    });

    btnSubMode.addEventListener('click', () => {
        showMessage('サブモードは<br>準備中です！');
    });

    btnShop.addEventListener('click', () => {
        showMessage('ショップは<br>準備中です！');
    });

    // ========================================================================
    // 装備画面のロジック
    // ========================================================================

    btnEquip.addEventListener('click', () => {
        renderEquipScreen();
        showScreen(screenEquip);
    });

    btnCloseEquip.addEventListener('click', () => {
        showScreen(screenHome);
    });

    // 装備画面のレンダリング
    function renderEquipScreen(filterText = "") {
        equippedList.innerHTML = "";
        ownedList.innerHTML = "";

        // 最大8キャラ分の装備スロットを描画
        const MAX_EQUIP = 8;
        for (let i = 0; i < MAX_EQUIP; i++) {
            const slotId = gameData.equippedSlimes[i];
            if (slotId) {
                const charaInfo = characterDatabase.find(c => c.id === slotId);
                equippedList.appendChild(createCharaCard(charaInfo, true));
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

    // キャラクターカードDOM生成
    function createCharaCard(chara, isEquipped) {
        const card = document.createElement('div');
        card.className = 'chara-card';
        
        const img = document.createElement('img');
        img.src = chara.image;
        img.alt = chara.name;
        // 画像がない場合のエラーハンドリング
        img.onerror = function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect fill="%23ddd" width="60" height="60"/%3E%3Ctext fill="%23555" x="30" y="30" font-family="sans-serif" font-size="10" text-anchor="middle" dy="3"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chara-name';
        nameSpan.textContent = chara.name;

        card.appendChild(img);
        card.appendChild(nameSpan);

        // クリックで詳細（GUIモーダル）を表示
        card.addEventListener('click', () => {
            detailName.textContent = chara.name;
            detailImage.src = chara.image;
            detailHp.textContent = chara.hp;
            detailAttack.textContent = chara.attack;
            detailAbility.textContent = chara.ability;
            modalCharaDetail.classList.add('active');
        });

        return card;
    }

    // 詳細モーダルを閉じる
    btnCloseDetail.addEventListener('click', () => {
        modalCharaDetail.classList.remove('active');
    });

    // 検索窓のリアルタイムフィルタリング
    searchSlimeInput.addEventListener('input', (e) => {
        renderEquipScreen(e.target.value);
    });

    // ゲーム開始
    initGame();
});
