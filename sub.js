// <a id="Chara"></a>

/**
 * CharacterDatabase
 * キャラクターのマスターデータを一元管理する配列です。
 * ゲーム内で新キャラを追加する場合は、この配列にオブジェクトを追加します。
 */
const CharacterDatabase = [
    {
        id: "slime",
        name: "スライム",
        hp: 10,
        attack: 1,
        ability: "一回だけ死んでもHPを半分にして復活する",
        imagePath: "gazou/スライム.png"
    }
    // 将来的なキャラクター追加用のテンプレート:
    // {
    //     id: "goblin",
    //     name: "ゴブリン",
    //     hp: 20,
    //     attack: 3,
    //     ability: "攻撃力アップ",
    //     imagePath: "gazou/ゴブリン.png"
    // }
];
