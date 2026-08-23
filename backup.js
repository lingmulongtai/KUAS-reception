/*
 * backup.js — 受付データの自動バックアップ
 *
 * localStorage はブラウザの履歴削除やシークレットウィンドウで消える。
 * 当日 1 台で運用する以上、そこが飛ぶと復旧手段が無くなるため、
 * 受付が入るたびに世代を残しておく。
 *
 * 二段構えにしてある。
 *   1. localStorage 内のスナップショット（直近 N 世代）
 *      … 誤操作・リセット事故からの復旧用。すぐ戻せる
 *   2. ファイルへの書き出し（File System Access API があれば自動）
 *      … ブラウザのデータごと消えたときの最後の砦
 *
 * File System Access API に対応していないブラウザでは、一定件数ごとに
 * ダウンロードを促す。黙って諦めない。
 *
 * script.js からは window.Backup として参照する。
 */
(function () {
    'use strict';

    const NS = 'kuas.reception.v1';
    const SNAPSHOT_KEY = NS + '.snapshots';
    const MAX_SNAPSHOTS = 20;

    // 何件受付するごとにファイルへ書き出すか
    const FILE_BACKUP_INTERVAL = 10;

    let fileHandle = null;          // File System Access API のハンドル
    let sinceLastFileBackup = 0;
    let onNeedManualBackup = null;  // 手動ダウンロードを促すコールバック

    function readSnapshots() {
        try {
            const raw = localStorage.getItem(SNAPSHOT_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Backup: failed to read snapshots', e);
            return [];
        }
    }

    /** いま localStorage にある受付データ一式を 1 つのオブジェクトにまとめる。 */
    function collect() {
        const pick = (key) => {
            try {
                const raw = localStorage.getItem(NS + '.' + key);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        };
        return {
            savedAt: new Date().toISOString(),
            programs: pick('programs'),
            reservations: pick('reservations'),
            briefings: pick('briefings'),
            participants: pick('participants')
        };
    }

    /**
     * スナップショットを 1 世代残す。
     * 容量が足りなくなったら古い世代から捨てて、必ず最新だけは残す。
     */
    function snapshot() {
        const data = collect();
        let list = readSnapshots();
        list.push(data);
        if (list.length > MAX_SNAPSHOTS) list = list.slice(-MAX_SNAPSHOTS);

        while (list.length > 0) {
            try {
                localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list));
                return data;
            } catch (e) {
                // QuotaExceededError。古い世代を捨てて入るまで縮める
                list.shift();
            }
        }
        console.error('Backup: could not store any snapshot');
        return data;
    }

    function fileName() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return 'kuas-reception-backup-'
            + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate())
            + '-' + pad(now.getHours()) + pad(now.getMinutes())
            + '.json';
    }

    function serialize() {
        return JSON.stringify(collect(), null, 2);
    }

    /** ブラウザに JSON をダウンロードさせる。 */
    function download() {
        const blob = new Blob([serialize()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    const supportsFileSystem = typeof window.showSaveFilePicker === 'function';

    /**
     * 書き出し先のファイルを一度だけ選んでもらう。
     * 以降はそのファイルに上書きし続けるので、操作は不要になる。
     */
    async function chooseBackupFile() {
        if (!supportsFileSystem) {
            download();
            return false;
        }
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: fileName(),
                types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
            });
            await writeToFile();
            return true;
        } catch (e) {
            // ユーザーがキャンセルした場合もここに来る。エラー扱いにしない
            if (e && e.name !== 'AbortError') console.error('Backup: file picker failed', e);
            return false;
        }
    }

    async function writeToFile() {
        if (!fileHandle) return false;
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(serialize());
            await writable.close();
            sinceLastFileBackup = 0;
            return true;
        } catch (e) {
            console.error('Backup: file write failed', e);
            return false;
        }
    }

    /**
     * 受付が 1 件入るたびに呼ぶ。
     * 毎回スナップショットを残し、一定件数ごとにファイルへも書き出す。
     */
    async function onReceptionChange() {
        snapshot();
        sinceLastFileBackup += 1;

        if (sinceLastFileBackup < FILE_BACKUP_INTERVAL) return;

        if (fileHandle) {
            await writeToFile();
        } else if (typeof onNeedManualBackup === 'function') {
            // 書き出し先が未設定。ダウンロードを促す
            sinceLastFileBackup = 0;
            onNeedManualBackup(FILE_BACKUP_INTERVAL);
        } else {
            sinceLastFileBackup = 0;
        }
    }

    /** スナップショットの一覧。新しい順。 */
    function list() {
        return readSnapshots().slice().reverse().map(function (snap, i) {
            return {
                index: i,
                savedAt: snap.savedAt,
                participants: Array.isArray(snap.participants) ? snap.participants.length : 0,
                reservations: Array.isArray(snap.reservations) ? snap.reservations.length : 0
            };
        });
    }

    /** list() の index で指定した世代を localStorage へ書き戻す。 */
    function restore(index) {
        const snapshots = readSnapshots().slice().reverse();
        const snap = snapshots[index];
        if (!snap) return false;
        ['programs', 'reservations', 'briefings', 'participants'].forEach(function (key) {
            if (snap[key] === null || snap[key] === undefined) return;
            localStorage.setItem(NS + '.' + key, JSON.stringify(snap[key]));
        });
        return true;
    }

    /** ダウンロードした JSON を読み戻す。 */
    function importFromText(text) {
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') throw new Error('不正なバックアップファイルです');
        ['programs', 'reservations', 'briefings', 'participants'].forEach(function (key) {
            if (data[key] === null || data[key] === undefined) return;
            localStorage.setItem(NS + '.' + key, JSON.stringify(data[key]));
        });
        return data;
    }

    window.Backup = {
        supportsFileSystem: supportsFileSystem,
        hasFileTarget: function () { return !!fileHandle; },
        setManualBackupHandler: function (fn) { onNeedManualBackup = fn; },
        chooseBackupFile: chooseBackupFile,
        onReceptionChange: onReceptionChange,
        snapshot: snapshot,
        download: download,
        list: list,
        restore: restore,
        importFromText: importFromText,
        MAX_SNAPSHOTS: MAX_SNAPSHOTS,
        FILE_BACKUP_INTERVAL: FILE_BACKUP_INTERVAL
    };
})();
