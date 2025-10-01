document.addEventListener('DOMContentLoaded', () => {
    // --- 要素の取得 ---
    const form = document.getElementById('record-form');
    const recordList = document.getElementById('record-list');
    const totalQuestionsInput = document.getElementById('total-questions-input');
    const correctAnswersInput = document.getElementById('correct-answers-input');
    const dateInput = document.getElementById('record-date');
    const memoInput = document.getElementById('memo-input');
    const tableHeaders = document.querySelectorAll('#record-table th[data-sort]');

    // --- グラフと統計の要素 ---
    const chartCanvas = document.getElementById('progress-chart').getContext('2d');
    const totalQuestionsEl = document.getElementById('total-questions');
    const totalCorrectEl = document.getElementById('total-correct');
    const overallAccuracyEl = document.getElementById('overall-accuracy');
    let progressChart; // グラフのインスタンスを保持する変数
    
    // --- データの状態管理 ---
    let records = [];
    let sortState = { column: 'date', order: 'asc' };

    // --- 初期化処理 ---
    function initializeApp() {
        records = getRecordsFromStorage();
        dateInput.valueAsDate = new Date(); // 日付を今日に設定
        addInputValidation();
        renderAll(); // 全てを再描画
    }

    // --- 描画関連 ---
    function renderAll() {
        sortRecords();
        renderTable();
        updateStats();
        renderChart();
    }

    // テーブルの描画
    function renderTable() {
        recordList.innerHTML = '';
        if (records.length === 0) {
            recordList.innerHTML = `<tr><td colspan="6">まだ記録がありません。</td></tr>`;
            return;
        }
        records.forEach(record => {
            const accuracy = record.total > 0 ? (record.correct / record.total * 100).toFixed(1) : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.date}</td>
                <td>${record.total}</td>
                <td>${record.correct}</td>
                <td>${accuracy}%</td>
                <td>${record.memo}</td>
                <td><button class="delete-btn" data-id="${record.id}">削除</button></td>
            `;
            recordList.appendChild(tr);
        });
    }

    // 統計の更新
    function updateStats() {
        const totalQuestions = records.reduce((sum, rec) => sum + rec.total, 0);
        const totalCorrect = records.reduce((sum, rec) => sum + rec.correct, 0);
        const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100).toFixed(1) : 0;

        totalQuestionsEl.textContent = totalQuestions;
        totalCorrectEl.textContent = totalCorrect;
        overallAccuracyEl.textContent = `${overallAccuracy}%`;
    }

    // グラフの描画・更新
    function renderChart() {
        if (progressChart) {
            progressChart.destroy(); // 既存のグラフを破棄
        }
        
        // グラフ用に日付でソートしたデータを作成
        const chartData = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

        progressChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: chartData.map(r => r.date),
                datasets: [{
                    label: '正答率 (%)',
                    data: chartData.map(r => r.total > 0 ? (r.correct / r.total * 100) : 0),
                    backgroundColor: 'rgba(0, 123, 255, 0.6)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) { return value + '%' }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `正答率: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }


    // --- データ操作 ---
    
    // 記録の追加
    function addRecord(e) {
        e.preventDefault();
        const newRecord = {
            id: Date.now(),
            date: dateInput.value,
            total: parseInt(totalQuestionsInput.value),
            correct: parseInt(correctAnswersInput.value),
            memo: memoInput.value.trim()
        };
        records.push(newRecord);
        saveRecordsToStorage();
        renderAll();
        form.reset(); // フォームをリセット
        dateInput.valueAsDate = new Date(); // 日付を再設定
    }

    // 記録の削除
    function deleteRecord(e) {
        if (!e.target.classList.contains('delete-btn')) return;
        if (!confirm('この記録を削除しますか？')) return;
        
        const idToDelete = Number(e.target.dataset.id);
        records = records.filter(rec => rec.id !== idToDelete);
        saveRecordsToStorage();
        renderAll();
    }
    
    // ソート処理
    function sortRecords() {
        const { column, order } = sortState;
        records.sort((a, b) => {
            let valA, valB;
            if (column === 'date') {
                valA = new Date(a.date);
                valB = new Date(b.date);
            } else if (column === 'accuracy') {
                valA = a.total > 0 ? a.correct / a.total : 0;
                valB = b.total > 0 ? b.correct / b.total : 0;
            }
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    // ソート状態の切り替え
    function toggleSort(e) {
        const column = e.target.dataset.sort;
        if (sortState.column === column) {
            sortState.order = sortState.order === 'asc' ? 'desc' : 'asc';
        } else {
            sortState.column = column;
            sortState.order = 'asc';
        }
        renderAll();
    }


    // --- ローカルストレージ関連 ---
    function getRecordsFromStorage() {
        return JSON.parse(localStorage.getItem('examRecords')) || [];
    }
    function saveRecordsToStorage() {
        localStorage.setItem('examRecords', JSON.stringify(records));
    }

    // --- その他 ---
    
    // 入力値のバリデーション
    function addInputValidation() {
        totalQuestionsInput.addEventListener('input', () => {
            const maxVal = totalQuestionsInput.value;
            if (maxVal) {
                correctAnswersInput.setAttribute('max', maxVal);
            }
        });
    }

    // --- イベントリスナーの設定 ---
    form.addEventListener('submit', addRecord);
    recordList.addEventListener('click', deleteRecord);
    tableHeaders.forEach(header => header.addEventListener('click', toggleSort));

    // --- アプリケーションの実行 ---
    initializeApp();
});