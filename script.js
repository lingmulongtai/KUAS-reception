document.addEventListener('DOMContentLoaded', () => {
    // --- IndexedDB データベース管理 ---
    const dbName = 'KUASReceptionDB';
    const dbVersion = 2; // スキーマ変更のためバージョンを上げる
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
                
                // ユーザーデータ用のストアは削除
                if (db.objectStoreNames.contains('userData')) {
                    db.deleteObjectStore('userData');
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
        indicator.innerHTML = `<i class="ph ph-check-circle"></i> ${escapeHTML(message)}`;
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
            walkInFurigana: document.getElementById('walk-in-furigana')?.value || '',
            walkInSchool: document.getElementById('walk-in-school')?.value || '',
            walkInGrade: document.getElementById('walk-in-grade')?.value || '',
            currentChoices: currentChoices,
            currentSection: getCurrentSection(),
            currentUser: currentUser ? {
                name: currentUser.name,
                furigana: currentUser.furigana || '',
                school: currentUser.school,
                grade: currentUser.grade,
                companions: currentUser.companions || 0,
                choices: currentUser.choices || []
            } : null
        };
        
        saveData('formData', formData);
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
            if (data.walkInFurigana && document.getElementById('walk-in-furigana')) {
                document.getElementById('walk-in-furigana').value = data.walkInFurigana;
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
            if (data.currentUser) {
                currentUser = {
                    name: data.currentUser.name,
                    furigana: data.currentUser.furigana || '',
                    school: data.currentUser.school,
                    grade: data.currentUser.grade,
                    companions: data.currentUser.companions || 0,
                    choices: Array.isArray(data.currentUser.choices) ? data.currentUser.choices : []
                };
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
        const formInputs = ['student-name', 'walk-in-name', 'walk-in-furigana', 'walk-in-school', 'walk-in-grade', 'walk-in-companions', 'companion-count-input'];
        formInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    setTimeout(saveFormData, 500); // 500ms遅延で保存
                });
                element.addEventListener('change', () => {
                    setTimeout(saveFormData, 500);
                });
            }
        });
    }

    // データベース初期化と復元
    async function initializeApp() {
        try {
            await initDB();
            await restoreFormData();
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
    
    let currentChoices = { 1: null, 2: null, 3: null };
    let currentUser = null;
    let sortable = null;
    let navigationHistory = [];
let currentLanguage = window.currentLanguage || 'ja';

// Bridge: mimic old `translations[currentLanguage].key` API using locales in window.translations
const translations = new Proxy({}, {
    get: function(_, lang) {
        return new Proxy({}, {
            get: function(__, key) {
                const dict = (window.translations && window.translations[lang]) || {};
                const val = dict[key];
                if (typeof val === 'string') return val;
                if (key === 'confirmDelete') {
                    return (title) => {
                        const tmpl = dict.confirmDelete || (lang === 'ja' ? '「{title}」を削除しますか？' : 'Are you sure you want to delete "{title}"?');
                        return tmpl.replace('{title}', title);
                    };
                }
                if (key === 'assignConfirm') {
                    return (count) => {
                        const tmpl = dict.assignConfirm || (lang === 'ja' ? '{count}人をプログラムに割り当てます。よろしいですか？' : 'Assign {count} people to programs. Are you sure?');
                        return tmpl.replace('{count}', count);
                    };
                }
                if (key === 'assignComplete') {
                    return (count) => {
                        const tmpl = dict.assignComplete || (lang === 'ja' ? '{count}人の割り当てが完了しました。' : 'Assignment for {count} people is complete.');
                        return tmpl.replace('{count}', count);
                    };
                }
                return val;
            }
        });
    }
});

function getTranslation(key) {
    const langMap = (window.translations && window.translations[currentLanguage]) || {};
    return typeof langMap[key] === 'string' ? langMap[key] : '';
}

function getTranslatedValue(defaultValue, englishValue) {
    if (currentLanguage === 'en' && englishValue) {
        return englishValue;
    }
    return defaultValue || englishValue || '';
}

let currentTheme = 'light';
    let settings = {
        prioritizeReserved: true,
        prioritizeGrade: true // 予約なしの学年優先（デフォルトON）
    };
// 管理パネル（プログラム編集）の未保存変更フラグ
let adminEditorDirty = false;
// 名簿マッピング情報（どの列がどのフィールドかの記録）
/*
            grade2: "2nd Year High School",
            grade3: "3rd Year High School",
            other: "Other",
            toProgramSelection: "Select Capstone Experience Program",
            noCapstoneExperience: "For those attending only the Faculty of Engineering Briefing",
            selectProgramTitle: "Select Your Preferred Programs",
            selectProgramDesc: "You can select up to 3 preferences.",
            confirmChoices: "Confirm Choices",
            successTitle: "Registration Complete!",
            successDesc: "You have been confirmed for the following program:",
            successWaiting: "Your program will be assigned later.",
            backToHome: "Back to Home",
            adminPanel: "Admin Panel",
            tabProgramEdit: "Edit Programs",
            tabFileLoad: "Load Files",
            tabRoster: "Roster Preview",
            tabStatus: "Reception Status",
            tabSettings: "Settings",
            showTranslation: "Show English Translation",
            jsonEditor: "View/Edit JSON",
            applyJson: "Apply JSON",
            addProgram: "+ Add Program",
            saveChanges: "Save Changes",
            fileUpload1: "① Mini-Capstone Experience Reservation Roster (xlsx)",
            fileUpload2: "② Faculty of Engineering Briefing Session Roster (xlsx)",
            loadProgress: "③ Load Progress (.json)",
            rosterReservations: "Mini-Capstone Experience Reservation Roster",
            rosterBriefing: "Faculty of Engineering Briefing Session Roster",
            rosterOthers: "Others",
            rosterSearchPlaceholder: "Search by Name/Furigana",
            statusConfirmed: "Confirmed",
            statusWaiting: "Waiting",
            statusNotRegistered: "Not Registered",
            confirmedList: "Confirmed List",
            waitingList: "Waiting List",
            assignWaiting: "Assign Waiting Participants",
            saveProgress: "Save Progress",
            exportData: "Export",
            exportSelect: "Select Export Format",
            exportExcelBtn: "Excel",
            exportPdfBtn: "PDF",
            prioritizeReserved: "Prioritize Reserved Participants",
            prioritizeDesc: "When ON, walk-in participants are set to 'Waiting'. After all registrations, assign them from the 'Reception Status' tab using the 'Assign Waiting Participants' button.",
            prioritizeGrade: "Prioritize by Grade (for Walk-ins)",
            prioritizeGradeDesc: "When ON, waiting walk-ins are assigned by grade (3rd yr → 2nd yr → 1st yr → Other). When OFF, it's first-come, first-served.",
            resetData: "Reset Reception Data",
            backToReception: "Back to Reception Screen",
            adminLogin: "Admin Login",
            password: "Password",
            login: "Login",
            logout: "Logout",
            cancel: "Cancel",
            choice1: "1st Choice",
            choice2: "2nd Choice",
            choice3: "3rd Choice",
            nameHeader: "Name",
            programHeader: "Program",
            statusHeader: "Status (count)",
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
            autoTranslate: "Auto-translate to English",
            titleEnLabel: "Title (English)",
            descriptionEnLabel: "Description (English)",
            full: "This program is full",
            cardView: "Card View",
            totalConfirmed: "Total Confirmed",
            totalWaiting: "Total Waiting",
            totalAttendees: "Total Registered",
            scheduleTitle: "Schedule",
            companionsCountLabel: "Number of Companions",
            noCapstoneTitle: "Registration Complete",
            noCapstoneDesc: "Your registration for not participating in the capstone experience is complete.",
            noCapstoneInfo: "If you are only attending the Faculty of Engineering briefing, please register for it separately.",
            nameSpaceNote: "※ Please put a space between family and given name",
            errorEnterName: "Please enter your name.",
            errorNotFound: "Reservation not found. Please check the name or register as a walk-in.",
            errorAllFields: "Please fill in all required fields.",
            errorSelectProgram: "Please select at least one program.",
            errorJsonFormat: "Invalid JSON format.",
            infoJsonApplied: "Data applied from JSON.",
            infoChangesSaved: "Changes have been saved.",
            settingsSaved: "Settings have been saved.",
            errorProgramFull: "This program is full. Please choose another.",
            errorInvalidProgram: "Invalid program data. Please choose another.",
            errorDuplicateChoices: "You cannot select the same program for multiple preferences.",
            errorUnexpected: "An unexpected error occurred. Please try again.",
            confirmDelete: (title) => `Are you sure you want to delete "${title}"?`,
            assignConfirm: (count) => `Assign ${count} people to programs. Are you sure?`,
            assignComplete: (count) => `Assignment for ${count} people is complete.`,
            noWaiting: "There are no participants on the waiting list.",
            noRosterData: "Roster data has not been imported. Please import the roster file from the admin panel.",
            resetConfirm: "All reception data (confirmed and waiting lists) will be reset. This action cannot be undone. Are you sure?",
            resetComplete: "Data has been reset. The page will now reload.",
            reloadDisabled: "Reloading is disabled on this page to prevent data loss.",
            errorAlreadyRegistered: "You are already registered or on the waiting list.",
            wrongPassword: "Incorrect password.",
            noChoicesProvided: "You did not provide program preferences with your reservation, so you must select them now.",
            noCapstoneBriefingTime: "{name}, your Faculty of Engineering briefing session starts at {time}.",
        },
        es: { // Ejemplo de un tercer idioma
            mainTitle: "Recepción de Experiencia Mini-Capstone de la Facultad de Ingeniería",
            reserved: "Reservado",
            walkIn: "Sin reserva",
            back: "Volver",
            enterFullName: "Por favor, ingrese su nombre completo",
            reservedNameInputTitle: "Reservado - Ingrese su nombre",
            walkInNameInputTitle: "Sin reserva - Ingrese su nombre",
            namePlaceholder: "Ej: Taro Yamada",
            checkReservation: "Verificar Reserva",
            confirmDetails: "Confirmar sus datos",
            confirmSubmit: "Confirmar",
            changeReservation: "Cambiar preferencias",
            name: "Nombre",
            furigana: "Furigana",
            furiganaPlaceholder: "Ej: YAMADA TARO",
            requiredMark: "Wajib",
            school: "Nama Sekolah",
            schoolPlaceholder: "Ej: SMA Negeri 1",
            grade: "Kelas",
            selectGrade: "Silakan pilih",
            grade1: "Kelas 1 SMA",
            grade2: "Kelas 2 SMA",
            grade3: "Kelas 3 SMA",
            other: "Lainnya",
            toProgramSelection: "Pilih Program Pengalaman Capstone",
            noCapstoneExperience: "Bagi yang hanya menghadiri Pengarahan Fakultas Teknik",
            selectProgramTitle: "Pilih Program Pilihan Anda",
            selectProgramDesc: "Anda dapat memilih hingga 3 preferensi.",
            confirmChoices: "Konfirmasi Pilihan",
            successTitle: "Pendaftaran Selesai!",
            successDesc: "Anda telah dikonfirmasi untuk program berikut:",
            successWaiting: "Program Anda akan ditentukan nanti.",
            backToHome: "Kembali ke Beranda",
            adminPanel: "Panel Admin",
            tabProgramEdit: "Edit Program",
            tabFileLoad: "Muat File",
            tabRoster: "Pratinjau Daftar Nama",
            tabStatus: "Status Penerimaan",
            tabSettings: "Pengaturan",
            showTranslation: "Tampilkan Terjemahan Bahasa Inggris",
            jsonEditor: "Lihat/Edit JSON",
            applyJson: "Terapkan JSON",
            addProgram: "+ Tambah Program",
            saveChanges: "Simpan Perubahan",
            fileUpload1: "① Daftar Reservasi Pengalaman Mini-Capstone (xlsx)",
            fileUpload2: "② Daftar Sesi Pengarahan Fakultas Teknik (xlsx)",
            loadProgress: "③ Muat Progres (.json)",
            rosterReservations: "Daftar Reservasi Pengalaman Mini-Capstone",
            rosterBriefing: "Daftar Sesi Pengarahan Fakultas Teknik",
            rosterOthers: "Lainnya",
            rosterSearchPlaceholder: "Cari berdasarkan Nama/Furigana",
            statusConfirmed: "Terkonfirmasi",
            statusWaiting: "Menunggu",
            statusNotRegistered: "Belum Terdaftar",
            confirmedList: "Daftar Terkonfirmasi",
            waitingList: "Daftar Tunggu",
            assignWaiting: "Tetapkan Peserta yang Menunggu",
            saveProgress: "Simpan Progres",
            exportData: "Ekspor",
            exportSelect: "Pilih Format Ekspor",
            exportExcelBtn: "Excel",
            exportPdfBtn: "PDF",
            prioritizeReserved: "Prioritaskan Peserta yang Reservasi",
            prioritizeDesc: "Jika AKTIF, peserta yang datang langsung akan berstatus 'Menunggu'. Setelah semua pendaftaran selesai, tetapkan mereka dari tab 'Status Penerimaan' menggunakan tombol 'Tetapkan Peserta yang Menunggu'.",
            prioritizeGrade: "Prioritaskan berdasarkan Kelas (untuk yang Langsung Datang)",
            prioritizeGradeDesc: "Jika AKTIF, peserta yang menunggu akan ditetapkan berdasarkan kelas (Kelas 3 → Kelas 2 → Kelas 1 → Lainnya). Jika NONAKTIF, berdasarkan urutan kedatangan.",
            resetData: "Atur Ulang Data Penerimaan",
            backToReception: "Kembali ke Layar Penerimaan",
            adminLogin: "Login Admin",
            password: "Kata Sandi",
            login: "Login",
            logout: "Logout",
            cancel: "Batal",
            choice1: "Pilihan 1",
            choice2: "Pilihan 2",
            choice3: "Pilihan 3",
            nameHeader: "Nama",
            programHeader: "Program",
            statusHeader: "Status (jumlah)",
            attendeesHeader: "Peserta",
            waitingHeader: "Menunggu Penempatan",
            furiganaHeader: "Furigana",
            timeHeader: "Waktu",
            noAttendees: "Belum ada",
            unselected: "Tidak dipilih",
            titleLabel: "Judul",
            descriptionLabel: "Deskripsi",
            capacityLabel: "Kapasitas",
            deleteButton: "Hapus",
            autoTranslate: "Terjemahkan otomatis ke Bahasa Inggris",
            titleEnLabel: "Judul (Inggris)",
            descriptionEnLabel: "Deskripsi (Inggris)",
            full: "Program ini sudah penuh",
            cardView: "Tampilan Kartu",
            totalConfirmed: "Total Terkonfirmasi",
            totalWaiting: "Total Menunggu",
            totalAttendees: "Total Terdaftar",
            scheduleTitle: "Jadwal",
            companionsCountLabel: "Jumlah Pendamping",
            noCapstoneTitle: "Pendaftaran Selesai",
            noCapstoneDesc: "Pendaftaran Anda untuk tidak berpartisipasi dalam pengalaman capstone telah selesai.",
            noCapstoneInfo: "Jika Anda hanya menghadiri pengarahan Fakultas Teknik, silakan mendaftar secara terpisah.",
            nameSpaceNote: "※ Harap beri spasi antara nama keluarga dan nama depan",
            // Alert Messages
            errorEnterName: "Silakan masukkan nama Anda.",
            errorNotFound: "Reservasi tidak ditemukan. Silakan periksa nama atau daftar sebagai peserta langsung.",
            errorAllFields: "Harap isi semua kolom yang wajib diisi.",
            errorSelectProgram: "Silakan pilih setidaknya satu program.",
            errorJsonFormat: "Format JSON tidak valid.",
            infoJsonApplied: "Data diterapkan dari JSON.",
            infoChangesSaved: "Perubahan telah disimpan.",
            settingsSaved: "Pengaturan telah disimpan.",
            errorProgramFull: "Program ini penuh. Silakan pilih yang lain.",
            errorInvalidProgram: "Data program tidak valid. Silakan pilih yang lain.",
            errorDuplicateChoices: "Anda tidak dapat memilih program yang sama untuk beberapa preferensi.",
            errorUnexpected: "Terjadi kesalahan tak terduga. Silakan coba lagi.",
            confirmDelete: (title) => `Apakah Anda yakin ingin menghapus "${title}"?`,
            assignConfirm: (count) => `Tetapkan ${count} orang ke program. Apakah Anda yakin?`,
            assignComplete: (count) => `Penetapan untuk ${count} orang selesai.`,
            noWaiting: "Tidak ada peserta dalam daftar tunggu.",
            noRosterData: "Data daftar nama belum diimpor. Silakan impor file dari panel admin.",
            resetConfirm: "Semua data penerimaan (daftar terkonfirmasi dan menunggu) akan diatur ulang. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?",
            resetComplete: "Data telah diatur ulang. Halaman akan dimuat ulang sekarang.",
            reloadDisabled: "Memuat ulang dinonaktifkan di halaman ini untuk mencegah kehilangan data.",
            errorAlreadyRegistered: "Anda sudah terdaftar atau berada dalam daftar tunggu.",
            wrongPassword: "Kata sandi salah.",
            noChoicesProvided: "Anda tidak memberikan preferensi program saat reservasi, jadi Anda harus memilihnya sekarang.",
            noCapstoneBriefingTime: "{name}, sesi pengarahan Fakultas Teknik Anda dimulai pukul {time}.",
        }
    };*/

    async function updateLanguage(lang) {
        await window.loadTranslations(lang);
        currentLanguage = lang;
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            const translation = getTranslation(key);
            if (translation) el.textContent = translation;
        });
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
            const key = el.dataset.langKeyPlaceholder;
            const translation = getTranslation(key);
            if (translation) el.placeholder = translation;
        });
        const currentVisibleSection = document.querySelector('#reception-sections-wrapper .section:not(.section-hidden)');
        if (currentVisibleSection && currentVisibleSection.id === 'program-selection-section') {
            renderProgramGrid();
        }
        if (document.getElementById('admin-view').classList.contains('hidden') === false) {
            renderAdminEditor();
            updateStatusView();
            renderRosterPreview();
        }
        if (currentUser) {
            showConfirmation(currentUser);
        }
        const briefingTimeEl = document.getElementById('no-capstone-briefing-time');
        if (briefingTimeEl && currentUser && currentUser.noCapstone) {
            const briefingAttendee = briefingSessionAttendees.find(a => a.name === currentUser.name);
            if (briefingAttendee && briefingAttendee.time) {
                const tmpl = getTranslation('noCapstoneBriefingTime');
                briefingTimeEl.textContent = (tmpl || '{name} {time}').replace('{name}', currentUser.name).replace('{time}', briefingAttendee.time);
            } else {
                briefingTimeEl.textContent = getTranslation('noCapstoneInfo') || '';
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

    function updateAdminEntryVisual(isLoggedIn) {
        if (!adminEntryBtn) return;
        try {
            adminEntryBtn.classList.toggle('logged-in', !!isLoggedIn);
            const icon = adminEntryBtn.querySelector('i');
            if (icon) {
                // ログイン時は filled shield-check、未ログイン時は gear
                icon.className = isLoggedIn ? 'ph ph-shield-check' : 'ph ph-gear-six';
            }
            adminEntryBtn.title = isLoggedIn ? (currentLanguage === 'ja' ? '管理画面（ログイン中）' : 'Admin (Logged in)') : (currentLanguage === 'ja' ? '管理画面へ' : 'Open Admin');
        } catch (_) {}
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
        try {
            if (window.firebase && window.firebase.auth) {
                const user = window.firebase.auth().currentUser;
                const emailSpan = document.getElementById('admin-user-email');
                if (emailSpan) emailSpan.textContent = (user && user.email) ? user.email : '';
            }
        } catch (_) {}
        renderAdminEditor();
        renderStatusTable();
    }
    
    function resetReceptionState() {
        document.getElementById('student-name').value = '';
        document.getElementById('walk-in-name').value = '';
        const f = document.getElementById('walk-in-furigana'); if (f) f.value = '';
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
        // Firestoreの最新データから現在のプログラム参加人数を計算
        const currentEnrollment = {};
        programs.forEach(p => { currentEnrollment[p.id] = 0; });
        allParticipants.forEach(p => {
            if (p.assignedProgramId && currentEnrollment[p.assignedProgramId] !== undefined) {
                currentEnrollment[p.assignedProgramId]++;
            }
        });

        for (const choiceId of user.choices) {
            if (choiceId && (currentEnrollment[choiceId] || 0) < programs.find(p => p.id === choiceId).capacity) {
                // 割り当て成功
                return programs.find(p => p.id === choiceId);
            }
        }
        // 割り当て失敗
        return null;
    }
    function showSuccessScreen(name, program, isWaiting = false) {
        const studentNameEl = document.getElementById('success-student-name');
        const programCardEl = document.getElementById('success-program-card');
        const successDesc = document.getElementById('success-message-desc');
        const roleMsgEl = document.getElementById('role-color-success');
        
        studentNameEl.textContent = `${name} 様`;
        
        if(isWaiting) {
            successDesc.textContent = window.translations[currentLanguage]?.successWaiting || '';
            successDesc.classList.add('waiting-emphasis');
            programCardEl.classList.add('hidden');
            if (roleMsgEl) {
                roleMsgEl.innerHTML = (currentLanguage === 'ja')
                    ? 'あなたは<span class="text-red">「赤色」</span>です。スムーズなご案内のためスタッフが手首に色のストラップをつけさせていただきます。'
                    : 'Your color is <span class="text-red">red</span>. For smooth guidance, staff will place a colored strap on your wrist.';
                roleMsgEl.classList.remove('hidden');
            }
        } else if (program) {
            successDesc.textContent = window.translations[currentLanguage]?.successDesc || '';
            successDesc.classList.remove('waiting-emphasis');
            programCardEl.classList.remove('hidden');
            programCardEl.innerHTML = `<h3>${escapeHTML(program.title)}</h3><p>${escapeHTML(program.description)}</p>`;
            programCardEl.style.borderColor = 'var(--success-color)';
            programCardEl.style.backgroundColor = '#eaf6ec';
            if (roleMsgEl) {
                roleMsgEl.innerHTML = (currentLanguage === 'ja')
                    ? 'あなたは<span class="text-red">「赤色」</span>です。スムーズなご案内のためスタッフが手首に色のストラップをつけさせていただきます。'
                    : 'Your color is <span class="text-red">red</span>. For smooth guidance, staff will place a colored strap on your wrist.';
                roleMsgEl.classList.remove('hidden');
            }
        } else {
            successDesc.textContent = window.translations[currentLanguage]?.successDesc || '';
            successDesc.classList.remove('waiting-emphasis');
            programCardEl.classList.remove('hidden');
            programCardEl.innerHTML = `<h3>申し訳ありません</h3><p>全ての希望プログラムが満員のため、参加できるプログラムがありません。運営スタッフにお声がけください。</p>`;
            programCardEl.style.borderColor = 'var(--danger-color)';
            programCardEl.style.backgroundColor = '#f8d7da';
            if (roleMsgEl) {
                roleMsgEl.classList.add('hidden');
            }
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
            const title = getTranslatedValue(p.title, p.title_en);
            const description = getTranslatedValue(p.description, p.description_en);
            let fullOverlayHTML = '';
            const fullText = getTranslation('full');
            if (isFull && fullText) {
                fullOverlayHTML = `<div class="full-overlay"><span>${escapeHTML(fullText)}</span></div>`;
            }
            card.innerHTML = `
                ${fullOverlayHTML}
                <h3>${escapeHTML(title)}</h3>
                <p>${escapeHTML(description)}</p>
                <div class="program-choice-btns" data-program-id="${p.id}">
                    <button class="p1" ${isFull ? 'disabled' : ''}>${escapeHTML(getTranslation('choice1') || '')}</button>
                    <button class="p2" ${isFull ? 'disabled' : ''}>${escapeHTML(getTranslation('choice2') || '')}</button>
                    <button class="p3" ${isFull ? 'disabled' : ''}>${escapeHTML(getTranslation('choice3') || '')}</button>
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
            // ID、完全タイトル一致、サブタイトル付きの前半一致に対応
            const prog = (function() {
                let p = programs.find(pp => pp.id === s);
                if (p) return p;
                p = programs.find(pp => pp.title === s || pp.title_en === s);
                if (p) return p;
                const base = extractBaseTitle(s);
                if (!base) return null;
                const norm = (t) => (t || '').toString().trim();
                return programs.find(pp => norm(base) === norm(pp.title) || norm(base) === norm(pp.title_en)
                    || norm(s).startsWith(norm(pp.title)) || norm(s).startsWith(norm(pp.title_en)));
            })();
            if (prog) {
                const title = currentLanguage === 'en' && prog.title_en ? prog.title_en : prog.title;
                return extractBaseTitle(title);
            }
            return translations[currentLanguage].unselected;
        };
        const choice1 = resolveChoice(student.choices?.[0]);
        const choice2 = resolveChoice(student.choices?.[1]);
        const choice3 = resolveChoice(student.choices?.[2]);
        document.querySelector('.content-wrapper').classList.add('has-back-btn');
        const companionsCount = Number.isFinite(student.companions) ? Math.max(0, student.companions) : 0;
        details.innerHTML = `
            <p>${escapeHTML(translations[currentLanguage].nameHeader)}: <span>${escapeHTML(student.name)} 様</span></p>
            <p>${escapeHTML(translations[currentLanguage].choice1)}: <span>${escapeHTML(choice1)}</span></p>
            <p>${escapeHTML(translations[currentLanguage].choice2)}: <span>${escapeHTML(choice2)}</span></p>
            <p>${escapeHTML(translations[currentLanguage].choice3)}: <span>${escapeHTML(choice3)}</span></p>
            <p>${escapeHTML(translations[currentLanguage].companionsCountLabel)}: <span>${companionsCount}</span></p>
        `;
        // 確認画面では役割カラーは表示しない
    }

    // 予約データの希望配列をプログラムIDに正規化（サブタイトル付きにも対応）
    function normalizeChoicesToProgramIds(rawChoices) {
        const findProgramByLooseTitle = (input) => {
            const s = (input || '').toString().trim();
            if (!s) return null;
            // 既にIDの場合
            let prog = programs.find(p => p.id === s);
            if (prog) return prog;
            // 完全一致（JP/EN）
            prog = programs.find(p => p.title === s || p.title_en === s);
            if (prog) return prog;
            // サブタイトル区切りで前半を比較（例: タイトル: サブタイトル / タイトル（サブタイトル）など）
            const base = extractBaseTitle(s);
            if (base) {
                const norm = (t) => (t || '').toString().trim();
                // プログラム名が入力の先頭に一致、または入力の前半がプログラム名と一致
                prog = programs.find(p => norm(base) === norm(p.title) || norm(base) === norm(p.title_en)
                    || norm(s).startsWith(norm(p.title)) || norm(s).startsWith(norm(p.title_en)));
                if (prog) return prog;
            }
            return null;
        };
        const toId = (val) => {
            const s = (val || '').toString().trim();
            if (!s || s === '-' || s === '希望なし' || s.toLowerCase() === 'none' || s === 'N/A') return null;
            const prog = findProgramByLooseTitle(s);
            return prog ? prog.id : null;
        };
        const arr = Array.isArray(rawChoices) ? rawChoices : [];
        return [toId(arr[0]), toId(arr[1]), toId(arr[2])];
    }

    // サブタイトルを含む文字列からベースタイトル（前半）を抽出
    function extractBaseTitle(raw) {
        const s = (raw || '').toString().trim();
        if (!s) return '';
        const separators = ['：', ':', '（', '(', '【', '『', '〜', '～'];
        // ハイフンは両側スペースがある場合のみ区切りとみなす
        const hyphenIdx = s.indexOf(' - ');
        let cutIdx = -1;
        separators.forEach(sep => {
            const idx = s.indexOf(sep);
            if (idx >= 0) cutIdx = (cutIdx < 0) ? idx : Math.min(cutIdx, idx);
        });
        if (hyphenIdx >= 0) cutIdx = (cutIdx < 0) ? hyphenIdx : Math.min(cutIdx, hyphenIdx);
        if (cutIdx >= 0) return s.slice(0, cutIdx).trim();
        return s;
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
    
    // プログラム選択画面の同伴者入力の表示/非表示を切り替え
    function setProgramCompanionsVisibility(visible) {
        const compInput = document.getElementById('companion-count-input');
        if (!compInput) return;
        const wrapper = compInput.closest('.input-group');
        if (!wrapper) return;
        if (visible) {
            wrapper.classList.remove('hidden');
        } else {
            wrapper.classList.add('hidden');
        }
    }

    // 予約経由のときは、名簿から読み込んだ同伴者人数をセレクトに反映
    function setProgramCompanionsFromCurrentUser() {
        const compInput = document.getElementById('companion-count-input');
        if (!compInput) return;
        const value = (typeof currentUser?.companions === 'number')
            ? String(Math.max(0, currentUser.companions))
            : '0';
        compInput.value = value;
    }
    
    // --- Excel 関連の処理 ---
    let pendingMappingContext = null; // { type, headerRow, jsonData }

    function detectTimeHeaderIndex(headerRow) {
        const lower = headerRow.map(h => (h || '').toString().toLowerCase());
        const candidates = ['時間', '時刻', '開始', 'start', 'time'];
        for (let i = 0; i < lower.length; i++) {
            if (candidates.some(k => lower[i].includes(k))) return i;
        }
        return -1;
    }

    function buildColumnOptions(headerRow) {
        return headerRow.map((h, i) => {
            const letter = columnLetter(i);
            const text = `${letter}: ${(h ?? '').toString()}`.trim();
            return { value: i, label: text };
        });
    }

    function renderSelect(labelText, id, options, selectedIndex = -1, allowNone = true) {
        const opts = [];
        if (allowNone) {
            opts.push(`<option value="-1">（なし）</option>`);
        }
        options.forEach(opt => {
            const sel = (selectedIndex === opt.value) ? ' selected' : '';
            opts.push(`<option value="${opt.value}"${sel}>${escapeHTML(opt.label)}</option>`);
        });
        return `
            <div class="editor-item-row">
                <label for="${id}">${escapeHTML(labelText)}</label>
                <select id="${id}">${opts.join('')}</select>
            </div>
        `;
    }

    function openMappingModal(context) {
        pendingMappingContext = context;
        const { type, headerRow } = context;
        const options = buildColumnOptions(headerRow);
        const mappingModal = document.getElementById('mapping-modal');
        const mappingTitle = document.getElementById('mapping-title');
        const mappingForm = document.getElementById('mapping-form');
        const btnApply = document.getElementById('btn-mapping-apply');
        const btnCancel = document.getElementById('btn-mapping-cancel');

        // 初期推定
        const resAuto = detectReservationHeaderMapping(headerRow);
        const briAuto = detectBriefingHeaderMapping(headerRow);
        const timeAutoIdx = detectTimeHeaderIndex(headerRow);

        if (type === 'reservations') {
            mappingTitle.textContent = 'ミニキャップストーン体験 名簿の列対応';
            mappingForm.innerHTML = [
                renderSelect('名前列（単一）', 'map-name-single', options, resAuto.nameIdx ?? -1, true),
                '<div style="margin-top:4px; font-size:12px; opacity:.8;">※ 上の「名前列」を使わない場合、下の「姓/名」列を設定してください</div>',
                renderSelect('姓列（任意）', 'map-last-name', options, -1, true),
                renderSelect('名列（任意）', 'map-first-name', options, -1, true),
                renderSelect('セイ（フリガナ）列（任意）', 'map-furigana-sei', options, (resAuto.furiganaIdxs?.[0] ?? -1), true),
                renderSelect('メイ（フリガナ）列（任意）', 'map-furigana-mei', options, (resAuto.furiganaIdxs?.[1] ?? -1), true),
                renderSelect('第1希望列', 'map-choice-1', options, (resAuto.choiceIdxs?.[0] ?? -1), false),
                renderSelect('第2希望列', 'map-choice-2', options, (resAuto.choiceIdxs?.[1] ?? -1), true),
                renderSelect('第3希望列', 'map-choice-3', options, (resAuto.choiceIdxs?.[2] ?? -1), true),
                renderSelect('同伴者人数列（任意）', 'map-companions', options, -1, true)
            ].join('');
        } else {
            mappingTitle.textContent = '工学部説明会 名簿の列対応';
            mappingForm.innerHTML = [
                renderSelect('名前列（単一）', 'map-name-single', options, briAuto.nameIdx ?? -1, true),
                '<div style="margin-top:4px; font-size:12px; opacity:.8;">※ 上の「名前列」を使わない場合、下の「姓/名」列を設定してください</div>',
                renderSelect('姓列（任意）', 'map-last-name', options, -1, true),
                renderSelect('名列（任意）', 'map-first-name', options, -1, true),
                renderSelect('セイ（フリガナ）列（任意）', 'map-furigana-sei', options, (briAuto.furiganaIdxs?.[0] ?? -1), true),
                renderSelect('メイ（フリガナ）列（任意）', 'map-furigana-mei', options, (briAuto.furiganaIdxs?.[1] ?? -1), true),
                renderSelect('時間列', 'map-time', options, timeAutoIdx, false),
                renderSelect('同伴者人数列（任意）', 'map-companions', options, -1, true)
            ].join('');
        }

        // 既存のリスナーをクリア（ボタンをクローン）
        const newApply = btnApply.cloneNode(true);
        btnApply.parentNode.replaceChild(newApply, btnApply);
        const newCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newCancel, btnCancel);

        newApply.addEventListener('click', onApplyMapping);
        newCancel.addEventListener('click', () => {
            mappingModal.classList.remove('visible');
        });

        mappingModal.classList.add('visible');
    }
    function onApplyMapping() {
        if (!pendingMappingContext) return;
        const { type, jsonData } = pendingMappingContext;
        const mappingModal = document.getElementById('mapping-modal');
        const getIdx = (id) => parseInt(document.getElementById(id)?.value ?? '-1', 10);
        const nameSingle = getIdx('map-name-single');
        const lastIdx = getIdx('map-last-name');
        const firstIdx = getIdx('map-first-name');
        const furiSeiIdx = getIdx('map-furigana-sei');
        const furiMeiIdx = getIdx('map-furigana-mei');

        if (type === 'reservations') {
            const c1 = getIdx('map-choice-1');
            const c2 = getIdx('map-choice-2');
            const c3 = getIdx('map-choice-3');
            const compIdx = getIdx('map-companions');
            const map = {
                nameIdx: nameSingle >= 0 ? nameSingle : [lastIdx, firstIdx].filter(i => i >= 0),
                furiganaIdxs: [furiSeiIdx, furiMeiIdx],
                choiceIdxs: [c1, c2, c3],
                companionsIdx: compIdx
            };
            rosterMappingInfo.reservations = map;
            const rows = jsonData.slice(1);
            const get = (row, idx) => (idx != null && idx >= 0 ? String(row[idx] ?? '').trim() : '');
            const parsed = rows
                .map(row => {
                    let name = '';
                    if (typeof map.nameIdx === 'number') {
                        name = get(row, map.nameIdx);
                    } else if (Array.isArray(map.nameIdx) && map.nameIdx.length) {
                        name = map.nameIdx.map(i => get(row, i)).filter(Boolean).join(' ');
                    }
                    const furiParts = Array.isArray(map.furiganaIdxs) ? map.furiganaIdxs : [];
                    const furigana = furiParts.filter(i => i >= 0).map(i => get(row, i)).filter(Boolean).join(' ');
                    const choices = map.choiceIdxs.map(i => {
                        const v = get(row, i);
                        return v || null;
                    });
                    const companions = Math.max(0, parseInt(get(row, map.companionsIdx), 10) || 0);
                    return { name, furigana: furigana || undefined, choices, companions };
                })
                .filter(r => (r.name || '').trim() !== '');
            reservations = parsed;
            const statusEl = document.getElementById('file-upload-status');
            if (statusEl) statusEl.innerHTML += `<p>予約者名簿を読み込みました。${reservations.length}件</p>`;
        } else {
            const timeIdx = getIdx('map-time');
            const compIdx = getIdx('map-companions');
            const map = {
                nameIdx: nameSingle >= 0 ? nameSingle : [lastIdx, firstIdx].filter(i => i >= 0),
                furiganaIdxs: [furiSeiIdx, furiMeiIdx],
                timeIdx: timeIdx,
                companionsIdx: compIdx
            };
            rosterMappingInfo.briefing = map;
            const rows = jsonData.slice(1);
            const get = (row, idx) => (idx != null && idx >= 0 ? String(row[idx] ?? '').trim() : '');
            const parsed = rows
                .map(row => {
                    let name = '';
                    if (typeof map.nameIdx === 'number') {
                        name = get(row, map.nameIdx);
                    } else if (Array.isArray(map.nameIdx) && map.nameIdx.length) {
                        name = map.nameIdx.map(i => get(row, i)).filter(Boolean).join(' ');
                    }
                    const furiParts = Array.isArray(map.furiganaIdxs) ? map.furiganaIdxs : [];
                    const furigana = furiParts.filter(i => i >= 0).map(i => get(row, i)).filter(Boolean).join(' ');
                    const time = get(row, map.timeIdx);
                    const companions = Math.max(0, parseInt(get(row, map.companionsIdx), 10) || 0);
                    return { name, furigana: furigana || undefined, time: time || undefined, companions };
                })
                .filter(r => (r.name || '').trim() !== '');
            briefingSessionAttendees = parsed;
            const statusEl = document.getElementById('file-upload-status');
            if (statusEl) statusEl.innerHTML += `<p>工学部説明会名簿を読み込みました。${briefingSessionAttendees.length}件</p>`;
        }

        saveStateToLocalStorage();
        saveRosterData();
        updateRosterMappingText();
        renderRosterPreview();
        mappingModal.classList.remove('visible');
        pendingMappingContext = null;
    }

    function handleFileUpload(file, type) {
        if (typeof XLSX === 'undefined') {
            const statusEl = document.getElementById('file-upload-status');
            if (statusEl) {
                statusEl.textContent = 'Excel処理ライブラリが見つかりません（オフライン資産の配置を確認してください）';
            }
            return;
        }
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
            openMappingModal({ type, headerRow, jsonData });
            } catch (error) {
                showCustomAlert('errorJsonFormat');
            }
        };
        reader.readAsArrayBuffer(file);
    }
    function exportToExcel() {
        if (typeof XLSX === 'undefined') {
            showCustomAlert('errorUnexpected');
            return;
        }
        const isEn = currentLanguage === 'en';
        const programLabel = isEn ? 'Program' : 'プログラム';
        const statusLabel = isEn ? 'Attendees/Capacity' : '出席/枠数';
        const attendeeLabel = isEn ? 'Attendee' : '参加者';
        const totalsLabel = isEn ? 'Total' : '合計';

        const rowsByProgram = programs.map(p => {
            const names = confirmedAttendees
                .filter(a => a.assignedProgramId === p.id)
                .map(a => a.name);
            return { program: p, names };
        });
        const maxNames = rowsByProgram.reduce((m, r) => Math.max(m, r.names.length), 0);

        const header = [programLabel, statusLabel];
        for (let i = 1; i <= maxNames; i++) header.push(`${attendeeLabel}${isEn ? ' ' : ''}${i}`);
        for (let i = 1; i <= maxNames; i++) header.push(`${attendeeLabel}${isEn ? ' ' : ''}${i} (Companions)`);

        const data = [header];
        rowsByProgram.forEach(({ program: p, names }) => {
            const title = getTranslatedValue(p.title, p.title_en);
            const enrolled = names.length;
            const capacity = p.capacity || 0;
            const compByName = (n) => (reservations.find(r => r.name === n)?.companions|0) || 0;
            const compCells = names.map(n => String(compByName(n)));
            const row = [title, `${enrolled}/${capacity}`, ...names, ...compCells];
            while (row.length < header.length) row.push('');
            data.push(row);
        });
        data.push([]);
        data.push([totalsLabel, confirmedAttendees.length]);

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reception Status");
        XLSX.writeFile(workbook, "reception_status.xlsx");
    }

    function exportToPdf() {
        // 簡易PDF: 別ウィンドウに印刷用HTMLを作成してユーザーの印刷ダイアログ（PDF保存対応）を開く
        const win = window.open('', '_blank');
        if (!win) {
            showCustomAlert('popupBlocked');
            return;
        }
        const isEn = currentLanguage === 'en';
        const programHeader = isEn ? 'Program' : 'プログラム';
        const statusHeader = isEn ? 'Attendees/Capacity' : '出席/枠数';
        const attendeeHeaderBase = isEn ? 'Attendee' : '参加者';
        const totalsLabel = isEn ? 'Total' : '合計';

        const rowsByProgram = programs.map(p => {
            const names = confirmedAttendees
                .filter(a => a.assignedProgramId === p.id)
                .map(a => a.name);
            return { program: p, names };
        });
        const maxNames = rowsByProgram.reduce((m, r) => Math.max(m, r.names.length), 0);

        const theadCols = [`<th>${programHeader}</th>`, `<th>${statusHeader}</th>`];
        for (let i = 1; i <= maxNames; i++) theadCols.push(`<th>${attendeeHeaderBase}${isEn ? ' ' : ''}${i}</th>`);
        for (let i = 1; i <= maxNames; i++) theadCols.push(`<th>${attendeeHeaderBase}${isEn ? ' ' : ''}${i} (Companions)</th>`);

        const bodyRows = rowsByProgram.map(({ program: p, names }) => {
            const title = (isEn && p.title_en) ? p.title_en : p.title;
            const enrolled = names.length;
            const capacity = p.capacity || 0;
            const cols = [`<td>${escapeHTML(title)}</td>`, `<td>${enrolled}/${capacity}</td>`];
            names.forEach(n => cols.push(`<td>${escapeHTML(n)}</td>`));
            names.forEach(n => {
                const comp = (reservations.find(r => r.name === n)?.companions|0);
                cols.push(`<td>${comp > 0 ? comp : ''}</td>`);
            });
            while (cols.length < theadCols.length) cols.push('<td></td>');
            return `<tr>${cols.join('')}</tr>`;
        }).join('');

        const totalCount = confirmedAttendees.length;

        const now = new Date();
        const titleDateJP = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        const topTitle = `${titleDateJP}　工学部ミニキャップストーン体験　受付状況`;

        win.document.write(`
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHTML(translations[currentLanguage].exportTitle || 'Reception Status')}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans JP', Arial, sans-serif; margin: 24px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 12px; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  th, td { font-size: 12px; padding: 6px 8px; border: 1px solid #ccc; word-break: break-word; }
  thead th { background: #f3f5f7; text-align: left; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  tfoot th, tfoot td { font-weight: 700; background: #f7f9fb; }
  @page { size: A4 portrait; margin: 14mm; }
</style>
</head><body>
  <h1>${escapeHTML(topTitle)}</h1>
  <table>
    <thead>
      <tr>${theadCols.join('')}</tr>
    </thead>
    <tbody>
      ${bodyRows || `<tr><td colspan="${theadCols.length}" style="text-align:center;">${escapeHTML(translations[currentLanguage].noAttendees)}</td></tr>`}
    </tbody>
    <tfoot>
      <tr><th>${totalsLabel}</th><td>${totalCount}</td>${Array(Math.max(0, theadCols.length - 2)).fill('<td></td>').join('')}</tr>
    </tfoot>
  </table>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 100); }<\/script>
</body></html>`);
        win.document.close();
    }

    function openExportPicker() {
        const exportModal = document.getElementById('export-modal');
        if (!exportModal) {
            // フォールバック
            exportToExcel();
            return;
        }
        exportModal.classList.add('visible');
        // 既存のハンドラをクリアするためにクローンで差し替え
        const replaceWithClone = (id, handler) => {
            const oldBtn = document.getElementById(id);
            if (!oldBtn) return;
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            if (handler) newBtn.addEventListener('click', handler);
        };
        replaceWithClone('btn-export-excel-modal', () => { exportModal.classList.remove('visible'); exportToExcel(); });
        replaceWithClone('btn-export-pdf-modal', () => { exportModal.classList.remove('visible'); exportToPdf(); });
        replaceWithClone('btn-export-cancel', () => { exportModal.classList.remove('visible'); });
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
                        .map(a => {
                            const comp = (reservations.find(r => r.name === a.name)?.companions|0);
                            const label = comp > 0 ? `${a.name}（同伴者:${comp}）` : a.name;
                            return `<span class=\"chip\">${escapeHTML(label)}</span>`;
                        })
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
                        <th>${escapeHTML(translations[currentLanguage].attendeesHeader)}</th>
                        <th>${escapeHTML(translations[currentLanguage].statusHeader)}</th>
                    </tr>
                </thead>
                <tbody>
                    ${programs.map((p, idx) => {
                        const title = (currentLanguage === 'en' && p.title_en) ? p.title_en : p.title;
                        const attendees = confirmedAttendees
                            .filter(a => a.assignedProgramId === p.id)
                            .map(a => {
                                const comp = (reservations.find(r => r.name === a.name)?.companions|0);
                                return escapeHTML(comp > 0 ? `${a.name}（同伴者:${comp}）` : a.name);
                            })
                            .join(', ');
                        return `
                            <tr>
                                <td>${idx+1}</td>
                                <td>${escapeHTML(title)}</td>
                                <td>${attendees || escapeHTML(translations[currentLanguage].noAttendees)}</td>
                                <td>${programEnrollment[p.id] || 0} / ${p.capacity}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        const waitingTable = document.getElementById('waiting-list-table');
        const getProgramTitle = (id) => {
            const prog = programs.find(p => p.id === id);
            if (!prog) return '';
            const title = getTranslatedValue(prog.title, prog.title_en);
            return extractBaseTitle(title);
        };
        if (useCard) {
            waitingTable.innerHTML = `
                <div class="waiting-list">
                    ${waitingList.map(user => `
                        <div class="waiting-item">
                            <div class="name-chip">${escapeHTML(user.name)}</div>
                            <div class="choices">
                                <span class="chip">${escapeHTML(getTranslation('choice1') || '')}: ${escapeHTML(getProgramTitle(user.choices[0]))}</span>
                                <span class="chip">${escapeHTML(getTranslation('choice2') || '')}: ${escapeHTML(getProgramTitle(user.choices[1]))}</span>
                                <span class="chip">${escapeHTML(getTranslation('choice3') || '')}: ${escapeHTML(getProgramTitle(user.choices[2]))}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            waitingTable.innerHTML = `
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>${escapeHTML(getTranslation('nameHeader') || '')}</th>
                            <th>${escapeHTML(getTranslation('choice1') || '')}</th>
                            <th>${escapeHTML(getTranslation('choice2') || '')}</th>
                            <th>${escapeHTML(getTranslation('choice3') || '')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${waitingList.map((user, idx) => `
                            <tr>
                                <td>${idx+1}</td>
                                <td>${escapeHTML((user.companions|0)>0 ? `${user.name}（同伴者:${user.companions}）` : user.name)}</td>
                                <td>${escapeHTML(getProgramTitle(user.choices[0]))}</td>
                                <td>${escapeHTML(getProgramTitle(user.choices[1]))}</td>
                                <td>${escapeHTML(getProgramTitle(user.choices[2]))}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
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
    let showFuriRes = !!(resMap && Array.isArray(resMap.furiganaIdxs) && resMap.furiganaIdxs.some(i => i != null && i >= 0));
    const shownChoiceIndexes = [0,1,2]; // プレビューは第1〜第3希望を常に表示
    let resHeader = `<th>${escapeHTML(translations[currentLanguage].nameHeader)}</th>`;
    if (showFuriRes) resHeader += `<th>${escapeHTML(translations[currentLanguage].furiganaHeader)}</th>`;
    shownChoiceIndexes.forEach(choiceIdx => {
        const key = choiceIdx === 0 ? 'choice1' : (choiceIdx === 1 ? 'choice2' : 'choice3');
        resHeader += `<th>${escapeHTML(translations[currentLanguage][key])}</th>`;
    });
    const resFiltered = reservations.filter(r => matches(r.name, r.furigana));
    const resHasComp = resFiltered.some(x => ((x.companions|0) > 0));
    // マッピングがないがデータにフリガナが含まれる場合は列を出す
    if (!showFuriRes && resFiltered.some(r => (r.furigana || '').trim() !== '')) {
        showFuriRes = true;
    }
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
        if (resHasComp) {
            const comp = (r.companions|0);
            tds += `<td>${comp > 0 ? comp : ''}</td>`;
        }
        return `<tr>${tds}</tr>`;
    }).join('');
    const resHeaderWithComp = resHeader + (resHasComp ? `<th>同伴者</th>` : '');
    rr.innerHTML = `<thead><tr>${resHeaderWithComp}</tr></thead><tbody>${resBody}</tbody>`;
    const resCountEl = document.getElementById('roster-reservations-count');
    if (resCountEl) resCountEl.textContent = `(${resFiltered.length})`;

    // 説明会名簿（必要な列のみ）
    const briMap = rosterMappingInfo.briefing;
    let showFuriBri = briMap && Array.isArray(briMap.furiganaIdxs) && briMap.furiganaIdxs.some(i => i != null && i >= 0);
    let briHeader = `<th>${escapeHTML(translations[currentLanguage].nameHeader)}</th>`;
    if (showFuriBri) briHeader += `<th>${escapeHTML(translations[currentLanguage].furiganaHeader)}</th>`;
    briHeader += `<th>${escapeHTML(translations[currentLanguage].timeHeader || '時間')}</th>`;
    const briFiltered = briefingSessionAttendees.filter(a => matches(a.name, a.furigana));
    if (!showFuriBri && briFiltered.some(a => (a.furigana || '').trim() !== '')) {
        showFuriBri = true;
    }
    const briHasComp = briFiltered.some(x => ((x.companions|0) > 0));
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
        if (briHasComp) {
            const comp = (a.companions|0);
            tds += `<td>${comp > 0 ? comp : ''}</td>`;
        }
        return `<tr>${tds}</tr>`;
    }).join('');
    const briHeaderWithComp = briHeader + (briHasComp ? `<th>同伴者</th>` : '');
    rb.innerHTML = `<thead><tr>${briHeaderWithComp}</tr></thead><tbody>${briBody}</tbody>`;
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
        // 同伴者入力の初期値を現在の値で反映
        const compInput = document.getElementById('companion-count-input');
        if (compInput && typeof currentUser?.companions === 'number') {
            compInput.value = String(Math.max(0, currentUser.companions));
        }
}

// 列ヘッダから自動検出（体験予約者）
function detectReservationHeaderMapping(headerRow) {
    const lower = headerRow.map(h => (h || '').toString().toLowerCase());
    const find = (candidates) => lower.findIndex(h => candidates.some(k => h.includes(k)));
    const nameIdx = find(['氏名','名前','name']);
    const seiIdx = find(['セイ','せい','sei']);
    const meiIdx = find(['メイ','めい','mei']);
    let furiganaIdxs = [seiIdx, meiIdx];
    // 単一「フリガナ」列しかない場合は両方に同じインデックスを入れておく
    if (furiganaIdxs.every(i => i < 0)) {
        const singleFuri = find(['フリガナ','ふりがな','kana','yomi','読み']);
        if (singleFuri >= 0) furiganaIdxs = [singleFuri, singleFuri];
    }
    // 第1〜3希望
    const firstIdx = find(['第1希望','第一希望','1st','first','第一','1希望']);
    const secondIdx = find(['第2希望','第二希望','2nd','second','第二','2希望']);
    const thirdIdx = find(['第3希望','第三希望','3rd','third','第三','3希望']);
    return {
        nameIdx: nameIdx >= 0 ? nameIdx : 0,
        furiganaIdxs,
        choiceIdxs: [firstIdx, secondIdx, thirdIdx].map(i => (i == null ? -1 : i))
    };
}

// 列ヘッダから自動検出（説明会）
function detectBriefingHeaderMapping(headerRow) {
    const lower = headerRow.map(h => (h || '').toString().toLowerCase());
    const find = (candidates) => lower.findIndex(h => candidates.some(k => h.includes(k)));
    const nameIdx = find(['氏名','名前','name']);
    const seiIdx = find(['セイ','せい','sei']);
    const meiIdx = find(['メイ','めい','mei']);
    let furiganaIdxs = [seiIdx, meiIdx];
    if (furiganaIdxs.every(i => i < 0)) {
        const singleFuri = find(['フリガナ','ふりがな','kana','yomi','読み']);
        if (singleFuri >= 0) furiganaIdxs = [singleFuri, singleFuri];
    }
    return { nameIdx: nameIdx >= 0 ? nameIdx : 0, furiganaIdxs };
}

function updateRosterMappingText() {
    const el = document.getElementById('roster-mapping-text');
    if (!el) return;
    const parts = [];
    if (rosterMappingInfo.reservations) {
        const m = rosterMappingInfo.reservations;
        const nameCol = Array.isArray(m.nameIdx)
            ? (m.nameIdx.length ? m.nameIdx.map(i => columnLetter(i)).join('+') : '-')
            : columnLetter(m.nameIdx);
        const furiCol = (Array.isArray(m.furiganaIdxs) && m.furiganaIdxs.some(i=>i>=0))
            ? m.furiganaIdxs.filter(i=>i>=0).map(i=>columnLetter(i)).join('+')
            : '-';
        parts.push(`体験: 氏名=${nameCol}, フリガナ=${furiCol} , 希望列=[${(m.choiceIdxs||[]).map(i=>i>=0?columnLetter(i):'-').join(', ')}]`);
    }
    if (rosterMappingInfo.briefing) {
        const m = rosterMappingInfo.briefing;
        const nameCol = Array.isArray(m.nameIdx)
            ? (m.nameIdx.length ? m.nameIdx.map(i => columnLetter(i)).join('+') : '-')
            : columnLetter(m.nameIdx);
        const furiCol = (Array.isArray(m.furiganaIdxs) && m.furiganaIdxs.some(i=>i>=0))
            ? m.furiganaIdxs.filter(i=>i>=0).map(i=>columnLetter(i)).join('+')
            : '-';
        const timeCol = (m.timeIdx != null && m.timeIdx >= 0) ? columnLetter(m.timeIdx) : '-';
        parts.push(`説明会: 氏名=${nameCol}, フリガナ=${furiCol}, 時間=${timeCol}`);
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
    }

    // --- LocalStorage 関連 ---
    function saveStateToLocalStorage() {
        const state = {
            programs,
            reservations,
            briefingSessionAttendees,
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
        themeSwitchBtn.innerHTML = theme === 'dark' ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
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

    // 汎用セーフリスナー
    const addListener = (el, type, handler) => { if (el) el.addEventListener(type, handler); };

    // カスタムアラートの閉じるボタン
    addListener(document.getElementById('btn-alert-ok'), 'click', () => {
        customAlertModal.classList.remove('visible');
    });

    // 受付画面のイベントリスナー（存在チェック付き）
    addListener(document.getElementById('btn-reserved'), 'click', () => navigateTo('name-input-section'));
    addListener(document.getElementById('btn-walk-in'), 'click', () => navigateTo('walk-in-section'));
    addListener(document.getElementById('btn-back'), 'click', goBack);

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
                setProgramCompanionsVisibility(true); // 予約あり（希望未入力）は表示
                setProgramCompanionsFromCurrentUser();
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
        setProgramCompanionsVisibility(true); // 予約あり（変更）は表示
        setProgramCompanionsFromCurrentUser();
        document.querySelector('.content-wrapper').classList.add('has-back-btn');
    });

    document.getElementById('btn-to-program-selection').addEventListener('click', () => {
        const nameEl = document.getElementById('walk-in-name');
        const furiganaEl = document.getElementById('walk-in-furigana');
        const schoolEl = document.getElementById('walk-in-school');
        const gradeEl = document.getElementById('walk-in-grade');
        const companionsEl = document.getElementById('walk-in-companions');
        
        if (!validateAndHighlight([nameEl, furiganaEl, gradeEl, companionsEl])) {
            showCustomAlert('errorAllFields');
            return;
        }
        
        const name = nameEl.value.trim().replace(/　/g, ' ');
        const furigana = furiganaEl.value.trim().replace(/　/g, ' ');
        
        // 既に登録済みかチェック
        const isAlreadyConfirmed = confirmedAttendees.some(attendee => attendee.name === name);
        const isAlreadyWaiting = waitingList.some(attendee => attendee.name === name);
        
        if (isAlreadyConfirmed || isAlreadyWaiting) {
            showCustomAlert('errorAlreadyRegistered');
            nameEl.focus();
            return;
        }
        
        const companions = Math.max(0, parseInt(companionsEl.value || '0', 10) || 0);
        currentUser = { name: name, furigana, school: schoolEl.value, grade: gradeEl.value, choices: [], companions };
        currentChoices = { 1: null, 2: null, 3: null };
        renderProgramGrid();
        updateProgramSelectionUI();
        navigateTo('program-selection-section');
        setProgramCompanionsVisibility(false); // 予約なしは非表示
        document.querySelector('.content-wrapper').classList.add('has-back-btn');
    });

    document.getElementById('btn-no-capstone').addEventListener('click', () => {
        const nameEl = document.getElementById('walk-in-name');
        const furiganaEl = document.getElementById('walk-in-furigana');
        const schoolEl = document.getElementById('walk-in-school');
        const gradeEl = document.getElementById('walk-in-grade');
        
        if (!validateAndHighlight([nameEl, furiganaEl, gradeEl])) {
            showCustomAlert('errorAllFields');
            return;
        }
        
        const name = nameEl.value.trim().replace(/　/g, ' ');
        const furigana = furiganaEl.value.trim().replace(/　/g, ' ');
        
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
            furigana,
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

        // 役割カラー（青）メッセージ表示
        const roleMsg = document.getElementById('role-color-no-capstone');
        if (roleMsg) {
            roleMsg.innerHTML = (currentLanguage === 'ja')
                ? 'あなたは<span class="text-blue">「青色」</span>です。スムーズなご案内のためスタッフが手首に色のストラップをつけさせていただきます。'
                : 'Your color is <span class="text-blue">blue</span>. For smooth guidance, staff will place a colored strap on your wrist.';
        }
        
        navigateTo('no-capstone-section');
        document.querySelector('.content-wrapper').classList.add('has-back-btn');
    });
    document.getElementById('btn-no-capstone-complete').addEventListener('click', async () => {
        try {
            if (currentUser && window.firebase && window.firebase.firestore) {
                const db = window.firebase.firestore();
                await db.collection('participants').add({
                    name: currentUser.name,
                    furigana: currentUser.furigana || '',
                    school: currentUser.school || '',
                    grade: currentUser.grade || '',
                    companions: 0,
                    choices: [],
                    assignedProgramId: null,
                    status: 'briefing_only',
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (e) { console.error(e); }
        // 最初の画面に戻る
        navigateTo('initial-selection');
        document.querySelector('.content-wrapper').classList.remove('has-back-btn');
        // フォームをクリア
        document.getElementById('walk-in-name').value = '';
        document.getElementById('walk-in-furigana').value = '';
        document.getElementById('walk-in-school').value = '';
        document.getElementById('walk-in-grade').value = '';
        currentUser = null;
    });

    document.getElementById('btn-submit-choices').addEventListener('click', () => {
        const choices = [currentChoices[1], currentChoices[2], currentChoices[3]];
        const companionInput = document.getElementById('companion-count-input');
        if (companionInput && currentUser && !companionInput.closest('.input-group')?.classList.contains('hidden')) {
            const companions = Math.max(0, parseInt(companionInput.value || '0', 10) || 0);
            currentUser.companions = companions;
        }
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
    ['student-name', 'walk-in-name', 'walk-in-furigana', 'walk-in-school', 'walk-in-grade', 'walk-in-companions'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => e.target.classList.remove('input-error'));
    });

    // 管理者フロー
    document.getElementById('admin-entry-btn').addEventListener('click', () => {
        try {
            if (window.firebase && window.firebase.auth) {
                const userNow = window.firebase.auth().currentUser;
                if (userNow) {
                    showAdminView();
                    return;
                }
                // 認証状態がまだ復元中の可能性があるため、短く待ってから再判定（最大1秒まで再試行）
                let tries = 0;
                const retry = () => {
                    const userLater = window.firebase.auth().currentUser;
                    if (userLater) { showAdminView(); return; }
                    if (++tries >= 4) { adminLoginModal.classList.add('visible'); return; }
                    setTimeout(retry, 250);
                };
                retry();
                return;
            }
        } catch (_) {}
        const fallbackSession = localStorage.getItem('adminSession') === 'true';
        if (fallbackSession) { showAdminView(); return; }
        adminLoginModal.classList.add('visible');
    });
    document.getElementById('btn-cancel-login').addEventListener('click', () => adminLoginModal.classList.remove('visible'));
    // Firebase Auth でメール/パスワードログイン
    document.getElementById('btn-admin-login').addEventListener('click', async () => {
        const emailInput = document.getElementById('admin-email');
        const passwordInput = document.getElementById('admin-password');
        const errorEl = document.getElementById('password-error');
        errorEl.textContent = '';
        try {
            if (window.firebase && window.firebase.auth) {
                await window.firebase.auth().signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value);
                // onAuthStateChanged に処理を委譲（確実に状態反映）
                return;
            } else {
                // Firebase未設定の場合は従来パスワード 'admin' でフォールバック
                if (passwordInput.value === 'admin') {
                    adminLoginModal.classList.remove('visible');
                    passwordInput.value = '';
                    // フォールバックセッションを保持（ログアウトまで有効）
                    try { localStorage.setItem('adminSession', 'true'); } catch (_) {}
                    showAdminView();
                    updateAdminEntryVisual(true);
                } else {
                    showCustomAlert('wrongPassword');
                    errorEl.textContent = getTranslation('wrongPassword') || 'Wrong password.';
                }
            }
        } catch (e) {
            console.error(e);
            const msg = (e && e.code === 'auth/wrong-password') || (e && e.code === 'auth/user-not-found') ? (getTranslation('wrongPassword') || 'Wrong password.') : (e && e.message) || 'Error';
            showCustomAlert('wrongPassword');
            errorEl.textContent = msg;
        }
    });
    // Enterキーでログイン
    const adminPasswordInput = document.getElementById('admin-password');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btn-admin-login').click();
            }
        });
    }
    // ログアウト
    const adminLogoutBtn = document.getElementById('btn-admin-logout');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', async () => {
            try {
                if (window.firebase && window.firebase.auth) {
                    await window.firebase.auth().signOut();
                }
            } catch (e) { console.error(e); }
            // フォールバックセッションをクリア
            try { localStorage.removeItem('adminSession'); } catch (_) {}
            document.getElementById('admin-user-email').textContent = '';
            // 受付画面へ戻す
            showReceptionView();
            updateAdminEntryVisual(false);
        });
    }

    // ページ読み込み時、既存セッションがあれば管理画面を自動表示
    try {
        if (window.firebase && window.firebase.auth) {
            // Firebaseは非同期で状態復元されるため、onAuthStateChangedで遷移
            window.firebase.auth().onAuthStateChanged(function(user){
                updateAdminEntryVisual(!!user);
                if (user) {
                    const emailSpan = document.getElementById('admin-user-email');
                    if (emailSpan) emailSpan.textContent = user.email || '';
                    // ログインが確認できたら必ず管理画面へ遷移し、モーダルを閉じる
                    adminLoginModal.classList.remove('visible');
                    showAdminView();
                }
            });
        } else {
            const fallbackSession = localStorage.getItem('adminSession') === 'true';
            updateAdminEntryVisual(fallbackSession);
            if (fallbackSession) {
                showAdminView();
            }
        }
    } catch (_) {}
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
	document.getElementById('btn-export-excel').addEventListener('click', openExportPicker);
    
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
            // Firestoreのデータを削除する処理をここに追加（今回は未実装）
            // ローカルのデータ削除
            localStorage.removeItem('receptionData');
            localStorage.removeItem('noRosterDataLastShown');
            showCustomAlert('resetComplete', () => {
                location.reload();
            });
        }, true);
    });

document.getElementById('btn-assign-waiting').addEventListener('click', assignWaitingListParticipants);

    // 受付状況: 表/カード切替
const statusViewToggle = document.getElementById('status-view-toggle');
if (statusViewToggle) {
    statusViewToggle.addEventListener('change', () => {
        updateStatusView();
    });
}
    // 完了処理
    document.getElementById('btn-confirm-reservation').addEventListener('click', () => {
        const isReserved = reservations.some(r => r.name === currentUser.name);
        const finalizeLocal = (assignedProgram) => {
            showSuccessScreen(currentUser.name, assignedProgram, !assignedProgram);
        };
        const writeToFirestore = async (assignedProgramId) => {
            try {
                if (window.firebase && window.firebase.firestore) {
                    const db = window.firebase.firestore();
                    const doc = {
                        name: currentUser.name,
                        furigana: currentUser.furigana || '',
                        school: currentUser.school || '',
                        grade: currentUser.grade || '',
                        companions: currentUser.companions || 0,
                        choices: currentUser.choices || [],
                        assignedProgramId: assignedProgramId || null,
                        status: assignedProgramId ? 'assigned' : (settings.prioritizeReserved && !isReserved ? 'waiting' : 'registered'),
                        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
                    };
                    await db.collection('participants').add(doc);
                }
            } catch (e) { console.error('Firestore write error', e); }
        };
        if (settings.prioritizeReserved && !isReserved) {
            writeToFirestore(null).finally(() => finalizeLocal(null));
        } else {
            const assignedProgram = assignProgram(currentUser);
            writeToFirestore(assignedProgram ? assignedProgram.id : null).finally(() => finalizeLocal(assignedProgram));
        }
    });
    
    document.getElementById('btn-back-to-home').addEventListener('click', showReceptionView);
    
    // ヘルプ: 安全にイベント登録
    safeOn(document.getElementById('help-btn'), 'click', () => {
        const modal = document.getElementById('help-modal');
        if (modal) modal.classList.add('visible');
    });
    safeOn(document.getElementById('btn-close-help'), 'click', () => {
        const modal = document.getElementById('help-modal');
        if (modal) modal.classList.remove('visible');
    });
    // ヘルプモーダルの外側をクリックしても閉じる
    safeOn(document.getElementById('help-modal'), 'click', (e) => {
        if (e.target && e.target.id === 'help-modal') {
            e.currentTarget.classList.remove('visible');
        }
    });

    // 管理者ログインモーダルの外側をクリックしても閉じる
    document.getElementById('admin-login-modal').addEventListener('click', (e) => {
        if (e.target.id === 'admin-login-modal') {
            adminLoginModal.classList.remove('visible');
        }
    });

    const langSwitchBtn = document.getElementById('lang-switch-btn');
    const langMenu = document.getElementById('lang-menu');
    const safeOn = (el, type, handler) => { if (el) el.addEventListener(type, handler); };

    // Left-click: Toggle Ja/En and ensure menu is hidden.
    safeOn(langSwitchBtn, 'click', () => {
        langMenu.classList.remove('visible'); // Hide menu on left-click
        const newLang = currentLanguage === 'ja' ? 'en' : 'ja';
        updateLanguage(newLang);
        const msg = newLang === 'ja' ? '言語が日本語に切り替わりました。' : 'Language switched to English.';
        showSaveIndicator(msg);
    });

    // Right-click: Prevent default and toggle menu.
    safeOn(langSwitchBtn, 'contextmenu', (e) => {
        e.preventDefault();
        langMenu.classList.toggle('visible');
    });

    // Global click: Hide menu if click is outside the button and menu.
    document.addEventListener('click', (e) => {
        // Use closest to handle clicks on child elements of the button (like the icon)
        if (!e.target.closest('#lang-switch-btn') && !(langMenu && langMenu.contains(e.target))) {
            if (langMenu) langMenu.classList.remove('visible');
        }
    });

    // Menu click: Select language and hide menu.
    safeOn(langMenu, 'click', (e) => {
        e.preventDefault(); // Prevent <a> tag from navigating
        if (e.target.tagName === 'A') {
            const newLang = e.target.dataset.lang;
            if (newLang && newLang !== currentLanguage) { // Only update if language is different
                updateLanguage(newLang);
                let msg = '';
                switch (newLang) {
                    case 'ja': msg = '言語が日本語に切り替わりました。'; break;
                    case 'en': msg = 'Language switched to English.'; break;
                    case 'es': msg = 'Idioma cambiado a Español.'; break;
                    case 'id': msg = 'Bahasa diubah ke Bahasa Indonesia.'; break;
                }
                showSaveIndicator(msg);
            }
            langMenu.classList.remove('visible'); // Always hide after click
        }
    });

    safeOn(themeSwitchBtn, 'click', () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        const msg = (currentLanguage === 'ja')
            ? (newTheme === 'dark' ? 'テーマがダークモードに切り替わりました。' : 'テーマがライトモードに切り替わりました。')
            : (newTheme === 'dark' ? 'Theme switched to Dark mode.' : 'Theme switched to Light mode.');
        showSaveIndicator(msg);
    });

    // Firestoreの初期化とリスナー設定
    function initializeFirestore() {
        if (window.firebase && window.firebase.firestore) {
            const dbFS = window.firebase.firestore();
            listenToParticipants(dbFS);
            console.log("Firestore is initialized and listeners are set up.");
        } else {
            console.error("Firebase Firestore is not available.");
        }
    }

    // participantsコレクションのリアルタイムリスナー
    function listenToParticipants(dbFS) {
        dbFS.collection('participants').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const participantsData = [];
            snapshot.forEach(doc => {
                participantsData.push({ id: doc.id, ...doc.data() });
            });
            allParticipants = participantsData;
            
            console.log('Participants data updated from Firestore:', allParticipants);

            // データが更新されたら、表示も更新する
            if (document.getElementById('admin-view').classList.contains('hidden') === false) {
                updateAdminViewData();
            }
        }, error => {
            console.error("Error listening to participants collection:", error);
        });
    }

    // Firestoreのデータ変更を管理者ビューに反映する
    function updateAdminViewData() {
        // 各コンポーネントを再描画
        updateStatusView();
        renderRosterTables();
    }


});
