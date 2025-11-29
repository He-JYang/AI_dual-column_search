// ==UserScript==
// @name         Kimi 自动提问（模拟回车发送）
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  在 www.kimi.com 上自动输入问题并模拟按下 Enter 发送
// @author       Qwen
// @match        https://www.kimi.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (!query) return;

    let editorRetryCount = 0;
    const maxEditorRetries = 25; // 最多等待 12.5 秒

    // 模拟逐字输入
    function simulateTyping(editor, text) {
        return new Promise((resolve) => {
            editor.focus();
            editor.innerHTML = '';
            editor.dispatchEvent(new Event('input', { bubbles: true }));

            let i = 0;
            const typeNext = () => {
                if (i < text.length) {
                    const char = text[i];
                    document.execCommand('insertText', false, char);
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    i++;
                    setTimeout(typeNext, 10 + Math.random() * 20);
                } else {
                    resolve();
                }
            };
            typeNext();
        });
    }

    // 模拟按下 Enter 键
    function pressEnter(editor) {
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true,
            view: window
        });
        editor.dispatchEvent(enterEvent);
        console.log('📤 已模拟按下 Enter 键');
    }

    // 主流程
    const main = async () => {
        // 🔍 等待 contenteditable 编辑器出现
        let editor = null;
        while (!editor && editorRetryCount < maxEditorRetries) {
            editor = document.querySelector('div[contenteditable="true"]');
            if (!editor) {
                await new Promise(r => setTimeout(r, 500));
                editorRetryCount++;
            }
        }

        if (!editor) {
            console.warn('❌ 未找到 Kimi 输入框');
            return;
        }

        const decodedQuery = decodeURIComponent(query);
        console.log('⌨️ 开始输入:', decodedQuery);

        // ✍️ 模拟输入
        await simulateTyping(editor, decodedQuery);
        console.log('✅ 输入完成');

        // ⏳ 稍等 UI 更新（确保 Enter 被识别为有效发送）
        await new Promise(r => setTimeout(r, 400));

        // 🔑 聚焦（确保事件目标正确）
        editor.focus();

        // ↵ 模拟回车
        pressEnter(editor);
    };

    // 启动
    setTimeout(main, 1000);
})();