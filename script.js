// --- データ管理 ---
let workbooksData = [
  { name: '無名の問題集', questions: [] }
];

let currentWorkbookIndex = 0;
let isRandomOrder = true;
let sliderAnimationId = null;

// ★ クイズ進行用データ
let currentQuizList = [];
let currentQuizIndex = 0;
let score = 0;
let lastQuizConfig = { sourceQuestions: [], count: 0, isRandom: true };

// --- 画面要素の取得 ---
const screens = document.querySelectorAll('.screen');
const navItems = document.querySelectorAll('.nav-item');
const bottomNav = document.querySelector('.bottom-nav');

// 個別画面
const homeScreen = document.getElementById('home-screen');
const createScreen = document.getElementById('create-screen');
const workbookScreen = document.getElementById('workbook-screen');
const workbookDetailScreen = document.getElementById('workbook-detail-screen');
const quizPlayScreen = document.getElementById('quiz-play-screen');
const quizResultScreen = document.getElementById('quiz-result-screen');

// ボタン等
const mainStartBtn = document.getElementById('main-start-btn');
const backFromWorkbookDetailBtn = document.getElementById('back-from-workbook-detail-btn');

// 問題作成画面の内部要素
const optionsList = document.querySelector('.options-list');
const addOptionBtn = document.querySelector('.add-option-btn');
const questionInput = document.querySelector('.question-input');

// 問題集リストの表示先
const workbookList = document.getElementById('workbook-list');
const addWorkbookBtn = document.getElementById('add-workbook-btn');

// 問題集詳細画面の要素
const detailWorkbookTitle = document.getElementById('detail-workbook-title');
const questionListArea = document.getElementById('question-list-area');

// 保存先選択モーダルの要素
const saveBtn = document.getElementById('save-btn');
const saveModal = document.getElementById('save-modal');
const modalWorkbookList = document.getElementById('modal-workbook-list');
const modalAddWorkbookBtn = document.getElementById('modal-add-workbook-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// 出題設定モーダルの要素
const playWorkbookBtn = document.getElementById('play-workbook-btn');
const quizConfigModal = document.getElementById('quiz-config-modal');
const closeConfigModalBtn = document.getElementById('close-config-modal-btn');
const quizCountSlider = document.getElementById('quiz-count-slider');
const quizCountDisplay = document.getElementById('quiz-count-display');
const quizRandomToggle = document.getElementById('quiz-random-toggle');
const randomStatusText = document.getElementById('random-status-text');
const startQuizConfigBtn = document.getElementById('start-quiz-config-btn');

// ★ クイズ画面・結果画面の要素
const quizProgressTitle = document.getElementById('quiz-progress-title');
const quizQuestionText = document.getElementById('quiz-question-text');
const quizOptionsList = document.getElementById('quiz-options-list');
const quizNextBtn = document.getElementById('quiz-next-btn');
const quitQuizBtn = document.getElementById('quit-quiz-btn');

const resultScoreText = document.getElementById('result-score-text');
const resultPercentageText = document.getElementById('result-percentage-text');
const resultRetryBtn = document.getElementById('result-retry-btn');
const resultHomeBtn = document.getElementById('result-home-btn');


// --- UI更新関数 ---
function renderWorkbooks() {
  workbookList.innerHTML = '';
  modalWorkbookList.innerHTML = '';

  workbooksData.forEach((wb, index) => {
    // 1. 問題集ページ用のカード
    const card1 = document.createElement('div');
    card1.className = 'workbook-card';
    card1.innerHTML = `
      <div class="workbook-info">
        <span class="workbook-icon">📚</span>
        <span class="workbook-name">${wb.name}</span>
      </div>
      <div class="workbook-actions">
        <span class="workbook-count">${wb.questions.length}問</span>
        <button class="action-icon-btn edit-btn" title="名前を変更">✏️</button>
        <button class="action-icon-btn delete-btn" title="削除">🗑️</button>
      </div>
    `;
    
    card1.addEventListener('click', () => {
      openWorkbookDetail(index);
    });

    const editBtn = card1.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renameWorkbook(index);
    });

    const deleteBtn = card1.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteWorkbook(index);
    });
    
    workbookList.appendChild(card1);

    // 2. 保存モーダル用のカード
    const card2 = document.createElement('div');
    card2.className = 'workbook-card';
    card2.innerHTML = `
      <div class="workbook-info">
        <span class="workbook-icon">📚</span>
        <span class="workbook-name">${wb.name}</span>
      </div>
      <span class="workbook-count">${wb.questions.length}問</span>
    `;
    
    card2.addEventListener('click', () => {
      saveToWorkbook(index);
    });
    
    modalWorkbookList.appendChild(card2);
  });
}

