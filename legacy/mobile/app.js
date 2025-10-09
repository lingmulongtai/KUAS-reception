(() => {
    const APP_ROOT_ID = 'app';
    const TOAST_ID = 'toast';
    const NETWORK_BANNER_ID = 'network-banner';
    const STORAGE_KEY = 'kuas-mobile-state-v1';

    const clone = (value) => {
        if (typeof window !== 'undefined' && typeof window.structuredClone === 'function') {
            return window.structuredClone(value);
        }
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            console.warn('Fallback clone failed', error);
            return value;
        }
    };

    const getStorage = () => {
        try {
            return window.localStorage;
        } catch (error) {
            console.warn('localStorage not available', error);
            return null;
        }
    };

    const Steps = {
        LANDING: 'landing',
        RESERVED_NAME: 'reserved-name',
        WALKIN_FORM: 'walkin-form',
        PROGRAM_SELECT: 'program-select',
        SUMMARY: 'summary',
        BRIEFING_ONLY: 'briefing-only',
        SUCCESS: 'success'
    };

    const initialState = {
        step: Steps.LANDING,
        reservedName: '',
        walkin: {
            name: '',
            furigana: '',
            school: '',
            grade: '',
            companions: ''
        },
        currentUser: null,
        choices: [],
        programs: [],
        reservations: [],
        status: {
            online: navigator.onLine,
            syncing: false
        },
        lastToast: null
    };

    const loadPersistedState = () => {
        try {
            const storage = getStorage();
            if (!storage) return clone(initialState);
            const raw = storage.getItem(STORAGE_KEY);
            if (!raw) return clone(initialState);
            const parsed = JSON.parse(raw);
            return { ...clone(initialState), ...parsed };
        } catch (error) {
            console.warn('Failed to restore mobile state', error);
            return clone(initialState);
        }
    };

    let state = loadPersistedState();

    const listeners = new Set();
    const subscribe = (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    const setState = (partial) => {
        state = { ...state, ...partial };
        persistState();
        for (const listener of listeners) listener(state);
    };

    const setNestedState = (path, value) => {
        const segments = path.split('.');
        const nextState = clone(state);
        let target = nextState;
        for (let i = 0; i < segments.length - 1; i++) {
            const key = segments[i];
            target[key] = target[key] ?? {};
            target = target[key];
        }
        target[segments[segments.length - 1]] = value;
        state = nextState;
        persistState();
        for (const listener of listeners) listener(state);
    };

    const persistState = () => {
        try {
            const payload = {
                step: state.step,
                reservedName: state.reservedName,
                walkin: state.walkin,
                currentUser: state.currentUser,
                choices: state.choices
            };
            const storage = getStorage();
            if (storage) {
                storage.setItem(STORAGE_KEY, JSON.stringify(payload));
            }
        } catch (error) {
            console.warn('Failed to persist mobile state', error);
        }
    };

    const templates = {
        landing() {
            return /* html */`
                <section class="screen" data-step="landing">
                    <header class="screen-header">
                        <span class="pill"><i class="ph ph-planet"></i> ようこそ KUAS へ</span>
                        <h1 class="screen-title">工学部ミニキャップストーン体験 受付</h1>
                        <p class="screen-subtitle">ご予約の有無を選択してください。スマホ専用の操作フローでスタッフがすぐに案内できます。</p>
                    </header>
                    <div class="card-grid">
                        <article class="card" data-action="go-reserved">
                            <i class="ph-fill ph-calendar-check card-icon"></i>
                            <h2 class="card-title">予約ありのお客様</h2>
                            <p class="card-description">お名前を入力して予約内容を確認します。現地での割り当ても自動で行われます。</p>
                            <div class="card-action">
                                <button class="card-button" data-action="go-reserved">
                                    <i class="ph ph-arrow-right"></i>
                                    受付に進む
                                </button>
                            </div>
                        </article>
                        <article class="card" data-action="go-walkin">
                            <i class="ph-fill ph-user-plus card-icon"></i>
                            <h2 class="card-title">予約なしのお客様</h2>
                            <p class="card-description">お名前や学年などを入力し、体験したいプログラムを選択します。</p>
                            <div class="card-action">
                                <button class="card-button" data-action="go-walkin">
                                    <i class="ph ph-arrow-right"></i>
                                    受付に進む
                                </button>
                            </div>
                        </article>
                    </div>
                </section>
            `;
        },
        reservedName(currentName = '') {
            return /* html */`
                <section class="screen" data-step="reserved-name">
                    <header class="screen-header">
                        <button class="secondary-button" data-action="back">
                            <i class="ph ph-arrow-left"></i>
                            もどる
                        </button>
                        <span class="pill"><i class="ph ph-calendar-check"></i> 予約あり</span>
                        <h1 class="screen-title">お名前を教えてください</h1>
                        <p class="screen-subtitle">ご予約名簿から検索します。姓と名の間にスペースを入れてください。</p>
                    </header>
                    <form class="form" data-form="reserved">
                        <div class="field-group">
                            <label class="field-label" for="reserved-name-input">お名前</label>
                            <input class="text-input" id="reserved-name-input" name="reservedName" autocomplete="off" inputmode="kana-name" placeholder="例：山田 太郎" value="${currentName ?? ''}" required>
                            <p class="field-hint">予約時に登録したフルネームを入力してください。</p>
                        </div>
                        <button type="submit" class="primary-button" data-action="check-reservation">
                            <span>予約を確認する</span>
                            <i class="ph ph-magnifying-glass"></i>
                        </button>
                    </form>
                </section>
            `;
        },
        walkinForm(formData) {
            return /* html */`
                <section class="screen" data-step="walkin-form">
                    <header class="screen-header">
                        <button class="secondary-button" data-action="back">
                            <i class="ph ph-arrow-left"></i>
                            もどる
                        </button>
                        <span class="pill"><i class="ph ph-user"></i> 予約なし</span>
                        <h1 class="screen-title">お客様情報を入力してください</h1>
                        <p class="screen-subtitle">現地のスタッフがスムーズに案内できるよう、必要な項目のみ入力いただきます。</p>
                    </header>
                    <form class="form" data-form="walkin">
                        <div class="field-group">
                            <label class="field-label" for="walkin-name">お名前 <span style="color: var(--color-primary);">必須</span></label>
                            <input class="text-input" id="walkin-name" name="name" autocomplete="off" inputmode="kana-name" required placeholder="例：佐藤 花子" value="${formData.name ?? ''}">
                            <p class="field-hint">姓と名の間にスペースを入れてください。</p>
                        </div>
                        <div class="field-group">
                            <label class="field-label" for="walkin-furigana">フリガナ <span style="color: var(--color-primary);">必須</span></label>
                            <input class="text-input" id="walkin-furigana" name="furigana" autocomplete="off" inputmode="katakana" required placeholder="例：サトウ ハナコ" value="${formData.furigana ?? ''}">
                        </div>
                        <div class="field-group">
                            <label class="field-label" for="walkin-school">学校名</label>
                            <input class="text-input" id="walkin-school" name="school" autocomplete="off" placeholder="例：〇〇高等学校" value="${formData.school ?? ''}">
                        </div>
                        <div class="field-group">
                            <label class="field-label" for="walkin-grade">学年 <span style="color: var(--color-primary);">必須</span></label>
                            <select class="select-input" id="walkin-grade" name="grade" required>
                                <option value="" ${formData.grade ? '' : 'selected'} disabled>選択してください</option>
                                <option value="高校1年生" ${formData.grade === '高校1年生' ? 'selected' : ''}>高校1年生</option>
                                <option value="高校2年生" ${formData.grade === '高校2年生' ? 'selected' : ''}>高校2年生</option>
                                <option value="高校3年生" ${formData.grade === '高校3年生' ? 'selected' : ''}>高校3年生</option>
                                <option value="その他" ${formData.grade === 'その他' ? 'selected' : ''}>その他</option>
                            </select>
                        </div>
                        <div class="field-group">
                            <label class="field-label" for="walkin-companions">同伴者人数 <span style="color: var(--color-primary);">必須</span></label>
                            <select class="select-input" id="walkin-companions" name="companions" required>
                                <option value="" ${formData.companions !== '' ? '' : 'selected'} disabled>選択してください</option>
                                ${[0,1,2,3,4,5].map(count => `
                                    <option value="${count}" ${String(formData.companions) === String(count) ? 'selected' : ''}>${count}</option>
                                `).join('')}
                            </select>
                        </div>
                        <button type="submit" class="primary-button" data-action="to-programs">
                            <span>プログラムを選ぶ</span>
                            <i class="ph ph-caret-right"></i>
                        </button>
                        <button type="button" class="secondary-button" data-action="briefing-only">
                            <span>キャップストーン体験には参加しない</span>
                        </button>
                    </form>
                </section>
            `;
        },
        programSelect({ programs, choices, currentUser }) {
            const renderChoiceBadge = (index) => {
                const labels = ['第1希望', '第2希望', '第3希望'];
                return `<span class="pill"><i class="ph ph-star"></i> ${labels[index]}</span>`;
            };
            return /* html */`
                <section class="screen" data-step="program-select">
                    <header class="screen-header">
                        <button class="secondary-button" data-action="back">
                            <i class="ph ph-arrow-left"></i>
                            もどる
                        </button>
                        <span class="pill"><i class="ph ph-stack"></i> プログラム選択</span>
                        <h1 class="screen-title">希望するプログラムをお選びください</h1>
                        <p class="screen-subtitle">最大3つまで選択できます。同じプログラムを複数回選ぶことはできません。</p>
                    </header>
                    <div class="timeline">
                        <div class="timeline-item">
                            <div class="dot"></div>
                            <div class="content">
                                <strong>${currentUser.name}</strong> 様は <strong>${currentUser.grade}</strong> の方として受付します。
                            </div>
                        </div>
                    </div>
                    <div class="program-grid">
                        ${programs.map(program => {
                            const selectedIndex = choices.findIndex(choice => choice === program.id);
                            const isSelected = selectedIndex >= 0;
                            const statusClass = program.isFull ? 'chip-status full' : 'chip-status';
                            const capacityText = program.capacity ? `定員 ${program.capacity} / 残り ${Math.max(program.remaining ?? program.capacity, 0)}` : '定員調整中';
                            return `
                                <button type="button" class="program-chip ${isSelected ? 'selected' : ''}" data-program-id="${program.id}">
                                    <div class="chip-header">
                                        <span class="chip-title">${program.title}</span>
                                        ${isSelected ? renderChoiceBadge(selectedIndex) : ''}
                                    </div>
                                    <span class="chip-capacity">${capacityText}</span>
                                    <span class="chip-status ${program.isFull ? 'full' : ''}">
                                        <span class="dot"></span>
                                        ${program.isFull ? '満員' : '受付中'}
                                    </span>
                                    <p class="chip-description">${program.description ?? ''}</p>
                                </button>
                            `;
                        }).join('')}
                    </div>
                    <footer class="bottom-actions">
                        <button class="secondary-button" data-action="clear-choices">選択をクリア</button>
                        <button class="primary-button" data-action="confirm-choices">
                            <span>選択を確定する</span>
                            <i class="ph ph-check"></i>
                        </button>
                    </footer>
                </section>
            `;
        },
        summary({ currentUser, assignedProgram, isWaiting }) {
            return /* html */`
                <section class="screen" data-step="summary">
                    <div class="summary-card">
                        <span class="badge">
                            <i class="ph ph-check-circle"></i>
                            受付内容を確認
                        </span>
                        <div class="name">${currentUser.name}</div>
                        <div class="detail-row"><span>学年</span><span>${currentUser.grade}</span></div>
                        <div class="detail-row"><span>同伴者</span><span>${currentUser.companions} 名</span></div>
                        <div class="detail-row"><span>ステータス</span><span>${isWaiting ? '割り当て待機' : '仮確定'}</span></div>
                    </div>
                    <section class="screen" style="box-shadow:none; background:transparent; padding:0; gap:18px;">
                        <header class="screen-header">
                            <h2 class="screen-title" style="font-size:1.2rem;">選択したプログラム</h2>
                        </header>
                        <div class="timeline">
                            ${currentUser.choices.map((choiceId, index) => {
                                const program = state.programs.find(p => p.id === choiceId);
                                if (!program) return '';
                                return `
                                    <div class="timeline-item">
                                        <div class="dot"></div>
                                        <div class="content">
                                            <strong>${['第1希望','第2希望','第3希望'][index]}</strong><br>
                                            ${program.title}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </section>
                    <div class="bottom-actions">
                        <button class="secondary-button" data-action="edit-programs">プログラムを変更</button>
                        <button class="primary-button" data-action="finalize">
                            <span>${isWaiting ? '待機として保存' : '受付を確定する'}</span>
                            <i class="ph ph-paper-plane-tilt"></i>
                        </button>
                    </div>
                </section>
            `;
        },
        briefingOnly({ currentUser }) {
            return /* html */`
                <section class="screen" data-step="briefing-only">
                    <div class="summary-card">
                        <span class="badge">
                            <i class="ph ph-megaphone"></i>
                            工学部説明会の受付
                        </span>
                        <div class="name">${currentUser.name}</div>
                        <p>キャップストーン体験への参加はありません。説明会会場までご案内します。</p>
                        <button class="primary-button" data-action="finalize-briefing">
                            受付を完了
                        </button>
                    </div>
                </section>
            `;
        },
        success({ currentUser, assignedProgram, isWaiting }) {
            return /* html */`
                <section class="screen" data-step="success">
                    <div class="summary-card">
                        <span class="badge">
                            <i class="ph ph-confetti"></i>
                            受付が完了しました！
                        </span>
                        <div class="name">${currentUser.name} 様</div>
                        <div class="detail-row"><span>学年</span><span>${currentUser.grade}</span></div>
                        <div class="detail-row"><span>同伴者</span><span>${currentUser.companions} 名</span></div>
                        <div class="detail-row"><span>ステータス</span><span>${isWaiting ? '割り当て待機中' : 'プログラム確定'}</span></div>
                    </div>
                    <section class="screen" style="box-shadow:none; background:transparent; padding:0; gap:18px;">
                        <header class="screen-header">
                            <h2 class="screen-title" style="font-size:1.2rem;">${isWaiting ? '会場スタッフに待機札をお受け取りください。' : '確定したプログラム'}</h2>
                        </header>
                        <div class="timeline">
                            ${(isWaiting ? currentUser.choices : [assignedProgram?.id]).map((choiceId) => {
                                const program = state.programs.find(p => p.id === choiceId);
                                if (!program) return '';
                                return `
                                    <div class="timeline-item">
                                        <div class="dot"></div>
                                        <div class="content">
                                            ${program.title}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </section>
                    <button class="primary-button" data-action="back-home">
                        <i class="ph ph-house"></i>
                        最初の画面にもどる
                    </button>
                </section>
            `;
        }
    };

    const render = () => {
        const root = document.getElementById(APP_ROOT_ID);
        if (!root) return;
        switch (state.step) {
            case Steps.LANDING:
                root.innerHTML = templates.landing();
                break;
            case Steps.RESERVED_NAME:
                root.innerHTML = templates.reservedName(state.reservedName);
                break;
            case Steps.WALKIN_FORM:
                root.innerHTML = templates.walkinForm(state.walkin);
                break;
            case Steps.PROGRAM_SELECT:
                root.innerHTML = templates.programSelect({
                    programs: state.programs,
                    choices: state.choices,
                    currentUser: state.currentUser || state.walkin
                });
                break;
            case Steps.SUMMARY:
                root.innerHTML = templates.summary({
                    currentUser: state.currentUser,
                    assignedProgram: state.assignedProgram,
                    isWaiting: state.isWaiting
                });
                break;
            case Steps.BRIEFING_ONLY:
                root.innerHTML = templates.briefingOnly({
                    currentUser: state.currentUser
                });
                break;
            case Steps.SUCCESS:
                root.innerHTML = templates.success({
                    currentUser: state.currentUser,
                    assignedProgram: state.assignedProgram,
                    isWaiting: state.isWaiting
                });
                break;
        }
        attachEventHandlers();
    };

    const showToast = (message, duration = 2600) => {
        const toast = document.getElementById(TOAST_ID);
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(state.lastToast);
        const timeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, duration);
        setState({ lastToast: timeout });
    };

    const updateNetworkBanner = () => {
        const banner = document.getElementById(NETWORK_BANNER_ID);
        if (!banner) return;
        if (state.status.online) {
            banner.textContent = 'オンライン接続中';
            banner.classList.add('visible');
            setTimeout(() => banner.classList.remove('visible'), 1600);
        } else {
            banner.textContent = 'ネットワークに接続できません';
            banner.classList.add('visible');
        }
    };

    const ensureFirebase = () => {
        if (!window.firebase || !window.firebase.firestore) {
            console.warn('Firebase initialization pending');
            return null;
        }
        return window.firebase.firestore();
    };

    const loadPrograms = async () => {
        setState({ status: { ...state.status, syncing: true } });
        try {
            const db = ensureFirebase();
            if (!db) throw new Error('Firestore is not ready');
            const snapshot = await db.collection('programs').orderBy('order').get();
            const programs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setState({ programs, status: { ...state.status, syncing: false } });
        } catch (error) {
            console.error('Failed to load programs', error);
            showToast('プログラム一覧を取得できませんでした');
            setState({ status: { ...state.status, syncing: false } });
        }
    };

    const checkReservation = async (name) => {
        const cleaned = name.trim();
        if (!cleaned) {
            showToast('お名前を入力してください');
            return;
        }
        setState({ status: { ...state.status, syncing: true } });
        try {
            const db = ensureFirebase();
            if (!db) throw new Error('Firestore is not ready');
            const snapshot = await db.collection('reservations').where('name', '==', cleaned).limit(1).get();
            if (snapshot.empty) {
                showToast('予約が見つかりません。「予約なし」で受付してください。');
                setState({ status: { ...state.status, syncing: false } });
                return;
            }
            const reservation = snapshot.docs[0].data();
            const merged = {
                name: reservation.name,
                furigana: reservation.furigana || '',
                school: reservation.school || '',
                grade: reservation.grade || '',
                companions: reservation.companions ?? 0,
                choices: Array.isArray(reservation.choices) ? reservation.choices : []
            };
            setState({
                currentUser: merged,
                choices: [...merged.choices],
                step: Steps.SUMMARY,
                status: { ...state.status, syncing: false },
                isWaiting: false
            });
            showToast('予約内容を読み込みました');
        } catch (error) {
            console.error('Reservation check failed', error);
            showToast('通信エラーが発生しました');
            setState({ status: { ...state.status, syncing: false } });
        }
    };

    const attachEventHandlers = () => {
        const root = document.getElementById(APP_ROOT_ID);
        if (!root) return;

        root.querySelectorAll('[data-action="go-reserved"]').forEach(el => {
            el.addEventListener('click', () => setState({ step: Steps.RESERVED_NAME }));
        });

        root.querySelectorAll('[data-action="go-walkin"]').forEach(el => {
            el.addEventListener('click', () => {
                setState({ step: Steps.WALKIN_FORM, currentUser: null, isWaiting: false, choices: [] });
            });
        });

        const backButton = root.querySelector('[data-action="back"]');
        if (backButton) {
            backButton.addEventListener('click', () => {
                setState({ step: Steps.LANDING, currentUser: null, choices: [] });
            });
        }

        const reservedForm = root.querySelector('[data-form="reserved"]');
        if (reservedForm) {
            reservedForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(reservedForm);
                const name = formData.get('reservedName') ?? '';
                setState({ reservedName: name });
                checkReservation(name);
            });
        }

        const walkinForm = root.querySelector('[data-form="walkin"]');
        if (walkinForm) {
            walkinForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(walkinForm);
                const payload = Object.fromEntries(formData.entries());
                const requiredFields = ['name', 'furigana', 'grade', 'companions'];
                for (const field of requiredFields) {
                    if (!payload[field]) {
                        showToast('必須項目をすべて入力してください');
                        return;
                    }
                }
                const companions = Number(payload.companions);
                if (Number.isNaN(companions) || companions < 0) {
                    showToast('同伴者人数を正しく選択してください');
                    return;
                }
                const nextUser = {
                    name: payload.name.trim(),
                    furigana: payload.furigana.trim(),
                    school: payload.school?.trim() ?? '',
                    grade: payload.grade,
                    companions,
                    choices: []
                };
                setState({ currentUser: nextUser, step: Steps.PROGRAM_SELECT, choices: [] });
            });

            const briefingBtn = walkinForm.querySelector('[data-action="briefing-only"]');
            if (briefingBtn) {
                briefingBtn.addEventListener('click', () => {
                    const formData = new FormData(walkinForm);
                    const payload = Object.fromEntries(formData.entries());
                    const nextUser = {
                        name: (payload.name ?? '').trim(),
                        furigana: (payload.furigana ?? '').trim(),
                        school: (payload.school ?? '').trim(),
                        grade: payload.grade || '未設定',
                        companions: Number(payload.companions || 0),
                        choices: []
                    };
                    if (!nextUser.name || !nextUser.furigana) {
                        showToast('お名前とフリガナを入力してください');
                        return;
                    }
                    setState({ currentUser: nextUser, step: Steps.BRIEFING_ONLY });
                });
            }
        }

        root.querySelectorAll('.program-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const id = chip.dataset.programId;
                if (!id) return;
                const existingIndex = state.choices.findIndex(choice => choice === id);
                if (existingIndex >= 0) {
                    const nextChoices = state.choices.filter(choice => choice !== id);
                    setState({ choices: nextChoices });
                    render();
                    return;
                }
                if (state.choices.length >= 3) {
                    showToast('選択できるのは3つまでです');
                    return;
                }
                setState({ choices: [...state.choices, id] });
                render();
            });
        });

        const clearButton = root.querySelector('[data-action="clear-choices"]');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                setState({ choices: [] });
                render();
            });
        }

        const confirmButton = root.querySelector('[data-action="confirm-choices"]');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                if (state.choices.length === 0) {
                    showToast('希望プログラムを選択してください');
                    return;
                }
                const uniqueChoices = new Set(state.choices);
                if (uniqueChoices.size !== state.choices.length) {
                    showToast('同じプログラムを複数選択できません');
                    return;
                }
                const nextUser = {
                    ...state.currentUser,
                    choices: [...state.choices]
                };
                setState({
                    currentUser: nextUser,
                    step: Steps.SUMMARY,
                    isWaiting: false,
                    assignedProgram: null
                });
            });
        }

        const editProgramsBtn = root.querySelector('[data-action="edit-programs"]');
        if (editProgramsBtn) {
            editProgramsBtn.addEventListener('click', () => setState({ step: Steps.PROGRAM_SELECT }));
        }

        const finalizeBtn = root.querySelector('[data-action="finalize"]');
        if (finalizeBtn) {
            finalizeBtn.addEventListener('click', () => finalizeSubmission());
        }

        const finalizeBriefing = root.querySelector('[data-action="finalize-briefing"]');
        if (finalizeBriefing) {
            finalizeBriefing.addEventListener('click', () => finalizeSubmission({ briefingOnly: true }));
        }

        const backHomeBtn = root.querySelector('[data-action="back-home"]');
        if (backHomeBtn) {
            backHomeBtn.addEventListener('click', () => {
                setState(clone(initialState));
                render();
            });
        }
    };

    const finalizeSubmission = async ({ briefingOnly = false } = {}) => {
        if (!state.currentUser) {
            showToast('受付情報が見つかりません');
            return;
        }
        setState({ status: { ...state.status, syncing: true } });
        try {
            const db = ensureFirebase();
            if (!db) throw new Error('Firestore is not ready');
            const payload = {
                name: state.currentUser.name,
                furigana: state.currentUser.furigana,
                school: state.currentUser.school,
                grade: state.currentUser.grade,
                companions: state.currentUser.companions,
                choices: briefingOnly ? [] : state.currentUser.choices,
                status: briefingOnly ? 'briefing_only' : 'registered',
                createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
            };
            if (!briefingOnly && state.currentUser.choices.length > 0) {
                payload.status = 'waiting';
            }
            await db.collection('participants').add(payload);
            setState({
                step: Steps.SUCCESS,
                assignedProgram: null,
                isWaiting: !briefingOnly && (state.currentUser.choices.length > 0),
                status: { ...state.status, syncing: false }
            });
            showToast('受付内容を保存しました');
        } catch (error) {
            console.error('Failed to finalize submission', error);
            showToast('通信エラーが発生しました');
            setState({ status: { ...state.status, syncing: false } });
        }
    };

    const initNetworkListeners = () => {
        window.addEventListener('online', () => {
            setState({ status: { ...state.status, online: true } });
            updateNetworkBanner();
        });
        window.addEventListener('offline', () => {
            setState({ status: { ...state.status, online: false } });
            updateNetworkBanner();
        });
        updateNetworkBanner();
    };

    const attachGlobalListeners = () => {
        subscribe(render);
        subscribe(updateNetworkBanner);
    };

    const init = async () => {
        attachGlobalListeners();
        render();
        initNetworkListeners();
        await loadPrograms();
    };

    document.addEventListener('DOMContentLoaded', init);
})();

