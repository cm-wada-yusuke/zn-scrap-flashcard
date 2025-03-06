document.addEventListener('DOMContentLoaded', async function() {
    const questionElement = document.getElementById('question');
    const answerElement = document.getElementById('answer');
    const showAnswerButton = document.getElementById('show-answer');
    const nextCardButton = document.getElementById('next-card');
    const prevCardButton = document.getElementById('prev-card');
    const commentLink = document.getElementById('comment-link');

    let currentCardIndex = 0;
    let cards = [];

    // Load cards from storage
    const data = await chrome.storage.local.get('flashcards');
    if (data.flashcards && data.flashcards.length > 0) {
        // Fisher-Yatesシャッフルアルゴリズムでカードをランダムに並び替え
        cards = [...data.flashcards];
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
    } else {
        questionElement.innerHTML = 'フラッシュカードが見つかりませんでした';
        answerElement.style.display = 'none';
        showAnswerButton.disabled = true;
        nextCardButton.disabled = true;
        return;
    }

    function showCard() {
        const card = cards[currentCardIndex];
        questionElement.innerHTML = card.question;
        answerElement.innerHTML = card.answer;
        answerElement.style.display = 'none';
        
        // Update button states
        showAnswerButton.disabled = false;
        nextCardButton.disabled = false;
        prevCardButton.disabled = false;

        // Update comment link with attributes
        commentLink.href = `https://zenn.dev/link/comments/${card.commentId}`;
        commentLink.target = '_blank';
        commentLink.rel = 'noopener noreferrer';
    }

    showCard();

    showAnswerButton.addEventListener('click', function() {
        answerElement.style.display = 'block';
    });

    nextCardButton.addEventListener('click', function() {
        currentCardIndex = (currentCardIndex + 1) % cards.length;
        showCard();
    });

    // キーボードイベントの処理を関数化
    function handlePrevCard() {
        currentCardIndex = (currentCardIndex - 1 + cards.length) % cards.length;
        showCard();
    }

    function handleShowAnswer() {
        answerElement.style.display = 'block';
    }

    function handleNextCard() {
        currentCardIndex = (currentCardIndex + 1) % cards.length;
        showCard();
    }

    // ボタンクリックイベント
    prevCardButton.addEventListener('click', handlePrevCard);
    showAnswerButton.addEventListener('click', handleShowAnswer);
    nextCardButton.addEventListener('click', handleNextCard);

    // キーボードイベント
    document.addEventListener('keydown', function(event) {
        // フォーム要素にフォーカスがある場合は無視
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'ArrowLeft':
                handlePrevCard();
                break;
            case 'Space':
                event.preventDefault(); // スクロールを防止
                handleShowAnswer();
                break;
            case 'ArrowRight':
                handleNextCard();
                break;
        }
    });
});
