// このスクリプトにはキャラクターのデータ（HP、防御力、攻撃力、クールダウン、射程、能力などのステータス）を書こう（このコメントは消さないでね）

/**
 * キャラクター（スライム）データ構造クラス
 */
class SlimeData {
    constructor(id, name, hp, attack, defense, cooldown, range, ability, image, description) {
        this.id = id;
        this.name = name;
        this.hp = hp;               // HP
        this.attack = attack;       // 攻撃力
        this.defense = defense;     // 防御力
        this.cooldown = cooldown;   // クールダウン (秒)
        this.range = range;         // 射程
        this.ability = ability;     // 特殊能力
        this.image = image;         // 画像ファイルパス (例: gazou/スライム.png)
        this.description = description; // 説明文
    }
}

/**
 * ゲーム内に存在するすべてのスライムのマスターデータ
 */
const MASTER_SLIMES = [
    new SlimeData(
        'slime_green',
        'スライム',
        50,             // HP (初期50)
        15,             // 攻撃力 (初期15)
        0,              // 防御力 (基本0)
        2,              // クールダウン (2)
        '5（近距離）',    // 射程 (5)
        'なし',          // 能力 (なし、普通に相手を殴る)
        'gazou/スライム.png',
        '冒険者が最初に目にするノーマルスライム。普通に相手を殴る。'
    )
];

/**
 * プレイヤーデータおよび装備・検索管理モジュール
 */
const PlayerDataManager = {
    STORAGE_KEY: 'battle_slime_player_data_v1',

    // メモリ上のプレイヤーデータ
    data: {
        name: '',
        ownedSlimes: ['slime_green'],
        equippedSlimes: ['slime_green'] // 最大8体まで装備可能
    },

    /**
     * ローカルストレージからデータを読み込む
     */
    load() {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed && typeof parsed === 'object') {
                    this.data.name = parsed.name || '';
                    this.data.ownedSlimes = Array.isArray(parsed.ownedSlimes) ? parsed.ownedSlimes : ['slime_green'];
                    this.data.equippedSlimes = Array.isArray(parsed.equippedSlimes) ? parsed.equippedSlimes : ['slime_green'];
                }
            } catch (error) {
                console.error('プレイヤーデータの読み込みに失敗しました:', error);
            }
        }
        return this.data;
    },

    /**
     * ローカルストレージにデータを保存する
     */
    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    },

    /**
     * プレイヤーの名前を設定・保存する
     */
    setName(name) {
        this.data.name = name;
        this.save();
    },

    /**
     * プレイヤーの名前を取得する
     */
    getName() {
        return this.data.name;
    },

    /**
     * 名前が設定済み（初回登録完了）かどうかを判定する
     */
    hasName() {
        return Boolean(this.data.name && this.data.name.trim().length >= 3 && this.data.name.trim().length <= 12);
    },

    /**
     * 所持しているスライム一覧を取得する
     */
    getOwnedSlimes() {
        return MASTER_SLIMES.filter(slime => this.data.ownedSlimes.includes(slime.id));
    },

    /**
     * 装備しているスライム一覧を取得する
     */
    getEquippedSlimes() {
        return MASTER_SLIMES.filter(slime => this.data.equippedSlimes.includes(slime.id));
    },

    /**
     * 対象のスライムが装備中かどうかを判定する
     */
    isEquipped(slimeId) {
        return this.data.equippedSlimes.includes(slimeId);
    },

    /**
     * スライムの装備・装備解除を切り替える（最大8体制限）
     */
    toggleEquip(slimeId) {
        const index = this.data.equippedSlimes.indexOf(slimeId);
        if (index > -1) {
            // 装備解除チェック（最低1体は装備しておく必要あり）
            if (this.data.equippedSlimes.length <= 1) {
                return { success: false, message: 'スライムは最低1体装備する必要があります！' };
            }
            this.data.equippedSlimes.splice(index, 1);
        } else {
            // 装備追加チェック（最大8体）
            if (this.data.equippedSlimes.length >= 8) {
                return { success: false, message: 'スライムは最大8体までしか装備できません！' };
            }
            this.data.equippedSlimes.push(slimeId);
        }
        this.save();
        return { success: true };
    },

    /**
     * 所持スライムを名前で検索する
     */
    searchOwnedSlimes(keyword) {
        const ownedList = this.getOwnedSlimes();
        if (!keyword || keyword.trim() === '') {
            return ownedList;
        }
        const term = keyword.trim().toLowerCase();
        return ownedList.filter(slime => slime.name.toLowerCase().includes(term));
    }
};