renderWorkbooks();


// --- 画面遷移関数 ---
function updateNavIndicator() {
  const activeTab = document.querySelector('.nav-item.active');
  const indicator = document.getElementById('nav-indicator');
  
  if (activeTab && indicator) {
    const navRect = activeTab.parentElement.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    
    const offsetLeft = tabRect.left - navRect.left;
    
    indicator.style.transform = `translateX(${offsetLeft}px)`;
    indicator.style.width = `${tabRect.width}px`;
  }
}

function switchScreen(targetScreenId) {
  screens.forEach(screen => screen.classList.add('hidden'));
  document.getElementById(targetScreenId).classList.remove('hidden');
  document.body.setAttribute('data-screen', targetScreenId);

  // ★ クイズ中・結果画面ではボトムナビを隠す
  if (targetScreenId === 'quiz-play-screen' || targetScreenId === 'quiz-result-screen') {
    bottomNav.classList.add('hidden');
  } else {
    bottomNav.classList.remove('hidden');
  }

  // タブのアクティブ状態の更新
  navItems.forEach(item => item.classList.remove('active'));
  
  if (targetScreenId === 'workbook-detail-screen') {
    document.getElementById('nav-workbook').classList.add('active');
  } else {
    const activeTab = document.querySelector(`.nav-item[data-target="${targetScreenId}"]`);
    if (activeTab) activeTab.classList.add('active');
  }

  updateNavIndicator();
}

window.addEventListener('DOMContentLoaded', updateNavIndicator);
window.addEventListener('resize', updateNavIndicator);

// --- ボトムナビゲーションのイベント ---
navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchScreen(item.dataset.target);
  });
});

// ★ ホーム画面の「出題」ボタン（登録されている全問題からランダム出題）
mainStartBtn.addEventListener('click', () => {
  const allQuestions = [];
  workbooksData.forEach(wb => {
    allQuestions.push(...wb.questions);
  });

  if (allQuestions.length === 0) {
    alert('保存されている問題がありません。\nまずは「作る」タブから問題を作成して保存してください！');
    return;
  }

  startQuiz(allQuestions, allQuestions.length, true);
});

// 詳細画面からの戻るボタン
backFromWorkbookDetailBtn.addEventListener('click', () => {
  switchScreen('workbook-screen');
});


// --- 問題作成画面の動的操作機能 ---
optionsList.addEventListener('click', (e) => {
  const target = e.target;
  if (target.classList.contains('toggle-correct-btn')) {
    if (target.classList.contains('correct')) {
      target.classList.remove('correct');
      target.classList.add('incorrect');
      target.textContent = '✕';
    } else {
      target.classList.remove('incorrect');
      target.classList.add('correct');
      target.textContent = '〇';
    }
  }
  if (target.classList.contains('remove-option-btn')) {
    const currentOptions = optionsList.querySelectorAll('.option-item');
    if (currentOptions.length <= 4) {
      alert('選択肢は最低4個必要です。');
      return;
    }
    target.closest('.option-item').remove();
  }
});

addOptionBtn.addEventListener('click', () => {
  const currentOptions = optionsList.querySelectorAll('.option-item');
  if (currentOptions.length >= 8) {
    alert('選択肢は最大8個までです。');
    return;
  }
  const newOption = document.createElement('div');
  newOption.className = 'option-item';
  newOption.innerHTML = `
    <button class="toggle-correct-btn incorrect">✕</button>
    <input type="text" class="option-input" placeholder="選択肢を入力してください">
    <button class="remove-option-btn">－</button>
  `;
  optionsList.appendChild(newOption);
});


// --- 問題集の操作ロジック ---
function createNewWorkbook() {
  const name = prompt('問題集の名前を入力してください:', 'マイ問題集');
  if (name === null || name.trim() === '') return null;
  
  workbooksData.push({ name: name.trim(), questions: [] });
  renderWorkbooks();
  return workbooksData.length - 1; 
}

function renameWorkbook(index) {
  const currentName = workbooksData[index].name;
  const newName = prompt('新しい問題集の名前を入力してください:', currentName);
  
  if (newName === null || newName.trim() === '') return;
  
  workbooksData[index].name = newName.trim();
  renderWorkbooks();
}

