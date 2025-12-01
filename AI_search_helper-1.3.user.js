// ==UserScript==
// @name         AI + 搜索双栏助手
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  在自定义页面上提供双栏搜索：左侧传统引擎，右侧大模型问答
// @author       HubertJason
// @match        https://www.hao123.com
// @grant        none
// @run-at       document-start  // 👈 提前到 document-start，更早干预
// ==/UserScript==

(function () {
    'use strict';

    if (window.location.hostname !== 'www.hao123.com') return;

    // 阻止原始页面加载任何内容（在 document-start 阶段）
    const originalOpen = document.open;
    document.open = function () {};
    document.write = function () {};
    document.writeln = function () {};

    // 等待 DOM 构建完成再替换
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

    function initApp() {
        // 彻底清空
        document.documentElement.innerHTML = '';
        document.head.innerHTML = '<title>AI + 搜索双栏助手</title>';
        document.body.innerHTML = '';

        // 添加样式
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
                width: 320px;
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
            }
            iframe {
                width: 100%;
                height: 100%;
                border: 1px solid #ddd;
                border-radius: 8px;
            }
        `;
        document.head.appendChild(style);

        // 构建 UI
        document.body.innerHTML = `
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="请输入搜索内容..." />
                <button id="searchBtn">搜索</button>
                <span>左侧：</span>
                <select id="engineSelect">
                    <option value="bing">Bing</option>
                    <option value="google">Google</option>
                </select>
                <span>右侧：</span>
                <select id="aiSelect">
                    <option value="kimi">Kimi</option>
                    <option value="qwen">通义千问 (Qwen)</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="gpt">ChatGPT</option>
                </select>
            </div>
            <div class="container">
                <div class="panel"><iframe id="leftFrame" src="about:blank"></iframe></div>
                <div class="panel"><iframe id="rightFrame" src="about:blank"></iframe></div>
            </div>
        `;

        // 绑定事件
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const engineSelect = document.getElementById('engineSelect');
        const aiSelect = document.getElementById('aiSelect');
        const leftFrame = document.getElementById('leftFrame');
        const rightFrame = document.getElementById('rightFrame');

        searchInput.focus();

        function performSearch() {
            const query = searchInput.value.trim();
            if (!query) return;

            // 👇 更新页面标题为搜索内容
            document.title = query;

            const q = encodeURIComponent(query);
            let leftUrl = '';
            switch (engineSelect.value) {
                case 'google': leftUrl = `https://www.google.com/search?q=${q}`; break;
                default: leftUrl = `https://www.bing.com/search?q=${q}`;
            }

            let rightUrl = 'about:blank';
            const ai = aiSelect.value;
            if (ai === 'qwen') {
                rightUrl = `https://qwen.ai/?q=${q}`;
            } else if (ai === 'kimi') {
                rightUrl = `https://www.kimi.com/?q=${q}`;
            } else if (ai === 'deepseek') {
                alert('请在新标签页中向 DeepSeek 提问：' + query);
                window.open('https://chat.deepseek.com/', '_blank');
            } else if (ai === 'gpt') {
                alert('请在新标签页中向 ChatGPT 提问：' + query);
                window.open('https://chat.openai.com/', '_blank');
            }

            leftFrame.src = leftUrl;
            rightFrame.src = rightUrl;
        }

        searchBtn.onclick = performSearch;
        searchInput.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
    }

    // 额外防护：移除可能动态插入的“辅助模式”元素
    const observer = new MutationObserver((mutations) => {
        for (const mut of mutations) {
            for (const node of mut.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 移除包含“辅助模式”的元素
                    if (node.textContent && /辅助模式|无障碍|compatibility/i.test(node.textContent)) {
                        node.remove();
                    }
                    // 或者根据常见 class/id 移除
                    if (node.classList && (node.classList.contains('assist-mode') || node.id === 'assistTip')) {
                        node.remove();
                    }
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
