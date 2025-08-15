document.addEventListener('DOMContentLoaded', () => {
    // --- IndexedDB データベース管理 ---
    const dbName = 'KUASReceptionDB';
    const dbVersion = 1;
    let db;

    // IndexedDB初期化
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // ユーザーデータ用のストア
                if (!db.objectStoreNames.contains('userData')) {
                    const userStore = db.createObjectStore('userData', { keyPath: 'id' });
                    userStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // フォームデータ用のストア
                if (!db.objectStoreNames.contains('formData')) {
                    const formStore = db.createObjectStore('formData', { keyPath: 'id' });
                    formStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    // --- HTMLエスケープユーティリティ ---
    function escapeHTML(value) {
        if (value == null) return '';
        return String(value).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
    }

    // データ保存時の視覚的フィードバック
    function showSaveIndicator(message = 'データを保存しました') {
        // 既存のインジケーターがあれば削除
        const existingIndicator = document.querySelector('.save-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // 新しいインジケーターを作成
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.innerHTML = `<i class="ph-check-circle"></i> ${escapeHTML(message)}`;
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(15, 140, 82, 0.95);
            color: white;
            padding: 14px 20px;
            border-radius: 12px;
            font-size: 18px;
            line-height: 1.4;
            z-index: 2001;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 10px 24px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        // アイコンを少し大きく
        const iconEl = indicator.querySelector('i');
        if (iconEl) {
            iconEl.style.fontSize = '22px';
        }

        // アニメーション
        setTimeout(() => {
            indicator.style.opacity = '1';
            indicator.style.transform = 'translateX(0)';
        }, 100);
        
        // 3秒後に消去
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateX(100%)';
            setTimeout(() => indicator.remove(), 300);
        }, 3000);
    }

    // データ保存（保存インジケーターなし）
    async function saveData(storeName, data) {
        try {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const saveData = {
                ...data,
                timestamp: Date.now()
            };
            
            await store.put(saveData);
        } catch (error) {
            console.error('データ保存エラー:', error);
        }
    }

    // データ保存（保存インジケーターあり）
    async function saveDataWithIndicator(storeName, data, message = 'データを保存しました') {
        try {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const saveData = {
                ...data,
                timestamp: Date.now()
            };
            
            await store.put(saveData);
            showSaveIndicator(message);
        } catch (error) {
            console.error('データ保存エラー:', error);
        }
    }

    // データ取得
    async function getData(storeName, id) {
        try {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('データ取得エラー:', error);
            return null;
        }
    }

    // データ削除
    async function deleteData(storeName, id) {
        try {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.delete(id);
        } catch (error) {
            console.error('データ削除エラー:', error);
        }
    }

    // フォームデータ保存
    function saveFormData() {
        const formData = {
            id: 'currentForm',
            reservedName: document.getElementById('student-name')?.value || '',
            walkInName: document.getElementById('walk-in-name')?.value || '',
            walkInSchool: document.getElementById('walk-in-school')?.value || '',
            walkInGrade: document.getElementById('walk-in-grade')?.value || '',
            currentChoices: currentChoices,
            currentSection: getCurrentSection()
        };
        
        saveData('formData', formData);
    }

    // 受付データ保存（確定済みリストと待機者リスト）
    function saveReceptionData() {
        const receptionData = {
            id: 'receptionData',
            confirmedAttendees: confirmedAttendees,
            waitingList: waitingList,
            programEnrollment: programEnrollment
        };
        
        saveData('userData', receptionData);
    }

    // 名簿データ保存
    function saveRosterData() {
        const rosterData = {
            id: 'rosterData',
            rosterMappingInfo: rosterMappingInfo,
            reservations: reservations,
            briefingSessionAttendees: briefingSessionAttendees
        };
        
        saveData('userData', rosterData);
    }

    // 受付データ復元
    async function restoreReceptionData() {
        const data = await getData('userData', 'receptionData');
        if (data) {
            if (data.confirmedAttendees) {
                confirmedAttendees = data.confirmedAttendees;
            }
            if (data.waitingList) {
                waitingList = data.waitingList;
            }
            if (data.programEnrollment) {
                programEnrollment = data.programEnrollment;
            }
            
            // 復元完了時にインジケーターを表示
            showSaveIndicator('受付データを復元しました');
        }
    }

    // フォームデータ復元
    async function restoreFormData() {
        const data = await getData('formData', 'currentForm');
        if (data) {
            // フォームフィールドに復元
            if (data.reservedName && document.getElementById('student-name')) {
                document.getElementById('student-name').value = data.reservedName;
            }
            if (data.walkInName && document.getElementById('walk-in-name')) {
                document.getElementById('walk-in-name').value = data.walkInName;
            }
            if (data.walkInSchool && document.getElementById('walk-in-school')) {
                document.getElementById('walk-in-school').value = data.walkInSchool;
            }
            if (data.walkInGrade && document.getElementById('walk-in-grade')) {
                document.getElementById('walk-in-grade').value = data.walkInGrade;
            }
            
            // 選択状態を復元
            if (data.currentChoices) {
                currentChoices = data.currentChoices;
            }
            
            // セクションを復元
            if (data.currentSection) {
                showSection(data.currentSection);
            }
            
            // 復元完了時にインジケーターを表示
            showSaveIndicator('データを復元しました');
        }
    }

    // 現在のセクションを取得
    function getCurrentSection() {
        const current = document.querySelector('#reception-sections-wrapper .section:not(.section-hidden)');
        return current ? current.id : 'initial-selection';
    }

    // 自動保存の設定
    function setupAutoSave() {
        // フォーム入力時の自動保存
        const formInputs = ['student-name', 'walk-in-name', 'walk-in-school', 'walk-in-grade'];
        formInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    setTimeout(saveFormData, 500); // 500ms遅延で保存
                });
            }
        });
    }

    // データベース初期化と復元
    async function initializeApp() {
        try {
            await initDB();
            await restoreFormData();
            await restoreReceptionData(); // 受付データも復元
            setupAutoSave();
        } catch (error) {
            console.error('アプリ初期化エラー:', error);
        }
    }

    // アプリケーション開始時にデータベースを初期化
    initializeApp();

    // --- データ（本来はExcelから読み込む） ---
    let programs = [
        { id: 'p1', title: '“紙”技エンジニアリング！', description: '一枚の紙をどれだけ長くできるか？どれだけの重さを支えられるか？切り方一つで変わる紙の可能性を切り拓こう！', capacity: 10, title_en: 'Paper Engineering Tricks!', description_en: 'How long can a single sheet of paper become? How much weight can it hold? Explore the surprising potential of paper with clever cuts and design.' },
        { id: 'p2', title: 'ChatGPTを操ろう！', description: 'いま話題の生成AIを使って、難しいコードのプログラミングなしで、楽しくアプリ作りに挑戦！', capacity: 15, title_en: 'Master ChatGPT!', description_en: 'Use trending generative AI to create fun apps without complex coding. Try hands-on building with ChatGPT as your partner.' },
        { id: 'p3', title: '現代の金属魔法？', description: '強靭なピアノ線を素手で折る！曲がった針金を一瞬で真っ直ぐに！身近な金属の不思議な現象を、実験で解き明かそう。', capacity: 10, title_en: 'Modern Metal Magic?', description_en: 'Snap tough piano wire with your bare hands? Straighten bent wire in an instant? Uncover the curious behavior of everyday metals through experiments.' },
        { id: 'p4', title: '電気の不思議を探ろう！', description: '1Vでは光らないLEDが、電気回路を工夫すれば光りだす？！電気の不思議を徹底調査して、謎を解き明かそう！', capacity: 12, title_en: 'Explore the Wonders of Electricity!', description_en: 'An LED won\'t light at 1V—unless you design the circuit cleverly! Investigate the mysteries of electricity and figure out why.' },
        { id: 'p5', title: '重力を自在に操ろう！', description: 'モノの落下スピードが自在に変えられる？！ニュートンもびっくりの「強磁場」の世界を楽しもう♪', capacity: 8, title_en: 'Bend Gravity at Will!', description_en: 'Change how fast objects fall?! Step into the world of strong magnetic fields—an experience that would amaze even Newton.' }
    ];

    // デフォルトの英語翻訳（既存データに不足がある場合に補完）
    const defaultEnglishById = {
        p1: { title_en: 'Paper Engineering Tricks!', description_en: 'How long can a single sheet of paper become? How much weight can it hold? Explore the surprising potential of paper with clever cuts and design.' },
        p2: { title_en: 'Master ChatGPT!', description_en: 'Use trending generative AI to create fun apps without complex coding. Try hands-on building with ChatGPT as your partner.' },
        p3: { title_en: 'Modern Metal Magic?', description_en: 'Snap tough piano wire with your bare hands? Straighten bent wire in an instant? Uncover the curious behavior of everyday metals through experiments.' },
        p4: { title_en: 'Explore the Wonders of Electricity!', description_en: 'An LED won\'t light at 1V—unless you design the circuit cleverly! Investigate the mysteries of electricity and figure out why.' },
        p5: { title_en: 'Bend Gravity at Will!', description_en: 'Change how fast objects fall?! Step into the world of strong magnetic fields—an experience that would amaze even Newton.' }
    };

    function injectDefaultEnglishIfMissing() {
        programs = programs.map(p => {
            const def = defaultEnglishById[p.id];
            if (!def) return p;
            const titleEn = p.title_en && p.title_en.trim() ? p.title_en : def.title_en;
            const descEn = p.description_en && p.description_en.trim() ? p.description_en : def.description_en;
            return { ...p, title_en: titleEn, description_en: descEn };
        });
    }
    let reservations = [ { name: '山田 太郎', choices: ['p1', 'p3', 'p2'] }, { name: '佐藤 花子', choices: ['p2', 'p5', 'p1'] } ];
    let briefingSessionAttendees = [];
    
    let programEnrollment = {};
    let confirmedAttendees = [];
    let waitingList = [];
    let currentChoices = { 1: null, 2: null, 3: null };
    let currentUser = null;
    let sortable = null;
    let navigationHistory = [];
    let currentLanguage = 'ja';
    let currentTheme = 'light';
    let settings = {
        prioritizeReserved: true,
        prioritizeGrade: true // 予約なしの学年優先（デフォルトON）
    };

// 管理パネル（プログラム編集）の未保存変更フラグ
let adminEditorDirty = false;

