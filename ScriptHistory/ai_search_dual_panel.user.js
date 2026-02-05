// ==UserScript==
// @name         ai_search_dual_panel
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  在自定义页面上提供双栏搜索：左侧传统引擎，右侧大模型问答
// @author       HubertJason
// @match        https://www.hao123.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    if (window.location.hostname !== 'www.hao123.com') return;

    // ⚡ 快速拦截原始页面输出
    document.write = document.writeln = document.open = function () {};

    // 清空并初始化自定义 UI
    const initApp = () => {
        // 彻底清空 body（安全方式）
        document.documentElement.innerHTML = '';
        document.head.innerHTML = '<title>AI + 搜索双栏助手</title>';
        document.body = document.createElement('body');

        // 插入样式
        const style = document.createElement('style');
        style.textContent = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
                height: 100%;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #f5f7fa;
            }
            .search-bar {
                padding: 8px;
                background: white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                display: flex;
                gap: 10px;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
            }
            .search-bar input {
                flex: 1;
                min-width: 320px;
                max-width: 900px;
                padding: 8px 12px;
                border: 1px solid #ccc;
                border-radius: 20px;
                font-size: 14px;
            }
            .search-bar button {
                padding: 8px 16px;
                background: #4285f4;
                color: white;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
            }
            .search-bar button:hover {
                background: #3367d6;
            }
            .search-bar select {
                padding: 6px 8px;
                font-size: 14px;
                border-radius: 6px;
                border: 1px solid #ccc;
            }
            .container {
                display: flex;
                height: calc(100vh - 50px);
            }
            .panel {
                flex: 1;
                padding: 10px;
                position: relative;
            }
            iframe {
                width: 100%;
                height: 100%;
                border: 1px solid #ddd;
                border-radius: 8px;
            }
            .iframe-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                cursor: pointer;
                z-index: 5;
            }
        `;
        document.head.appendChild(style);

        // 构建 HTML 结构
        document.body.innerHTML = `
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="请输入搜索内容..." />
                <button type="button" id="searchBtn">搜索</button>
                <span>左侧：</span>
                <select id="engineSelect">
                    <option value="bing">Bing</option>
                    <option value="google">Google</option>
                </select>
                <span>右侧：</span>
                <select id="aiSelect">
                    <option value="kimi">Kimi</option>
                    <option value="qwen">Qwen</option>
                    <option value="gpt">ChatGPT</option>
                    <option value="gemini">Gemini</option>
                    <option value="ALL">ALL</option>
                </select>
            </div>
            <div class="container">
                <div class="panel" id="leftPanel">
                    <div class="iframe-overlay" id="leftOverlay"></div>
                    <iframe id="leftFrame" src="about:blank"></iframe>
                </div>
                <div class="panel"><iframe id="rightFrame" src="about:blank"></iframe></div>
            </div>
        `;

        // 获取元素（此时一定存在）
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const engineSelect = document.getElementById('engineSelect');
        const aiSelect = document.getElementById('aiSelect');
        const leftFrame = document.getElementById('leftFrame');
        const rightFrame = document.getElementById('rightFrame');
        const leftOverlay = document.getElementById('leftOverlay');

        searchInput.focus();

        // 👇 关键：绑定 overlay 点击事件
        leftOverlay.addEventListener('click', function () {
            searchInput.focus();
            searchInput.style.outline = '2px solid #4285f4';
            setTimeout(() => {
                searchInput.style.outline = '';
            }, 300);
            // 真正从 DOM 中移除
            this.remove();
        });


        function performSearch() {

            // 👇 新增：搜索时自动移除左侧蒙版（如果存在）
            const existingOverlay = document.getElementById('leftOverlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            const query = searchInput.value.trim();
            if (!query) return;

            document.title = query;
            const q = encodeURIComponent(query);

            let leftUrl = engineSelect.value === 'google'
                ? `https://www.google.com/search?q=${q}`
                : `https://www.bing.com/search?q=${q}`;

            let rightUrl = 'about:blank';
            const ai = aiSelect.value;
            if (ai === 'kimi') {
                rightUrl = `https://www.kimi.com/?q=${q}`;
            } else if (ai === 'qwen') {
                rightUrl = `https://www.kimi.com/?q=${q}`;
                window.open(`https://www.qianwen.com/?q=${q}`, '_blank');
            } else if (ai === 'gpt') {
                rightUrl = `https://www.kimi.com/?q=${q}`;
                window.open(`https://chatgpt.com/?q=${q}`, '_blank');
            } else if (ai === 'gemini') {
                rightUrl = `https://www.kimi.com/?q=${q}`;
                window.open(`https://gemini.google.com/?q=${q}`, '_blank');
            } else if (ai === 'ALL') {
                rightUrl = `https://www.kimi.com/?q=${q}`;
                window.open(`https://www.qianwen.com/?q=${q}`, '_blank');
                window.open(`https://chatgpt.com/?q=${q}`, '_blank');
                // setTimeout(() => {
                window.open(`https://gemini.google.com/?q=${q}`, '_blank');
                // }, 600);

                setTimeout(() => {
                    window.open(`https://www.google.com/search?q=${q}`, '_blank');
                }, 1200);
            }

            leftFrame.src = leftUrl;
            rightFrame.src = rightUrl;
        }

        searchBtn.onclick = performSearch;
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') performSearch();
        };
    };

    // 等待 body 可用（即使 document-start，也需确保可操作）
    const waitForBody = () => {
        if (document.body) {
            initApp();
        } else {
            // 极少数情况下 body 未创建，强制创建
            const observer = new MutationObserver(() => {
                if (document.body) {
                    observer.disconnect();
                    initApp();
                }
            });
            observer.observe(document.documentElement, { childList: true });
            // 安全兜底：100ms 后强制初始化
            setTimeout(() => {
                if (!document.body) {
                    document.documentElement.appendChild(document.createElement('body'));
                }
                if (!document.body.innerHTML) {
                    initApp();
                }
            }, 100);
        }
    };

    waitForBody();

    // 防御性清理：移除 hao123 可能动态插入的辅助元素
    const cleanObserver = new MutationObserver((mutations) => {
        for (const mut of mutations) {
            for (const node of mut.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (
                        (node.textContent && /辅助模式|无障碍|compatibility/i.test(node.textContent)) ||
                        (node.classList && node.classList.contains('assist-mode')) ||
                        (node.id && /assist|tip/i.test(node.id))
                    ) {
                        node.remove();
                    }
                }
            }
        }
    });

    if (document.body) {
        cleanObserver.observe(document.body, { childList: true, subtree: true });
    } else {
        const initObserver = new MutationObserver(() => {
            if (document.body) {
                initObserver.disconnect();
                cleanObserver.observe(document.body, { childList: true, subtree: true });
            }
        });
        initObserver.observe(document, { childList: true, subtree: true });
    }
})();