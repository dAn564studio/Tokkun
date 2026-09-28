// --- データ管理 ---
const STORAGE_KEY = 'n_kou_test_workbooks';

// localStorageからデータを読み込む関数
function loadWorkbooksFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('localStorageからのデータ読み込みに失敗しました:', e);
    }
  }
  return [
    { name: '無名の問題集', questions: [] }
  ];
}

// localStorageへデータを保存する関数
function saveWorkbooksToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workbooksData));
}

let workbooksData = loadWorkbooksFromStorage();

let currentWorkbookIndex = 0;
let isRandomOrder = true;
let sliderAnimationId = null;

// 作成中の問題形式 ('choice': 選択問題, 'fillin': 記述問題)
let currentQuestionType = 'choice';
// 記述箇所の数 (1〜3個)
let fillinCount = 1;

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

// 記述問題作成要素
const choiceCreateArea = document.getElementById('choice-create-area');
const fillinCreateArea = document.getElementById('fillin-create-area');
const fillinPartsContainer = document.getElementById('fillin-parts-container');
const fillinAddBtn = document.getElementById('fillin-add-btn');
const fillinRemoveBtn = document.getElementById('fillin-remove-btn');
const formatChoiceBtn = document.getElementById('format-choice-btn');
const formatFillinBtn = document.getElementById('format-fillin-btn');

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

  if (targetScreenId === 'quiz-play-screen' || targetScreenId === 'quiz-result-screen') {
    bottomNav.classList.add('hidden');
  } else {
    bottomNav.classList.remove('hidden');
  }

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

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchScreen(item.dataset.target);
  });
});

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

backFromWorkbookDetailBtn.addEventListener('click', () => {
  switchScreen('workbook-screen');
});


// --- 記述問題の作成フォーム描画ロジック ---
function renderFillinForm() {
  fillinPartsContainer.innerHTML = '';

  // 記述箇所の数に合わせて input フィールドを構築
  for (let i = 0; i < fillinCount; i++) {
    // 前のテキスト入力欄
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'fillin-text-input';
    textInput.dataset.type = 'text';
    textInput.dataset.index = i;
    textInput.placeholder = i === 0 ? '前の文字' : '中間の文字';

    // 記述箇所の正解入力欄
    const answerBox = document.createElement('div');
    answerBox.className = 'fillin-answer-box';
    answerBox.innerHTML = `
      <span class="fillin-answer-label">記述箇所 ${i + 1} </span>
      <input type="text" class="fillin-answer-input" data-type="answer" data-index="${i}" placeholder="正解を入力">
    `;

    fillinPartsContainer.appendChild(textInput);
    fillinPartsContainer.appendChild(answerBox);
  }

  // 一番右（末尾）のテキスト入力欄
  const lastTextInput = document.createElement('input');
  lastTextInput.type = 'text';
  lastTextInput.className = 'fillin-text-input';
  lastTextInput.dataset.type = 'text';
  lastTextInput.dataset.index = fillinCount;
  lastTextInput.placeholder = '後の文字';
  fillinPartsContainer.appendChild(lastTextInput);
}

// 初期描画を実行
renderFillinForm();

// 形式切り替えタブのイベント
formatChoiceBtn.addEventListener('click', () => {
  currentQuestionType = 'choice';
  formatChoiceBtn.classList.add('active');
  formatFillinBtn.classList.remove('active');
  choiceCreateArea.classList.remove('hidden');
  fillinCreateArea.classList.add('hidden');
});

formatFillinBtn.addEventListener('click', () => {
  currentQuestionType = 'fillin';
  formatFillinBtn.classList.add('active');
  formatChoiceBtn.classList.remove('active');
  fillinCreateArea.classList.remove('hidden');
  choiceCreateArea.classList.add('hidden');
});

// プラスボタン：右側に記述箇所を増やす（最大3個）
fillinAddBtn.addEventListener('click', () => {
  if (fillinCount >= 3) {
    alert('記述箇所は最大3個までです。');
    return;
  }
  fillinCount++;
  renderFillinForm();
});

