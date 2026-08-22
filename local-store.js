/*
 * local-store.js — ローカル専用データ層
 *
 * かつて Firestore が担っていた永続化を localStorage で置き換える。
 * ネットワークもアカウントも一切不要で、同一ブラウザの複数タブ間だけは
 * storage イベント経由でリアルタイムに同期する。
 *
 * script.js からは window.LocalStore として参照する。
 */
(function () {
    'use strict';

    const NS = 'kuas.reception.v1';
    const KEY = {
        programs: NS + '.programs',
        reservations: NS + '.reservations',
        briefings: NS + '.briefings',
        participants: NS + '.participants'
    };

    const participantListeners = [];

    function newId(prefix) {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return prefix + '-' + window.crypto.randomUUID();
        }
        return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return fallback;
            const parsed = JSON.parse(raw);
            return parsed === null || parsed === undefined ? fallback : parsed;
        } catch (e) {
            console.error('LocalStore: failed to read ' + key, e);
            return fallback;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            // 主に QuotaExceededError。呼び出し側で警告を出せるよう false を返す。
            console.error('LocalStore: failed to write ' + key, e);
            return false;
        }
    }

    function notifyParticipants() {
        const list = LocalStore.participants.list();
        participantListeners.forEach(function (fn) {
            try { fn(list); } catch (e) { console.error('LocalStore: participant listener failed', e); }
        });
    }

    const LocalStore = {
        KEY: KEY,
        newId: newId,

        programs: {
            /** 保存済みプログラム一覧。未保存なら null を返し、script.js 側の初期値を使わせる。 */
            load: function () {
                const list = read(KEY.programs, null);
                if (!Array.isArray(list) || list.length === 0) return null;
                return list
                    .map(function (p, i) {
                        return {
                            id: p.id || newId('program'),
                            title: p.title || '',
                            description: p.description || '',
                            title_en: p.title_en || '',
                            description_en: p.description_en || '',
                            capacity: p.capacity || 0,
                            order: typeof p.order === 'number' ? p.order : i
                        };
                    })
                    .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
            },
            save: function (programs) {
                const payload = (programs || []).map(function (p, index) {
                    return {
                        id: p.id,
                        title: p.title,
                        description: p.description,
                        title_en: p.title_en || '',
                        description_en: p.description_en || '',
                        capacity: p.capacity || 0,
                        order: index
                    };
                });
                return write(KEY.programs, payload);
            }
        },

        rosters: {
            /** { reservations, briefings } を返す。未保存の側は null。 */
            load: function () {
                const reservations = read(KEY.reservations, null);
                const briefings = read(KEY.briefings, null);
                return {
                    reservations: Array.isArray(reservations) && reservations.length > 0
                        ? reservations.map(function (r) {
                            return {
                                id: r.id || newId('reservation'),
                                name: r.name || '',
                                furigana: r.furigana || '',
                                choices: Array.isArray(r.choices) ? r.choices : [],
                                companions: r.companions || 0
                            };
                        })
                        : null,
                    briefings: Array.isArray(briefings) && briefings.length > 0
                        ? briefings.map(function (b) {
                            return {
                                id: b.id || newId('briefing'),
                                name: b.name || '',
                                furigana: b.furigana || '',
                                time: b.time || '',
                                companions: b.companions || 0
                            };
                        })
                        : null
                };
            },
            save: function (reservations, briefings) {
                const okA = write(KEY.reservations, (reservations || []).map(function (r) {
                    return {
                        id: r.id || newId('reservation'),
                        name: r.name,
                        furigana: r.furigana || '',
                        choices: Array.isArray(r.choices) ? r.choices : [],
                        companions: r.companions || 0
                    };
                }));
                const okB = write(KEY.briefings, (briefings || []).map(function (b) {
                    return {
                        id: b.id || newId('briefing'),
                        name: b.name,
                        furigana: b.furigana || '',
                        time: b.time || '',
                        companions: b.companions || 0
                    };
                }));
                return okA && okB;
            }
        },

        participants: {
            /** 受付済み来場者。Firestore 時代と同じく新しい順。 */
            list: function () {
                const list = read(KEY.participants, []);
                if (!Array.isArray(list)) return [];
                return list.slice().sort(function (a, b) {
                    return (b.createdAt || 0) - (a.createdAt || 0);
                });
            },
            add: function (doc) {
                const list = read(KEY.participants, []);
                const record = Object.assign({}, doc, {
                    id: newId('participant'),
                    createdAt: Date.now()
                });
                list.push(record);
                if (!write(KEY.participants, list)) {
                    throw new Error('LocalStore: participant write failed');
                }
                notifyParticipants();
                return record;
            },
            remove: function (id) {
                const list = read(KEY.participants, []);
                const next = list.filter(function (p) { return p.id !== id; });
                if (next.length === list.length) return false;
                if (!write(KEY.participants, next)) {
                    throw new Error('LocalStore: participant remove failed');
                }
                notifyParticipants();
                return true;
            },
            clear: function () {
                write(KEY.participants, []);
                notifyParticipants();
            }
        },

        /** 受付データの変更を購読する。戻り値を呼ぶと購読解除。 */
        onParticipantsChange: function (fn) {
            if (typeof fn !== 'function') return function () {};
            participantListeners.push(fn);
            fn(LocalStore.participants.list());
            return function () {
                const i = participantListeners.indexOf(fn);
                if (i >= 0) participantListeners.splice(i, 1);
            };
        },

        /** 全データを消す（管理画面のリセット用）。 */
        clearAll: function () {
            Object.keys(KEY).forEach(function (k) {
                try { localStorage.removeItem(KEY[k]); } catch (_) {}
            });
            notifyParticipants();
        }
    };

    // 別タブでの書き込みを取り込む
    window.addEventListener('storage', function (e) {
        if (e.key === KEY.participants) notifyParticipants();
    });

    window.LocalStore = LocalStore;
})();