function deleteWorkbook(index) {
  const wbName = workbooksData[index].name;
  const isConfirmed = confirm(`本当に「${wbName}」を削除しますか？`);
  
  if (isConfirmed) {
    workbooksData.splice(index, 1);
    renderWorkbooks();
  }
}

function saveToWorkbook(index) {
  const qText = questionInput.value;
  
  const optionsData = [];
  const optionItems = optionsList.querySelectorAll('.option-item');
  optionItems.forEach(item => {
    const isCorrect = item.querySelector('.toggle-correct-btn').classList.contains('correct');
    const optText = item.querySelector('.option-input').value;
    optionsData.push({
      text: optText || '（未入力の選択肢）',
      isCorrect: isCorrect
    });
  });

  workbooksData[index].questions.push({ 
    text: qText || '無題の問題',
    options: optionsData
  });
  
  alert(`「${workbooksData[index].name}」に問題を保存しました！`);
  
  questionInput.value = '';
  document.querySelectorAll('.option-input').forEach(input => input.value = '');
  
  saveModal.classList.add('hidden');
  renderWorkbooks();
}

function openWorkbookDetail(index) {
  currentWorkbookIndex = index;
  const wb = workbooksData[index];
  detailWorkbookTitle.textContent = wb.name;
  questionListArea.innerHTML = '';
  
  if (wb.questions.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-message';
    emptyMsg.textContent = '問題を保存してください。';
    questionListArea.appendChild(emptyMsg);
  } else {
    wb.questions.forEach((q, qIndex) => {
      const qCard = document.createElement('div');
      qCard.className = 'question-card';
      
      let optionsBeforeAnswer = '';
      let optionsAfterAnswer = '';
      
      if (q.options && q.options.length > 0) {
        optionsBeforeAnswer = q.options.map(opt => `
          <li class="option-display-item">
            <span class="option-text">${opt.text}</span>
          </li>
        `).join('');

        optionsAfterAnswer = q.options.map(opt => `
          <li class="option-answer-item ${opt.isCorrect ? 'correct-item' : 'incorrect-item'}">
            <span class="${opt.isCorrect ? 'correct-tag' : 'incorrect-tag'}">
              ${opt.isCorrect ? '〇' : '✕'}
            </span>
            <span class="option-text">${opt.text}</span>
          </li>
        `).join('');
      } else {
        optionsBeforeAnswer = '<li class="option-display-item">選択肢が保存されていません</li>';
        optionsAfterAnswer = '<li class="option-answer-item">選択肢が保存されていません</li>';
      }

      qCard.innerHTML = `
        <div class="q-card-header">
          <div class="q-card-header-top">
            <span>第${qIndex + 1}問</span>
            <span class="tap-hint toggle-hint">👆 問題を表示</span>
          </div>
          <div class="q-card-preview">${q.text}</div>
        </div>
        <div class="q-card-body hidden">
          <div class="q-card-text">${q.text}</div>
          
          <ul class="option-list-before">
            ${optionsBeforeAnswer}
          </ul>

          <button class="show-answer-btn">答えを見る</button>
          
          <div class="q-card-answer hidden">
            <div class="answer-title">【選択肢と正解】</div>
            <ul class="option-answer-list">
              ${optionsAfterAnswer}
            </ul>
          </div>
        </div>
      `;

      const header = qCard.querySelector('.q-card-header');
      const body = qCard.querySelector('.q-card-body');
      const hint = qCard.querySelector('.toggle-hint');
      const preview = qCard.querySelector('.q-card-preview');
      const showAnswerBtn = qCard.querySelector('.show-answer-btn');
      const answerBox = qCard.querySelector('.q-card-answer');
      const optionsBefore = qCard.querySelector('.option-list-before');

      header.addEventListener('click', () => {
        const isHidden = body.classList.toggle('hidden');
        if (isHidden) {
          hint.textContent = '👆 問題を表示';
          preview.classList.remove('hidden');
        } else {
          hint.textContent = '👆 問題を閉じる';
          preview.classList.add('hidden');
        }
      });

      showAnswerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isAnswerHidden = answerBox.classList.toggle('hidden');
        if (isAnswerHidden) {
          showAnswerBtn.textContent = '答えを見る';
          optionsBefore.classList.remove('hidden');
        } else {
          showAnswerBtn.textContent = '答えを非表示';
          optionsBefore.classList.add('hidden');
        }
      });

      questionListArea.appendChild(qCard);
    });
  }
  
  switchScreen('workbook-detail-screen');
}

