// トウモロコシ育成システム

export type Corn = {
    id: number;
    stage: number;
    progress: number;
    plantedAt: number;
    lastUpdate: number;
};

export type PopcornEntry = {
    time: string;
    batch: number;
    produced: number;
};

export type GameState = {
    corns: Corn[];
    cornSeedCount: number; // トウモロコシの実の総数
    popcornCount: number;
    popcornTotal: number;
    popcornSold: number;
    popcornEfficiency: number;
    popcornHistory: PopcornEntry[];
    coinCount: number; // コイン残量
};

export interface GameDOM {
    getElementById(id: string): HTMLElement | null;
    createElement(tag: string): HTMLElement;
    querySelectorAll(selector: string): NodeListOf<HTMLElement>;
}

export function setupGame(
    dom: GameDOM = document,
    alertFn: (msg: string) => void = typeof window !== 'undefined' ? window.alert : () => {}
) {
    // DOMContentLoaded相当の初期化
    const cornListArea = dom.getElementById('corn-list') as HTMLElement;
    const clickButton = dom.getElementById('corn-button') as HTMLElement;
    const counterDisplay = dom.getElementById('corn-count') as HTMLElement;
    const STORAGE_KEY = 'cornGrowerV1';
    // ポップコーン関連
    const popcornCountDisplay = dom.getElementById('popcorn-count') as HTMLElement;
    const popcornTotalDisplay = dom.getElementById('popcorn-total') as HTMLElement;
    const popcornSoldDisplay = dom.getElementById('popcorn-sold') as HTMLElement;
    const popcornEfficiencyDisplay = dom.getElementById('popcorn-efficiency') as HTMLElement;
    const batchSizeInput = dom.getElementById('batch-size') as HTMLInputElement;
    const producePopcornBtn = dom.getElementById('produce-popcorn-btn') as HTMLElement;
    const popcornHistoryList = dom.getElementById('popcorn-history') as HTMLElement;
    const sellPopcornBtn = dom.getElementById('sell-popcorn-btn') as HTMLElement;
    const coinCountDisplay = dom.getElementById('coin-count') as HTMLElement;

    // 成長段階
    const STAGES: { name: string; duration: number }[] = [
        { name: '種', duration: 10 },
        { name: '芽', duration: 20 },
        { name: '若い苗', duration: 30 },
        { name: '成熟', duration: 0 }
    ];

    // 育成中コーンリスト
    let corns: Corn[] = [];
    let cornSeedCount: number = 0;
    let coinCount: number = 0;
    // ポップコーン在庫・統計
    let popcornCount: number = 0;
    let popcornTotal: number = 0;
    let popcornSold: number = 0;
    let popcornEfficiency: number = 1;
    let popcornHistory: PopcornEntry[] = [];

    // ローカルストレージから復元
    function loadData(): void {
        try {
            const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem(STORAGE_KEY) : null;
            if (saved) {
                const data = JSON.parse(saved);
                corns = data.corns || [];
                cornSeedCount = data.cornSeedCount ?? 30; // 初期値30
                popcornCount = data.popcornCount || 0;
                popcornTotal = data.popcornTotal || 0;
                popcornSold = data.popcornSold || 0;
                popcornEfficiency = data.popcornEfficiency ?? 2; // 生産効率初期値2
                popcornHistory = data.popcornHistory || [];
                coinCount = data.coinCount ?? 0; // コイン初期値0
            } else {
                cornSeedCount = 30; // 初期値30
                popcornEfficiency = 2; // 生産効率初期値2
                coinCount = 0; // コイン初期値0
            }
        } catch (e) {
            console.error('ローカルストレージ読み込みエラー:', e);
            cornSeedCount = 30;
            popcornEfficiency = 2;
            coinCount = 0;
        }
    }

    // ローカルストレージ保存
    function saveData(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    corns,
                    cornSeedCount,
                    popcornCount,
                    popcornTotal,
                    popcornSold,
                    popcornEfficiency,
                    popcornHistory,
                    coinCount
                }));
            }
        } catch (e) {
            console.error('ローカルストレージ保存エラー:', e);
        }
    }

    // 新しいコーンを植える
    function plantCorn(): void {
        // トウモロコシの実が1個以上ないと植えられない
        if (cornSeedCount < 1) {
            alertFn('トウモロコシの実が足りません');
            return;
        }
        cornSeedCount -= 1;
        const id = Date.now() + Math.random();
        corns.push({
            id,
            stage: 0,
            progress: 0,
            plantedAt: Date.now(),
            lastUpdate: Date.now()
        });
        saveData();
        renderCorns();
        updateCounter();
    }

    // 成長処理
    function updateGrowth(): void {
        const now = Date.now();
        let changed = false;
        corns.forEach(corn => {
            if (corn.stage < STAGES.length - 1) {
                const stageDuration = STAGES[corn.stage].duration * 1000;
                corn.progress += now - corn.lastUpdate;
                if (corn.progress >= stageDuration) {
                    corn.stage += 1;
                    corn.progress = 0;
                    changed = true;
                }
                corn.lastUpdate = now;
            }
        });
        if (changed) saveData();
        renderCorns();
    }

    // 収穫
    function harvestCorn(id: number): void {
        const idx = corns.findIndex(c => c.id === id);
        if (idx !== -1 && corns[idx].stage === STAGES.length - 1) {
            corns.splice(idx, 1);
            // トウモロコシの実を10個獲得（収穫量は将来的に変動可能）
            cornSeedCount += 8; // 収穫効率を8個に調整
            saveData();
            renderCorns();
            updateCounter();
        }
    }

    // カウンター表示
    function updateCounter(): void {
        counterDisplay.textContent = cornSeedCount.toString();
        popcornCountDisplay.textContent = popcornCount.toString();
        popcornTotalDisplay.textContent = popcornTotal.toString();
        popcornSoldDisplay.textContent = popcornSold.toString();
        popcornEfficiencyDisplay.textContent = popcornEfficiency.toString();
        if (coinCountDisplay) {
            coinCountDisplay.textContent = coinCount.toString();
        }
        updateProduceButtonState();
        if (typeof updateSellButtonState === 'function') {
            updateSellButtonState();
        }

        // 残量表示の色変更
        const batch = Math.max(1, parseInt(batchSizeInput.value, 10) || 1);
        if (cornSeedCount < batch) {
            counterDisplay.classList.add('low-resource');
        } else {
            counterDisplay.classList.remove('low-resource');
        }
    }

    // ポップコーン生産ボタンの有効/無効状態制御
    function updateProduceButtonState(): void {
        const batch = Math.max(1, parseInt(batchSizeInput.value, 10) || 1);
        if (cornSeedCount < batch) {
            if (typeof producePopcornBtn.setAttribute === 'function') {
                producePopcornBtn.setAttribute('disabled', 'true');
            }
            if (producePopcornBtn.classList && typeof producePopcornBtn.classList.add === 'function') {
                producePopcornBtn.classList.add('disabled-btn');
            }
        } else {
            if (typeof producePopcornBtn.removeAttribute === 'function') {
                producePopcornBtn.removeAttribute('disabled');
            }
            if (producePopcornBtn.classList && typeof producePopcornBtn.classList.remove === 'function') {
                producePopcornBtn.classList.remove('disabled-btn');
            }
        
            // 販売ボタンの有効/無効状態制御
            function updateSellButtonState(): void {
                if (popcornCount < 1) {
                    if (typeof sellPopcornBtn.setAttribute === 'function') {
                        sellPopcornBtn.setAttribute('disabled', 'true');
                    }
                    if (sellPopcornBtn.classList && typeof sellPopcornBtn.classList.add === 'function') {
                        sellPopcornBtn.classList.add('disabled-btn');
                    }
                } else {
                    if (typeof sellPopcornBtn.removeAttribute === 'function') {
                        sellPopcornBtn.removeAttribute('disabled');
                    }
                    if (sellPopcornBtn.classList && typeof sellPopcornBtn.classList.remove === 'function') {
                        sellPopcornBtn.classList.remove('disabled-btn');
                    }
                }
            }
        }
    }

    // 育成中リスト表示
    function renderCorns(): void {
        cornListArea.innerHTML = '';
        if (corns.length === 0) {
            cornListArea.innerHTML = '<p>育成中のトウモロコシはありません。</p>';
            return;
        }
        corns.forEach(corn => {
            const stageObj = STAGES[corn.stage];
            const isMature = corn.stage === STAGES.length - 1;
            const div = dom.createElement('div') as HTMLElement;
            div.className = 'corn-item';
            div.innerHTML = `
                <span>🌱 ${stageObj.name}</span>
                <div class="progress-bar" style="width:200px; background:#eee; border-radius:8px; margin:4px 0;">
                  <div style="height:16px; background:#ffd700; border-radius:8px; width:${isMature ? 100 : Math.floor(corn.progress / (STAGES[corn.stage].duration * 1000) * 100)}%;"></div>
                </div>
                ${isMature ? `<button type="button" class="harvest-btn" data-id="${corn.id}">収穫する</button>` : `<span>次の段階まで: ${isMature ? '-' : Math.max(0, Math.ceil((STAGES[corn.stage].duration * 1000 - corn.progress)/1000))}秒</span>`}
            `;
            cornListArea.appendChild(div);
        });
        // 収穫ボタンイベント
        dom.querySelectorAll('.harvest-btn').forEach(btn => {
            btn.onclick = function () {
                const id = Number((btn as HTMLElement).getAttribute('data-id'));
                harvestCorn(id);
            };
        });
    }

    // ポップコーン生産
