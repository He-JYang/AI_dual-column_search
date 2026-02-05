// ==UserScript==
// @name         Gemini auto ask
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  高容错自动提问：智能等待 Quill 编辑器，兼容动态 class，仅回车发送
// @author       Qwen
// @match        https://gemini.google.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (!query) return;

    console.log('🤖 Gemini 自动提问（高容错版）启动...');

    // 🔍 通用方式查找 Quill 的 <p>（不依赖动态 class）
    function findQuillP() {
        const editors = document.querySelectorAll('div.ql-editor[contenteditable="true"]');
        for (const editor of editors) {
            // 确保是 Gemini 的输入框（通常在 input-area-v2 内部）
            if (editor.closest('input-area-v2')) {
                const p = editor.querySelector('p');
                if (p) {
                    return { editor, p };
                }
            }
        }
        return null;
    }

    const main = async () => {
        const maxWaitMs = 10000; // 最多等 10 秒
        const checkInterval = 300; // 每 300ms 检查一次

        let elapsed = 0;
        let result = null;

        while (elapsed < maxWaitMs) {
            result = findQuillP();
            if (result) break;
            await new Promise(r => setTimeout(r, checkInterval));
            elapsed += checkInterval;
        }

        if (!result) {
            console.warn('❌ 超时：未能找到 Gemini 的 Quill 输入区域（<p>）');
            return;
        }

        const { editor, p } = result;
        const decodedQuery = decodeURIComponent(query);
        console.log('⌨️ 填入内容:', decodedQuery);

        // 设置文本
        p.textContent = decodedQuery;

        // 触发 input 事件（关键！让 Quill 感知内容变化）
        editor.dispatchEvent(new Event('input', { bubbles: true }));

        editor.focus();

        // 短暂延迟后模拟 Enter 发送
        setTimeout(() => {
            editor.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true,
                cancelable: true
            }));
            console.log('✅ 已模拟 Enter 发送');
        }, 300);
    };

    main();
})();