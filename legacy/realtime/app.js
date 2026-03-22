/**
 * KUAS Reception – Firebase Realtime Database 共通モジュール (app.js)
 *
 * このファイルは index.html（iPad受付）と admin.html（PC管理）で共有します。
 * Firebase SDK の読み込み後に、このファイルを読み込んでください。
 */

/* global firebase */

const KuasApp = (() => {
  // ─── Firebase パス定数 ────────────────────────────────────
  const DB_PATHS = {
    programs:          'programs',
    waitingList:       'waitingList',
    confirmedAttendees:'confirmedAttendees',
    settings:          'settings'
  };

  // ─── XSS対策エスケープ（共通） ───────────────────────────
  const escHtml = (str) => String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const escAttr = (str) => String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  // ─── Firebase 初期化 ──────────────────────────────────────
  const initFirebase = () => {
    if (!window.firebaseConfig) {
      console.error('[KUAS] firebase-config.js が読み込まれていません。');
      return false;
    }
    // プレースホルダー検出
    const cfg = window.firebaseConfig;
    const isPlaceholder = Object.values(cfg).some(
      (v) => typeof v === 'string' && v.startsWith('YOUR_')
    );
    if (isPlaceholder) {
      console.error('[KUAS] firebase-config.js にプレースホルダー値が残っています。実際の Firebase プロジェクトの値に置き換えてください。');
      return false;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(window.firebaseConfig);
    }
    return true;
  };

  const getDb = () => {
    try {
      return firebase.database();
    } catch (e) {
      console.error('[KUAS] Firebase Database の取得に失敗しました。', e);
      return null;
    }
  };

  const getRef = (path) => {
    const db = getDb();
    return db ? db.ref(path) : null;
  };

  // ─── リアルタイムリスナー ────────────────────────────────
  /**
   * パスを監視し、データ変更のたびに callback(value) を呼び出す。
   * 戻り値の関数を呼ぶことでリスナーを解除できる。
   * @param {string} path
   * @param {(value: any) => void} callback
   * @returns {() => void} unsubscribe function
   */
  const listenToNode = (path, callback) => {
    const ref = getRef(path);
    if (!ref) return () => {};
    const handler = ref.on('value', (snapshot) => {
      callback(snapshot.val());
    }, (error) => {
      console.error(`[KUAS] listenToNode(${path}) エラー:`, error);
    });
    return () => ref.off('value', handler);
  };

  // ─── データ操作 ───────────────────────────────────────────
  const pushToNode = (path, data) => {
    const ref = getRef(path);
    if (!ref) return Promise.reject(new Error('Database not ready'));
    return ref.push({
      ...data,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
  };

  const setNode = (path, data) => {
    const ref = getRef(path);
    if (!ref) return Promise.reject(new Error('Database not ready'));
    return ref.set(data);
  };

  const updateNode = (path, data) => {
    const ref = getRef(path);
    if (!ref) return Promise.reject(new Error('Database not ready'));
    return ref.update(data);
  };

  const removeNode = (path) => {
    const ref = getRef(path);
    if (!ref) return Promise.reject(new Error('Database not ready'));
    return ref.remove();
  };

  /**
   * ルートから複数パスを一括でアトミック更新する。
   * @param {Object} updates  例: { 'waitingList/id1': null, 'confirmedAttendees/id1': {...} }
   */
  const multiPathUpdate = (updates) => {
    const db = getDb();
    if (!db) return Promise.reject(new Error('Database not ready'));
    return db.ref().update(updates);
  };

  // ─── 一括割り当てロジック ────────────────────────────────
  /**
   * 待機リスト内のユーザーをプログラム残席に基づいて確定者へ一括移動する。
   * @param {Object} programs          Firebase /programs の値
   * @param {Object} waitingList       Firebase /waitingList の値
   * @param {Object} confirmedAttendees Firebase /confirmedAttendees の値
   * @param {Object} settings          Firebase /settings の値
   * @returns {{ updates: Object, assignedCount: number, skippedCount: number }}
   */
  const buildBulkAssignUpdates = (programs, waitingList, confirmedAttendees, settings) => {
    if (!programs || !waitingList) {
      return { updates: {}, assignedCount: 0, skippedCount: 0 };
    }

    const programsObj   = programs   || {};
    const waitingObj    = waitingList || {};
    const confirmedObj  = confirmedAttendees || {};
    const prioritizeRes = settings?.prioritizeReservations === true;

    // プログラムごとの定員と確定人数を計算
    const capacityMap = {};
    const confirmedMap = {};
    for (const [pid, prog] of Object.entries(programsObj)) {
      capacityMap[pid]  = Number(prog.capacity) || 0;
      confirmedMap[pid] = 0;
    }
    for (const attendee of Object.values(confirmedObj)) {
      if (attendee && attendee.assignedProgram && confirmedMap[attendee.assignedProgram] !== undefined) {
        confirmedMap[attendee.assignedProgram] += 1 + (Number(attendee.companions) || 0);
      }
    }

    // 待機リストをタイムスタンプ順（古い順）に並べ、予約者優先オプション対応
    let waitingEntries = Object.entries(waitingObj)
      .filter(([, u]) => u != null)
      .sort(([, a], [, b]) => (a.createdAt || 0) - (b.createdAt || 0));

    if (prioritizeRes) {
      const reserved   = waitingEntries.filter(([, u]) => u.type === 'reserved');
      const others     = waitingEntries.filter(([, u]) => u.type !== 'reserved');
      waitingEntries   = [...reserved, ...others];
    }

    const updates = {};
    let assignedCount = 0;
    let skippedCount  = 0;

    for (const [uid, user] of waitingEntries) {
      // briefing_only の受付済みユーザーも移動
      if (user.type === 'briefing_only') {
        updates[`confirmedAttendees/${uid}`] = {
          ...user,
          assignedProgram: null,
          confirmedAt: firebase.database.ServerValue.TIMESTAMP
        };
        updates[`waitingList/${uid}`] = null;
        assignedCount++;
        continue;
      }

      const choices = Array.isArray(user.choices) ? user.choices : [];
      let assigned = false;

      for (const programId of choices) {
        if (!programId || capacityMap[programId] === undefined) continue;
        const headCount = 1 + (Number(user.companions) || 0);
        const remaining = capacityMap[programId] - confirmedMap[programId];
        if (remaining >= headCount) {
          confirmedMap[programId] += headCount;
          updates[`confirmedAttendees/${uid}`] = {
            ...user,
            assignedProgram: programId,
            confirmedAt: firebase.database.ServerValue.TIMESTAMP
          };
          updates[`waitingList/${uid}`] = null;
          assignedCount++;
          assigned = true;
          break;
        }
      }

      if (!assigned) skippedCount++;
    }

    return { updates, assignedCount, skippedCount };
  };

  // ─── トースト通知 ─────────────────────────────────────────
  const showToast = (message, duration = 3000) => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toast._kuas_timeout);
    toast._kuas_timeout = setTimeout(() => toast.classList.remove('visible'), duration);
  };

  // ─── ネットワーク状態バナー ───────────────────────────────
  const initNetworkStatus = () => {
    const update = () => {
      const banner = document.getElementById('network-banner');
      if (!banner) return;
      if (navigator.onLine) {
        banner.textContent = 'オンライン接続中';
        banner.classList.add('visible');
        setTimeout(() => banner.classList.remove('visible'), 1800);
      } else {
        banner.textContent = '⚠ ネットワークに接続できません';
        banner.classList.add('visible');
      }
    };
    window.addEventListener('online',  update);
    window.addEventListener('offline', update);
  };

  // ─── リロード・離脱防止 ──────────────────────────────────
  const RELOAD_WARNING = 'データの損失を防ぐため、再読み込みは管理画面の同期機能を使用してください。';

  const preventReload = () => {
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      e.returnValue = RELOAD_WARNING;
      return RELOAD_WARNING;
    });

    document.addEventListener('keydown', (e) => {
      const isReloadKey =
        e.key === 'F5' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'));
      if (isReloadKey) {
        e.preventDefault();
        showToast(RELOAD_WARNING, 4000);
        return false;
      }
    }, { capture: true });
  };

  // ─── JSON バックアップ ────────────────────────────────────
  const downloadJsonBackup = async () => {
    const db = getDb();
    if (!db) { showToast('データベースに接続できません'); return; }
    try {
      const snapshot = await db.ref().once('value');
      const data = snapshot.val() || {};
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `kuas-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('JSONバックアップをダウンロードしました');
    } catch (err) {
      console.error('[KUAS] バックアップ失敗:', err);
      showToast('バックアップの取得に失敗しました');
    }
  };

  // ─── データリセット（全削除 + 初期プログラム再投入） ────
  const DEFAULT_PROGRAMS = [
    { title: 'AIロボットプログラミング', description: 'センサーと機械学習でロボットを動かす体験', capacity: 20, order: 1 },
    { title: 'IoTスマートデバイス',      description: 'ArduinoとWi-Fiモジュールで電子工作', capacity: 20, order: 2 },
    { title: '橋梁設計シミュレーション', description: 'CADソフトで橋の設計と強度解析を体験', capacity: 20, order: 3 },
    { title: '再生可能エネルギー実験',   description: '太陽光・燃料電池の仕組みを学ぶ実験', capacity: 20, order: 4 },
    { title: 'データサイエンス入門',     description: 'Pythonでデータを可視化・分析する体験', capacity: 20, order: 5 }
  ];

  const resetAllData = async () => {
    const db = getDb();
    if (!db) { showToast('データベースに接続できません'); return; }
    try {
      // 全データ削除後、デフォルトプログラムを再投入
      await db.ref().remove();
      const programsRef = db.ref(DB_PATHS.programs);
      for (const prog of DEFAULT_PROGRAMS) {
        await programsRef.push({
          ...prog,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
      await db.ref(DB_PATHS.settings).set({
        prioritizeReservations: false,
        resetAt: firebase.database.ServerValue.TIMESTAMP
      });
      showToast('データをリセットし、初期プログラムを復元しました');
    } catch (err) {
      console.error('[KUAS] リセット失敗:', err);
      showToast('リセットに失敗しました: ' + err.message);
    }
  };

  // ─── 公開 API ─────────────────────────────────────────────
  return {
    DB_PATHS,
    initFirebase,
    getDb,
    getRef,
    listenToNode,
    pushToNode,
    setNode,
    updateNode,
    removeNode,
    multiPathUpdate,
    buildBulkAssignUpdates,
    showToast,
    initNetworkStatus,
    preventReload,
    downloadJsonBackup,
    resetAllData,
    DEFAULT_PROGRAMS,
    escHtml,
    escAttr
  };
})();