// マイナスボタン：右から順番に記述箇所を削除（最小1個）
fillinRemoveBtn.addEventListener('click', () => {
  if (fillinCount <= 1) {
    alert('記述箇所は最低1個必要です。');
    return;
  }
  fillinCount--;
  renderFillinForm();
});


// --- 選択問題の動的操作機能 ---
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
  saveWorkbooksToStorage();
  renderWorkbooks();
  return workbooksData.length - 1; 
}

function renameWorkbook(index) {
  const currentName = workbooksData[index].name;
  const newName = prompt('新しい問題集の名前を入力してください:', currentName);
  
  if (newName === null || newName.trim() === '') return;
  
  workbooksData[index].name = newName.trim();
  saveWorkbooksToStorage();
  renderWorkbooks();
}

function deleteWorkbook(index) {
  const wbName = workbooksData[index].name;
  const isConfirmed = confirm(`本当に「${wbName}」を削除しますか？`);
  
  if (isConfirmed) {
    workbooksData.splice(index, 1);
    saveWorkbooksToStorage();
    renderWorkbooks();
  }
}

function saveToWorkbook(index) {
  if (currentQuestionType === 'choice') {
    // 選択問題の保存
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
      type: 'choice',
      text: qText || '無題の問題',
      options: optionsData
    });
    
    questionInput.value = '';
    document.querySelectorAll('.option-input').forEach(input => input.value = '');
  } else {
    // 記述問題の保存
    const textInputs = fillinPartsContainer.querySelectorAll('.fillin-text-input');
    const answerInputs = fillinPartsContainer.querySelectorAll('.fillin-answer-input');

    const texts = [];
    textInputs.forEach(input => texts.push(input.value || ''));

    const answers = [];
    answerInputs.forEach(input => answers.push(input.value || ''));

    workbooksData[index].questions.push({
      type: 'fillin',
      texts: texts,
      answers: answers
    });

    // 記述フォーム初期化
    fillinCount = 1;
    renderFillinForm();
  }

  alert(`「${workbooksData[index].name}」に問題を保存しました！`);
  saveWorkbooksToStorage();
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
      
      const isFillin = (q.type === 'fillin');

      let previewText = '';
      let bodyContentHtml = '';

      if (isFillin) {
        // 記述問題の文章整形
        let fullSentence = '';
        q.texts.forEach((txt, idx) => {
          fullSentence += txt;
          if (idx < q.answers.length) {
            fullSentence += `「${q.answers[idx]}」`;
          }
        });
        previewText = fullSentence;

        bodyContentHtml = `
          <div class="fillin-display-text">
            ${q.texts.map((txt, idx) => {
              return txt + (idx < q.answers.length ? `<span class="fillin-blank-tag">${q.answers[idx]}</span>` : '');
            }).join('')}
          </div>
        `;
      } else {
        // 選択問題
        previewText = q.text;
        
        let optionsBeforeAnswer = q.options.map(opt => `
          <li class="option-display-item">
            <span class="option-text">${opt.text}</span>
          </li>
        `).join('');

        let optionsAfterAnswer = q.options.map(opt => `
          <li class="option-answer-item ${opt.isCorrect ? 'correct-item' : 'incorrect-item'}">
            <span class="${opt.isCorrect ? 'correct-tag' : 'incorrect-tag'}">
              ${opt.isCorrect ? '〇' : '✕'}
            </span>
            <span class="option-text">${opt.text}</span>
          </li>
        `).join('');

        bodyContentHtml = `
          <div class="q-card-text">${q.text}</div>
          <ul class="option-list-before">${optionsBeforeAnswer}</ul>
          <button class="show-answer-btn">答えを見る</button>
          <div class="q-card-answer hidden">
            <div class="answer-title">【選択肢と正解】</div>
            <ul class="option-answer-list">${optionsAfterAnswer}</ul>
          </div>
        `;
      }

      qCard.innerHTML = `
        <div class="q-card-header">
          <div class="q-card-header-top">
            <span>第${qIndex + 1}問 (${isFillin ? '記述式' : '選択式'})</span>
            <span class="tap-hint toggle-hint">👆 問題を表示</span>
          </div>
          <div class="q-card-preview">${previewText}</div>
        </div>
        <div class="q-card-body hidden">
          ${bodyContentHtml}
        </div>
      `;

      const header = qCard.querySelector('.q-card-header');
      const body = qCard.querySelector('.q-card-body');
      const hint = qCard.querySelector('.toggle-hint');
      const preview = qCard.querySelector('.q-card-preview');

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

      if (!isFillin) {
        const showAnswerBtn = qCard.querySelector('.show-answer-btn');
        const answerBox = qCard.querySelector('.q-card-answer');
        const optionsBefore = qCard.querySelector('.option-list-before');

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
      }

      questionListArea.appendChild(qCard);
    });
  }
  
  switchScreen('workbook-detail-screen');
}

