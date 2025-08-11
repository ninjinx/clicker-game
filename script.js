// トウモロコシ育成システム
document.addEventListener('DOMContentLoaded', function () {
    const cornListArea = document.getElementById('corn-list');
    const clickButton = document.getElementById('corn-button');
    const counterDisplay = document.getElementById('corn-count');
    const STORAGE_KEY = 'cornGrowerV1';
    // ポップコーン関連
    const popcornCountDisplay = document.getElementById('popcorn-count');
    const popcornTotalDisplay = document.getElementById('popcorn-total');
    const popcornSoldDisplay = document.getElementById('popcorn-sold');
    const popcornEfficiencyDisplay = document.getElementById('popcorn-efficiency');
    const batchSizeInput = document.getElementById('batch-size');
    const producePopcornBtn = document.getElementById('produce-popcorn-btn');
    const popcornHistoryList = document.getElementById('popcorn-history');
    const sellPopcornBtn = document.getElementById('sell-popcorn-btn');

    // 成長段階
    const STAGES = [
        { name: '種', duration: 10 },      // 秒
        { name: '芽', duration: 20 },
        { name: '若い苗', duration: 30 },
        { name: '成熟', duration: 0 }      // 最終段階はduration不要
    ];

    // 育成中コーンリスト
    let corns = [];
    let matureCount = 0;

    // ポップコーン在庫・統計
    let popcornCount = 0;
    let popcornTotal = 0;
    let popcornSold = 0;
    let popcornEfficiency = 1; // 1トウモロコシ→1ポップコーン（アップグレード基盤）
    let popcornHistory = [];

    // ローカルストレージから復元
    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                corns = data.corns || [];
                matureCount = data.matureCount || 0;
                popcornCount = data.popcornCount || 0;
                popcornTotal = data.popcornTotal || 0;
                popcornSold = data.popcornSold || 0;
                popcornEfficiency = data.popcornEfficiency || 1;
                popcornHistory = data.popcornHistory || [];
            }
        } catch (e) {
            console.error('ローカルストレージ読み込みエラー:', e);
        }
    }

    // ローカルストレージ保存
    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                corns,
                matureCount,
                popcornCount,
                popcornTotal,
                popcornSold,
                popcornEfficiency,
                popcornHistory
            }));
        } catch (e) {
            console.error('ローカルストレージ保存エラー:', e);
        }
    }

    // 新しいコーンを植える
    function plantCorn() {
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
    }

    // 成長処理
    function updateGrowth() {
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
    function harvestCorn(id) {
        const idx = corns.findIndex(c => c.id === id);
        if (idx !== -1 && corns[idx].stage === STAGES.length - 1) {
            corns.splice(idx, 1);
            matureCount += 1;
            saveData();
            renderCorns();
            updateCounter();
        }
    }

    // カウンター表示
    function updateCounter() {
        counterDisplay.textContent = matureCount;
        popcornCountDisplay.textContent = popcornCount;
        popcornTotalDisplay.textContent = popcornTotal;
        popcornSoldDisplay.textContent = popcornSold;
        popcornEfficiencyDisplay.textContent = popcornEfficiency;
    }

    // 育成中リスト表示
    function renderCorns() {
        cornListArea.innerHTML = '';
        if (corns.length === 0) {
            cornListArea.innerHTML = '<p>育成中のトウモロコシはありません。</p>';
            return;
        }
        corns.forEach(corn => {
            const stageObj = STAGES[corn.stage];
            const isMature = corn.stage === STAGES.length - 1;
            const div = document.createElement('div');
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
        document.querySelectorAll('.harvest-btn').forEach(btn => {
            btn.onclick = function () {
                const id = Number(btn.getAttribute('data-id'));
                harvestCorn(id);
            };
        });
    }

    // ポップコーン生産
    function producePopcorn(batch = 1) {
        if (matureCount < batch) {
            alert('トウモロコシが足りません');
            return;
        }
        const produced = batch * popcornEfficiency;
        matureCount -= batch;
        popcornCount += produced;
        popcornTotal += produced;
        // 履歴記録
        const entry = {
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
    function animateProduction(amount) {
        const machine = document.getElementById('popcorn-machine');
        if (!machine) return;
        machine.classList.add('pop');
        setTimeout(() => {
            machine.classList.remove('pop');
        }, 600);
        // 簡易エフェクト
        for (let i = 0; i < Math.min(amount, 10); i++) {
            const img = document.createElement('img');
            img.src = 'https://cdn.pixabay.com/photo/2016/03/31/19/14/popcorn-1295373_1280.png';
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
    function renderPopcornHistory() {
        popcornHistoryList.innerHTML = '';
        if (popcornHistory.length === 0) {
            popcornHistoryList.innerHTML = '<li>生産履歴なし</li>';
            return;
        }
        popcornHistory.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `${entry.time}: トウモロコシ${entry.batch}個→ポップコーン${entry.produced}個`;
            popcornHistoryList.appendChild(li);
        });
    }

    // ポップコーン販売（基盤のみ）
    sellPopcornBtn.onclick = function () {
        alert('販売機能は準備中です');
    };

    // 生産ボタンイベント
    producePopcornBtn.onclick = function () {
        const batch = Math.max(1, parseInt(batchSizeInput.value, 10) || 1);
        producePopcorn(batch);
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
});
