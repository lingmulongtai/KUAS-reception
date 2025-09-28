// language-loader.js

// グローバルスコープに関数を公開
window.translations = {};
window.currentLanguage = 'ja';

// 指定された言語の翻訳を非同期で読み込む
window.loadTranslations = async function(lang) {
    // 'ja' などの短い言語コードのみをサポート
    const validLang = /^[a-z]{2}$/.test(lang) ? lang : 'ja';

    if (window.translations[validLang]) {
        return; // 既に読み込み済み
    }
    try {
        const response = await fetch(`locales/${validLang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load ${validLang}.json`);
        }
        window.translations[validLang] = await response.json();
    } catch (error) {
        console.error(error);
        if (validLang !== 'en') {
            await window.loadTranslations('en'); // フォールバック
        }
    }
};

// UIのテキストを更新する
window.applyTranslations = function(lang) {
    const langToUse = window.translations[lang] ? lang : 'en'; // 読み込み失敗時は英語にフォールバック
    window.currentLanguage = langToUse;
    document.documentElement.lang = langToUse;

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        if (window.translations[langToUse] && typeof window.translations[langToUse][key] === 'string') {
            el.textContent = window.translations[langToUse][key];
        }
    });

    document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
        const key = el.dataset.langKeyPlaceholder;
        if (window.translations[langToUse] && typeof window.translations[langToUse][key] === 'string') {
            el.placeholder = window.translations[langToUse][key];
        }
    });
};

// ページの初期化時にデフォルト言語を読み込む
document.addEventListener('DOMContentLoaded', async () => {
    const savedLang = localStorage.getItem('receptionLang') || 'ja';
    await window.loadTranslations(savedLang);
    window.applyTranslations(savedLang);
});
