/*
 * name-match.js の照合テスト。
 *   node tests/name-match.test.js
 *
 * 受付で拾えないと困る入力パターンを列挙してある。
 * 新しい取りこぼしを見つけたら、まずここにケースを足すこと。
 */
const fs = require('fs');
const path = require('path');

global.window = {};
const src = fs.readFileSync(path.join(__dirname, '..', 'name-match.js'), 'utf8');
new Function('window', src)(global.window);
const NM = global.window.NameMatch;

const roster = [
    { name: '山田 太郎', furigana: 'ヤマダ タロウ', email: 't-yamada@example.com' },
    { name: '山田 花子', furigana: 'ヤマダ ハナコ', email: 'hanako.y@example.com' },
    { name: '佐藤 一郎', furigana: 'サトウ イチロウ', email: 'ichiro.sato@example.com' },
    { name: '田中 翔', furigana: 'タナカ ショウ', email: 'sho_tanaka@example.com' },
    { name: 'Nguyen Van An', furigana: 'グエン ヴァン アン', email: 'nguyen.va@example.com' },
    { name: '髙橋 美咲', furigana: 'タカハシ ミサキ', email: 'misaki.t@example.com' },
    { name: '服部 潤', furigana: 'ハットリ ジュン', email: 'jun.hattori@example.com' },
    { name: '鈴木 健太', furigana: 'スズキ ケンタ', email: 'kenta.s@example.com' },
];
NM.indexRecords(roster);

// [入力, 候補に必ず含まれてほしい氏名]
const cases = [
    // 漢字・姓のみ・名のみ・スペース有無
    ['山田 太郎',    ['山田 太郎']],
    ['山田太郎',     ['山田 太郎']],
    ['山田',         ['山田 太郎', '山田 花子']],
    ['太郎',         ['山田 太郎']],

    // かな
    ['やまだ',       ['山田 太郎', '山田 花子']],
    ['ヤマダ',       ['山田 太郎', '山田 花子']],
    ['たろう',       ['山田 太郎']],
    ['ﾔﾏﾀﾞ',        ['山田 太郎', '山田 花子']],

    // ローマ字（大文字小文字・綴りゆれ・長音）
    ['yamada',       ['山田 太郎', '山田 花子']],
    ['YAMADA',       ['山田 太郎', '山田 花子']],
    ['Tarou',        ['山田 太郎']],
    ['taro',         ['山田 太郎']],
    ['tarō',         ['山田 太郎']],
    ['satou',        ['佐藤 一郎']],
    ['sato',         ['佐藤 一郎']],
    ['ichiro',       ['佐藤 一郎']],
    ['shou',         ['田中 翔']],
    ['syou',         ['田中 翔']],
    ['sho',          ['田中 翔']],
    ['takahashi',    ['髙橋 美咲']],
    ['hattori',      ['服部 潤']],
    ['jun',          ['服部 潤']],
    ['zyun',         ['服部 潤']],

    // 全角英数
    ['ｔ－ｙａｍａｄａ', ['山田 太郎']],

    // メールアドレスのローカル部
    ['t-yamada',     ['山田 太郎']],
    ['kenta.s',      ['鈴木 健太']],

    // 留学生（氏名がアルファベット、フリガナがカタカナ）
    ['nguyen',       ['Nguyen Van An']],
    ['NGUYEN VAN',   ['Nguyen Van An']],
    ['ぐえん',       ['Nguyen Van An']],
    ['グエン',       ['Nguyen Van An']],

    // かな入力
    ['さとう',       ['佐藤 一郎']],
    ['しょう',       ['田中 翔']],
    ['たかはし',     ['髙橋 美咲']],
    ['はっとり',     ['服部 潤']],
    ['じゅん',       ['服部 潤']],
    ['すずき',       ['鈴木 健太']],

    // 濁点・小書き文字の打ち漏れ
    ['ススキ',       ['鈴木 健太']],
    ['すすき',       ['鈴木 健太']],
    ['ハツトリ',     ['服部 潤']],
    ['しゆん',       ['服部 潤']],
];

// 名簿に無い入力で誤ヒットしないこと。
// 1文字でも前方一致は返す（'a' は 'An' を拾う）ので、ここには前方一致しない文字列を置く。
const negativeCases = ['xyz', '存在しない名前', 'zzzz', 'qqq'];

let pass = 0;
let fail = 0;

for (const [query, expected] of cases) {
    const got = NM.search(query, roster).map(h => h.record.name);
    const missing = expected.filter(e => !got.includes(e));
    if (missing.length === 0) {
        pass++;
    } else {
        fail++;
        console.log(`FAIL  "${query}"`);
        console.log(`      拾えなかった: ${missing.join(' / ')}`);
        console.log(`      実際の候補  : ${got.join(' / ') || '(なし)'}`);
    }
}

for (const query of negativeCases) {
    const got = NM.search(query, roster);
    if (got.length === 0) {
        pass++;
    } else {
        fail++;
        console.log(`FAIL  "${query}" は 0 件であるべき`);
        console.log(`      実際: ${got.map(h => h.record.name).join(' / ')}`);
    }
}

console.log(`${pass} passed, ${fail} failed  (${cases.length + negativeCases.length} cases)`);
process.exit(fail ? 1 : 0);
