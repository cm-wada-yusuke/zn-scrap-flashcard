document.addEventListener('DOMContentLoaded', async function() {
    const openButton = document.getElementById('open-flashcards');
    
    try {
        // Get current tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tabs || tabs.length === 0) {
            throw new Error('アクティブなタブが見つかりません');
        }
        
        const tab = tabs[0];
        
        if (!tab.id) {
            throw new Error('タブIDが取得できません');
        }
        
        // Check if we're on a Zenn scrap page
        if (!/^https:\/\/zenn\.dev\/[^\/]+\/scraps\/[^\/]+$/.test(tab.url)) {
            openButton.disabled = true;
            openButton.textContent = 'Zennのスクラップページでのみ利用可能です';
            return;
        }

        // Extract scrap content when button is clicked
        openButton.addEventListener('click', async function() {
            try {
                // Inject content script to extract scrap content
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        // ページが完全に読み込まれるのを待つ
                        return new Promise((resolve) => {
                            // すでにiframeが読み込まれている場合は即時実行
                            const iframes = document.querySelectorAll('iframe');
                            if (iframes.length > 0 && iframes[0].getAttribute('data-content')) {
                                resolve(extractCards());
                                return;
                            } 

                            // そうでない場合は少し待ってから実行
                            setTimeout(() => {
                                resolve(extractCards());
                            }, 1000);
                        });

                        function extractCards() {
                            // スクラップの各スレッドを取得（idがcomment-で始まるもののみ）
                            const articles = document.querySelectorAll('article[id^="comment-"]');
                            const cards = [];

                            articles.forEach(article => {
                                const zncDiv = article.querySelector('div.znc');
                                if (!zncDiv) return;

                                // articleのIDからコメントIDを抽出
                                const articleId = article.id;
                                const commentId = articleId.replace('comment-', '');
                                console.log('Article ID:', articleId, 'Comment ID:', commentId);

                                // 最初の要素をプレーンテキストとして取得（質問）
                                const firstElement = zncDiv.firstElementChild;
                                if (!firstElement) return;
                                
                                const question = firstElement.textContent.trim();
                                console.log('Question:', question);
                                
                                // 解答用のHTML要素を生成
                                console.log('Processing elements for answer:');
                                const answerElements = [];
                                zncDiv.childNodes.forEach(child => {
                                    if (child.nodeType === Node.ELEMENT_NODE) {
                                        const element = child;
                                        console.log('Processing element:', element.outerHTML);
                                        // 指定されたaria-labelを持つボタンを除外
                                        const unwantedButtons = element.querySelectorAll('button[aria-label="クリップボードにコピー"], button[aria-label="右端で折り返す"]');
                                        unwantedButtons.forEach(button => button.remove());

                                        const embeddedSpan = element.querySelector('span.zenn-embedded');
                                        
                                        if (embeddedSpan) {
                                            const iframe = embeddedSpan.querySelector('iframe');
                                            if (iframe) {
                                                console.log('Found iframe:', iframe);
                                                console.log('data-content:', iframe.getAttribute('data-content'));
                                                const encodedContent = iframe.getAttribute('data-content');
                                                if (encodedContent) {
                                                    const decodedContent = decodeURIComponent(encodedContent);
                                                    const link = document.createElement('a');
                                                    link.href = decodedContent;
                                                    link.textContent = decodedContent;
                                                    link.target = '_blank';
                                                    answerElements.push(link.outerHTML);
                                                }
                                            }
                                        } else {
                                            answerElements.push(element.outerHTML);
                                        }
                                    }
                                });

                                cards.push({
                                    question,
                                    answer: answerElements.join('\n'),
                                    commentId
                                });
                            });

                            return cards;
                        }
                    }
                });

                if (!results || results.length === 0) {
                    throw new Error('スクリプトの実行結果が取得できません');
                }

                const { result } = results[0];

                // Store the cards in local storage
                await chrome.storage.local.set({ flashcards: result });

                // Open flashcard view in new tab
                await chrome.tabs.create({
                    url: chrome.runtime.getURL('flashcard.html')
                });
            } catch (error) {
                console.error('フラッシュカードの作成中にエラーが発生しました:', error);
                openButton.disabled = true;
                openButton.textContent = 'エラーが発生しました: ' + error.message;
            }
        });
    } catch (error) {
        console.error('初期化中にエラーが発生しました:', error);
        openButton.disabled = true;
        openButton.textContent = 'エラーが発生しました: ' + error.message;
    }
});