// 名簿マッピング情報（どの列がどのフィールドかの記録）
let rosterMappingInfo = { reservations: null, briefing: null };

    // --- 多言語対応 ---
    const translations = {
        ja: {
            mainTitle: "工学部ミニキャップストーン体験 受付",
            reserved: "予約あり",
            walkIn: "予約なし",
            back: "戻る",
            enterFullName: "お名前をフルネームで入力してください",
            reservedNameInputTitle: "予約あり - お名前入力",
            walkInNameInputTitle: "予約なし - お名前入力",
            namePlaceholder: "例：山田 太郎",
            checkReservation: "予約を確認する",
            confirmDetails: "ご予約内容の確認",
            confirmSubmit: "この内容で確定",
            changeReservation: "希望を変更する",
            name: "お名前",
            school: "学校名",
            schoolPlaceholder: "例：〇〇高等学校",
            grade: "学年",
            selectGrade: "選択してください",
            grade1: "高校1年生",
            grade2: "高校2年生",
            grade3: "高校3年生",
            other: "その他",
            toProgramSelection: "キャップストーン体験プログラム選択へ",
            selectProgramTitle: "希望プログラムを選択してください",
            selectProgramDesc: "第1〜第3希望まで選択できます。",
            confirmChoices: "選択を確定する",
            successTitle: "受付が完了しました！",
            successDesc: "あなたは以下のプログラムに確定しました。",
            successWaiting: "受付が完了しました。プログラムは後ほど割り当てられます。",
            backToHome: "最初の画面に戻る",
            adminPanel: "管理パネル",
            tabProgramEdit: "プログラム編集",
            tabFileLoad: "ファイル読み込み",
            tabRoster: "名簿プレビュー",
            tabStatus: "受付状況",
            tabSettings: "設定",
            jsonEditor: "JSON表示/編集",
            applyJson: "JSONを適用",
            addProgram: "＋ プログラムを追加",
            saveChanges: "変更を保存",
            fileUpload1: "① ミニキャップストーン体験 予約者名簿 (xlsx)",
            fileUpload2: "② 工学部説明会 予約者名簿 (xlsx)",
            loadProgress: "③ 進行状況を読み込む (.json)",
            exportExcel: "Excelファイルに書き出し",
            rosterMapping: "列の対応: A列=氏名, B列=第1希望, C列=第2希望, D列=第3希望",
            rosterReservations: "ミニキャップストーン体験 予約者名簿",
            rosterBriefing: "工学部説明会 参加者名簿",
            saveProgress: "進行状況を保存",
            backToReception: "受付画面に戻る",
            adminLogin: "管理者ログイン",
            password: "パスワード",
            login: "ログイン",
            cancel: "キャンセル",
            choice1: "第1希望",
            choice2: "第2希望",
            choice3: "第3希望",
            nameHeader: "お名前",
            programHeader: "プログラム",
            statusHeader: "受付状況 (人)",
            attendeesHeader: "参加者一覧",
            waitingHeader: "割り当て待機中",
            furiganaHeader: "フリガナ",
            timeHeader: "時間",
            noAttendees: "まだいません",
            unselected: "未選択",
            titleLabel: "タイトル",
            descriptionLabel: "説明文",
            capacityLabel: "定員",
            deleteButton: "削除",
            showTranslation: "英語翻訳表示",
            autoTranslate: "自動英訳",
            titleEnLabel: "タイトル(英)",
            descriptionEnLabel: "説明文(英)",
            full: "定員いっぱいです",
            assignWaiting: "待機者を一括割り当て",
            prioritizeReserved: "予約者優先割り当て",
            prioritizeDesc: "この設定をONにすると、予約なしの参加者は受付時に「割り当て待機」状態になります。全員の受付完了後、「受付状況」タブの「待機者を一括割り当て」ボタンを押してプログラムを確定してください。",
            prioritizeGrade: "学年優先割り当て（予約なし）",
            prioritizeGradeDesc: "ONのとき、予約なしの待機者を学年（高3→高2→高1→その他）の優先順で割り当てます。OFFのときは先着順です。",
            confirmedList: "確定済みリスト",
            waitingList: "待機者リスト",
            cardView: "カード表示",
            totalConfirmed: "確定済み合計",
            totalWaiting: "待機中合計",
            totalAttendees: "受付合計",
            resetData: "受付データをリセット",
            // Alert Messages
            errorEnterName: "お名前を入力してください。",
            errorNotFound: "予約が見つかりません。お名前をご確認いただくか、当日参加として受付してください。",
            errorAllFields: "すべての項目を入力してください。",
            errorSelectProgram: "希望プログラムを一つ以上選択してください。",
            errorJsonFormat: "JSONの形式が正しくありません。",
            infoJsonApplied: "JSONからデータを適用しました。",
            infoChangesSaved: "変更を保存しました。",
            settingsSaved: "設定を保存しました。",
            errorProgramFull: "このプログラムは満員です。別のプログラムを選択してください。",
            errorInvalidProgram: "プログラムのデータに不整合があります。別のプログラムを選択してください。",
            errorDuplicateChoices: "同じプログラムを複数の希望に指定することはできません。",
            errorUnexpected: "予期しないエラーが発生しました。やり直してください。",
            confirmDelete: (title) => `「${title}」を削除しますか？`,
            assignConfirm: (count) => `${count}人をプログラムに割り当てます。よろしいですか？`,
            assignComplete: (count) => `${count}人の割り当てが完了しました。`,
            noWaiting: "待機中の参加者はいません。",
            noRosterData: "名簿データがインポートされていません。管理画面から名簿ファイルをインポートしてください。",
            resetConfirm: "すべての受付データ（確定、待機リスト）がリセットされます。この操作は元に戻せません。よろしいですか？",
            resetComplete: "データをリセットしました。ページを再読み込みします。",
            reloadDisabled: "データの損失を防ぐため、このページでの再読み込みは無効になっています。",
            errorAlreadyRegistered: "あなたはすでに受付済みまたは待機中です。",
            wrongPassword: "パスワードが間違っています。",
            noChoicesProvided: "あなたはご予約時にプログラム希望を出していないので、希望を出す必要があります。",
            nameSpaceNote: "※ 姓と名の間にスペースを入力してください",
            scheduleTitle: "スケジュール",
                            noCapstoneExperience: "キャップストーン体験に参加しない",
                noCapstoneTitle: "キャップストーン体験に参加しない",
                noCapstoneDesc: "キャップストーン体験に参加しない場合の受付が完了しました。",
                noCapstoneInfo: "工学部説明会のみに参加される場合は、別途説明会の受付をお願いします。",
                noCapstoneBriefingTime: "{name}様、あなたの工学部説明会は{time}から始まります。",
            statusConfirmed: "確定済み",
            statusWaiting: "待機中",
            statusNotRegistered: "未受付"
        },
        en: {
            mainTitle: "Faculty of Engineering Mini-Capstone Experience Reception",
            reserved: "Reserved",
            walkIn: "Walk-in",
            back: "Back",
            enterFullName: "Please enter your full name",
            reservedNameInputTitle: "Reserved - Enter Your Name",
            walkInNameInputTitle: "Walk-in - Enter Your Name",
            namePlaceholder: "e.g., Taro Yamada",
            checkReservation: "Check Reservation",
            confirmDetails: "Confirm Your Details",
            confirmSubmit: "Confirm",
            changeReservation: "Change Preferences",
            name: "Name",
            school: "School Name",
            schoolPlaceholder: "e.g., Example High School",
            grade: "Grade",
            selectGrade: "Please select",
            grade1: "1st Year High School",
            grade2: "2nd Year High School",
            grade3: "3rd Year High School",
            other: "Other",
            toProgramSelection: "Select Capstone Experience Program",
            selectProgramTitle: "Select Your Preferred Programs",
            selectProgramDesc: "You may choose up to three preferences.",
            confirmChoices: "Confirm Selection",
            successTitle: "Registration Complete!",
            successDesc: "You have been assigned to the following program.",
            successWaiting: "Registration is complete. Your program will be assigned later.",
            backToHome: "Back to Home",
            adminPanel: "Admin Panel",
            tabProgramEdit: "Edit Programs",
            tabFileLoad: "Load Files",
            tabRoster: "Roster Preview",
            tabStatus: "Status",
            tabSettings: "Settings",
            jsonEditor: "View/Edit JSON",
            applyJson: "Apply JSON",
            addProgram: "+ Add Program",
            saveChanges: "Save Changes",
            fileUpload1: "① Capstone Experience Reservation Roster (xlsx)",
            fileUpload2: "② Faculty Briefing Session Roster (xlsx)",
            loadProgress: "③ Load Progress (.json)",
            exportExcel: "Export to Excel",
            rosterMapping: "Column mapping: A=Name, B=1st Choice, C=2nd Choice, D=3rd Choice",
            rosterReservations: "Mini-Capstone Reservation Roster",
            rosterBriefing: "Faculty Briefing Session Roster",
            rosterSearchPlaceholder: "Search by name/kana",
            rosterOthers: "Others",
            saveProgress: "Save Progress",
            backToReception: "Back to Reception",
            adminLogin: "Admin Login",
            password: "Password",
            login: "Login",
            cancel: "Cancel",
            choice1: "1st Choice",
            choice2: "2nd Choice",
            choice3: "3rd Choice",
            nameHeader: "Name",
            programHeader: "Program",
            statusHeader: "Status (Count)",
            attendeesHeader: "Attendees",
            waitingHeader: "Waiting for Assignment",
            furiganaHeader: "Furigana",
            timeHeader: "Time",
            noAttendees: "None yet",
            unselected: "Not selected",
            titleLabel: "Title",
            descriptionLabel: "Description",
            capacityLabel: "Capacity",
            deleteButton: "Delete",
            showTranslation: "Show English Translation",
            autoTranslate: "Auto Translate",
            titleEnLabel: "Title (EN)",
            descriptionEnLabel: "Desc (EN)",
            full: "This program is full",
            assignWaiting: "Assign All Waiting",
            prioritizeReserved: "Prioritize Reserved Attendees",
            prioritizeDesc: "When this is ON, walk-in attendees will be put on a waiting list. After all registrations are complete, press the 'Assign All Waiting' button in the 'Status' tab to assign them to programs.",
            prioritizeGrade: "Prioritize Grade (Walk-ins)",
            prioritizeGradeDesc: "When ON, assign walk-in waitlist by grade priority (HS3 > HS2 > HS1 > Others). When OFF, use first-come-first-served.",
            confirmedList: "Confirmed List",
            waitingList: "Waiting List",
            cardView: "Card View",
            totalConfirmed: "Total Confirmed",
            totalWaiting: "Total Waiting",
            totalAttendees: "Total Attendees",
            resetData: "Reset Reception Data",
            // Alert Messages
            errorEnterName: "Please enter your name.",
            errorNotFound: "Reservation not found. Please check the name or register as a walk-in.",
            errorAllFields: "Please fill in all fields.",
            errorSelectProgram: "Please select at least one program.",
            errorJsonFormat: "Invalid JSON format.",
            infoJsonApplied: "Applied data from JSON.",
            infoChangesSaved: "Changes have been saved.",
            settingsSaved: "Settings have been saved.",
            errorProgramFull: "This program is full. Please select another program.",
            errorInvalidProgram: "Program data is inconsistent. Please select another program.",
            errorDuplicateChoices: "You cannot select the same program for multiple preferences.",
            errorUnexpected: "An unexpected error occurred. Please try again.",
            confirmDelete: (title) => `Are you sure you want to delete "${title}"?`,
            assignConfirm: (count) => `Assign ${count} people to programs. Are you sure?`,
            assignComplete: (count) => `Assignment for ${count} people is complete.`,
            noWaiting: "There are no attendees on the waiting list.",
            noRosterData: "Roster data has not been imported. Please import roster files from the admin panel.",
            resetConfirm: "All reception data (confirmed and waiting lists) will be reset. This action cannot be undone. Are you sure?",
            resetComplete: "Data has been reset. The page will now reload.",
            reloadDisabled: "To prevent data loss, reloading this page has been disabled.",
            errorAlreadyRegistered: "You have already registered or are on the waiting list.",
            wrongPassword: "Incorrect password.",
            noChoicesProvided: "You did not provide program preferences when reserving. Please select your preferences.",
            nameSpaceNote: "※ Please enter a space between your first and last name",
                            scheduleTitle: "Schedule",
                            noCapstoneExperience: "Do not participate in the Capstone Experience",
                noCapstoneTitle: "Do not participate in the Capstone Experience",
                noCapstoneDesc: "Registration for not participating in the Capstone Experience is complete.",
                noCapstoneInfo: "If you are only participating in the Faculty Briefing Session, please register separately for the briefing session.",
                noCapstoneBriefingTime: "Mr./Ms. {name}, your Faculty Briefing Session starts at {time}.",
            statusConfirmed: "Confirmed",
            statusWaiting: "Waiting",
            statusNotRegistered: "Not Registered"
        }
    };

    function updateLanguage(lang) {
        currentLanguage = lang;
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            const translation = translations[lang][key];
            if (typeof translation === 'function') return;
            if (translation) {
                el.textContent = translation;
            }
        });
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
            const key = el.dataset.langKeyPlaceholder;
             if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });
        // 動的な部分も更新
        const currentVisibleSection = document.querySelector('#reception-sections-wrapper .section:not(.section-hidden)');
        if (currentVisibleSection && currentVisibleSection.id === 'program-selection-section') {
            renderProgramGrid();
        }
        if (document.getElementById('admin-view').classList.contains('hidden') === false) {
            renderAdminEditor();
            renderStatusTable();
            renderRosterPreview();
        }
        if (currentUser) {
            showConfirmation(currentUser);
        }
        
        // キャップストーン体験に参加しない画面の時間表示を更新
        const briefingTimeEl = document.getElementById('no-capstone-briefing-time');
        if (briefingTimeEl && currentUser && currentUser.noCapstone) {
            const briefingAttendee = briefingSessionAttendees.find(a => a.name === currentUser.name);
            if (briefingAttendee && briefingAttendee.time) {
                const timeMessage = translations[lang].noCapstoneBriefingTime
                    .replace('{name}', currentUser.name)
                    .replace('{time}', briefingAttendee.time);
                briefingTimeEl.textContent = timeMessage;
            } else {
                briefingTimeEl.textContent = translations[lang].noCapstoneInfo;
            }
        }
        
        localStorage.setItem('receptionLang', lang);
    }

    // --- 要素の取得 ---
    const receptionView = document.getElementById('reception-view');
    const adminView = document.getElementById('admin-view');
    const adminEntryBtn = document.getElementById('admin-entry-btn');
    const topBarButtons = document.querySelector('.top-bar-buttons');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const receptionSections = document.querySelectorAll('#reception-view .section');
    const btnBack = document.getElementById('btn-back');
    const customAlertModal = document.getElementById('custom-alert-modal');

    // 初期選択画面（ホーム）のボタン参照と選択状態
    const btnReserved = document.getElementById('btn-reserved');
    const btnWalkIn = document.getElementById('btn-walk-in');
    let homeSelection = null; // 'reserved' | 'walkIn' | null
    function isInitialSelectionVisible() {
        return getCurrentSection() === 'initial-selection';
    }
    function updateHomeSelectionFocus() {
        if (!isInitialSelectionVisible()) return;
        if (homeSelection === 'reserved' && btnReserved) {
            btnReserved.focus();
        } else if (homeSelection === 'walkIn' && btnWalkIn) {
            btnWalkIn.focus();
        }
    }

    // --- カスタムアラート関数 ---
    function showCustomAlert(messageKey, onConfirm, isConfirm = false) {
        const message = translations[currentLanguage][messageKey] || messageKey;
        document.getElementById('alert-message').textContent = message;
        customAlertModal.classList.add('visible');
        // OKボタンの処理を一旦リセット
        const oldOkBtn = document.getElementById('btn-alert-ok');
        const newOkBtn = oldOkBtn.cloneNode(true);
        oldOkBtn.parentNode.replaceChild(newOkBtn, oldOkBtn);

        newOkBtn.addEventListener('click', () => {
            customAlertModal.classList.remove('visible');
            if (onConfirm) onConfirm();
        });
    }

    // --- 画面切り替え関数 ---
    let isAdminBtnVisible = true;

    function setAdminButtonVisibilityWithAnimation(shouldShow) {
        if (!adminEntryBtn || !topBarButtons) return;
        if (shouldShow === isAdminBtnVisible) return;

        if (shouldShow) {
            // Show with slide-in, others move from right (50px) to original
            adminEntryBtn.style.display = 'flex';
            adminEntryBtn.classList.remove('slide-out-right');
            adminEntryBtn.classList.add('slide-in-right');
            topBarButtons.classList.remove('shift-right');
            topBarButtons.classList.remove('shift-left');
            topBarButtons.classList.add('shift-back');
            adminEntryBtn.style.pointerEvents = 'auto';
            adminEntryBtn.style.opacity = '1';
            const onEnd = () => {
                adminEntryBtn.classList.remove('slide-in-right');
                topBarButtons.classList.remove('shift-back');
                adminEntryBtn.removeEventListener('animationend', onEnd);
            };
            adminEntryBtn.addEventListener('animationend', onEnd);
        } else {
            // Hide with slide-out to the right, shift others right by one
            adminEntryBtn.classList.remove('slide-in-right');
            adminEntryBtn.classList.add('slide-out-right');
            topBarButtons.classList.remove('shift-back');
            topBarButtons.classList.add('shift-right');
            adminEntryBtn.style.pointerEvents = 'none';
            adminEntryBtn.style.opacity = '0';
            const onEnd = () => {
                adminEntryBtn.style.display = 'none';
                adminEntryBtn.classList.remove('slide-out-right');
                topBarButtons.classList.remove('shift-right');
                adminEntryBtn.removeEventListener('animationend', onEnd);
            };
            adminEntryBtn.addEventListener('animationend', onEnd);
        }
        isAdminBtnVisible = shouldShow;
    }

    function showSection(sectionId) {
        receptionSections.forEach(section => {
            section.classList.toggle('section-hidden', section.id !== sectionId);
        });
        btnBack.classList.toggle('hidden', sectionId === 'initial-selection' || sectionId === 'success-section');
        setAdminButtonVisibilityWithAnimation(sectionId === 'initial-selection');
        
        // セクション変更時にデータを保存
        setTimeout(saveFormData, 100);
    }

    function showReceptionSection(sectionId) {
        receptionSections.forEach(section => {
            section.classList.toggle('section-hidden', section.id !== sectionId);
        });
        btnBack.classList.toggle('hidden', sectionId === 'initial-selection' || sectionId === 'success-section' || sectionId === 'no-capstone-section');
        setAdminButtonVisibilityWithAnimation(sectionId === 'initial-selection');
        
        // セクション変更時にデータを保存
        setTimeout(saveFormData, 100);

        // 戻るボタンの有無に応じてコンテナ下余白を調整
        const wrapper = document.querySelector('#reception-view .content-wrapper');
        if (wrapper) {
            if (sectionId === 'initial-selection' || sectionId === 'success-section' || sectionId === 'no-capstone-section') {
                wrapper.classList.remove('has-back-btn');
            } else {
                wrapper.classList.add('has-back-btn');
            }
        }

        // 初期選択画面に入ったとき、自動フォーカスは行わない（ロゴクリック時の誤選択を防止）
        if (sectionId === 'initial-selection') {
            homeSelection = null;
        }
    }

    function navigateTo(targetSectionId) {
        const currentSection = document.querySelector('#reception-sections-wrapper .section:not(.section-hidden)');
        if (currentSection) {
            navigationHistory.push(currentSection.id);
        }
        showReceptionSection(targetSectionId);
    }

    function goBack() {
        if (navigationHistory.length > 0) {
            const previousSectionId = navigationHistory.pop();
            showReceptionSection(previousSectionId);
        }
    }
    
    function showAdminView() {
        receptionView.classList.add('hidden');
        adminView.classList.remove('hidden');
        // 設定ボタンをアニメーションで右へ退避
        setAdminButtonVisibilityWithAnimation(false);
        renderAdminEditor();
        renderStatusTable();
    }
    
    function resetReceptionState() {
        document.getElementById('student-name').value = '';
        document.getElementById('walk-in-name').value = '';
        document.getElementById('walk-in-school').value = '';
        document.getElementById('walk-in-grade').value = '';
        currentUser = null;
        currentChoices = { 1: null, 2: null, 3: null };
        navigationHistory = [];
        
        // 保存されたデータを削除
        deleteData('formData', 'currentForm');
    }

    function showReceptionView() {
        adminView.classList.add('hidden');
        receptionView.classList.remove('hidden');
        adminEntryBtn.classList.remove('hidden');
        resetReceptionState();
        showReceptionSection('initial-selection');
    }
    
    // --- 割り当てと完了画面 ---
    function assignProgram(user) {
        for (const choiceId of user.choices) {
            if (choiceId && (programEnrollment[choiceId] || 0) < programs.find(p => p.id === choiceId).capacity) {
                programEnrollment[choiceId]++; 
                const assigned = programs.find(p => p.id === choiceId);
                confirmedAttendees.push({ name: user.name, assignedProgramId: assigned.id });
                saveReceptionData(); // 受付データを保存
                return assigned;
            }
        }
        confirmedAttendees.push({ name: user.name, assignedProgramId: null });
        saveReceptionData(); // 受付データを保存
        return null;
    }

    function showSuccessScreen(name, program, isWaiting = false) {
        const studentNameEl = document.getElementById('success-student-name');
        const programCardEl = document.getElementById('success-program-card');
        const successDesc = document.getElementById('success-message-desc');
        
        studentNameEl.textContent = `${name} 様`;
        
        if(isWaiting) {
            successDesc.textContent = translations[currentLanguage].successWaiting;
            programCardEl.classList.add('hidden');
        } else if (program) {
            successDesc.textContent = translations[currentLanguage].successDesc;
            programCardEl.classList.remove('hidden');
            programCardEl.innerHTML = `<h3>${escapeHTML(program.title)}</h3><p>${escapeHTML(program.description)}</p>`;
            programCardEl.style.borderColor = 'var(--success-color)';
            programCardEl.style.backgroundColor = '#eaf6ec';
        } else {
            successDesc.textContent = translations[currentLanguage].successDesc;
            programCardEl.classList.remove('hidden');
            programCardEl.innerHTML = `<h3>申し訳ありません</h3><p>全ての希望プログラムが満員のため、参加できるプログラムがありません。運営スタッフにお声がけください。</p>`;
            programCardEl.style.borderColor = 'var(--danger-color)';
            programCardEl.style.backgroundColor = '#f8d7da';
        }
        
        navigationHistory = []; // 完了したら履歴をリセット
        navigateTo('success-section');
        
        // 完了時に保存されたデータを削除
        deleteData('formData', 'currentForm');

        // お祝いエフェクト（供給1.5秒、落下鑑賞5秒）
        launchConfetti(1500, 5000);
    }

    // --- コンフェッティ（軽量実装） ---
    function launchConfetti(supplyMs = 1000, tailMs = 5000) {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;
        const colors = ['#8DBF21', '#46A679', '#0F8C52', '#FFD166', '#EF476F', '#118AB2'];
        let particles = [];

        const create = (n) => {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: -20,
                    r: 4 + Math.random() * 6,
                    c: colors[(Math.random() * colors.length) | 0],
                    vx: -2 + Math.random() * 4,
                    vy: 2 + Math.random() * 3,
                    rot: Math.random() * Math.PI,
                    vr: (-0.2 + Math.random() * 0.4)
                });
            }
        };

        let running = true;
        const startAt = performance.now();
        const supplyEndAt = startAt + supplyMs; // 供給終了時刻
        const stopAt = supplyEndAt + tailMs;    // 完全終了目安
        // フェードイン
        canvas.style.opacity = '1';
        const loop = () => {
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
                p.vy += 0.02;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.c;
                ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
                ctx.restore();
            });
            particles = particles.filter(p => p.y < h + 40);
            const now = performance.now();
            // 供給は短く（1秒程度）
            if (now < supplyEndAt) {
                create(5);
            }
            // 全粒子が落下し、鑑賞時間を過ぎたら終了
            if (now >= stopAt && particles.length === 0) {
                running = false;
                // フェードアウトして後片付け
                setTimeout(() => {
                    ctx.clearRect(0, 0, w, h);
                    canvas.style.opacity = '0';
                }, 200);
                return;
            }
            requestAnimationFrame(loop);
        };

        // 初期供給（控えめ）
        create(10);
        loop();

        // リサイズ対応
        const onResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize, { once: true });
    }

    // --- 管理パネルの描画 ---
    function renderAdminEditor() {
        const editorList = document.getElementById('program-editor-list');
        editorList.innerHTML = '';
        programs.forEach((p, index) => {
            const item = document.createElement('li');
            item.className = 'program-editor-item';
            item.dataset.id = p.id;
            item.innerHTML = `
                <div class="editor-item-header">
                    <strong>${escapeHTML(translations[currentLanguage].programHeader || 'プログラム')} ${index + 1}</strong>
                    <i class="ph-list" title="ドラッグして順番変更"></i>
                </div>
                <div class="editor-item-row">
                    <label for="title-${escapeHTML(p.id)}">${escapeHTML(translations[currentLanguage].titleLabel)}</label>
                    <input type="text" id="title-${escapeHTML(p.id)}" value="${escapeHTML(p.title)}" autocomplete="off" spellcheck="false">
                </div>
                <div class="editor-item-row en-translation-field">
                    <label for="title-en-${escapeHTML(p.id)}">${escapeHTML(translations[currentLanguage].titleEnLabel)}</label>
                    <input type="text" id="title-en-${escapeHTML(p.id)}" value="${escapeHTML(p.title_en || '')}" autocomplete="off" spellcheck="false">
                </div>
                <div class="editor-item-row">
                    <label for="desc-${escapeHTML(p.id)}">${escapeHTML(translations[currentLanguage].descriptionLabel)}</label>
                    <textarea id="desc-${escapeHTML(p.id)}" autocomplete="off" spellcheck="false">${escapeHTML(p.description)}</textarea>
                </div>
                <div class="editor-item-row en-translation-field">
                    <label for="desc-en-${escapeHTML(p.id)}">${escapeHTML(translations[currentLanguage].descriptionEnLabel)}</label>
                    <textarea id="desc-en-${escapeHTML(p.id)}" autocomplete="off" spellcheck="false">${escapeHTML(p.description_en || '')}</textarea>
                </div>
                <div class="editor-item-row">
                    <label for="capacity-${escapeHTML(p.id)}">${escapeHTML(translations[currentLanguage].capacityLabel)}</label>
                    <input type="number" id="capacity-${escapeHTML(p.id)}" value="${escapeHTML(p.capacity)}" style="width: 80px; flex-grow: 0;">
                    <div style="margin-left: auto;">
                        <button class="btn btn-danger btn-sm btn-delete-program">${escapeHTML(translations[currentLanguage].deleteButton)}</button>
                    </div>
                </div>
            `;
            editorList.appendChild(item);
        });
        
        document.querySelectorAll('.btn-delete-program').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemToDelete = e.target.closest('.program-editor-item');
                const programId = itemToDelete.dataset.id;
                const programIndex = programs.findIndex(p => p.id === programId);
                if (programIndex > -1) {
                    if (confirm(translations[currentLanguage].confirmDelete(programs[programIndex].title))) {
                        programs.splice(programIndex, 1);
                        adminEditorDirty = true; // 未保存変更あり
                        renderAdminEditor();
                    }
                }
            });
        });

        if (sortable) sortable.destroy();
        const programEditorList = document.getElementById('program-editor-list');
        sortable = new Sortable(programEditorList, {
            animation: 150,
            handle: '.ph-list',
            onEnd: function (evt) {
                const items = programEditorList.querySelectorAll('.program-editor-item');
                items.forEach((item, index) => {
                    item.querySelector('.editor-item-header strong').textContent = `${translations[currentLanguage].programHeader || 'プログラム'} ${index + 1}`;
                });
                adminEditorDirty = true; // 並び替えで未保存変更
            }
        });
        
        document.getElementById('json-editor').value = JSON.stringify(programs, null, 2);

        // 入力・変更で未保存フラグを立てる
        editorList.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('input', () => { adminEditorDirty = true; });
        });

        // 自動英訳機能は削除
    }
    
    function saveChangesFromUI() {
        const editorList = document.getElementById('program-editor-list');
        const newPrograms = [];
        const itemIds = Array.from(editorList.children).map(item => item.dataset.id);

        itemIds.forEach(id => {
            const itemElement = editorList.querySelector(`[data-id="${id}"]`);
            const newTitle = itemElement.querySelector(`#title-${id}`).value;
            const newDesc = itemElement.querySelector(`#desc-${id}`).value;
            const newTitleEn = itemElement.querySelector(`#title-en-${id}`).value;
            const newDescEn = itemElement.querySelector(`#desc-en-${id}`).value;
            const newCapacity = parseInt(itemElement.querySelector(`#capacity-${id}`).value, 10);
            newPrograms.push({ 
                id: id, 
                title: newTitle, 
                description: newDesc, 
                title_en: newTitleEn,
                description_en: newDescEn,
                capacity: newCapacity || 10 
            });
        });
        programs = newPrograms;
        saveStateToLocalStorage();
    adminEditorDirty = false; // 保存完了で未保存状態を解消
    showCustomAlert('infoChangesSaved');
        renderAdminEditor();
    }

    // 自動英訳機能は削除済み

    function renderProgramGrid() {
        const grid = document.getElementById('program-grid');
        grid.innerHTML = '';
        programs.forEach(p => {
            const card = document.createElement('div');
            card.className = 'program-card';
            card.id = `card-${p.id}`;
            const isFull = (programEnrollment[p.id] || 0) >= p.capacity;
            if (isFull) {
                card.classList.add('is-full');
            }
            const title = (currentLanguage === 'en' && p.title_en) ? p.title_en : p.title;
            const description = (currentLanguage === 'en' && p.description_en) ? p.description_en : p.description;
            let fullOverlayHTML = '';
            if (isFull) {
                fullOverlayHTML = `<div class="full-overlay"><span>${escapeHTML(translations[currentLanguage].full)}</span></div>`;
            }
            card.innerHTML = `
                ${fullOverlayHTML}
                <h3>${escapeHTML(title)}</h3>
                <p>${escapeHTML(description)}</p>
                <div class="program-choice-btns" data-program-id="${p.id}">
                    <button class="p1" ${isFull ? 'disabled' : ''}>${escapeHTML(translations[currentLanguage].choice1)}</button>
                    <button class="p2" ${isFull ? 'disabled' : ''}>${escapeHTML(translations[currentLanguage].choice2)}</button>
                    <button class="p3" ${isFull ? 'disabled' : ''}>${escapeHTML(translations[currentLanguage].choice3)}</button>
                </div>`;
            grid.appendChild(card);
        });
        addChoiceButtonListeners();
        updateProgramSelectionUI();
    }

    function addChoiceButtonListeners() {
        document.querySelectorAll('.program-choice-btns button').forEach(button => {
            button.addEventListener('click', (e) => {
                try {
                    const programId = e.target.parentElement.dataset.programId;
                    const choiceNumber = e.target.classList.contains('p1') ? 1 : (e.target.classList.contains('p2') ? 2 : 3);

                    // 不正ID
                    const program = programs.find(p => p.id === programId);
                    if (!program) {
                        showCustomAlert('errorInvalidProgram');
                        return;
                    }
                    // 満員
                    const isFull = (programEnrollment[program.id] || 0) >= program.capacity;
                    if (isFull) {
                        showCustomAlert('errorProgramFull');
                        return;
                    }
                    // 重複選択（同じプログラムを複数の希望に）
                    const alreadyChosen = Object.entries(currentChoices).some(([k, v]) => Number(k) !== choiceNumber && v === programId);
                    if (alreadyChosen) {
                        showCustomAlert('errorDuplicateChoices');
                        return;
                    }

                    // トグル動作
                    if (currentChoices[choiceNumber] === programId) {
                        currentChoices[choiceNumber] = null;
                    } else {
                        currentChoices[choiceNumber] = programId;
                    }
                    updateProgramSelectionUI();

                    // プログラム選択時にデータを保存（インジケーターなし）
                    setTimeout(saveFormData, 100);
                } catch (err) {
                    console.error(err);
                    showCustomAlert('errorUnexpected');
                }
            });
        });
    }

    function updateProgramSelectionUI() {
        document.querySelectorAll('.program-card').forEach(c => c.classList.remove('selected-1', 'selected-2', 'selected-3'));
        document.querySelectorAll('.program-choice-btns button').forEach(b => {
            b.classList.remove('active');
            const programId = b.parentElement.dataset.programId;
            const program = programs.find(p => p.id === programId);
            const isFull = (programEnrollment[program.id] || 0) >= program.capacity;
            if (!isFull) {
                b.disabled = false;
            }
        });

        for (const [choice, programId] of Object.entries(currentChoices)) {
            if (programId) {
                document.getElementById(`card-${programId}`).classList.add(`selected-${choice}`);
                const btn = document.querySelector(`#card-${programId} .p${choice}`);
                if(btn) btn.classList.add('active');

                document.querySelectorAll(`.program-choice-btns .p${choice}`).forEach(b => {
                    if (b.parentElement.dataset.programId !== programId) b.disabled = true;
                });
            }
        }
    }

    function showConfirmation(student) {
        const details = document.getElementById('confirmation-details');
        const getTitle = (id) => {
            const prog = programs.find(p => p.id === id);
            if (!prog) return translations[currentLanguage].unselected;
            return (currentLanguage === 'en' && prog.title_en) ? prog.title_en : prog.title;
        };
        const resolveChoice = (raw) => {
            const s = (raw || '').toString().trim();
            if (!s || s === '-' || s === '希望なし' || s.toLowerCase() === 'none' || s === 'N/A') return translations[currentLanguage].unselected;
            // ExcelからIDで来る場合とタイトルで来る場合を許容
            const byId = programs.find(p => p.id === s);
            if (byId) return currentLanguage === 'en' && byId.title_en ? byId.title_en : byId.title;
            const byTitle = programs.find(p => p.title === s || p.title_en === s);
            if (byTitle) return currentLanguage === 'en' && byTitle.title_en ? byTitle.title_en : byTitle.title;
            return translations[currentLanguage].unselected;
        };
        const choice1 = resolveChoice(student.choices?.[0]);
        const choice2 = resolveChoice(student.choices?.[1]);
        const choice3 = resolveChoice(student.choices?.[2]);
        document.querySelector('.content-wrapper').classList.add('has-back-btn');
        details.innerHTML = `
            <p>${escapeHTML(translations[currentLanguage].nameHeader)}: <span>${escapeHTML(student.name)} 様</span></p>
            <p>${escapeHTML(translations[currentLanguage].choice1)}: <span>${escapeHTML(choice1)}</span></p>
            <p>${escapeHTML(translations[currentLanguage].choice2)}: <span>${escapeHTML(choice2)}</span></p>
            <p>${escapeHTML(translations[currentLanguage].choice3)}: <span>${escapeHTML(choice3)}</span></p>
        `;
    }

    // 予約データの希望配列をプログラムIDに正規化
    function normalizeChoicesToProgramIds(rawChoices) {
        const toId = (val) => {
            const s = (val || '').toString().trim();
            if (!s || s === '-' || s === '希望なし' || s.toLowerCase() === 'none' || s === 'N/A') return null;
            // 既にIDの場合
            const byId = programs.find(p => p.id === s);
            if (byId) return byId.id;
            // タイトル/英語タイトルで一致
            const byTitle = programs.find(p => p.title === s || p.title_en === s);
            if (byTitle) return byTitle.id;
            return null;
        };
        const arr = Array.isArray(rawChoices) ? rawChoices : [];
        return [toId(arr[0]), toId(arr[1]), toId(arr[2])];
    }

    // --- 入力検証 ---
    function validateAndHighlight(elements) {
        let allValid = true;
        elements.forEach(el => {
            if (!el.value) {
                el.classList.add('input-error');
                allValid = false;
            } else {
                el.classList.remove('input-error');
            }
        });
        return allValid;
    }
    
    // --- Excel 関連の処理 ---
    function handleFileUpload(file, type) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            const statusEl = document.getElementById('file-upload-status');
            try {
            const headerRow = (jsonData[0] || []).map(v => (v == null ? '' : String(v).trim()));
            if (type === 'reservations') {
                // 体験参加登録者名簿 固定列マッピング
                // A=No(0) B=姓(1) C=名(2) D=セイ(3) E=メイ(4) ... O=第一希望(14) P=第二希望(15) Q=第三希望(16)
                const map = {
                    nameIdx: [1, 2],
                    furiganaIdx: [3, 4],
                    choiceIdxs: [14, 15, 16]
                };
                rosterMappingInfo.reservations = map;
                reservations = jsonData.slice(1)
                    .filter(row => row && row.length && (String(row[1] ?? '').trim() !== '' || String(row[2] ?? '').trim() !== ''))
                    .map(row => {
                        const get = (idx) => (idx != null && idx >= 0 ? String(row[idx] ?? '').trim() : '');
                        const fullName = [get(1), get(2)].filter(Boolean).join(' ');
                        const fullKana = [get(3), get(4)].filter(Boolean).join(' ');
                        return {
                            name: fullName,
                            furigana: fullKana || undefined,
                            choices: [get(14) || null, get(15) || null, get(16) || null]
                        };
                    });
                                 statusEl.innerHTML += `<p>予約者名簿を読み込みました。${reservations.length}件</p>`;
             } else if (type === 'briefing') {
                 // 工学部説明会参加者名簿 固定列マッピング
                 // A=No(0) B=時間(1) C=姓(2) D=名(3) E=セイ(4) F=メイ(5)
                 const map = {
                     timeIdx: 1,
                     nameIdx: [2, 3],
                     furiganaIdx: [4, 5]
                 };
                 rosterMappingInfo.briefing = map;
                 briefingSessionAttendees = jsonData.slice(1)
                     .filter(row => row && row.length && (String(row[2] ?? '').trim() !== '' || String(row[3] ?? '').trim() !== ''))
                     .map(row => {
                         const get = (idx) => (idx != null && idx >= 0 ? String(row[idx] ?? '').trim() : '');
                         const fullName = [get(2), get(3)].filter(Boolean).join(' ');
                         const fullKana = [get(4), get(5)].filter(Boolean).join(' ');
                         const time = get(1); // B列の時間情報
                         return {
                             name: fullName,
                             furigana: fullKana || undefined,
                             time: time || undefined
                         };
                     });
                 statusEl.innerHTML += `<p>工学部説明会名簿を読み込みました。${briefingSessionAttendees.length}件</p>`;
             }
                 saveStateToLocalStorage();
                 saveRosterData(); // IndexedDBに名簿データを保存
             updateRosterMappingText();
             renderRosterPreview();
            } catch (error) {
                showCustomAlert('errorJsonFormat');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function exportToExcel() {
        const data = [[escapeHTML(translations[currentLanguage].programHeader), escapeHTML(translations[currentLanguage].nameHeader)]];
        confirmedAttendees.forEach(attendee => {
            const program = programs.find(p => p.id === attendee.assignedProgramId);
            const title = program ? (currentLanguage === 'en' && program.title_en ? program.title_en : program.title) : 'N/A';
            data.push([title, attendee.name]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reception Status");
        XLSX.writeFile(workbook, "reception_status.xlsx");
    }
    
    function renderStatusTable() {
        const summaryEl = document.getElementById('status-summary');
        const confirmedCount = confirmedAttendees.length;
        const waitingCount = waitingList.length;
        const totalCapacity = programs.reduce((sum, p) => sum + (p.capacity || 0), 0);
        const totalEnrolled = Object.values(programEnrollment).reduce((sum, v) => sum + (v || 0), 0);
        const totalRatio = Math.min(100, Math.round((totalEnrolled / Math.max(1, totalCapacity)) * 100));
        summaryEl.innerHTML = `
            <p><strong>${escapeHTML(translations[currentLanguage].totalConfirmed)}:</strong> ${confirmedCount}</p>
            <p><strong>${escapeHTML(translations[currentLanguage].totalWaiting)}:</strong> ${waitingCount}</p>
            <div class="total-progress">
                <div class="label"><span>${escapeHTML(translations[currentLanguage].totalAttendees)}</span><span>${totalEnrolled} / ${totalCapacity}</span></div>
                <div class="bar"><div class="bar-inner" style="width:${totalRatio}%"></div></div>
            </div>
        `;

        const table = document.getElementById('status-table');
        const useCard = document.getElementById('status-view-toggle')?.checked !== false; // デフォルトはカード
        table.innerHTML = useCard ? `
            <div class="status-grid">
                ${programs.map((p, idx) => {
                    const title = (currentLanguage === 'en' && p.title_en) ? p.title_en : p.title;
                    const enrolled = programEnrollment[p.id] || 0;
                    const ratio = Math.min(100, Math.round((enrolled / p.capacity) * 100));
                    const attendeeNames = confirmedAttendees
                        .filter(a => a.assignedProgramId === p.id)
                        .map(a => `<span class=\"chip\">${escapeHTML(a.name)}</span>`)
                        .join('');
                    return `
                        <div class=\"program-card-status\">
                            <div class=\"card-header\">
                                <h4><span class=\"program-no-badge\">#${idx+1}</span>${escapeHTML(title)}</h4>
                                <span class=\"count-badge\">${enrolled} / ${p.capacity}</span>
                            </div>
                            <div class=\"progress\"><div class=\"progress-bar\" style=\"width:${ratio}%\"></div></div>
                            <div class=\"attendees-chips\">${attendeeNames || `<span class="chip">${escapeHTML(translations[currentLanguage].noAttendees)}</span>`}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : `
            <table style=\"width:100%; border-collapse:collapse;\"> 
                <thead>
                    <tr>
                        <th>#</th>
                        <th>${escapeHTML(translations[currentLanguage].programHeader)}</th>
                        <th>${escapeHTML(translations[currentLanguage].statusHeader)}</th>
                        <th>${escapeHTML(translations[currentLanguage].attendeesHeader)}</th>
                    </tr>
                </thead>
                <tbody>
                    ${programs.map((p, idx) => {
                        const title = (currentLanguage === 'en' && p.title_en) ? p.title_en : p.title;
                        const attendees = confirmedAttendees
                            .filter(a => a.assignedProgramId === p.id)
                            .map(a => escapeHTML(a.name))
                            .join(', ');
                        return `
                            <tr>
                                <td>${idx+1}</td>
                                <td>${escapeHTML(title)}</td>
                                <td>${programEnrollment[p.id] || 0} / ${p.capacity}</td>
                                <td>${attendees || escapeHTML(translations[currentLanguage].noAttendees)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        const waitingTable = document.getElementById('waiting-list-table');
        const getTitle = (id) => {
            const prog = programs.find(p => p.id === id);
            if (!prog) return '';
            return (currentLanguage === 'en' && prog.title_en) ? prog.title_en : prog.title;
        };
        waitingTable.innerHTML = `
            <div class="waiting-list">
                ${waitingList.map(user => `
                    <div class="waiting-item">
                        <div class="name-chip">${escapeHTML(user.name)}</div>
                        <div class="choices">
                            <span class="chip">${escapeHTML(translations[currentLanguage].choice1)}: ${escapeHTML(getTitle(user.choices[0]))}</span>
                            <span class="chip">${escapeHTML(translations[currentLanguage].choice2)}: ${escapeHTML(getTitle(user.choices[1]))}</span>
                            <span class="chip">${escapeHTML(translations[currentLanguage].choice3)}: ${escapeHTML(getTitle(user.choices[2]))}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

// 名簿プレビューのレンダリング
function renderRosterPreview() {
    const rr = document.getElementById('roster-reservations-table');
    const rb = document.getElementById('roster-briefing-table');
        const ro = document.getElementById('roster-others-table');
    if (!rr || !rb) return;

    const query = (document.getElementById('roster-search-input')?.value || '').trim();
    const norm = (s) => (s || '').toString().replace(/\s+/g, '').toLowerCase();
    const matches = (name, kana) => {
        if (!query) return true;
        const q = norm(query);
        return norm(name).includes(q) || norm(kana).includes(q);
    };

    // 予約者名簿（必要な列のみ）
    const resMap = rosterMappingInfo.reservations;
    const showFuriRes = !!resMap; // 固定マッピングでフリガナがある
    const shownChoiceIndexes = [0,1,2]; // プレビューは第1〜第3希望を常に表示
    let resHeader = `<th>${escapeHTML(translations[currentLanguage].nameHeader)}</th>`;
    if (showFuriRes) resHeader += `<th>${escapeHTML(translations[currentLanguage].furiganaHeader)}</th>`;
    shownChoiceIndexes.forEach(choiceIdx => {
        const key = choiceIdx === 0 ? 'choice1' : (choiceIdx === 1 ? 'choice2' : 'choice3');
        resHeader += `<th>${escapeHTML(translations[currentLanguage][key])}</th>`;
    });
    const resFiltered = reservations.filter(r => matches(r.name, r.furigana));
    const resBody = resFiltered.map(r => {
        // ステータス判定: 確定済みリストにいる場合は緑、待機リストにいる場合は黄色、どちらにもいない場合は赤
        let status = 'red'; // デフォルトは赤（未受付）
        if (confirmedAttendees.some(a => a.name === r.name)) {
            status = 'green'; // 確定済み
        } else if (waitingList.some(a => a.name === r.name)) {
            status = 'yellow'; // 待機中
        }
        const statusDot = `<span class="status-dot status-${status}"></span>`;
        let tds = `<td>${statusDot}${escapeHTML(r.name || '')}</td>`;
        if (showFuriRes) tds += `<td>${escapeHTML(r.furigana || '')}</td>`;
        shownChoiceIndexes.forEach(i => { tds += `<td>${escapeHTML(r.choices?.[i] || '')}</td>`; });
        return `<tr>${tds}</tr>`;
    }).join('');
    rr.innerHTML = `<thead><tr>${resHeader}</tr></thead><tbody>${resBody}</tbody>`;
    const resCountEl = document.getElementById('roster-reservations-count');
    if (resCountEl) resCountEl.textContent = `(${resFiltered.length})`;

    // 説明会名簿（必要な列のみ）
    const briMap = rosterMappingInfo.briefing;
    const showFuriBri = briMap && briMap.furiganaIdx != null && briMap.furiganaIdx >= 0;
    let briHeader = `<th>${escapeHTML(translations[currentLanguage].nameHeader)}</th>`;
    if (showFuriBri) briHeader += `<th>${escapeHTML(translations[currentLanguage].furiganaHeader)}</th>`;
    briHeader += `<th>${escapeHTML(translations[currentLanguage].timeHeader || '時間')}</th>`;
    const briFiltered = briefingSessionAttendees.filter(a => matches(a.name, a.furigana));
    const briBody = briFiltered.map(a => {
        // ステータス判定: 確定済みリストにいる場合は緑、待機リストにいる場合は黄色、どちらにもいない場合は赤
        let status = 'red'; // デフォルトは赤（未受付）
        if (confirmedAttendees.some(c => c.name === a.name)) {
            status = 'green'; // 確定済み
        } else if (waitingList.some(w => w.name === a.name)) {
            status = 'yellow'; // 待機中
        }
        const statusDot = `<span class="status-dot status-${status}"></span>`;
        let tds = `<td>${statusDot}${escapeHTML(a.name || '')}</td>`;
        if (showFuriBri) tds += `<td>${escapeHTML(a.furigana || '')}</td>`;
        tds += `<td>${escapeHTML(a.time || '')}</td>`;
        return `<tr>${tds}</tr>`;
    }).join('');
    rb.innerHTML = `<thead><tr>${briHeader}</tr></thead><tbody>${briBody}</tbody>`;
    const briCountEl = document.getElementById('roster-briefing-count');
    if (briCountEl) briCountEl.textContent = `(${briFiltered.length})`;

    // その他: どちらにも含まれないが、確定済みに存在する名前
    if (ro) {
        const knownNames = new Set([
            ...reservations.map(r => r.name),
            ...briefingSessionAttendees.map(b => b.name)
        ]);
        const others = confirmedAttendees
            .filter(a => !knownNames.has(a.name))
            .map(a => a.name);
        const othersBody = others.map(n => `
            <tr>
                <td><span class="status-dot status-green"></span>${escapeHTML(n)}</td>
            </tr>
        `).join('');
        ro.innerHTML = othersBody ? `<tbody>${othersBody}</tbody>` : '<tbody></tbody>';
        const roCount = document.getElementById('roster-others-count');
        if (roCount) roCount.textContent = `(${others.length})`;
    }
}

// 列ヘッダから自動検出（体験予約者）
function detectReservationHeaderMapping(headerRow) {
    const lower = headerRow.map(h => (h || '').toString().toLowerCase());
    const find = (candidates) => lower.findIndex(h => candidates.some(k => h.includes(k)));
    const nameIdx = find(['氏名','名前','name']);
    const furiganaIdx = find(['フリガナ','ふりがな','kana','yomi','読み']);
    // 第1〜3希望
    const firstIdx = find(['第1希望','第一希望','1st','first','第一','1希望']);
    // 残りは近傍やキーワードで探す
    const secondIdx = find(['第2希望','第二希望','2nd','second','第二','2希望']);
    const thirdIdx = find(['第3希望','第三希望','3rd','third','第三','3希望']);
    return {
        nameIdx: nameIdx >= 0 ? nameIdx : 0,
        furiganaIdx: furiganaIdx,
        choiceIdxs: [firstIdx, secondIdx, thirdIdx].map(i => (i == null ? -1 : i))
    };
}

// 列ヘッダから自動検出（説明会）
function detectBriefingHeaderMapping(headerRow) {
    const lower = headerRow.map(h => (h || '').toString().toLowerCase());
    const find = (candidates) => lower.findIndex(h => candidates.some(k => h.includes(k)));
    const nameIdx = find(['氏名','名前','name']);
    const furiganaIdx = find(['フリガナ','ふりがな','kana','yomi','読み']);
    return { nameIdx: nameIdx >= 0 ? nameIdx : 0, furiganaIdx };
}

function updateRosterMappingText() {
    const el = document.getElementById('roster-mapping-text');
    if (!el) return;
    const parts = [];
    if (rosterMappingInfo.reservations) {
        const m = rosterMappingInfo.reservations;
        parts.push(`体験: 氏名=${columnLetter(m.nameIdx)}, フリガナ=${m.furiganaIdx>=0?columnLetter(m.furiganaIdx):'-'} , 希望列=[${m.choiceIdxs.map(i=>i>=0?columnLetter(i):'-').join(', ')}]`);
    }
    if (rosterMappingInfo.briefing) {
        const m = rosterMappingInfo.briefing;
        parts.push(`説明会: 氏名=${columnLetter(m.nameIdx)}, フリガナ=${m.furiganaIdx>=0?columnLetter(m.furiganaIdx):'-'}`);
    }
    el.textContent = parts.length ? parts.join(' / ') : '列の対応: 自動検出中…';
}

function columnLetter(index) {
    let n = (index|0) + 1;
    let s = '';
    while (n > 0) {
        const rem = (n - 1) % 26;
        s = String.fromCharCode(65 + rem) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}
    
    function initializeEnrollment() {
        programEnrollment = {};
        programs.forEach(p => { programEnrollment[p.id] = 0; });
        confirmedAttendees.forEach(attendee => {
            if (attendee.assignedProgramId && programEnrollment[attendee.assignedProgramId] !== undefined) {
                programEnrollment[attendee.assignedProgramId]++;
            }
        });
    }

    // --- LocalStorage 関連 ---
    function saveStateToLocalStorage() {
        const state = {
            programs,
            reservations,
            briefingSessionAttendees,
            // IndexedDBで管理するため、localStorageには保存しない
            // programEnrollment,
            // confirmedAttendees,
            // waitingList,
            settings
        };
        localStorage.setItem('receptionData', JSON.stringify(state));
    }

    function loadStateFromLocalStorage() {
        const savedState = localStorage.getItem('receptionData');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                programs = state.programs || programs;
                reservations = state.reservations || reservations;
                briefingSessionAttendees = state.briefingSessionAttendees || [];
                // IndexedDBから復元されるため、localStorageからは読み込まない
                // programEnrollment = state.programEnrollment || {};
                // confirmedAttendees = state.confirmedAttendees || [];
                // waitingList = state.waitingList || [];
                if (state.settings) {
                    settings = state.settings;
                }
            } catch (e) {
                console.error("Failed to parse saved state:", e);
            }
        }
    }

    // --- テーマ（ダークモード）関連 ---
    const themeSwitchBtn = document.getElementById('theme-switch-btn');
    function setTheme(theme) {
        currentTheme = theme;
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeSwitchBtn.innerHTML = theme === 'dark' ? '<i class="ph-sun"></i>' : '<i class="ph-moon"></i>';
        localStorage.setItem('receptionTheme', theme);
    }

    // リロード制御は無効化（F5 / Ctrl+R のブロックを削除）

    // --- 初期化処理 ---
    loadStateFromLocalStorage();
    // 管理画面に入る前に初期英訳を補完
    injectDefaultEnglishIfMissing();
    initializeEnrollment();
    
    const savedLang = localStorage.getItem('receptionLang') || 'ja';
    updateLanguage(savedLang);

    const savedTheme = localStorage.getItem('receptionTheme') || 'light';
    setTheme(savedTheme);

    // カスタムアラートの閉じるボタン
    document.getElementById('btn-alert-ok').addEventListener('click', () => {
        customAlertModal.classList.remove('visible');
    });

    // 受付画面のイベントリスナー
    document.getElementById('btn-reserved').addEventListener('click', () => navigateTo('name-input-section'));
    document.getElementById('btn-walk-in').addEventListener('click', () => navigateTo('walk-in-section'));
    document.getElementById('btn-back').addEventListener('click', goBack);

    // 初期選択画面のキーボード操作（←/→で選択、Enterで決定）
    document.addEventListener('keydown', (e) => {
        if (!isInitialSelectionVisible()) return;
        if (e.key === 'ArrowRight') {
            homeSelection = 'walkIn';
            updateHomeSelectionFocus();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            homeSelection = 'reserved';
            updateHomeSelectionFocus();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (homeSelection === 'reserved') {
                btnReserved?.click();
                e.preventDefault();
            } else if (homeSelection === 'walkIn') {
                btnWalkIn?.click();
                e.preventDefault();
            }
            // homeSelection が null の場合は Enter を無視（誤進入防止）
        }
    });
    
    document.getElementById('btn-check-reservation').addEventListener('click', () => {
        const nameInput = document.getElementById('student-name');
        if (!validateAndHighlight([nameInput])) {
            showCustomAlert('errorEnterName');
            return;
        }
        const name = nameInput.value.trim().replace(/　/g, ' ');

        // 既に登録済みかチェック
        const isAlreadyConfirmed = confirmedAttendees.some(attendee => attendee.name === name);
        const isAlreadyWaiting = waitingList.some(attendee => attendee.name === name);
        
        if (isAlreadyConfirmed || isAlreadyWaiting) {
            showCustomAlert('errorAlreadyRegistered');
            nameInput.focus();
            return;
        }

        const student = reservations.find(r => r.name === name);
        if (student) {
            // Excelの値で "希望なし" 等が入っている場合の判定
            const normalize = (v) => (v || '').toString().trim();
            const rawChoices = Array.isArray(student.choices) ? student.choices : [];
            const hasNoPreference = rawChoices.length === 0 || rawChoices.every(v => {
                const s = normalize(v);
                return !s || s === '-' || s === '希望なし' || s.toLowerCase() === 'none' || s === 'N/A';
            });

            // 予約レコードからchoicesをID配列に正規化
            const normalized = normalizeChoicesToProgramIds(student.choices);
            currentUser = {...student, choices: normalized};
            if (hasNoPreference) {
                // 希望が未入力の場合は希望選択画面へ誘導
                showCustomAlert('noChoicesProvided');
                currentChoices = { 1: null, 2: null, 3: null };
                renderProgramGrid();
                updateProgramSelectionUI();
                navigateTo('program-selection-section');
                document.querySelector('.content-wrapper').classList.add('has-back-btn');
                return;
            }
            showConfirmation(currentUser);
            navigateTo('reservation-confirmation-section');
        } else {
            showCustomAlert('errorNotFound');
            nameInput.focus();
        }
    });

    document.getElementById('btn-change-reservation').addEventListener('click', () => {
        currentChoices = { 1: currentUser.choices[0], 2: currentUser.choices[1], 3: currentUser.choices[2] };
        renderProgramGrid();
        updateProgramSelectionUI();
        navigateTo('program-selection-section');
        document.querySelector('.content-wrapper').classList.add('has-back-btn');
    });

    document.getElementById('btn-to-program-selection').addEventListener('click', () => {
        const nameEl = document.getElementById('walk-in-name');
        const schoolEl = document.getElementById('walk-in-school');
        const gradeEl = document.getElementById('walk-in-grade');
        
        if (!validateAndHighlight([nameEl, schoolEl, gradeEl])) {
            showCustomAlert('errorAllFields');
            return;
        }
        
        const name = nameEl.value.trim().replace(/　/g, ' ');
        
        // 既に登録済みかチェック
        const isAlreadyConfirmed = confirmedAttendees.some(attendee => attendee.name === name);
        const isAlreadyWaiting = waitingList.some(attendee => attendee.name === name);
        
        if (isAlreadyConfirmed || isAlreadyWaiting) {
            showCustomAlert('errorAlreadyRegistered');
            nameEl.focus();
            return;
        }
        
        currentUser = { name: name, school: schoolEl.value, grade: gradeEl.value, choices: [] };
        currentChoices = { 1: null, 2: null, 3: null };
        renderProgramGrid();
        updateProgramSelectionUI();
        navigateTo('program-selection-section');
        document.querySelector('.content-wrapper').classList.add('has-back-btn');
    });

    document.getElementById('btn-no-capstone').addEventListener('click', () => {
        const nameEl = document.getElementById('walk-in-name');
        const schoolEl = document.getElementById('walk-in-school');
        const gradeEl = document.getElementById('walk-in-grade');
        
        if (!validateAndHighlight([nameEl, schoolEl, gradeEl])) {
            showCustomAlert('errorAllFields');
            return;
        }
        
        const name = nameEl.value.trim().replace(/　/g, ' ');
        
        // 既に登録済みかチェック
        const isAlreadyConfirmed = confirmedAttendees.some(attendee => attendee.name === name);
        const isAlreadyWaiting = waitingList.some(attendee => attendee.name === name);
        
        if (isAlreadyConfirmed || isAlreadyWaiting) {
            showCustomAlert('errorAlreadyRegistered');
            nameEl.focus();
            return;
        }
        
        // キャップストーン体験に参加しない場合の処理
        currentUser = { 
            name: name, 
            school: schoolEl.value, 
            grade: gradeEl.value, 
            choices: [],
            noCapstone: true 
        };
        
        // 説明会時間を検索して表示
        const briefingAttendee = briefingSessionAttendees.find(a => a.name === name);
        const briefingTimeEl = document.getElementById('no-capstone-briefing-time');
        if (briefingAttendee && briefingAttendee.time) {
            const timeMessage = translations[currentLanguage].noCapstoneBriefingTime
                .replace('{name}', name)
                .replace('{time}', briefingAttendee.time);
            briefingTimeEl.textContent = timeMessage;
        } else {
            // 時間が見つからない場合は元のメッセージを表示
            briefingTimeEl.textContent = translations[currentLanguage].noCapstoneInfo;
        }
        
        navigateTo('no-capstone-section');
        document.querySelector('.content-wrapper').classList.add('has-back-btn');
    });

    document.getElementById('btn-no-capstone-complete').addEventListener('click', () => {
        // キャップストーン体験に参加しない場合の受付完了処理
        // ここでは特別な処理は行わず、最初の画面に戻る
        navigateTo('initial-selection');
        document.querySelector('.content-wrapper').classList.remove('has-back-btn');
        
        // フォームをクリア
        document.getElementById('walk-in-name').value = '';
        document.getElementById('walk-in-school').value = '';
        document.getElementById('walk-in-grade').value = '';
        
        currentUser = null;
    });

    document.getElementById('btn-submit-choices').addEventListener('click', () => {
        const choices = [currentChoices[1], currentChoices[2], currentChoices[3]];
        if (choices.filter(c => c).length === 0) {
            showCustomAlert('errorSelectProgram');
            return;
        }
        // 同一プログラムを複数希望に入れていないか確認
        const hasDup = choices.filter(Boolean).length !== new Set(choices.filter(Boolean)).size;
        if (hasDup) {
            showCustomAlert('errorDuplicateChoices');
            return;
        }
        currentUser.choices = choices; 
        showConfirmation(currentUser);
        navigateTo('reservation-confirmation-section');
        
        // 選択確定時にデータを保存（インジケーター付き）
        setTimeout(() => {
            const formData = {
                id: 'currentForm',
                reservedName: document.getElementById('student-name')?.value || '',
                walkInName: document.getElementById('walk-in-name')?.value || '',
                walkInSchool: document.getElementById('walk-in-school')?.value || '',
                walkInGrade: document.getElementById('walk-in-grade')?.value || '',
                currentChoices: currentChoices,
                currentSection: getCurrentSection()
            };
            saveDataWithIndicator('formData', formData, '選択内容を保存しました');
        }, 100);
    });
    
    // エラーハイライト解除リスナー
    ['student-name', 'walk-in-name', 'walk-in-school', 'walk-in-grade'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => e.target.classList.remove('input-error'));
    });

    // 管理者フロー
    document.getElementById('admin-entry-btn').addEventListener('click', () => adminLoginModal.classList.add('visible'));
    document.getElementById('btn-cancel-login').addEventListener('click', () => adminLoginModal.classList.remove('visible'));
    document.getElementById('btn-admin-login').addEventListener('click', () => {
        const passwordInput = document.getElementById('admin-password');
        if (passwordInput.value === 'admin') {
            adminLoginModal.classList.remove('visible');
            passwordInput.value = '';
            document.getElementById('password-error').textContent = '';
            showAdminView();
        } else {
            // ポップアップ表示（既存のカスタムアラートを使用）
            showCustomAlert('wrongPassword');
            // エラーメッセージを赤文字で表示
            document.getElementById('password-error').textContent = translations[currentLanguage].wrongPassword;
            // 簡易的な連続アタック対策: 入力をロック＆解除までの遅延
            passwordInput.disabled = true;
            document.getElementById('btn-admin-login').disabled = true;
            setTimeout(() => {
                passwordInput.disabled = false;
                document.getElementById('btn-admin-login').disabled = false;
                passwordInput.focus();
                passwordInput.select();
            }, 2000);
        }
    });
    // Enterキーでログイン（パスワード入力中）
    const adminPasswordInput = document.getElementById('admin-password');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btn-admin-login').click();
            }
        });
    }
    
// 未保存変更がある場合に離脱確認してからタブ切り替え
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        const targetTabName = e.currentTarget.dataset.tab;
        const switchTab = () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.toggle('active', content.id === `tab-${targetTabName}`);
            });
            if (targetTabName === 'status') {
                renderStatusTable();
            }
            if (targetTabName === 'roster') {
                updateRosterMappingText();
                renderRosterPreview();
            }
        };
        const isEditorActive = document.getElementById('tab-editor')?.classList.contains('active');
        if (isEditorActive && adminEditorDirty && targetTabName !== 'editor') {
            if (confirm('変更を保存していません。本当に離れますか？')) {
                adminEditorDirty = false; // 破棄
                switchTab();
            }
        } else {
            switchTab();
        }
    });
});

    document.getElementById('translation-toggle-checkbox').addEventListener('change', (e) => {
        document.getElementById('tab-editor').classList.toggle('show-en', e.target.checked);
    });

document.getElementById('btn-add-program').addEventListener('click', () => {
        const newId = 'p' + (Date.now());
        programs.push({ id: newId, title: '新しいプログラム', description: '', capacity: 10, title_en: '', description_en: '' });
        renderAdminEditor();
    adminEditorDirty = true;
    });

    document.getElementById('btn-save-programs').addEventListener('click', saveChangesFromUI);
    
document.getElementById('btn-apply-json').addEventListener('click', () => {
        const jsonEditor = document.getElementById('json-editor');
        try {
            const newPrograms = JSON.parse(jsonEditor.value);
            if (Array.isArray(newPrograms)) {
                programs = newPrograms;
                showCustomAlert('infoJsonApplied');
                renderAdminEditor();
            adminEditorDirty = true;
            } else { throw new Error('データは配列形式である必要があります。'); }
        } catch (e) { showCustomAlert('errorJsonFormat'); }
    });

// 管理画面から受付へ戻る際に未保存確認
document.getElementById('btn-exit-admin').addEventListener('click', () => {
    const isEditorActive = document.getElementById('tab-editor')?.classList.contains('active');
    if (isEditorActive && adminEditorDirty) {
        if (!confirm('変更を保存していません。本当に離れますか？')) return;
        adminEditorDirty = false; // 破棄
    }
    showReceptionView();
});
	
	// ヘッダーロゴクリックでホームへ戻る
    const headerLogo = document.querySelector('.header-logo');
    if (headerLogo) {
        headerLogo.style.cursor = 'pointer';
        headerLogo.addEventListener('click', () => {
            const isEditorActive = document.getElementById('tab-editor')?.classList.contains('active');
            if (isEditorActive && adminEditorDirty) {
                if (!confirm('変更を保存していません。本当に離れますか？')) return;
                adminEditorDirty = false; // 破棄
            }
            showReceptionView();
        });
    }
	
	document.getElementById('reservations-file-input').addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'reservations'));
	document.getElementById('briefing-session-file-input').addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'briefing'));
	document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);
    
    document.getElementById('prioritize-toggle-checkbox').checked = settings.prioritizeReserved;
    document.getElementById('prioritize-toggle-checkbox').addEventListener('change', (e) => {
        settings.prioritizeReserved = e.target.checked;
        saveStateToLocalStorage();
        showSaveIndicator(translations[currentLanguage].settingsSaved);
    });
    const prioritizeGradeEl = document.getElementById('prioritize-grade-toggle-checkbox');
    if (prioritizeGradeEl) {
        prioritizeGradeEl.checked = settings.prioritizeGrade;
        prioritizeGradeEl.addEventListener('change', (e) => {
            settings.prioritizeGrade = e.target.checked;
            saveStateToLocalStorage();
            showSaveIndicator(translations[currentLanguage].settingsSaved);
        });
    }
    
    document.getElementById('btn-reset-data').addEventListener('click', () => {
        showCustomAlert('resetConfirm', () => {
            localStorage.removeItem('receptionData');
            localStorage.removeItem('noRosterDataLastShown'); // 名簿データポップアップ表示記録も削除
            // IndexedDBの受付データと名簿データも削除
            deleteData('userData', 'receptionData');
            deleteData('userData', 'rosterData');
            showCustomAlert('resetComplete', () => {
                location.reload();
            });
        }, true);
    });

    document.getElementById('btn-assign-waiting').addEventListener('click', () => {
        if(waitingList.length === 0) {
            showCustomAlert('noWaiting');
            return;
        }
        const count = waitingList.length;
        if(confirm(translations[currentLanguage].assignConfirm(count))) {
            // 学年優先がONの場合、並べ替えてから割り当て
            const gradePriority = (g) => {
                if (!g) return 99;
                if (typeof g !== 'string') return 99;
                if (g.includes('3')) return 1; // 高3
                if (g.includes('2')) return 2; // 高2
                if (g.includes('1')) return 3; // 高1
                return 4; // その他
            };
            const list = settings.prioritizeGrade
                ? [...waitingList].sort((a, b) => gradePriority(a.grade) - gradePriority(b.grade))
                : [...waitingList];
            list.forEach(user => {
                assignProgram(user);
            });
            waitingList = [];
            saveReceptionData(); // IndexedDBに保存
            renderStatusTable();
            showCustomAlert(translations[currentLanguage].assignComplete(count));
        }
    });

    // 受付状況: 表/カード切替
    const statusViewToggle = document.getElementById('status-view-toggle');
    if (statusViewToggle) {
        statusViewToggle.addEventListener('change', () => {
            renderStatusTable();
        });
    }

    // 完了処理
    document.getElementById('btn-confirm-reservation').addEventListener('click', () => {
        const isReserved = reservations.some(r => r.name === currentUser.name);
        if (settings.prioritizeReserved && !isReserved) {
            waitingList.push(currentUser);
            saveReceptionData(); // IndexedDBに保存
            showSuccessScreen(currentUser.name, null, true);
        } else {
            const assignedProgram = assignProgram(currentUser);
            showSuccessScreen(currentUser.name, assignedProgram);
        }
    });
    
    document.getElementById('btn-back-to-home').addEventListener('click', showReceptionView);
    
    document.getElementById('help-btn').addEventListener('click', () => {
        document.getElementById('help-modal').classList.add('visible');
    });

    document.getElementById('btn-close-help').addEventListener('click', () => {
        document.getElementById('help-modal').classList.remove('visible');
    });

    // ヘルプモーダルの外側をクリックしても閉じる
    document.getElementById('help-modal').addEventListener('click', (e) => {
        if (e.target.id === 'help-modal') {
            document.getElementById('help-modal').classList.remove('visible');
        }
    });

    // 管理者ログインモーダルの外側をクリックしても閉じる
    document.getElementById('admin-login-modal').addEventListener('click', (e) => {
        if (e.target.id === 'admin-login-modal') {
            adminLoginModal.classList.remove('visible');
        }
    });

    document.getElementById('lang-switch-btn').addEventListener('click', () => {
        const newLang = currentLanguage === 'ja' ? 'en' : 'ja';
        updateLanguage(newLang);
        // 言語切替トースト表示（右上）
        const msg = newLang === 'ja' ? '言語が日本語に切り替わりました。' : 'Language switched to English.';
        showSaveIndicator(msg);
    });

    themeSwitchBtn.addEventListener('click', () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        const msg = (currentLanguage === 'ja')
            ? (newTheme === 'dark' ? 'テーマがダークモードに切り替わりました。' : 'テーマがライトモードに切り替わりました。')
            : (newTheme === 'dark' ? 'Theme switched to Dark mode.' : 'Theme switched to Light mode.');
        showSaveIndicator(msg);
    });
    
    // 名簿データのインポート状況をチェック
    async function checkRosterDataStatus() {
        // IndexedDBから名簿データを復元
        const savedState = await getData('userData', 'rosterData');
        
        // IndexedDBに保存された名簿データがある場合は復元
        if (savedState && savedState.rosterMappingInfo) {
            rosterMappingInfo = savedState.rosterMappingInfo;
            if (savedState.reservations) {
                reservations = savedState.reservations;
            }
            if (savedState.briefingSessionAttendees) {
                briefingSessionAttendees = savedState.briefingSessionAttendees;
            }
        }
        
        const hasReservationsData = rosterMappingInfo.reservations !== null;
        const hasBriefingData = rosterMappingInfo.briefing !== null;
        
        if (!hasReservationsData && !hasBriefingData) {
            // 一日一回、初めての起動時のみポップアップを表示
            const today = new Date().toDateString();
            const lastShownDate = localStorage.getItem('noRosterDataLastShown');
            
            if (lastShownDate !== today) {
                setTimeout(() => {
                    showCustomAlert('noRosterData');
                    // 今日表示したことを記録
                    localStorage.setItem('noRosterDataLastShown', today);
                }, 500); // 少し遅延させて画面の初期化を待つ
            }
        }
    }

    // 初期画面表示
    showReceptionSection('initial-selection');

    // 名簿データのインポート状況をチェック（非同期）
    checkRosterDataStatus().catch(error => {
        console.error('名簿データチェックエラー:', error);
    });

    // 名簿検索イベント
    const rosterSearchInput = document.getElementById('roster-search-input');
    if (rosterSearchInput) {
        rosterSearchInput.addEventListener('input', () => {
            renderRosterPreview();
        });
    }
});