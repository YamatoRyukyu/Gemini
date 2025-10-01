document.addEventListener('DOMContentLoaded', () => {
    // HTMLの要素を取得
    const form = document.getElementById('progress-form');
    const studyDateEl = document.getElementById('study-date');
    const startPageEl = document.getElementById('start-page');
    const endPageEl = document.getElementById('end-page');
    const pagesReadEl = document.getElementById('pages-read');
    const progressListEl = document.getElementById('progress-list');

    // --- 初期化処理 ---
    // 日付の初期値を今日に設定
    studyDateEl.valueAsDate = new Date();
    // ページ読み込み時に、保存されたデータを表示
    loadProgress();
    // 次の開始ページを自動設定
    setNextStartPage();


    // --- イベントリスナーの設定 ---

    // 開始ページまたは終了ページが入力されたら、進捗ページ数を計算
    startPageEl.addEventListener('input', calculatePages);
    endPageEl.addEventListener('input', calculatePages);

    // フォームが送信（「記録する」ボタンがクリック）されたときの処理
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // フォームのデフォルトの送信動作をキャンセル
        addProgress();
    });

    // --- 関数定義 ---

    /**
     * 進んだページ数を計算して表示する関数
     */
    function calculatePages() {
        const start = parseInt(startPageEl.value, 10) || 0;
        const end = parseInt(endPageEl.value, 10) || 0;
        const pagesRead = end >= start ? end - start + 1 : 0; // +1することで「1~1ページまで」なら1ページと計算
        pagesReadEl.textContent = pagesRead;
    }

    /**
     * 入力された進捗を記録する関数
     */
    function addProgress() {
        const studyDate = studyDateEl.value;
        const startPage = startPageEl.value;
        const endPage = endPageEl.value;
        
        // 入力チェック
        if (!studyDate || !startPage || !endPage) {
            alert('すべての日付とページを入力してください。');
            return;
        }
        if (parseInt(startPage) > parseInt(endPage)) {
            alert('終了ページは開始ページ以上の数値を入力してください。');
            return;
        }

        const pagesRead = parseInt(endPage) - parseInt(startPage) + 1;

        // 記録するデータを作成
        const progress = {
            id: Date.now(), // 削除処理のためにユニークなIDを付与
            date: studyDate,
            start: startPage,
            end: endPage,
            read: pagesRead
        };
        
        const progresses = getProgressesFromStorage();
        progresses.push(progress);
        saveProgressesToStorage(progresses);

        // 画面に新しい記録を追加
        renderProgress(progress);
        
        // 次の入力を準備
        setNextStartPage();
    }
    
    /**
     * ローカルストレージから進捗データを取得する関数
     * @returns {Array} 進捗データの配列
     */
    function getProgressesFromStorage() {
        const progressesJSON = localStorage.getItem('progresses');
        return progressesJSON ? JSON.parse(progressesJSON) : [];
    }

    /**
     * 進捗データをローカルストレージに保存する関数
     * @param {Array} progresses 保存する進捗データの配列
     */
    function saveProgressesToStorage(progresses) {
        localStorage.setItem('progresses', JSON.stringify(progresses));
    }

    /**
     * 保存されているすべての進捗データを読み込んで表示する関数
     */
    function loadProgress() {
        progressListEl.innerHTML = ''; // 一旦リストを空にする
        const progresses = getProgressesFromStorage();
        progresses.forEach(progress => {
            renderProgress(progress);
        });
    }

    /**
     * ★新機能★ 次の学習の開始ページを自動設定する関数
     */
    function setNextStartPage() {
        const progresses = getProgressesFromStorage();
        // 記録が1つ以上ある場合
        if (progresses.length > 0) {
            // 配列の最後の要素（＝最後に記録されたデータ）を取得
            const lastProgress = progresses[progresses.length - 1];
            // 最後の記録の終了ページに1を足したものを次の開始ページに設定
            const nextStartPage = parseInt(lastProgress.end, 10) + 1;
            startPageEl.value = nextStartPage;
        } else {
            // 記録がない場合は1ページからに設定
            startPageEl.value = 1;
        }
        // 次の入力のために終了ページと計算結果はクリアしておく
        endPageEl.value = '';
        calculatePages(); // 計算結果表示も更新
    }

    /**
     * 1件の進捗データをテーブルの行として画面に表示する関数
     * @param {object} progress 表示する進捗データ
     */
    function renderProgress(progress) {
        const tr = document.createElement('tr');
        tr.dataset.id = progress.id; // 行にIDを持たせる
        tr.innerHTML = `
            <td>${progress.date}</td>
            <td>${progress.start}</td>
            <td>${progress.end}</td>
            <td>${progress.read}</td>
            <td><button class="delete-btn">削除</button></td>
        `;

        // 削除ボタンの処理
        tr.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('この記録を削除しますか？')) {
                const idToDelete = Number(tr.dataset.id);
                // データの中から該当IDのものを削除
                let progresses = getProgressesFromStorage();
                progresses = progresses.filter(p => p.id !== idToDelete);
                saveProgressesToStorage(progresses);
                // 画面からも行を削除
                tr.remove();
                // 削除後に次の開始ページを再計算
                setNextStartPage();
            }
        });

        progressListEl.appendChild(tr);
    }
});