// モーダルバインド
saveBtn.addEventListener('click', () => { saveModal.classList.remove('hidden'); });
closeModalBtn.addEventListener('click', () => { saveModal.classList.add('hidden'); });
addWorkbookBtn.addEventListener('click', () => { createNewWorkbook(); });
modalAddWorkbookBtn.addEventListener('click', () => {
  const newIndex = createNewWorkbook();
  if (newIndex !== null) saveToWorkbook(newIndex);
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


// ★ ----- クイズ解く機能 (記述判定対応) ----- ★
let isAnswered = false;

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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

function renderQuizQuestion() {
  isAnswered = false;
  
  const currentQ = currentQuizList[currentQuizIndex];
  quizProgressTitle.textContent = `第 ${currentQuizIndex + 1} / ${currentQuizList.length} 問`;
  
  quizOptionsList.innerHTML = '';

  if (currentQ.type === 'fillin') {
    // --- 記述問題の描画 ---
    let questionText = currentQ.texts.map((txt, idx) => {
      return txt + (idx < currentQ.answers.length ? '「 」' : '');
    }).join('');
    
    quizQuestionText.textContent = questionText;

    const fillinContainer = document.createElement('div');
    fillinContainer.className = 'quiz-fillin-container';

    currentQ.answers.forEach((ans, idx) => {
      const item = document.createElement('div');
      item.className = 'quiz-fillin-item';
      item.innerHTML = `
        <span style="font-weight:bold; font-size:13px; color:var(--color-primary);">記述 ${idx + 1}:</span>
        <input type="text" class="quiz-fillin-input" data-index="${idx}" placeholder="解答を入力">
      `;

      const inputEl = item.querySelector('.quiz-fillin-input');
      inputEl.addEventListener('input', () => {
        updateSubmitButtonState();
      });

      fillinContainer.appendChild(item);
    });

    quizOptionsList.appendChild(fillinContainer);
  } else {
    // --- 選択問題の描画 ---
    quizQuestionText.textContent = currentQ.text;

    if (!currentQ.options || currentQ.options.length === 0) {
      quizOptionsList.innerHTML = '<div class="empty-message">選択肢が設定されていません</div>';
      quizNextBtn.classList.add('hidden');
      return;
    }

    currentQ.options.forEach((opt, idx) => {
      const optBtn = document.createElement('button');
      optBtn.className = 'quiz-option-btn';
      optBtn.innerHTML = `<span>${opt.text}</span>`;
      
      optBtn.addEventListener('click', () => {
        if (isAnswered) return;
        optBtn.classList.toggle('selected');
        updateSubmitButtonState();
      });
      
      quizOptionsList.appendChild(optBtn);
    });
  }

  quizNextBtn.textContent = '回答する';
  quizNextBtn.classList.remove('hidden');
  updateSubmitButtonState();
}

function updateSubmitButtonState() {
  if (isAnswered) return;
  const currentQ = currentQuizList[currentQuizIndex];

  if (currentQ.type === 'fillin') {
    const inputs = quizOptionsList.querySelectorAll('.quiz-fillin-input');
    let hasInput = Array.from(inputs).some(input => input.value.trim() !== '');
    quizNextBtn.disabled = !hasInput;
    quizNextBtn.style.opacity = hasInput ? '1' : '0.5';
  } else {
    const selectedBtns = quizOptionsList.querySelectorAll('.quiz-option-btn.selected');
    quizNextBtn.disabled = selectedBtns.length === 0;
    quizNextBtn.style.opacity = selectedBtns.length > 0 ? '1' : '0.5';
  }
}

quizNextBtn.addEventListener('click', () => {
  if (!isAnswered) {
    checkQuizAnswer();
  } else {
    currentQuizIndex++;
    if (currentQuizIndex < currentQuizList.length) {
      renderQuizQuestion();
    } else {
      showQuizResult();
    }
  }
});

// 答え合わせ（判定）
function checkQuizAnswer() {
  isAnswered = true;
  quizNextBtn.disabled = false;
  quizNextBtn.style.opacity = '1';

  const currentQ = currentQuizList[currentQuizIndex];

  if (currentQ.type === 'fillin') {
    // 記述問題の採点
    const inputs = quizOptionsList.querySelectorAll('.quiz-fillin-input');
    let isAllCorrect = true;

    inputs.forEach((input, idx) => {
      input.disabled = true;
      const userAns = input.value.trim();
      const correctAns = currentQ.answers[idx].trim();

      const item = input.closest('.quiz-fillin-item');

      // ⭕/❌ マーク用の要素を作成（入力値を維持）
      const resultMark = document.createElement('span');
      resultMark.className = 'quiz-fillin-mark';

      if (userAns === correctAns) {
        item.classList.add('correct-choice');
        resultMark.style.color = '#e55353';
        resultMark.style.fontWeight = 'bold';
        resultMark.textContent = '⭕';
        item.appendChild(resultMark);
      } else {
        isAllCorrect = false;
        item.classList.add('incorrect-choice');
        resultMark.style.color = '#4a90e2';
        resultMark.style.fontWeight = 'bold';
        resultMark.textContent = '❌';
        item.appendChild(resultMark);

        // 正解テキストを記述枠（item）のすぐ下に配置
        const correctText = document.createElement('div');
        correctText.className = 'quiz-fillin-correct-text';
        correctText.textContent = `正解: ${correctAns}`;
        item.insertAdjacentElement('afterend', correctText);
      }
    });

    if (isAllCorrect) score++;
  } else {
    // 選択問題の採点
    const allBtns = quizOptionsList.querySelectorAll('.quiz-option-btn');
    let isFullyCorrect = true;

    allBtns.forEach((btn, idx) => {
      btn.disabled = true;
      const opt = currentQ.options[idx];
      const isSelected = btn.classList.contains('selected');

      if (opt.isCorrect) {
        if (isSelected) {
          btn.classList.remove('selected');
          btn.classList.add('correct-choice');
          btn.innerHTML += ' <span>⭕ 正解</span>';
        } else {
          isFullyCorrect = false;
          btn.classList.add('correct-choice');
          btn.style.opacity = '0.7';
          btn.innerHTML += ' <span>⭕ 正解</span>';
        }
      } else {
        if (isSelected) {
          isFullyCorrect = false;
          btn.classList.remove('selected');
          btn.classList.add('incorrect-choice');
          btn.innerHTML += ' <span>❌ 不正解</span>';
        }
      }
    });

    if (isFullyCorrect) score++;
  }

  if (currentQuizIndex < currentQuizList.length - 1) {
    quizNextBtn.textContent = '次の問題へ ➔';
  } else {
    quizNextBtn.textContent = '結果を見る';
  }
}

quitQuizBtn.addEventListener('click', () => {
  if (confirm('出題を中断して戻りますか？')) {
    switchScreen('workbook-detail-screen');
  }
});

function showQuizResult() {
  const total = currentQuizList.length;
  const percentage = Math.round((score / total) * 100);
  
  resultScoreText.textContent = `${score} / ${total}`;
  resultPercentageText.textContent = `正解率 ${percentage}%`;
  
  switchScreen('quiz-result-screen');
}

resultRetryBtn.addEventListener('click', () => {
  startQuiz(lastQuizConfig.sourceQuestions, lastQuizConfig.count, lastQuizConfig.isRandom);
});

resultHomeBtn.addEventListener('click', () => {
  switchScreen('home-screen');
});