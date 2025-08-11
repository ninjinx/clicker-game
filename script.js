// クッキークリッカー風ゲームの基本機能

document.addEventListener('DOMContentLoaded', function () {
    const counterDisplay = document.getElementById('cookie-count');
    const clickButton = document.getElementById('cookie-button');
    const STORAGE_KEY = 'cookie_clicker_count';

    // カウンターの初期化
    let count = 0;

    // ローカルストレージから値を取得
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null && !isNaN(Number(saved))) {
            count = Number(saved);
        }
    } catch (e) {
        console.error('ローカルストレージの読み込みエラー:', e);
    }

    // カウンター表示の更新
    function updateDisplay() {
        if (counterDisplay) {
            counterDisplay.textContent = count;
        }
    }

    // クリックイベント
    if (clickButton) {
        clickButton.addEventListener('click', function () {
            count += 1;
            updateDisplay();
            // ローカルストレージに保存
            try {
                localStorage.setItem(STORAGE_KEY, count);
            } catch (e) {
                console.error('ローカルストレージの保存エラー:', e);
            }
        });
    }

    updateDisplay();
});