// --- イベントのバインド ---
saveBtn.addEventListener('click', () => {
  saveModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => {
  saveModal.classList.add('hidden');
});
addWorkbookBtn.addEventListener('click', () => {
  createNewWorkbook();
});
modalAddWorkbookBtn.addEventListener('click', () => {
  const newIndex = createNewWorkbook();
  if (newIndex !== null) {
    saveToWorkbook(newIndex);
  }
});

// 出題設定モーダルの制御
playWorkbookBtn.addEventListener('click', () => {
  const currentWb = workbooksData[currentWorkbookIndex];
  const totalQuestions = currentWb.questions.length;
  
  if (totalQuestions === 0) {
    alert('この問題集には問題が登録されていません。まずは問題を保存してください。');
    return;
  }
  
  quizCountSlider.min = 1;
  quizCountSlider.max = totalQuestions;
  quizCountSlider.step = 0.01;
  quizCountSlider.value = totalQuestions;
  
  quizCountSlider.disabled = (totalQuestions === 1);
  quizCountDisplay.textContent = `${totalQuestions}問`;
  quizConfigModal.classList.remove('hidden');
});

closeConfigModalBtn.addEventListener('click', () => {
  quizConfigModal.classList.add('hidden');
});

function animateSnapSlider() {
  if (sliderAnimationId) cancelAnimationFrame(sliderAnimationId);

  const startValue = parseFloat(quizCountSlider.value);
  const targetValue = Math.max(1, Math.round(startValue));

  function step() {
    const currentValue = parseFloat(quizCountSlider.value);
    const diff = targetValue - currentValue;

    if (Math.abs(diff) < 0.03) {
      quizCountSlider.value = targetValue;
      quizCountDisplay.textContent = `${targetValue}問`;
      return;
    }

    quizCountSlider.value = currentValue + diff * 0.25;
    const currentDisplayCount = Math.max(1, Math.round(parseFloat(quizCountSlider.value)));
    quizCountDisplay.textContent = `${currentDisplayCount}問`;

    sliderAnimationId = requestAnimationFrame(step);
  }

  sliderAnimationId = requestAnimationFrame(step);
}

quizCountSlider.addEventListener('input', (e) => {
  if (sliderAnimationId) cancelAnimationFrame(sliderAnimationId);
  const count = Math.max(1, Math.round(parseFloat(e.target.value)));
  quizCountDisplay.textContent = `${count}問`;
});

quizCountSlider.addEventListener('change', animateSnapSlider);
quizCountSlider.addEventListener('pointerup', animateSnapSlider);
quizCountSlider.addEventListener('touchend', animateSnapSlider);

quizRandomToggle.addEventListener('click', () => {
  isRandomOrder = !isRandomOrder;
  if (isRandomOrder) {
    quizRandomToggle.classList.add('active');
    randomStatusText.textContent = 'ON';
  } else {
    quizRandomToggle.classList.remove('active');
    randomStatusText.textContent = 'OFF';
  }
});

startQuizConfigBtn.addEventListener('click', () => {
  const selectedCount = Math.round(parseFloat(quizCountSlider.value));
  const currentWb = workbooksData[currentWorkbookIndex];
  
  quizConfigModal.classList.add('hidden');
  startQuiz(currentWb.questions, selectedCount, isRandomOrder);
});


// ★ ----- クイズ解く機能のロジック ----- ★

let isAnswered = false; // 現在のターンで回答済みかどうかのフラグ

// 配列をシャッフルする関数 (フィッシャー・イエーツ)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// クイズ開始
function startQuiz(sourceQuestions, count, isRandom) {
  lastQuizConfig = { sourceQuestions, count, isRandom };
  
  let list = [...sourceQuestions];
  if (isRandom) {
    list = shuffleArray(list);
  }
  currentQuizList = list.slice(0, count);
  
  currentQuizIndex = 0;
  score = 0;
  
  switchScreen('quiz-play-screen');
  renderQuizQuestion();
}

// クイズ画面の描画
function renderQuizQuestion() {
  isAnswered = false; // 回答状態をリセット
  
  const currentQ = currentQuizList[currentQuizIndex];
  quizProgressTitle.textContent = `第 ${currentQuizIndex + 1} / ${currentQuizList.length} 問`;
  quizQuestionText.textContent = currentQ.text;
  
  quizOptionsList.innerHTML = '';

  if (!currentQ.options || currentQ.options.length === 0) {
    quizOptionsList.innerHTML = '<div class="empty-message">選択肢が設定されていません</div>';
    quizNextBtn.classList.add('hidden');
    return;
  }

  // 選択肢ボタンの生成
  currentQ.options.forEach((opt, idx) => {
    const optBtn = document.createElement('button');
    optBtn.className = 'quiz-option-btn';
    optBtn.innerHTML = `<span>${opt.text}</span>`;
    
    // 選択肢タップで「選択状態」のオン/オフを切り替え（トグル）
    optBtn.addEventListener('click', () => {
      if (isAnswered) return; // 回答後はタップ不可
      optBtn.classList.toggle('selected');
      updateSubmitButtonState();
    });
    
    quizOptionsList.appendChild(optBtn);
  });

  // 下部ボタンを「回答する」として初期化
  quizNextBtn.textContent = '回答する';
  quizNextBtn.classList.remove('hidden');
  updateSubmitButtonState();
}

// 「回答する」ボタンの有効/無効の更新
function updateSubmitButtonState() {
  if (isAnswered) return;
  const selectedBtns = quizOptionsList.querySelectorAll('.quiz-option-btn.selected');
  // 1つ以上選択されていれば押せるようにする
  if (selectedBtns.length > 0) {
    quizNextBtn.disabled = false;
    quizNextBtn.style.opacity = '1';
  } else {
    quizNextBtn.disabled = true;
    quizNextBtn.style.opacity = '0.5';
  }
}

// 下部ボタン（回答する / 次の問題へ）を押した時の処理
quizNextBtn.addEventListener('click', () => {
  if (!isAnswered) {
    // まだ回答していない場合は判定を実行
    checkQuizAnswer();
  } else {
    // 判定済みの場合は次の問題（または結果画面）へ進行
    currentQuizIndex++;
    if (currentQuizIndex < currentQuizList.length) {
      renderQuizQuestion();
    } else {
      showQuizResult();
    }
  }
});

// 答え合わせ（判定）処理
function checkQuizAnswer() {
  isAnswered = true;
  quizNextBtn.disabled = false;
  quizNextBtn.style.opacity = '1';

  const currentQ = currentQuizList[currentQuizIndex];
  const allBtns = quizOptionsList.querySelectorAll('.quiz-option-btn');

  let isFullyCorrect = true; // すべての正解を正しく選べているか

  allBtns.forEach((btn, idx) => {
    btn.disabled = true; // ボタン操作をロック
    const opt = currentQ.options[idx];
    const isSelected = btn.classList.contains('selected');

    if (opt.isCorrect) {
      if (isSelected) {
        // 【正解の選択肢】を【選んでいた】場合
        btn.classList.remove('selected');
        btn.classList.add('correct-choice');
        btn.innerHTML += ' <span>⭕ 正解</span>';
      } else {
        // 【正解の選択肢】を【選んでいなかった】場合
        isFullyCorrect = false;
        btn.classList.add('correct-choice');
        btn.style.opacity = '0.7'; // 選び損ねた正解は少し薄く表示
        btn.innerHTML += ' <span>⭕ 正解</span>';
      }
    } else {
      if (isSelected) {
        // 【不正解の選択肢】を【選んでしまった】場合
        isFullyCorrect = false;
        btn.classList.remove('selected');
        btn.classList.add('incorrect-choice');
        btn.innerHTML += ' <span>❌ 不正解</span>';
      }
    }
  });

  // 完全正解（正解のものをすべて選び、不正解を選ばなかった）場合のみスコア加算
  if (isFullyCorrect) {
    score++;
  }

  // ボタンの表示を「次の問題へ」に変更
  if (currentQuizIndex < currentQuizList.length - 1) {
    quizNextBtn.textContent = '次の問題へ ➔';
  } else {
    quizNextBtn.textContent = '結果を見る 🎉';
  }
}

// クイズの中断（✕ボタン）
quitQuizBtn.addEventListener('click', () => {
  const isConfirmed = confirm('出題を中断して戻りますか？');
  if (isConfirmed) {
    switchScreen('workbook-detail-screen');
  }
});

// 結果画面の表示
function showQuizResult() {
  const total = currentQuizList.length;
  const percentage = Math.round((score / total) * 100);
  
  resultScoreText.textContent = `${score} / ${total}`;
  resultPercentageText.textContent = `正解率 ${percentage}%`;
  
  switchScreen('quiz-result-screen');
}

// もう一度解くボタン
resultRetryBtn.addEventListener('click', () => {
  startQuiz(lastQuizConfig.sourceQuestions, lastQuizConfig.count, lastQuizConfig.isRandom);
});

// ホームに戻るボタン
resultHomeBtn.addEventListener('click', () => {
  switchScreen('home-screen');
});