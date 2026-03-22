// ==UserScript==
// @name         GPT auto ask
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  修复 "Illegal invocation" 错误，稳定自动提问
// @author       Qwen
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('prompt');
    if (!query) return;

    console.log('🤖 GPT 自动提问（修复版）启动');

    // ✅ 安全设置 React 输入值（避免 Illegal invocation）
    function setReactInputValue(element, value) {
        element.value = value;
        if (element._valueTracker) {
            try {
                element._valueTracker.setValue(value);
            } catch (e) {
                // 忽略异常（某些环境 _valueTracker 不可写）
            }
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ✅ 模拟 Enter（带完整属性）
    function simulateEnter(element) {
        const eventProps = {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            view: window,
            isComposing: false
        };
        element.dispatchEvent(new KeyboardEvent('keydown', eventProps));
        element.dispatchEvent(new KeyboardEvent('keyup', eventProps));
    }

    const main = async () => {
        let textarea = null;
        for (let i = 0; i < 20; i++) {
            textarea = document.querySelector('#prompt-textarea');
            if (textarea) break;
            await new Promise(r => setTimeout(r, 300));
        }

        if (!textarea) {
            console.warn('❌ 未找到 #prompt-textarea');
            return;
        }

        const decodedQuery = decodeURIComponent(query).trim();
        if (!decodedQuery) return;

        console.log('📝 设置问题:', decodedQuery);
        setReactInputValue(textarea, decodedQuery);
        textarea.focus();

        // ⏳ 关键等待：让 React 状态同步
        await new Promise(r => setTimeout(r, 600));

        // 🔁 发送（最多 2 次）
        for (let i = 0; i < 2; i++) {
            if (textarea.value.trim() === '') break; // 已清空说明已发送
            simulateEnter(textarea);
            await new Promise(r => setTimeout(r, 800));
        }

        console.log(textarea.value.trim() === '' ? '✅ 发送成功' : '⚠️ 可能未发送');
    };

    setTimeout(main, 800);
})();