/*
 * name-match.js — 来場者照合エンジン
 *
 * 受付で「名前が出てこない」を起こさないことだけを目的にしたモジュール。
 * 精度より再現率を優先し、少しでも掠れば候補として拾い上げる。
 * 絞り込みは人間（スタッフ）が候補一覧から選んでやればよい、という設計。
 *
 * 拾える入力:
 *   山田太郎 / 山田 太郎 / 山田 / 太郎        … 漢字・姓のみ・名のみ・スペース有無
 *   やまだたろう / ヤマダ / たろう             … ひらがな・カタカナ どちらでも
 *   yamada / Tarou / TARO / tarō              … ローマ字・大文字小文字・長音表記ゆれ
 *   ﾔﾏﾀﾞ / ＹＡＭＡＤＡ                        … 半角カナ・全角英数
 *   t-yamada                                  … メールアドレスのローカル部
 *
 * script.js からは window.NameMatch として参照する。
 */
(function () {
    'use strict';

    // ------------------------------------------------------------
    // かな → ローマ字
    // ------------------------------------------------------------
    // 訓令式寄りの「ゆるい」綴りで出す。ヘボン式との差（shi/si など）は
    // このあと looseRomaji() が吸収するので、ここでは片方に寄せておけばよい。
    const KANA_ROMAJI = {
        'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
        'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
        'しゃ': 'sya', 'しゅ': 'syu', 'しょ': 'syo', 'しぇ': 'sye',
        'じゃ': 'zya', 'じゅ': 'zyu', 'じょ': 'zyo', 'じぇ': 'zye',
        'ちゃ': 'tya', 'ちゅ': 'tyu', 'ちょ': 'tyo', 'ちぇ': 'tye',
        'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
        'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
        'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
        'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
        'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
        'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
        'ふぁ': 'ha', 'ふぃ': 'hi', 'ふぇ': 'he', 'ふぉ': 'ho',
        'うぃ': 'wi', 'うぇ': 'we', 'うぉ': 'wo',
        'てぃ': 'ti', 'でぃ': 'di', 'とぅ': 'tu', 'どぅ': 'du',
        'ゔぁ': 'ba', 'ゔぃ': 'bi', 'ゔぇ': 'be', 'ゔぉ': 'bo',

        'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
        'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
        'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
        'さ': 'sa', 'し': 'si', 'す': 'su', 'せ': 'se', 'そ': 'so',
        'ざ': 'za', 'じ': 'zi', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
        'た': 'ta', 'ち': 'ti', 'つ': 'tu', 'て': 'te', 'と': 'to',
        'だ': 'da', 'ぢ': 'zi', 'づ': 'zu', 'で': 'de', 'ど': 'do',
        'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
        'は': 'ha', 'ひ': 'hi', 'ふ': 'hu', 'へ': 'he', 'ほ': 'ho',
        'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
        'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
        'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
        'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
        'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
        'わ': 'wa', 'ゐ': 'i', 'ゑ': 'e', 'を': 'o', 'ん': 'n',
        'ゔ': 'bu',
        'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
        'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo'
    };

    /** ひらがな列をローマ字に変換する。かな以外の文字はそのまま残す。 */
    function kanaToRomaji(hira) {
        let out = '';
        let i = 0;
        while (i < hira.length) {
            const pair = hira.slice(i, i + 2);
            if (KANA_ROMAJI[pair]) { out += KANA_ROMAJI[pair]; i += 2; continue; }

            const ch = hira[i];
            if (ch === 'っ') {
                // 促音：次の子音を重ねる
                const next = KANA_ROMAJI[hira.slice(i + 1, i + 3)] || KANA_ROMAJI[hira[i + 1]];
                if (next) out += next[0];
                i += 1;
                continue;
            }
            if (ch === 'ー') { i += 1; continue; }   // 長音は落とす（後段で母音重複も潰す）

            out += KANA_ROMAJI[ch] !== undefined ? KANA_ROMAJI[ch] : ch;
            i += 1;
        }
        return out;
    }

    /**
     * ローマ字の綴りゆれを 1 つの形に潰す。
     * shi/si・chi/ti・tsu/tu・fu/hu・ji/zi、および長音（ou/oo/ō → o）を吸収する。
     */
    function looseRomaji(s) {
        return s
            .replace(/[āâ]/g, 'a').replace(/[īî]/g, 'i').replace(/[ūû]/g, 'u')
            .replace(/[ēê]/g, 'e').replace(/[ōô]/g, 'o')
            .replace(/sh/g, 's').replace(/ch/g, 't').replace(/ts/g, 't')
            .replace(/j/g, 'z').replace(/f/g, 'h').replace(/l/g, 'r')
            .replace(/([aiueo])\1+/g, '$1')     // aa → a
            .replace(/ou/g, 'o').replace(/ei/g, 'e')
            .replace(/[^a-z0-9]/g, '');
    }

    /**
     * 照合用の正規形。
     * 全角/半角・カタカナ/ひらがな・大文字小文字・空白・記号の違いを消す。
     */
    function normalize(input) {
        let s = (input === null || input === undefined) ? '' : String(input);
        // 全角英数 → 半角、半角カナ → 全角カナ、合成濁点の結合
        if (typeof s.normalize === 'function') s = s.normalize('NFKC');
        // カタカナ → ひらがな
        s = s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
        s = s.toLowerCase();
        // 空白・記号を落とす（中黒、ハイフン各種、ピリオド、アポストロフィ）
        s = s.replace(/[\s　・.,'’"\-‐‑‒–—ー_]/g, '');
        return s;
    }

    /** 正規形をさらにローマ字の緩い綴りへ寄せる。かな・ローマ字混在でも比較できる。 */
    function toRomajiKey(normalized) {
        return looseRomaji(kanaToRomaji(normalized));
    }

    // 濁点・半濁点を落とすための対応表
    const DAKUTEN_BASE = {
        'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
        'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
        'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
        'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ',
        'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ',
        'ゔ': 'う',
        'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
        'っ': 'つ', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'ゎ': 'わ'
    };

    /**
     * 濁点・半濁点・小書き文字の違いを無視した形。
     * 「スズキ」を「ススキ」と打ってしまう類の打ち間違いを拾うための保険。
     */
    function toFuzzyKey(normalized) {
        return normalized.replace(/./g, (c) => DAKUTEN_BASE[c] || c);
    }

    // ------------------------------------------------------------
    // 検索キーの構築
    // ------------------------------------------------------------

    /** 「山田 太郎」→ ['山田 太郎', '山田', '太郎']。区切りが無ければ全体のみ。 */
    function splitParts(value) {
        const raw = (value === null || value === undefined) ? '' : String(value);
        const parts = raw.split(/[\s　]+/).filter(Boolean);
        if (parts.length <= 1) return raw.trim() ? [raw.trim()] : [];
        return [raw.trim()].concat(parts);
    }

    /** メールアドレスのローカル部だけを取り出す。@ が無ければ全体を返す。 */
    function emailLocalPart(email) {
        const raw = (email === null || email === undefined) ? '' : String(email).trim();
        if (!raw) return '';
        const at = raw.indexOf('@');
        return at > 0 ? raw.slice(0, at) : raw;
    }

    /**
     * 1 レコードぶんの検索キーを作る。
     * { plain: Set<string>, romaji: Set<string> } を返す。
     */
    function buildKeys(record) {
        const plain = new Set();
        const romaji = new Set();
        const fuzzy = new Set();

        const add = (value) => {
            const n = normalize(value);
            if (!n) return;
            plain.add(n);
            const r = toRomajiKey(n);
            if (r) romaji.add(r);
            const f = toFuzzyKey(n);
            if (f && f !== n) fuzzy.add(f);
        };

        splitParts(record.name).forEach(add);
        splitParts(record.furigana).forEach(add);
        if (record.email) {
            add(emailLocalPart(record.email));
            // t.yamada / t-yamada のような区切りは分割しても引けるようにする
            emailLocalPart(record.email).split(/[._\-+]/).filter(p => p.length >= 2).forEach(add);
        }
        if (record.school) add(record.school);

        return { plain: plain, romaji: romaji, fuzzy: fuzzy };
    }

    // ------------------------------------------------------------
    // 照合
    // ------------------------------------------------------------

    const SCORE = { EXACT: 100, PREFIX: 70, PARTIAL: 45, ROMAJI_PENALTY: 8, FUZZY_PENALTY: 16 };

    // 1文字だけの部分一致は名簿全体を引っ掛けてしまうので、前方一致までに留める
    const MIN_PARTIAL_LENGTH = 2;

    /** キー集合に対して 1 本のクエリを当て、最良スコアを返す。0 なら不一致。 */
    function scoreAgainst(keys, queryPlain, queryRomaji, queryFuzzy) {
        let best = 0;

        const test = (keySet, query, penalty) => {
            if (!query || !keySet) return;
            keySet.forEach((key) => {
                let s = 0;
                if (key === query) s = SCORE.EXACT;
                else if (key.startsWith(query) || query.startsWith(key)) s = SCORE.PREFIX;
                else if (query.length >= MIN_PARTIAL_LENGTH && (key.includes(query) || query.includes(key))) s = SCORE.PARTIAL;
                if (s) best = Math.max(best, s - penalty);
            });
        };

        test(keys.plain, queryPlain, 0);
        test(keys.romaji, queryRomaji, SCORE.ROMAJI_PENALTY);
        test(keys.fuzzy, queryFuzzy, SCORE.FUZZY_PENALTY);
        return best;
    }

    /**
     * 名簿からクエリに掠るレコードを拾う。
     *
     * @param {string} query    受付スタッフが打った文字列
     * @param {Array}  records  名簿レコード（name / furigana / email / school を見る）
     * @param {Object} [options] { limit = 20, minLength = 1 }
     * @returns {Array} [{ record, index, score }] をスコアの高い順に返す
     */
    function search(query, records, options) {
        const opts = options || {};
        const limit = opts.limit || 20;
        const minLength = opts.minLength || 1;

        const qPlain = normalize(query);
        if (qPlain.length < minLength) return [];
        const qRomaji = toRomajiKey(qPlain);
        const qFuzzy = toFuzzyKey(qPlain);

        const hits = [];
        (records || []).forEach((record, index) => {
            const keys = record.__matchKeys || buildKeys(record);
            const score = scoreAgainst(keys, qPlain, qRomaji, qFuzzy);
            if (score > 0) hits.push({ record: record, index: index, score: score });
        });

        // 同点なら名簿の並び順を保つ
        hits.sort((a, b) => (b.score - a.score) || (a.index - b.index));
        return hits.slice(0, limit);
    }

    /** 名簿を読み込んだ直後に呼び、各レコードへ検索キーを埋め込んでおく。 */
    function indexRecords(records) {
        (records || []).forEach((record) => {
            Object.defineProperty(record, '__matchKeys', {
                value: buildKeys(record),
                enumerable: false,
                writable: true,
                configurable: true
            });
        });
        return records;
    }

    window.NameMatch = {
        normalize: normalize,
        toRomajiKey: toRomajiKey,
        toFuzzyKey: toFuzzyKey,
        kanaToRomaji: kanaToRomaji,
        looseRomaji: looseRomaji,
        emailLocalPart: emailLocalPart,
        buildKeys: buildKeys,
        indexRecords: indexRecords,
        search: search,
        SCORE: SCORE
    };
})();