// --- DEBUG LOG: producePopcorn成熟コーン消費前 ---
console.log('[DEBUG] corns(before):', corns.map(c => c.stage));
console.log('[DEBUG] matureCount:', corns.filter(c => c.stage === STAGES.length - 1).length);
    function producePopcorn(batch: number = 1): void {
        // トウモロコシの実が足りない場合は生産不可
        if (cornSeedCount < batch) {
            alertFn('トウモロコシの実が足りません');
            return;
        }
        const produced = batch * popcornEfficiency;
        cornSeedCount -= batch;
        popcornCount += produced;
        popcornTotal += produced;
        // 履歴記録
        const entry: PopcornEntry = {
            time: new Date().toLocaleString(),
            batch,
            produced
        };
        popcornHistory.unshift(entry);
        if (popcornHistory.length > 20) popcornHistory.pop();
        saveData();
        updateCounter();
        renderPopcornHistory();
        animateProduction(produced);
    }

    // 生産アニメーション
    function animateProduction(amount: number): void {
        const machine = dom.getElementById('popcorn-machine') as HTMLElement;
        if (!machine) return;
        machine.classList.add('pop');
        setTimeout(() => {
            machine.classList.remove('pop');
        }, 600);
        // 簡易エフェクト
        for (let i = 0; i < Math.min(amount, 10); i++) {
            const img = dom.createElement('img') as HTMLImageElement;
            img.src = 'images/popcorn.png';
            img.style.position = 'absolute';
            img.style.width = '32px';
            img.style.left = (80 + Math.random() * 40) + 'px';
            img.style.top = (40 + Math.random() * 40) + 'px';
            img.style.opacity = '0.8';
            img.style.transition = 'all 1s';
            machine.appendChild(img);
            setTimeout(() => {
                img.style.top = (80 + Math.random() * 40) + 'px';
                img.style.opacity = '0';
            }, 100);
            setTimeout(() => {
                machine.removeChild(img);
            }, 1100);
        }
    }

    // 履歴表示
    function renderPopcornHistory(): void {
        popcornHistoryList.innerHTML = '';
        if (popcornHistory.length === 0) {
            popcornHistoryList.innerHTML = '<li>生産履歴なし</li>';
            return;
        }
        popcornHistory.forEach(entry => {
            const li = dom.createElement('li') as HTMLElement;
            li.textContent = `${entry.time}: トウモロコシ${entry.batch}個→ポップコーン${entry.produced}個`;
            popcornHistoryList.appendChild(li);
        });
    }

    // ポップコーン販売
    function sellPopcorn(sellAmount: number = 1): void {
        if (popcornCount < sellAmount) {
            alertFn('ポップコーンの在庫が足りません');
            return;
        }
        popcornCount -= sellAmount;
        coinCount += sellAmount;
        popcornSold += sellAmount;
        saveData();
        updateCounter();
        // 簡易フィードバック
        if (typeof sellPopcornBtn.classList?.add === 'function') {
            sellPopcornBtn.classList.add('sold-effect');
            setTimeout(() => {
                sellPopcornBtn.classList.remove('sold-effect');
            }, 400);
        }
    }

    sellPopcornBtn.onclick = function () {
        // 1個ずつ販売（将来的に複数対応可）
        sellPopcorn(1);
        updateSellButtonState();
    };

    // 生産ボタンイベント
    producePopcornBtn.onclick = function () {
        const batch = Math.max(1, parseInt(batchSizeInput.value, 10) || 1);
        producePopcorn(batch);
        updateProduceButtonState();
    };



    // 植えるボタン
    clickButton.onclick = function () {
        plantCorn();
    };

    // 初期化
    loadData();
    updateCounter();
    renderCorns();
    renderPopcornHistory();

    // 成長タイマー
    setInterval(updateGrowth, 1000);

    // batchSizeInput変更時にボタン状態更新（テスト環境対応）
    if (typeof batchSizeInput.addEventListener === 'function') {
        batchSizeInput.addEventListener('input', updateProduceButtonState);
    }

    // テスト用に主要関数を返す
    return {
        plantCorn,
        producePopcorn,
        updateGrowth,
        harvestCorn,
        getState: (): GameState => ({
            corns,
            cornSeedCount,
            popcornCount,
            popcornTotal,
            popcornSold,
            popcornEfficiency,
            popcornHistory,
            coinCount,
            sellPopcorn
        }),
        addMatureCornForTest: (count: number = 1) => {
            for (let i = 0; i < count; i++) {
                corns.push({
                    id: Date.now() + Math.random(),
                    stage: STAGES.length - 1,
                    progress: 0,
                    plantedAt: Date.now(),
                    lastUpdate: Date.now()
                });
            }
            saveData();
            renderCorns();
        }
    };
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setupGame(document);
    });
}
