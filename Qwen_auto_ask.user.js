// ==UserScript==
// @name         Qwen auto ask
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  修复因 React 状态未更新导致发送按钮灰显的问题
// @author       Qwen
// @match        https://www.qianwen.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (!query) return;
    console.log('start')
    // 🔧 强制让 React 感知到 textarea 值变化
    function setReactInputValue(element, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        ).set;

        nativeInputValueSetter.call(element, value);

        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
    }

    // 🔍 查找发送按钮（根据常见结构）
    function findSendButton() {
        return document.querySelector(
            '#GLOBAL_ID\\.QWEN_AI_LAYOUT_CONTENT button[type="submit"], ' +
            '#GLOBAL_ID\\.QWEN_AI_LAYOUT_CONTENT .send-button, ' +
            '#GLOBAL_ID\\.QWEN_AI_LAYOUT_CONTENT button:has(svg[aria-label="发送"]), ' +
            '#GLOBAL_ID\\.QWEN_AI_LAYOUT_CONTENT div[role="button"]:has(svg)'
        );
    }

    const main = async () => {
        let retryCount = 0;
        const maxRetries = 30;
        let textarea = null;

        while (!textarea && retryCount < maxRetries) {
            textarea = document.querySelector(
                '#GLOBAL_ID\\.QWEN_AI_LAYOUT_CONTENT > div.Home--aXgE3ZET > div > div.MessageInput--huaOYrdW.medium--Kgej7Ilm > div.MessageInput__Content--G_9hiWE8.medium--Kgej7Ilm > textarea'
            );
            if (!textarea) {
                await new Promise(r => setTimeout(r, 500));
                retryCount++;
            }
        }

        if (!textarea) {
            console.warn('❌ 未找到输入框');
            return;
        }

        const decodedQuery = decodeURIComponent(query);
        console.log('⌨️ 设置输入内容:', decodedQuery);

        // ✅ 关键：使用 React 兼容方式设置值
        setReactInputValue(textarea, decodedQuery);
        textarea.focus();

        // 等待按钮变为可用（最多 2 秒）
        await new Promise(r => setTimeout(r, 800));

        // 尝试点击发送按钮
        const sendButton = findSendButton();
        if (sendButton && !sendButton.disabled) {
            sendButton.click();
            console.log('✅ 成功点击发送按钮');
        } else {
            console.warn('⚠️ 发送按钮仍不可用，尝试模拟 Enter');
            // 回退：模拟 Enter（可能无效，但试试）
            textarea.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true,
                cancelable: true
            }));
        }
    };

    setTimeout(main, 1000);
})();