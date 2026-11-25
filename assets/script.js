/* ============================================================
 * Desktop · 我的桌面 — 交互逻辑
 * 纯静态、无构建。所有配置集中在 CONFIG，方便自行增删。
 * ============================================================ */
(function () {
    'use strict';

    // ---------- 配置（集中放在 assets/config.js，增删网站只需改那里） ----------
    const CFG = window.DESKTOP_CONFIG || {};
    const SITES = CFG.sites || [];
    const SEARCH_ENGINES = CFG.searchEngines || {};
    const WALLPAPER_SOURCES = CFG.wallpaperSources || {};
    const WALLPAPER_CDNS = CFG.wallpaperCdns || {};

    // ---------- 存储辅助（隐私模式下 localStorage 可能抛错） ----------
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    };

    const $ = id => document.getElementById(id);
    const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
    const pad = n => String(n).padStart(2, '0');
    // 统一写文本：元素不存在时静默跳过，避免模块里反复判空
    function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }
    // 统一 fetch JSON：非 2xx 视为失败，供天气/统计复用
    function fetchJson(url, options) {
        return fetch(url, options).then(r => {
            if (!r.ok) throw new Error(String(r.status));
            return r.json();
        });
    }
    // 生成带随机参数的 URL，避免图片 API 缓存（壁纸/封面共用逻辑）
    function withBust(url) {
        const sep = url.indexOf('?') === -1 ? '?' : '&';
        return url + sep + 't=' + Date.now() + '&r=' + Math.random().toString(36).slice(2);
    }

    // 顶层下拉：只有统一设置面板；调色盘作为面板内子视图
    // 全局「点击空白处关闭面板」只注册一次（此前在壁纸/主题里各注册了三次）
    const DROPDOWN_IDS = ['settingsPanel'];
    function closeDropdowns(except) {
        DROPDOWN_IDS.forEach(id => {
            const el = $(id);
            if (el && id !== except) el.classList.add('hidden');
        });
    }
    document.addEventListener('click', function () { closeDropdowns(); });
    // 设置面板开关
    function initSettingsPanel() {
        const btn = $('settingsBtn'), panel = $('settingsPanel'), close = $('settingsClose');
        if (!btn || !panel) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const willOpen = panel.classList.contains('hidden');
            if (willOpen) {
                closeDropdowns('settingsPanel');
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
                // 关闭时若在调色盘子视图，回到主面板，避免下次打开停留在子视图
                const body = panel.querySelector('.settings-body');
                const picker = $('colorPicker');
                if (body) body.classList.remove('hidden');
                if (picker) picker.classList.add('hidden');
            }
        });
        if (close) close.addEventListener('click', function (e) {
            e.stopPropagation();
            panel.classList.add('hidden');
        });
        panel.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    /* ============================================================
     * 1. 网站 dock 渲染
     * ============================================================ */
    function renderSites() {
        const dock = $('siteDock');
        if (!dock) return;
        const frag = document.createDocumentFragment();
        SITES.forEach(site => {
            const a = document.createElement('a');
            a.href = site.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'site-card';
            a.title = site.title + (site.desc ? ' - ' + site.desc : '');

            const iconWrap = document.createElement('div');
            iconWrap.className = 'site-icon';
            if (site.img) {
                const img = document.createElement('img');
                img.className = 'site-img';
                img.src = site.img;
                img.alt = site.title;
                iconWrap.appendChild(img);
            } else if (site.icon) {
                const ic = document.createElement('iconify-icon');
                ic.setAttribute('icon', site.icon);
                ic.setAttribute('width', '24');
                ic.setAttribute('height', '24');
                iconWrap.appendChild(ic);
            } else {
                const letter = document.createElement('span');
                letter.className = 'fallback-letter';
                letter.textContent = site.title.charAt(0).toUpperCase();
                iconWrap.appendChild(letter);
            }
            a.appendChild(iconWrap);

            const title = document.createElement('div');
            title.className = 'site-title';
            title.textContent = site.title;
            a.appendChild(title);

            if (site.desc) {
                const desc = document.createElement('div');
                desc.className = 'site-desc';
                desc.textContent = site.desc;
                a.appendChild(desc);
            }
            frag.appendChild(a);
        });
        dock.appendChild(frag);
    }

    /* ============================================================
     * 2. 组合时钟：模拟表盘平滑扫秒 + 数字时钟（12/24 小时切换）
     * ============================================================ */
    const clock = (function () {
        let hour12 = store.get('clock-hour12', '0') === '1';
        const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
        // 元素引用只查一次；农历日期/节日一天才变一次，缓存后避免每帧重算
        const el = {
            time: $('clockTime'), ampm: $('clockAmPm'), greet: $('clockGreet'),
            date: $('clockDate'), week: $('clockWeek'), lunar: $('clockLunar'), festival: $('clockFestival'),
            sec: $('handSecond'), min: $('handMinute'), hour: $('handHour')
        };
        let lastSecond = -1, lastDayKey = '';
        const dayKey = now => now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();

        function buildTicks() {
            const wrap = $('dialTicks');
            const dial = $('clockDial');
            if (!wrap) return;
            wrap.innerHTML = '';
            // 刻度半径随表盘尺寸自适应（桌面 196px / 移动 172px）
            const radius = dial ? Math.round(dial.clientWidth / 2) - 8 : 90;
            for (let i = 0; i < 60; i++) {
                const t = document.createElement('div');
                const major = i % 5 === 0;
                t.className = 'dial-tick' + (major ? ' major' : '');
                t.style.transform = 'rotate(' + (i * 6) + 'deg) translateY(-' + radius + 'px)';
                if (!major) { t.style.height = '5px'; t.style.opacity = '0.45'; t.style.marginLeft = '0'; t.style.width = '1px'; }
                wrap.appendChild(t);
            }
        }

        // 统一的节日/节气辅助（lunar-javascript 正确 API：getFestivals() 复数，返回数组）
        function lunarFestivals(y, m, d) {
            const solar = Solar.fromYmd(y, m, d);
            const lunar = solar.getLunar();
            const list = [].concat(solar.getFestivals() || [], lunar.getFestivals() || []);
            const jieqi = lunar.getJieQi() || '';
            if (jieqi) list.push(jieqi);
            return { lunar: lunar, list: list };
        }

        function lunarParts(now) {
            // 返回 { lunar, festival }：农历日期与节日/节气分开显示（左侧公历、右侧农历）
            try {
                if (typeof Solar === 'undefined') return { lunar: '', festival: '' };
                const r = lunarFestivals(now.getFullYear(), now.getMonth() + 1, now.getDate());
                return {
                    lunar: r.lunar.getMonthInChinese() + '月' + r.lunar.getDayInChinese(),
                    festival: r.list.length ? r.list.join('、') : '—'
                };
            } catch (e) { return { lunar: '', festival: '' }; }
        }

        function greeting(h) {
            if (h < 5) return '夜深了';
            if (h < 9) return '早上好';
            if (h < 12) return '上午好';
            if (h < 14) return '中午好';
            if (h < 18) return '下午好';
            if (h < 22) return '晚上好';
            return '夜深了';
        }

        // 每秒更新的数字时钟与问候语
        function renderTime(now) {
            let h = now.getHours();
            let ampm = '';
            if (hour12) {
                ampm = h < 12 ? 'AM' : 'PM';
                h = h % 12 || 12;
            }
            if (el.time) el.time.textContent = pad(h) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
            if (el.ampm) el.ampm.textContent = ampm;
            if (el.greet) el.greet.textContent = greeting(now.getHours());
        }

        // 每天更新一次的日期与农历（Solar 计算较重，不能放进每帧循环）
        function renderDate(now) {
            if (el.date) el.date.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
            if (el.week) el.week.textContent = '星期' + WEEK[now.getDay()];
            if (el.lunar || el.festival) {
                const parts = lunarParts(now);
                if (el.lunar) el.lunar.textContent = parts.lunar;
                if (el.festival) el.festival.textContent = parts.festival;
            }
        }

        function tick() {
            const now = new Date();
            // 指针平滑扫秒：每帧更新（唯一需要 60fps 的部分）
            const s = now.getSeconds() + now.getMilliseconds() / 1000;
            const m = now.getMinutes() + s / 60;
            const h = (now.getHours() % 12) + m / 60;
            if (el.sec) el.sec.style.transform = 'rotate(' + (s * 6) + 'deg)';
            if (el.min) el.min.style.transform = 'rotate(' + (m * 6) + 'deg)';
            if (el.hour) el.hour.style.transform = 'rotate(' + (h * 30) + 'deg)';
            // 文本只在秒变化时更新；日期/农历只在跨天时更新，大幅降低开销
            if (now.getSeconds() !== lastSecond) {
                renderTime(now);
                lastSecond = now.getSeconds();
                const key = dayKey(now);
                if (key !== lastDayKey) { renderDate(now); lastDayKey = key; }
            }
            requestAnimationFrame(tick);
        }

        function bindToggle() {
            if (!el.time) return;
            el.time.addEventListener('click', function () {
                hour12 = !hour12;
                store.set('clock-hour12', hour12 ? '1' : '0');
                renderTime(new Date());
            });
        }

        return function init() {
            buildTicks();
            bindToggle();
            tick();
        };
    })();

    /* ============================================================
     * 3. 搜索框（可切换搜索引擎，默认 Google，记忆选择）
     * ============================================================ */
    function initSearch() {
        let engine = store.get('search-engine', 'google');
        if (!SEARCH_ENGINES[engine]) engine = 'google';

        const input = $('searchInput');
        const dropdown = $('engineDropdown');
        const engineIcon = $('engineIcon');
        const engineOptions = $$('.engine-option');

        function applyEngine(key) {
            engine = key;
            store.set('search-engine', key);
            if (engineIcon) engineIcon.setAttribute('icon', SEARCH_ENGINES[key].icon);
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            if (input) input.placeholder = '使用 ' + label + ' 搜索，或直接按回车……';
            engineOptions.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-engine') === key));
        }

        function doSearch() {
            const q = input ? input.value.trim() : '';
            if (!q) { if (input) input.focus(); return; }
            window.open(SEARCH_ENGINES[engine].url + encodeURIComponent(q), '_blank', 'noopener');
        }

        const btn = $('engineBtn');
        if (btn) btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (dropdown) dropdown.classList.toggle('hidden');
        });

        engineOptions.forEach(option => {
            option.addEventListener('click', function (e) {
                e.stopPropagation();
                applyEngine(this.getAttribute('data-engine'));
                if (dropdown) dropdown.classList.add('hidden');
                if (input) input.focus();
            });
        });

        document.addEventListener('click', function () {
            if (dropdown) dropdown.classList.add('hidden');
        });

        const searchBtn = $('searchBtn');
        if (searchBtn) searchBtn.addEventListener('click', doSearch);
        if (input) input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') doSearch();
        });

        applyEngine(engine);
    }

    /* ============================================================
     * 4. 随机壁纸（可切换图源 + 手动刷新，记忆选择）
     * ============================================================ */
    const wallpaper = (function () {
        let source = store.get('wallpaper-source', 'dmoe');
        if (!WALLPAPER_SOURCES[source]) source = 'dmoe';
        // 自建图源返回内容类型：image（按屏幕横竖）/ acg（动图）/ video（视频）
        let media = store.get('wallpaper-media', 'image');
        if (['image', 'acg', 'video'].indexOf(media) === -1) media = 'image';
        // 自建图源 CDN：cf / eo（访问方式相同，仅域名不同），默认 eo
        let cdn = store.get('wallpaper-cdn', 'eo');
        if (!WALLPAPER_CDNS[cdn]) cdn = 'cf';
        // 自定义图源 API（用户在菜单里输入，存 localStorage）
        let customApi = store.get('wallpaper-custom-api', '');
        // 自动换背景：开关 + 间隔（秒），设置持久化到 localStorage
        let autoEnabled = store.get('wallpaper-auto-enabled', '0') === '1';
        let autoInterval = parseInt(store.get('wallpaper-auto-interval', '60'), 10);
        if (isNaN(autoInterval) || autoInterval < 5) autoInterval = 60;
        let autoTimer = null;

        // 按屏幕宽高比选横屏/竖屏接口
        function orientation() {
            return window.innerWidth / window.innerHeight >= 1 ? 'landscape' : 'portrait';
        }
        // Cloudflare Pages 函数接口：cf/eo 两条 CDN 路径完全一致
        function apiPath(base, mode) {
            const path = media === 'image' ? orientation() : media; // image → landscape/portrait
            return base + path;
        }
        // 虚拟主机 PHP 接口：api.php?path=xxx&cdn=cf|eo（别名同样可搭配 cdn）
        function phpPath() {
            const path = media === 'image' ? orientation() : media;
            // 默认 eo 可省略，但显式带上更清晰、也便于切换后立即生效
            return WALLPAPER_SOURCES.php.url + path + '&cdn=' + cdn;
        }

        function buildUrl() {
            // 自定义图源：直接返回图片地址，附加随机参数避免缓存
            if (source === 'custom' && customApi) return withBust(customApi);
            // mixed：在樱花 DMOE 与作者自建图源（PHP）之间随机挑一个
            if (source === 'dmoe') return withBust(WALLPAPER_SOURCES.dmoe.url);
            if (source === 'php') return withBust(phpPath());
            if (source === 'selfhost') return withBust(apiPath(WALLPAPER_CDNS[cdn].base, media));
            // mixed：dmoe 或 php
            if (Math.random() < 0.5) return withBust(WALLPAPER_SOURCES.dmoe.url);
            return withBust(phpPath());
        }

        // 双层交叉淡入淡出：新媒体在备用层准备好后淡入，再交换主/备层
        const layerA = $('wallpaper'), layerB = $('wallpaperFade');
        let front = layerA, back = layerB;
        let loadToken = 0; // 防止手动刷新与定时器并发时相互干扰

        // 移除某一层里的视频元素（切回静态图或换下一个视频时）
        function clearVideo(layer) {
            if (!layer) return;
            $$('video', layer).forEach(v => { try { v.pause(); } catch (e) {} v.remove(); });
        }
        // 淡出层里的暂停播放，避免后台视频持续占用解码资源
        function pauseVideo(layer) {
            if (!layer) return;
            $$('video', layer).forEach(v => { try { v.pause(); } catch (e) {} });
        }

        function fadeIn(token, done) {
            if (token !== loadToken || !back) { if (done) done(); return; }
            back.style.opacity = '0';
            back.classList.add('loaded');
            setTimeout(function () { if (token === loadToken) back.style.opacity = '1'; }, 50);
            // 淡入完成后隐藏旧前层并交换；旧层若是视频则暂停
            setTimeout(function () {
                if (token !== loadToken) return;
                if (front) {
                    front.style.opacity = '0';
                    front.classList.remove('loaded');
                    pauseVideo(front);
                }
                const tmp = front; front = back; back = tmp;
                if (done) done();
            }, 900);
        }

        function load() {
            const refreshBtn = $('refreshBgBtn');
            const token = ++loadToken;
            if (refreshBtn) refreshBtn.classList.add('loading');
            const url = buildUrl();
            let settled = false;
            let videoTried = false;
            let fallbackTimer = null;
            const stopLoading = () => { if (refreshBtn && token === loadToken) refreshBtn.classList.remove('loading'); };

            // 把已准备好的媒体放到备用层并淡入。kind=image|video
            function present(kind, videoEl) {
                if (settled || token !== loadToken || !back) return;
                settled = true;
                clearTimeout(fallbackTimer);
                clearVideo(back);
                if (kind === 'video') {
                    // 视频：铺满容器，静音自动循环，不显示任何播放控件
                    back.style.backgroundImage = '';
                    back.appendChild(videoEl);
                    const p = videoEl.play();
                    if (p && p.catch) p.catch(function () {});
                } else {
                    // 图片：GIF / APNG / 动态 WebP 由浏览器原生循环播放，直接作为背景
                    back.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
                }
                back.dataset.media = kind;
                fadeIn(token, stopLoading);
            }

            // 图片解码失败 → 视为视频（API 常返回无扩展名的 mp4/webm）
            function tryVideo() {
                if (settled || videoTried || token !== loadToken || !back) return;
                videoTried = true;
                clearTimeout(fallbackTimer);
                clearVideo(back);
                back.style.backgroundImage = '';
                const video = document.createElement('video');
                video.className = 'wallpaper-video';
                video.autoplay = true;
                video.loop = true;
                video.muted = true;                   // 静音以满足自动播放策略
                video.playsInline = true;             // iOS 不强制全屏
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');
                video.preload = 'auto';
                video.setAttribute('aria-hidden', 'true');
                // 故意不设置 controls：背景视频不提供播放组件
                let videoSettled = false;
                video.addEventListener('loadeddata', function () {
                    if (videoSettled) return;
                    videoSettled = true;
                    present('video', video);
                }, { once: true });
                video.addEventListener('error', function () {
                    if (videoSettled) return;
                    videoSettled = true;
                    // 图片和视频都失败：保留上一张壁纸，只取消加载动画
                    clearVideo(back);
                    settled = true;
                    clearTimeout(fallbackTimer);
                    stopLoading();
                }, { once: true });
                video.src = url;
                back.appendChild(video);
            }

            // 先按图片尝试；加载中若迟迟无响应（慢速视频流）则兜底转视频探测
            const img = new Image();
            img.onload = function () { present('image'); };
            img.onerror = function () { tryVideo(); };
            img.src = url;
            fallbackTimer = setTimeout(function () { if (!settled) tryVideo(); }, 12000);
        }

        // ---- 自动换背景 ----
        function updateAutoUI() {
            const toggle = $('autoWpEnabled');
            const input = $('autoWpInterval');
            const status = $('autoWpStatus');
            if (toggle) toggle.checked = autoEnabled;
            if (input) input.value = autoInterval;
            $$('.auto-wp-preset').forEach(b => {
                b.classList.toggle('active', parseInt(b.getAttribute('data-sec'), 10) === autoInterval);
            });
            if (status) {
                const min = Math.floor(autoInterval / 60), sec = autoInterval % 60;
                const label = autoInterval >= 60
                    ? (min + '分' + (sec ? sec + '秒' : ''))
                    : (autoInterval + '秒');
                status.textContent = autoEnabled ? '已开启 · 每 ' + label + ' 更换' : '已关闭';
            }
        }

        function scheduleAuto() {
            if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
            if (!autoEnabled) return;
            autoTimer = setInterval(load, autoInterval * 1000);
        }

        function setAutoEnabled(on) {
            autoEnabled = !!on;
            store.set('wallpaper-auto-enabled', autoEnabled ? '1' : '0');
            updateAutoUI();
            scheduleAuto();
        }

        function setAutoInterval(sec) {
            sec = parseInt(sec, 10);
            if (isNaN(sec) || sec < 5) sec = 60;
            autoInterval = sec;
            store.set('wallpaper-auto-interval', String(autoInterval));
            updateAutoUI();
            scheduleAuto(); // 间隔变化时重设计时器
        }

        function initAuto() {
            updateAutoUI();
            scheduleAuto();

            const toggle = $('autoWpEnabled');
            if (toggle) toggle.addEventListener('change', function () { setAutoEnabled(this.checked); });

            $$('.auto-wp-preset').forEach(b => {
                b.addEventListener('click', function () {
                    setAutoInterval(parseInt(this.getAttribute('data-sec'), 10));
                });
            });

            const input = $('autoWpInterval');
            if (input) input.addEventListener('change', function () { setAutoInterval(this.value); });
            // 自定义步进按钮（主题风格）
            const up = $('intervalUp'), down = $('intervalDown');
            if (up) up.addEventListener('click', function (e) {
                e.stopPropagation();
                setAutoInterval(autoInterval + 5);
            });
            if (down) down.addEventListener('click', function (e) {
                e.stopPropagation();
                setAutoInterval(Math.max(5, autoInterval - 5));
            });
        }

        function applySourceMenu() {
            $$('.wp-source-option').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-source') === source);
            });
            // 两种自建图源都显示内容类型与 CDN 选项（cf/eo 访问方式相同）
            const mediaBox = $('wpMediaOptions'), cdnBox = $('wpCdnOptions');
            const isApiSource = source === 'selfhost' || source === 'php';
            if (mediaBox) mediaBox.classList.toggle('hidden', !isApiSource);
            if (cdnBox) cdnBox.classList.toggle('hidden', !isApiSource);
            $$('.wp-seg-btn[data-media]').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-media') === media);
            });
            $$('.wp-seg-btn[data-cdn]').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-cdn') === cdn);
            });
            // 选中自定义时展开 API 输入框并回填已保存地址
            const box = $('wpCustomApi');
            const input = $('wpCustomApiInput');
            if (box) box.classList.toggle('hidden', source !== 'custom');
            if (input && source === 'custom') input.value = customApi;
        }

        function init() {
            applySourceMenu();
            initAuto();
            load();

            const refreshBtn = $('refreshBgBtn');
            if (refreshBtn) refreshBtn.addEventListener('click', load);

            $$('.wp-source-option').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const picked = this.getAttribute('data-source');
                    // 选自定义但还没填 API 时，保持菜单打开并聚焦输入框
                    if (picked === 'custom' && !customApi) {
                        source = 'custom';
                        store.set('wallpaper-source', source);
                        applySourceMenu();
                        const input = $('wpCustomApiInput');
                        if (input) input.focus();
                        return;
                    }
                    source = picked;
                    store.set('wallpaper-source', source);
                    applySourceMenu();
                    load();
                });
            });

            // 作者自建图源：内容类型（图片 / ACG 动图 / 视频）
            $$('.wp-seg-btn[data-media]').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    media = this.getAttribute('data-media');
                    store.set('wallpaper-media', media);
                    applySourceMenu();
                    load();
                });
            });
            // 作者自建随机图：CDN 选择（cf / eo，访问方式相同）
            $$('.wp-seg-btn[data-cdn]').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    cdn = this.getAttribute('data-cdn');
                    store.set('wallpaper-cdn', cdn);
                    applySourceMenu();
                    load();
                });
            });

            // 自定义图源 API：保存并切换
            const apiInput = $('wpCustomApiInput');
            const apiSave = $('wpCustomApiSave');
            function saveCustomApi() {
                if (!apiInput) return;
                let val = apiInput.value.trim();
                if (!val) {
                    apiInput.placeholder = '请先输入 API 地址';
                    return;
                }
                // 补全协议，避免相对地址无法加载
                if (!/^https?:\/\//i.test(val)) val = 'https://' + val;
                customApi = val;
                store.set('wallpaper-custom-api', customApi);
                source = 'custom';
                store.set('wallpaper-source', source);
                applySourceMenu();
                load();
            }
            if (apiSave) apiSave.addEventListener('click', function (e) {
                e.stopPropagation();
                saveCustomApi();
            });
            if (apiInput) {
                apiInput.addEventListener('click', e => e.stopPropagation());
                apiInput.addEventListener('keydown', function (e) {
                    e.stopPropagation();
                    if (e.key === 'Enter') saveCustomApi();
                });
            }
            const apiBox = $('wpCustomApi');
            if (apiBox) apiBox.addEventListener('click', e => e.stopPropagation());
        }

        return { init: init };
    })();

    /* ============================================================
     * 5. 天气（Open-Meteo，免费无需 Key）
     *    固定两地：① 成都郫都（主要，优先展示）② 四川西充
     * ============================================================ */
    const weather = (function () {
        // 城市：默认来自 config，用户在设置中自定义后存 localStorage（键 weather-locations）
        const DEFAULT_LOCATIONS = (CFG.weatherLocations || []).map(l => ({ ...l }));
        const LOC_STORE_KEY = 'weather-locations';
        function loadLocations() {
            try {
                const raw = JSON.parse(localStorage.getItem(LOC_STORE_KEY) || 'null');
                if (Array.isArray(raw) && raw.length === DEFAULT_LOCATIONS.length &&
                    raw.every(l => l && typeof l.lat === 'number' && typeof l.lon === 'number' && l.name)) {
                    return raw;
                }
            } catch (e) {}
            return DEFAULT_LOCATIONS.map(l => ({ ...l }));
        }
        let LOCATIONS = loadLocations();
        const CODE_MAP = {
            0: ['晴', 'noto:sun'], 1: ['大致晴朗', 'noto:sun-behind-small-cloud'],
            2: ['局部多云', 'noto:sun-behind-small-cloud'], 3: ['阴', 'noto:cloud'],
            45: ['雾', 'noto:fog'], 48: ['雾凇', 'noto:fog'],
            51: ['小毛毛雨', 'noto:cloud-with-rain'], 53: ['毛毛雨', 'noto:cloud-with-rain'],
            55: ['大毛毛雨', 'noto:cloud-with-rain'], 56: ['冻毛毛雨', 'noto:cloud-with-rain'], 57: ['强冻毛毛雨', 'noto:cloud-with-rain'],
            61: ['小雨', 'noto:cloud-with-rain'], 63: ['中雨', 'noto:cloud-with-rain'], 65: ['大雨', 'noto:cloud-with-rain'],
            66: ['冻雨', 'noto:cloud-with-rain'], 67: ['强冻雨', 'noto:cloud-with-rain'],
            71: ['小雪', 'noto:cloud-with-snow'], 73: ['中雪', 'noto:cloud-with-snow'], 75: ['大雪', 'noto:cloud-with-snow'], 77: ['雪粒', 'noto:cloud-with-snow'],
            80: ['阵雨', 'noto:cloud-with-rain'], 81: ['强阵雨', 'noto:cloud-with-rain'], 82: ['暴雨', 'noto:cloud-with-rain'],
            85: ['阵雪', 'noto:cloud-with-snow'], 86: ['强阵雪', 'noto:cloud-with-snow'],
            95: ['雷雨', 'noto:cloud-with-lightning'], 96: ['雷雨伴冰雹', 'noto:cloud-with-lightning-and-rain'], 99: ['强雷雨伴冰雹', 'noto:cloud-with-lightning-and-rain']
        };
        function codeInfo(c) { return CODE_MAP[c] || ['未知', 'noto:cloud']; }

        function aqiInfo(aqi) {
            if (aqi == null) return '空气 —';
            if (aqi <= 50) return '空气 优 ' + Math.round(aqi);
            if (aqi <= 100) return '空气 良 ' + Math.round(aqi);
            if (aqi <= 150) return '空气 轻度 ' + Math.round(aqi);
            if (aqi <= 200) return '空气 中度 ' + Math.round(aqi);
            if (aqi <= 300) return '空气 重度 ' + Math.round(aqi);
            return '空气 严重 ' + Math.round(aqi);
        }

        function fetchWeather(loc) {
            const k = loc.key;
            const wxUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat + '&longitude=' + loc.lon +
                '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1';
            const aqUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + loc.lat + '&longitude=' + loc.lon + '&current=us_aqi&timezone=auto';

            setText('wxCity' + k, loc.name);

            fetchJson(wxUrl).then(j => {
                const cur = j && j.current;
                if (cur) {
                    const info = codeInfo(cur.weather_code);
                    setText('wxTemp' + k, Math.round(cur.temperature_2m));
                    setText('wxDesc' + k, info[0]);
                    const iconEl = document.querySelector('#wxIcon' + k + ' iconify-icon');
                    if (iconEl) iconEl.setAttribute('icon', info[1]);
                }
                if (j && j.daily) {
                    setText('wxRange' + k, Math.round(j.daily.temperature_2m_min[0]) + '° / ' + Math.round(j.daily.temperature_2m_max[0]) + '°');
                }
            }).catch(() => { setText('wxDesc' + k, '天气获取失败'); });

            fetchJson(aqUrl).then(j => {
                setText('wxAqi' + k, aqiInfo(j && j.current ? j.current.us_aqi : null));
            }).catch(() => {});
        }

        function init() {
            LOCATIONS.forEach(fetchWeather);
            // 30 分钟刷新一次
            setInterval(function () { LOCATIONS.forEach(fetchWeather); }, 30 * 60 * 1000);
        }

        // ---------- 天气城市自定义 ----------
        function updateCityLabels() {
            LOCATIONS.forEach(function (loc, i) {
                setText('wxCity' + i, loc.name);
                const cur = $('wxCityCurrent' + i);
                if (cur) cur.textContent = '当前：' + loc.name + '（' + Number(loc.lat).toFixed(2) + ', ' + Number(loc.lon).toFixed(2) + '）';
            });
        }
        function applyLocations(locs) {
            LOCATIONS = locs;
            store.set(LOC_STORE_KEY, JSON.stringify(LOCATIONS));
            updateCityLabels();
            LOCATIONS.forEach(fetchWeather); // 立即用新城市刷新
        }
        // Open-Meteo geocoding：按名称搜索城市（中文支持）
        function searchCity(name) {
            const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
                encodeURIComponent(name) + '&count=6&language=zh&format=json';
            return fetchJson(url);
        }
        function initCitySettings() {
            updateCityLabels();
            $$('.wx-city-search').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const slot = parseInt(this.getAttribute('data-slot'), 10);
                    const input = $('wxCityInput' + slot);
                    const box = $('wxCityResults' + slot);
                    if (!input || !box) return;
                    const name = input.value.trim();
                    if (!name) { box.textContent = '请输入城市名'; box.classList.remove('hidden'); return; }
                    box.textContent = '搜索中…'; box.classList.remove('hidden');
                    searchCity(name).then(function (j) {
                        const list = (j && j.results) || [];
                        box.innerHTML = '';
                        if (!list.length) { box.textContent = '未找到，换个关键词试试'; return; }
                        list.forEach(function (r) {
                            const b = document.createElement('button');
                            b.type = 'button';
                            b.className = 'wx-city-result';
                            const region = [r.admin1, r.country].filter(Boolean).join(' · ');
                            b.textContent = (r.name || '') + (region ? '（' + region + '）' : '');
                            b.addEventListener('click', function (ev) {
                                ev.stopPropagation();
                                const locs = LOCATIONS.map(l => ({ ...l }));
                                locs[slot] = {
                                    key: String(slot),
                                    name: r.name || name,
                                    lat: r.latitude,
                                    lon: r.longitude
                                };
                                applyLocations(locs);
                                box.classList.add('hidden');
                            });
                            box.appendChild(b);
                        });
                    }).catch(function () { box.textContent = '搜索失败，请检查网络'; });
                });
            });
            // 输入框回车触发搜索
            $$('.wx-city-input').forEach(function (input) {
                input.addEventListener('keydown', function (e) {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                        const slot = input.id.replace('wxCityInput', '');
                        const btn = document.querySelector('.wx-city-search[data-slot="' + slot + '"]');
                        if (btn) btn.click();
                    }
                });
                input.addEventListener('click', e => e.stopPropagation());
            });
            const reset = $('wxCityReset');
            if (reset) reset.addEventListener('click', function (e) {
                e.stopPropagation();
                applyLocations(DEFAULT_LOCATIONS.map(l => ({ ...l })));
            });
        }
        return { init: init, initCitySettings: initCitySettings };
    })();

    /* ============================================================
     * 6. 日历（可翻月，含农历/节气/节日高亮，回到今天）
     * ============================================================ */
    const calendar = (function () {
        let viewYear, viewMonth; // viewMonth: 0-11
        const today = new Date();
        viewYear = today.getFullYear();
        viewMonth = today.getMonth();

        // 一次 Solar 计算同时得到农历文案与是否节日（原来每个格子算两遍）
        function dayInfo(y, m, d) {
            if (typeof Solar === 'undefined') return { text: '', festival: false };
            try {
                const solar = Solar.fromYmd(y, m, d);
                const lunar = solar.getLunar();
                const sf = solar.getFestivals() || [];
                const lf = lunar.getFestivals() || [];
                const jq = lunar.getJieQi() || '';
                return {
                    festival: !!(sf.length || lf.length || jq),
                    // 公历节日 > 农历节日 > 节气 > 农历日
                    text: sf.length ? sf[0]
                        : lf.length ? lf[0]
                        : jq ? jq
                        : (lunar.getDayInChinese() === '初一' ? lunar.getMonthInChinese() + '月' : lunar.getDayInChinese())
                };
            } catch (e) { return { text: '', festival: false }; }
        }

        function isoWeek(date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        function render() {
            $('calTitle').textContent = viewYear + '年' + (viewMonth + 1) + '月';
            const midMonth = new Date(viewYear, viewMonth, 15);
            $('calWeek').textContent = '第 ' + isoWeek(midMonth) + ' 周';

            const grid = $('calGrid');
            grid.innerHTML = '';
            const first = new Date(viewYear, viewMonth, 1);
            // 以周一为一周起始：offset 0=周一 ... 6=周日
            const startOffset = (first.getDay() + 6) % 7;
            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
            const daysPrev = new Date(viewYear, viewMonth, 0).getDate();
            const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

            for (let i = 0; i < totalCells; i++) {
                let d, m = viewMonth, y = viewYear, other = false;
                if (i < startOffset) { d = daysPrev - startOffset + 1 + i; m = viewMonth - 1; other = true; }
                else if (i >= startOffset + daysInMonth) { d = i - startOffset - daysInMonth + 1; m = viewMonth + 1; other = true; }
                else { d = i - startOffset + 1; }
                if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }

                const cell = document.createElement('div');
                cell.className = 'cal-cell';
                const dow = new Date(y, m, d).getDay();
                if (other) cell.classList.add('other');
                if (dow === 0 || dow === 6) cell.classList.add('weekend');
                // 单个格子只计算一次农历信息
                const info = other ? null : dayInfo(y, m, d);
                if (info && info.festival) cell.classList.add('festival');
                if (!other && y === today.getFullYear() && m === today.getMonth() && d === today.getDate()) cell.classList.add('today');

                const num = document.createElement('div');
                num.className = 'cal-num';
                num.textContent = d;
                cell.appendChild(num);

                const lunar = document.createElement('div');
                lunar.className = 'cal-lunar';
                lunar.textContent = info ? info.text : '';
                cell.appendChild(lunar);

                grid.appendChild(cell);
            }

            // 页脚：今日农历 + 节气/节日 + 下一个节气
            let footer = '';
            try {
                if (typeof Solar !== 'undefined') {
                    const s = Solar.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate());
                    const lunar = s.getLunar();
                    const sf = s.getFestivals() || [];
                    const lf = lunar.getFestivals() || [];
                    const jieqi = lunar.getJieQi() || '';
                    const fest = [].concat(sf, lf).filter(Boolean).join('、');
                    footer = '农历' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese();
                    if (jieqi) footer += ' · ' + jieqi;
                    if (fest) footer += ' · ' + fest;
                    const next = lunar.getNextJieQi && lunar.getNextJieQi();
                    if (next) {
                        const ns = next.getSolar();
                        footer += ' · 下一个节气：' + next.getName() + '（' + ns.getMonth() + '月' + ns.getDay() + '日）';
                    }
                }
            } catch (e) { footer = ''; }
            $('calFooter').textContent = footer || '—';
        }

        function init() {
            $('calPrevBtn').addEventListener('click', () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } render(); });
            $('calNextBtn').addEventListener('click', () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } render(); });
            $('calTodayBtn').addEventListener('click', () => { viewYear = today.getFullYear(); viewMonth = today.getMonth(); render(); });
            render();
        }
        return { init: init };
    })();

    /* ============================================================
     * 7. 页脚：本站运行时间（去掉备案信息）
     * ============================================================ */
    function initUptime() {
        const el = $('site_uptime');
        if (!el) return;
        const startedAt = CFG.uptimeStart || new Date(2026, 10, 21, 19, 0, 0);
        function render() {
            const diff = Math.max(0, Date.now() - startedAt);
            const days = Math.floor(diff / 86400000);
            const h = pad(Math.floor(diff / 3600000) % 24);
            const m = pad(Math.floor(diff / 60000) % 60);
            const s = pad(Math.floor(diff / 1000) % 60);
            el.textContent = days + '天 ' + h + ':' + m + ':' + s;
        }
        render();
        setInterval(render, 1000);
    }

    /* ============================================================
     * 7.5 访问统计（本地调用 WebViso /api/visit，与 SunPanel 同后端）
     *   - 页面加载计一次 PV/UV
     *   - 每 60 秒用「不带 pv/uv」的请求拉取当前计数刷新显示（不重复计数）
     *   - 页面从后台切回前台时，视为一次新访问，计一次 PV
     *   - 页面卸载前用 sendBeacon 兜底，避免关闭时漏计
     * ============================================================ */
    function initStats() {
        const api = CFG.statsApi;
        if (!api) return;
        let path = location.pathname || '/';
        // file:// 下路径是本地磁盘路径，统一记为首页，避免每台机器各自一份统计
        if (location.protocol === 'file:') path = '/';
        const base = {
            url: path,
            hostname: location.protocol === 'file:' ? 'local-file' : location.hostname,
            referrer: document.referrer || ''
        };
        let lastPV = null, lastUV = null;

        function paint(pv, uv) {
            if (pv != null) { const el = $('page_pv'); if (el) el.textContent = pv; lastPV = pv; }
            if (uv != null) { const el = $('page_uv'); if (el) el.textContent = uv; lastUV = uv; }
        }

        function post(payload) {
            return fetch(api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign({}, base, payload))
            }).then(r => r.json());
        }

        // 计数一次并显示
        function record() {
            return post({ pv: true, uv: true })
                .then(d => { if (d && d.ret === 'OK' && d.data) paint(d.data.pv, d.data.uv); })
                .catch(() => {});
        }

        // 只查询当前计数（不带 pv/uv 标志，后端不会增加计数），用于定时刷新显示
        function refreshDisplay() {
            return post({})
                .then(d => {
                    if (d && d.ret === 'OK' && d.data && d.data.pv != null) paint(d.data.pv, d.data.uv);
                })
                .catch(() => {});
        }

        record();
        const timer = setInterval(refreshDisplay, 60000);

        // 标签页重新可见时视为一次新访问
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) record();
        });
        // 关闭/离开时兜底上报
        window.addEventListener('pagehide', function () {
            try {
                navigator.sendBeacon(api, new Blob([JSON.stringify(Object.assign({}, base, { pv: true, uv: true }))], { type: 'application/json' }));
            } catch (e) {}
        });
        // 清理定时器（单页无需，保留引用以防外部调用）
        window.__statsTimer = timer;
    }

    /* ============================================================
     * 8. 音乐播放器（参考 Firefly 本地播放方案，UI 与本站适配）
     * ============================================================ */
    const music = (function () {
        // 兼容：优先用新的精简配置（musicSongs），否则回退旧格式（musicPlaylist）
        const MUSIC_DIR = CFG.musicDir || 'assets/music/';
        const COVER_DIR = CFG.musicCoverDir || 'assets/music/cover/';
        const COVER_EXTS = ['webp', 'jpg', 'png', 'jpeg'];
        // R2 回退：本地优先，慢/失败时切到公开域名同名文件
        const CDN_BASE = String(CFG.musicCdnBase || '').replace(/\/+$/, '');
        const CDN_TIMEOUT = parseInt(CFG.musicCdnTimeout, 10) || 3000;
        // 本地路径 → R2 URL：assets/music/01-xxx.mp3 → <CDN_BASE>/music/01-xxx.mp3
        function cdnUrl(localPath) {
            if (!CDN_BASE || !localPath) return '';
            return CDN_BASE + '/' + String(localPath).replace(/^\/?assets\//, '');
        }

        // 从文件名解析歌名与歌手：去掉序号，按最后一个 "-" 拆分 "歌名-歌手"
        function parseFileName(file) {
            let stem = String(file || '').replace(/\.[^.]+$/, ''); // 去扩展名
            stem = stem.replace(/^\d+\s*[-_.]?\s*/, '');          // 去开头序号
            const parts = stem.split(/\s+-\s+|\s*[-_]\s*/).filter(Boolean);
            if (parts.length >= 2) return { name: parts[0], artist: parts.slice(1).join(' ') };
            return { name: stem || '未命名', artist: '' };
        }

        // 构建完整曲目：url / cover 自动补全，忽略显式 coverFile 时用同名图片自动探测
        const PLAYLIST = (function () {
            if (CFG.musicSongs && CFG.musicSongs.length) {
                return CFG.musicSongs.map(s => {
                    const parsed = parseFileName(s.file);
                    const base = String(s.file).replace(/\.[^.]+$/, '');
                    // 封面候选分两组：本地静态资源 / R2 远端（同名文件）
                    const localCovers = COVER_EXTS.map(ext => COVER_DIR + base + '.' + ext);
                    const cdnCovers = CDN_BASE ? localCovers.map(cdnUrl) : [];
                    const cover = s.coverFile
                        ? {
                            local: [COVER_DIR + s.coverFile],
                            remote: CDN_BASE ? [cdnUrl(COVER_DIR + s.coverFile)] : []
                        }
                        : { local: localCovers, remote: cdnCovers };
                    return {
                        name: s.name || parsed.name,
                        artist: s.artist || parsed.artist,
                        url: MUSIC_DIR + s.file,
                        cover: cover
                    };
                });
            }
            // 旧格式兼容（url/cover 已是完整路径）
            return (CFG.musicPlaylist || []).map(s => ({ name: s.name, artist: s.artist, url: s.url, cover: s.cover }));
        })();

        /* 封面加载策略
         *  1) 优先本地静态资源（assets/music/cover/…），按 webp→jpg→png→jpeg 依次尝试；
         *  2) 本地 5s 内仍未加载完成（慢速/卡住）→ 放弃本地，改用 R2 远端；
         *  3) 本地明确 404 时立即切 R2，不浪费等待时间。
         * 结果按曲目缓存；并发请求共享同一次探测，避免重复下载。
         */
        const COVER_LOCAL_TIMEOUT = parseInt(CFG.musicCoverTimeout, 10) || 5000;
        const coverCache = {};    // key -> 成功 URL（'' 表示无封面）
        const coverPending = {};  // key -> 等待中的回调队列

        function isRemoteUrl(u) { return /^https?:\/\//i.test(String(u || '')); }

        function resolveCover(song, cb) {
            const c = song.cover;
            if (typeof c === 'string') { cb(c); return; }
            if (!c) { cb(''); return; }

            // 兼容两种结构：{local, remote} 与旧版 {candidates}
            let local = [], remote = [];
            if (Array.isArray(c.local) || Array.isArray(c.remote)) {
                local = c.local || [];
                remote = c.remote || [];
            } else if (Array.isArray(c.candidates)) {
                c.candidates.forEach(u => { (isRemoteUrl(u) ? remote : local).push(u); });
            }
            if (!local.length && !remote.length) { cb(''); return; }

            const key = local[0] || remote[0];
            if (coverCache[key] !== undefined) { cb(coverCache[key]); return; }
            // 同一首曲子并发调用时共享探测结果
            if (coverPending[key]) { coverPending[key].push(cb); return; }
            coverPending[key] = [cb];

            function finish(url) {
                coverCache[key] = url;
                const list = coverPending[key] || [];
                delete coverPending[key];
                list.forEach(fn => { try { fn(url); } catch (e) {} });
            }

            let settled = false;
            let timer = null;
            function done(url) {
                if (settled) return;
                settled = true;
                if (timer) { clearTimeout(timer); timer = null; }
                finish(url);
            }

            // 阶段二：R2 远端
            let ri = 0;
            function tryRemote() {
                if (settled) return;
                if (ri >= remote.length) { done(''); return; }
                const url = remote[ri++];
                const img = new Image();
                img.onload = () => done(url);
                img.onerror = () => { if (!settled) tryRemote(); };
                img.src = url;
            }

            // 阶段一：本地静态资源
            let li = 0;
            function tryLocal() {
                if (settled) return;
                if (li >= local.length) { tryRemote(); return; }
                const url = local[li++];
                const img = new Image();
                img.onload = () => done(url);
                // 本地文件不存在（404）→ 立刻换下一个候选/转 R2，不空等
                img.onerror = () => { if (!settled) tryLocal(); };
                img.src = url;
            }

            if (local.length) {
                // 本地 5s 预算：超时仍未出图 → 切 R2
                timer = setTimeout(() => { if (!settled) tryRemote(); }, COVER_LOCAL_TIMEOUT);
                tryLocal();
            } else {
                tryRemote();
            }
        }

        const MODE_ICON = ['material-symbols:repeat-rounded', 'material-symbols:repeat-one-rounded', 'material-symbols:shuffle-rounded'];
        const MODE_TITLE = ['列表循环', '单曲循环', '随机播放'];

        const audio = new Audio();
        audio.preload = 'none';
        let index = 0;
        let mode = parseInt(store.get('music-mode', '0'), 10) || 0;
        let volume = parseFloat(store.get('music-volume', '0.7'));
        if (isNaN(volume) || volume < 0 || volume > 1) volume = 0.7;
        audio.volume = volume;

        function fmt(sec) {
            if (!sec || isNaN(sec)) return '0:00';
            const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
            return m + ':' + (s < 10 ? '0' : '') + s;
        }

        function renderList() {
            const box = $('mpPlaylist');
            if (!box) return;
            box.innerHTML = '';
            PLAYLIST.forEach((song, i) => {
                const item = document.createElement('button');
                item.className = 'mp-playlist-item' + (i === index ? ' active' : '');
                item.title = song.name + ' - ' + song.artist;
                const num = document.createElement('span');
                num.className = 'mpl-num'; num.textContent = (i + 1);
                const name = document.createElement('span');
                name.className = 'mpl-name';
                name.textContent = song.name;
                if (song.artist) {
                    const artist = document.createElement('span');
                    artist.className = 'mpl-artist';
                    artist.textContent = ' · ' + song.artist;
                    name.appendChild(artist);
                }
                item.appendChild(num); item.appendChild(name);
                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    loadTrack(i, true);
                });
                box.appendChild(item);
            });
        }

        function renderTrack() {
            const song = PLAYLIST[index];
            if (!song) return;
            setText('mpTitle', song.name);
            setText('mpArtist', song.artist);
            const cover = $('mpCover');
            const wrap = $('mpCoverWrap');
            const currentIndex = index;
            resolveCover(song, function (url) {
                if (currentIndex !== index || !url) return; // 已切歌或无封面则跳过
                if (cover) { cover.src = url; cover.classList.add('show'); }
                if (wrap) wrap.classList.add('has-cover');
            });
            // 更新列表高亮
            $$('.mp-playlist-item').forEach((el, i) => {
                el.classList.toggle('active', i === index);
            });
            // Media Session 元数据
            if ('mediaSession' in navigator && window.MediaMetadata) {
                try {
                    const meta = { title: song.name, artist: song.artist, album: 'Desktop Music' };
                    resolveCover(song, function (url) {
                        if (url) meta.artwork = [{ src: new URL(url, location.href).href, sizes: '512x512' }];
                        navigator.mediaSession.metadata = new MediaMetadata(meta);
                    });
                } catch (e) {}
            }
        }

        function updatePlayIcon() {
            const icon = $('mpPlayIcon');
            const wrap = $('mpCoverWrap');
            if (icon) icon.setAttribute('icon', audio.paused ? 'material-symbols:play-arrow-rounded' : 'material-symbols:pause-rounded');
            if (wrap) wrap.classList.toggle('playing', !audio.paused);
        }

        let loadToken = 0; // 防止旧请求的超时/错误回退干扰当前曲目

        function loadTrack(i, autoplay) {
            index = (i + PLAYLIST.length) % PLAYLIST.length;
            const song = PLAYLIST[index];
            const token = ++loadToken;
            const localUrl = song.url;
            const remoteUrl = cdnUrl(localUrl);
            const canFallback = !!remoteUrl;
            let switched = false;
            let timer = null;
            let settled = false;

            renderTrack();
            setText('mpCurTime', '0:00');
            setText('mpDurTime', '0:00');
            const bar = $('mpProgressBar'); if (bar) bar.style.width = '0%';
            const thumb = $('mpProgressThumb'); if (thumb) thumb.style.left = '0%';

            function setSource(src) {
                const el = $('mpSource');
                if (!el) return;
                el.textContent = src === 'cdn' ? 'R2' : (src === 'error' ? '加载失败' : '本地');
                el.className = 'mp-source' + (src === 'cdn' ? ' cdn' : '');
            }
            function cleanup() {
                if (timer) { clearTimeout(timer); timer = null; }
                audio.removeEventListener('loadedmetadata', onReady);
                audio.removeEventListener('canplay', onReady);
                audio.removeEventListener('error', onError);
                audio.removeEventListener('playing', onReady);
            }
            function onReady() {
                if (token !== loadToken || settled) return;
                // 只有真正拿到时长才算就绪（某些浏览器对失败源也会误触发 canplay）
                if (!isFinite(audio.duration) || audio.duration <= 0) return;
                settled = true;
                cleanup();
                setSource(switched ? 'cdn' : 'local');
            }
            function switchToCdn() {
                if (switched || !remoteUrl || token !== loadToken || settled) return;
                switched = true;
                setSource('cdn');
                const resume = audio.currentTime;
                cleanup();
                audio.src = remoteUrl;
                audio.load();
                audio.addEventListener('loadedmetadata', function resumeOnce() {
                    audio.removeEventListener('loadedmetadata', resumeOnce);
                    if (resume > 0 && isFinite(audio.duration)) audio.currentTime = Math.min(resume, audio.duration);
                });
                audio.addEventListener('loadedmetadata', onReady);
                audio.addEventListener('canplay', onReady);
                audio.addEventListener('error', onError);
                if (autoplay) audio.play().catch(() => {});
            }
            function onError() {
                if (token !== loadToken || settled) return;
                if (!switched && canFallback) switchToCdn();
                else { settled = true; cleanup(); setSource('error'); }
            }

            cleanup();
            audio.addEventListener('loadedmetadata', onReady);
            audio.addEventListener('canplay', onReady);
            audio.addEventListener('playing', onReady);
            audio.addEventListener('error', onError);
            audio.src = localUrl;
            setSource('local');
            audio.load();
            if (autoplay) audio.play().catch(() => {});
            // 本地加载超时 → 切 R2
            if (canFallback) timer = setTimeout(switchToCdn, CDN_TIMEOUT);
        }

        function togglePlay() {
            if (!audio.src && PLAYLIST.length) { loadTrack(index, true); return; }
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
        }

        function next(auto) {
            if (mode === 1 && auto) { audio.currentTime = 0; audio.play().catch(() => {}); return; }
            let i;
            if (mode === 2) { do { i = Math.floor(Math.random() * PLAYLIST.length); } while (i === index && PLAYLIST.length > 1); }
            else i = index + 1;
            loadTrack(i, true);
        }

        function prev() {
            loadTrack(mode === 2 ? Math.floor(Math.random() * PLAYLIST.length) : index - 1, true);
        }

        function applyVolume(v) {
            volume = Math.max(0, Math.min(1, v));
            audio.volume = volume;
            store.set('music-volume', String(volume));
            const slider = $('mpVolume'); if (slider) slider.value = Math.round(volume * 100);
            const icon = $('mpVolIcon');
            if (icon) icon.setAttribute('icon', volume === 0 ? 'material-symbols:volume-off-rounded' : 'material-symbols:volume-up-rounded');
        }

        function applyMode() {
            const btn = $('mpMode');
            if (btn) {
                // 图标在按钮内部的 <iconify-icon> 上，必须先找到它再改 icon 属性
                const ic = btn.querySelector('iconify-icon');
                if (ic) ic.setAttribute('icon', MODE_ICON[mode]);
                btn.title = '播放模式：' + MODE_TITLE[mode];
                btn.classList.toggle('on', mode !== 0);
            }
            store.set('music-mode', String(mode));
        }

        // 媒体会话控制（系统媒体键 / 锁屏）
        function setupMediaSession() {
            if (!('mediaSession' in navigator)) return;
            const handlers = {
                play: () => togglePlay(),
                pause: () => audio.pause(),
                previoustrack: () => prev(),
                nexttrack: () => next(false),
                stop: () => { audio.pause(); audio.currentTime = 0; },
                seekto: (d) => { if (d && d.seekTime != null && audio.duration) audio.currentTime = Math.max(0, Math.min(d.seekTime, audio.duration)); }
            };
            Object.keys(handlers).forEach(name => {
                try { navigator.mediaSession.setActionHandler(name, handlers[name]); } catch (e) {}
            });
        }

        function init() {
            if (!PLAYLIST.length) return;
            renderList();
            renderTrack();
            applyVolume(volume);
            applyMode();
            setupMediaSession();

            const playBtn = $('mpPlay');
            if (playBtn) playBtn.addEventListener('click', togglePlay);
            const prevBtn = $('mpPrev'); if (prevBtn) prevBtn.addEventListener('click', prev);
            const nextBtn = $('mpNext'); if (nextBtn) nextBtn.addEventListener('click', () => next(false));
            const modeBtn = $('mpMode'); if (modeBtn) modeBtn.addEventListener('click', () => { mode = (mode + 1) % 3; applyMode(); });
            const muteBtn = $('mpMute'); if (muteBtn) muteBtn.addEventListener('click', () => { applyVolume(audio.volume > 0 ? 0 : (volume || 0.7)); });
            const slider = $('mpVolume'); if (slider) slider.addEventListener('input', function () { applyVolume(this.value / 100); });

            const listBtn = $('mpPlaylistBtn'); const list = $('mpPlaylist');
            if (listBtn) listBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!list) return;
                // 打开时按可用空间限制高度，避免顶到右上角工具栏
                if (list.classList.contains('hidden')) {
                    const player = $('musicPlayer');
                    const tools = document.querySelector('.wallpaper-tools');
                    if (player && tools) {
                        const playerTop = player.getBoundingClientRect().top;
                        const toolsBottom = tools.getBoundingClientRect().bottom;
                        const avail = Math.max(160, Math.min(260, playerTop - toolsBottom - 16));
                        list.style.maxHeight = avail + 'px';
                    }
                }
                list.classList.toggle('hidden');
            });
            document.addEventListener('click', function (e) {
                if (list && !list.contains(e.target) && e.target !== listBtn && !listBtn.contains(e.target)) list.classList.add('hidden');
            });

            // 进度条：支持点击 + 按住拖动（参考 Firefly 的 pointer 事件实现）
            const progress = $('mpProgress');
            let dragging = false;
            if (progress) {
                let dragPercent = 0;
                function getPercent(e) {
                    const rect = progress.getBoundingClientRect();
                    if (!rect.width) return 0;
                    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                }
                function paintProgress(pct) {
                    const bar = $('mpProgressBar');
                    const thumb = $('mpProgressThumb');
                    const p = Math.max(0, Math.min(1, pct));
                    if (bar) bar.style.width = (p * 100) + '%';
                    if (thumb) thumb.style.left = (p * 100) + '%';
                    progress.setAttribute('aria-valuenow', Math.round(p * 100));
                    if (audio.duration) setText('mpCurTime', fmt(p * audio.duration));
                }
                progress.addEventListener('pointerdown', function (e) {
                    if (e.button !== 0 || !audio.duration) return;
                    dragging = true;
                    progress.classList.add('dragging');
                    try { progress.setPointerCapture(e.pointerId); } catch (err) {}
                    dragPercent = getPercent(e);
                    paintProgress(dragPercent);
                    e.preventDefault();
                });
                progress.addEventListener('pointermove', function (e) {
                    if (!dragging) return;
                    dragPercent = getPercent(e);
                    paintProgress(dragPercent);
                });
                function finishDrag(e) {
                    if (!dragging) return;
                    dragging = false;
                    progress.classList.remove('dragging');
                    try { progress.releasePointerCapture(e.pointerId); } catch (err) {}
                    if (audio.duration) audio.currentTime = dragPercent * audio.duration;
                }
                progress.addEventListener('pointerup', finishDrag);
                progress.addEventListener('pointercancel', function (e) {
                    if (!dragging) return;
                    dragging = false;
                    progress.classList.remove('dragging');
                    try { progress.releasePointerCapture(e.pointerId); } catch (err) {}
                    // 取消时恢复到实际播放位置
                    if (audio.duration) paintProgress(audio.currentTime / audio.duration);
                });
            }

            audio.addEventListener('play', updatePlayIcon);
            audio.addEventListener('pause', updatePlayIcon);
            audio.addEventListener('timeupdate', function () {
                setText('mpCurTime', fmt(audio.currentTime));
                setText('mpDurTime', fmt(audio.duration));
                if (!dragging && audio.duration) {
                    const pct = audio.currentTime / audio.duration;
                    const bar = $('mpProgressBar'), thumb = $('mpProgressThumb');
                    if (bar) bar.style.width = (pct * 100) + '%';
                    if (thumb) thumb.style.left = (pct * 100) + '%';
                    if (progress) progress.setAttribute('aria-valuenow', Math.round(pct * 100));
                }
            });
            audio.addEventListener('ended', function () { next(true); });
            audio.addEventListener('error', function () {
                // 单曲加载失败时短暂后跳到下一首
                setTimeout(() => { if (audio.error) next(true); }, 1200);
            });
        }

        return { init: init };
    })();

    /* ============================================================
     * 9. 主题色切换（右上角调色板按钮）
     * ============================================================ */
    const THEMES = CFG.themes || {};
    function initTheme() {
        let theme = store.get('theme', 'amber');
        let customColor = store.get('theme-custom-color', '#fbbf24');
        if (theme !== 'custom' && !THEMES[theme]) theme = 'amber';

        // 统一解析 #RRGGBB → [r,g,b]（0-255），供 rgb / 加深 / HSV 转换共用
        function hexToTriplet(hex) {
            const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
            return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
        }
        function hexToRgb(hex) {
            const c = hexToTriplet(hex);
            return c ? c.join(', ') : null;
        }
        // 加深颜色（用于渐变深色端）
        function darken(hex, ratio) {
            const c = hexToTriplet(hex);
            if (!c) return '#000000';
            return '#' + c.map(v => Math.round(v * (1 - ratio)).toString(16).padStart(2, '0')).join('');
        }

        function apply() {
            const root = document.documentElement;
            if (theme === 'custom') {
                const rgb = hexToRgb(customColor);
                if (rgb) {
                    root.style.setProperty('--accent-rgb', rgb);
                    root.style.setProperty('--accent-2', darken(customColor, 0.25));
                }
            } else {
                const t = THEMES[theme];
                root.style.setProperty('--accent-rgb', t.rgb);
                root.style.setProperty('--accent-2', t.second);
            }
            $$('.theme-option').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
            });
            const customLabel = $('themeCustomBtn');
            if (customLabel) customLabel.classList.toggle('active', theme === 'custom');
            const swatch = $('customColorSwatch');
            if (swatch) swatch.style.background = customColor;
        }
        apply();

        const panel = $('settingsPanel');
        $$('.theme-option').forEach(option => {
            option.addEventListener('click', function (e) {
                e.stopPropagation();
                theme = this.getAttribute('data-theme');
                store.set('theme', theme);
                apply();
            });
        });
        // ---------- 自定义调色盘（主题风格，替代浏览器原生取色器） ----------
        const picker = $('colorPicker');
        const customBtn = $('themeCustomBtn');
        const cpSV = $('cpSV'), cpSVCursor = $('cpSVCursor'), cpHue = $('cpHue');
        const cpHex = $('cpHex'), cpPreview = $('cpPreview');

        // HSV 状态（h:0-360, s/v:0-1）
        let h = 45, s = 0.75, v = 1;
        function hsvToHex(h, s, v) {
            const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
            let r = 0, g = 0, b = 0;
            if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
            else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
            else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
            const to2 = n => Math.round((n + m) * 255).toString(16).padStart(2, '0');
            return '#' + (to2(r) + to2(g) + to2(b)).toUpperCase();
        }
        function hexToHsv(hex) {
            const triplet = hexToTriplet(hex);
            if (!triplet) return null;
            const r = triplet[0] / 255, g = triplet[1] / 255, b = triplet[2] / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
            let hh = 0;
            if (d) {
                if (max === r) hh = 60 * (((g - b) / d) % 6);
                else if (max === g) hh = 60 * ((b - r) / d + 2);
                else hh = 60 * ((r - g) / d + 4);
            }
            if (hh < 0) hh += 360;
            return { h: hh, s: max === 0 ? 0 : d / max, v: max };
        }
        function updatePicker() {
            const hex = hsvToHex(h, s, v);
            if (cpSV) cpSV.style.background = 'hsl(' + h + ', 100%, 50%)';
            if (cpSVCursor) {
                cpSVCursor.style.left = (s * 100) + '%';
                cpSVCursor.style.top = ((1 - v) * 100) + '%';
            }
            if (cpHue) cpHue.value = Math.round(h);
            if (cpHex) cpHex.value = hex;
            if (cpPreview) cpPreview.style.background = hex;
        }
        function initHsvFromHex(hex) {
            const r = hexToHsv(hex);
            if (r) { h = r.h; s = r.s; v = r.v; }
            updatePicker();
        }

        if (customBtn && picker) {
            // 打开调色盘（关闭主题菜单，互斥其它下拉框）
            customBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const body = panel ? panel.querySelector('.settings-body') : null;
                if (body) body.classList.add('hidden');
                picker.classList.remove('hidden');
                initHsvFromHex(customColor);
            });
            // 返回主题菜单
            const back = $('cpBack');
            if (back) back.addEventListener('click', function (e) {
                e.stopPropagation();
                picker.classList.add('hidden');
                const body = panel ? panel.querySelector('.settings-body') : null;
                if (body) body.classList.remove('hidden');
            });
            picker.addEventListener('click', e => e.stopPropagation());

            // SV 面板拖动
            let draggingSV = false;
            function onSV(e) {
                if (!cpSV) return;
                const r = cpSV.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                s = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
                v = 1 - Math.max(0, Math.min(1, (clientY - r.top) / r.height));
                updatePicker();
            }
            if (cpSV) {
                cpSV.addEventListener('mousedown', function (e) { draggingSV = true; onSV(e); });
                cpSV.addEventListener('touchstart', function (e) { draggingSV = true; onSV(e); }, { passive: true });
            }
            document.addEventListener('mousemove', function (e) { if (draggingSV) onSV(e); });
            document.addEventListener('touchmove', function (e) { if (draggingSV) onSV(e); }, { passive: true });
            document.addEventListener('mouseup', function () { draggingSV = false; });
            document.addEventListener('touchend', function () { draggingSV = false; });

            // 色相滑块
            if (cpHue) cpHue.addEventListener('input', function () { h = parseFloat(this.value); updatePicker(); });

            // HEX 手动输入
            if (cpHex) cpHex.addEventListener('change', function () {
                const parsed = hexToHsv(this.value);
                if (parsed) { h = parsed.h; s = parsed.s; v = parsed.v; updatePicker(); }
                else updatePicker();
            });

            // 快捷色块
            const quick = $('cpQuick');
            if (quick) {
                ['#FBBF24', '#60A5FA', '#34D399', '#A78BFA', '#FB7185', '#22D3EE', '#F87171', '#F472B6'].forEach(hex => {
                    const b = document.createElement('button');
                    b.type = 'button'; b.style.background = hex; b.title = hex;
                    b.addEventListener('click', function (e) { e.stopPropagation(); initHsvFromHex(hex); });
                    quick.appendChild(b);
                });
            }

            // 应用
            const applyBtn = $('cpApply');
            if (applyBtn) applyBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                customColor = hsvToHex(h, s, v);
                theme = 'custom';
                store.set('theme', 'custom');
                store.set('theme-custom-color', customColor);
                apply();
                picker.classList.add('hidden');
            });
        }
    }

    /* ============================================================
     * 9.5 3D 酷炫跟随光标（渐进增强：支持 3D 且非触屏时启用，否则回退原生光标）
     *   发光核心点 + 旋转虚线光环(带 3D 倾斜) + 5 段拖尾 + 点击波纹 + 悬停高亮
     *   参考 my-homepage 的实现，颜色改用本站主题色变量
     * ============================================================ */
    function initCursor() {
        const supports3D = !!(window.CSS && CSS.supports &&
            CSS.supports('transform', 'perspective(500px) rotateX(10deg)'));
        const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (!supports3D || isTouch) return;

        const fx = $('cursorFx'), halo = $('cursorHalo'), dot = $('cursorDot'), ripple = $('cursorRipple');
        if (!fx || !halo || !dot) return;
        const trails = [1, 2, 3, 4, 5].map(i => $('trail' + i)).filter(Boolean);
        document.body.classList.add('custom-cursor');
        // 初始即显示自定义光标（此前要等首次 mousemove 才 visible，容易被误认为"光标消失"）
        fx.style.opacity = '1';

        let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
        let hx = mouseX, hy = mouseY;
        let lastX = mouseX, lastY = mouseY;
        let vx = 0, vy = 0, spin = 0;
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const pts = trails.map(() => ({ x: mouseX, y: mouseY }));

        document.addEventListener('mousemove', e => {
            mouseX = e.clientX; mouseY = e.clientY;
            fx.style.opacity = '1';
        }, { passive: true });
        document.addEventListener('mouseleave', () => { fx.style.opacity = '0'; });
        document.addEventListener('mouseenter', () => { fx.style.opacity = '1'; });

        // 点击波纹
        let rippleAnim = null;
        document.addEventListener('mousedown', e => {
            if (reduce || !ripple) return;
            if (rippleAnim) cancelAnimationFrame(rippleAnim);
            const rx = e.clientX, ry = e.clientY;
            let t = 0;
            ripple.style.opacity = '0.9';
            (function step() {
                t += 0.06;
                ripple.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) scale(' + (1 + t * 4) + ')';
                ripple.style.opacity = String(Math.max(0, 0.9 - t * 0.9));
                if (t < 1) rippleAnim = requestAnimationFrame(step);
            })();
        });

        // 悬停在可点击元素上时高亮
        const interactive = 'a, button, input, .site-card, .wp-source-option, .theme-option, .mp-playlist-item';
        document.addEventListener('mouseover', e => {
            if (e.target instanceof Element && e.target.closest(interactive)) document.body.classList.add('hovering');
        });
        document.addEventListener('mouseout', e => {
            if (e.target instanceof Element && e.target.closest(interactive)) document.body.classList.remove('hovering');
        });

        function render() {
            const rawVx = mouseX - lastX, rawVy = mouseY - lastY;
            lastX = mouseX; lastY = mouseY;
            vx += (rawVx - vx) * 0.15;
            vy += (rawVy - vy) * 0.15;
            hx += (mouseX - hx) * 0.16;
            hy += (mouseY - hy) * 0.16;

            const speed = Math.min(Math.sqrt(vx * vx + vy * vy), 50);
            const tiltX = reduce ? 0 : Math.max(-35, Math.min(35, -vy * 1.5));
            const tiltY = reduce ? 0 : Math.max(-35, Math.min(35, vx * 1.5));
            spin += reduce ? 0 : 0.6 + speed * 0.15;
            const scale = 1 + speed / 120 + (document.body.classList.contains('hovering') ? 0.3 : 0);

            dot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0)';
            halo.style.transform =
                'translate3d(' + hx + 'px,' + hy + 'px,0) ' +
                'perspective(520px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) ' +
                'rotate(' + spin + 'deg) scale(' + scale + ')';

            let tx = mouseX, ty = mouseY;
            pts.forEach((p, i) => {
                p.x += (tx - p.x) * 0.32;
                p.y += (ty - p.y) * 0.32;
                const k = 1 - i / (pts.length + 1);
                trails[i].style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0) scale(' + k.toFixed(2) + ')';
                trails[i].style.opacity = (k * 0.7).toFixed(2);
                tx = p.x; ty = p.y;
            });
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }

    /* ============================================================
     * 10. 闲置自动淡出（30 秒无操作后所有组件逐渐变淡直至消失，任意操作恢复）
     * ============================================================ */
    function initIdleFade() {
        const layer = $('fadeLayer') || $('pageContent');
        if (!layer) return;
        let timer = null, hidden = false;
        // 手动隐藏标记：为 true 时只响应页面内点击，鼠标移动/滚动/按键都不恢复
        let manualHidden = false;

        // 淡出/淡入统一交给 CSS transition（无毛玻璃，无需逐帧重采样）
        function hide(fast) {
            if (hidden) return;
            hidden = true;
            const ms = fast ? 350 : 2000;
            layer.style.transition = 'opacity ' + (ms / 1000) + 's ease';
            layer.style.opacity = '0';
            layer.style.pointerEvents = 'none'; // 淡出后不拦截壁纸交互
        }
        function show() {
            manualHidden = false;
            if (!hidden && layer.style.opacity === '1') return;
            layer.style.transition = 'opacity .6s ease';
            layer.style.opacity = '1';
            layer.style.pointerEvents = '';
            hidden = false;
        }
        function reset(e) {
            // 手动隐藏后，只有页面内任意点击（或触摸点击）才恢复组件
            if (manualHidden && (!e || e.type !== 'click')) return;
            show();
            if (timer) clearTimeout(timer);
            timer = setTimeout(function () { hide(false); }, 30000);
        }
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(ev => {
            document.addEventListener(ev, reset, { passive: true });
        });
        reset();

        // 右上角「立即隐藏」按钮：快速淡出所有组件（含自身），之后只有页面内点击才恢复
        const hideBtn = $('fadeNowBtn');
        if (hideBtn) hideBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (timer) { clearTimeout(timer); timer = null; }
            hide(true);
            manualHidden = true;
        });
    }

    /* ============================================================
     * 11. 全屏切换（右上角按钮）
     * ============================================================ */
    function initFullscreen() {
        const btn = $('fullscreenBtn');
        if (!btn) return;
        const icon = btn.querySelector('iconify-icon');
        btn.classList.remove('hidden'); // 浏览器支持才显示

        function paint() {
            const on = !!document.fullscreenElement;
            if (icon) icon.setAttribute('icon', on ? 'mdi:fullscreen-exit' : 'mdi:fullscreen');
            btn.title = on ? '退出全屏' : '进入全屏';
        }
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (document.fullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
            } else if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(function () {});
            }
        });
        document.addEventListener('fullscreenchange', paint);
        paint();
    }

    /* ============================================================
     * 12. PWA 安装（捕获 beforeinstallprompt，右上角按钮触发；支持多端各自安装）
     * ============================================================ */
    function initPwaInstall() {
        const btn = $('installBtn');
        if (!btn) return;
        let deferred = null;

        // 已安装（standalone 模式）时隐藏安装按钮
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            btn.classList.add('hidden');
            return;
        }
        // 开发/本地 file:// 下无安装事件时，也先隐藏，等事件到来再显示
        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            deferred = e;
            btn.classList.remove('hidden');
        });
        window.addEventListener('appinstalled', function () {
            deferred = null;
            btn.classList.add('hidden');
        });
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (deferred) {
                deferred.prompt();
                deferred.userChoice.then(function () { deferred = null; btn.classList.add('hidden'); });
            }
        });
    }

    /* ============================================================
     * 启动
     * ============================================================ */
    function start() {
        renderSites();
        initTheme();
        clock();
        initSearch();
        wallpaper.init();
        weather.init();
        calendar.init();
        music.init();
        initUptime();
        initStats();
        initCursor();
        initIdleFade();
        initSettingsPanel();
        weather.initCitySettings();
        initFullscreen();
        initPwaInstall();
        // PWA Service Worker：仅 http(s) 下注册（file:// 不支持，双击打开时静默跳过）
        if ('serviceWorker' in navigator && location.protocol !== 'file:') {
            navigator.serviceWorker.register('./sw.js').catch(function () {});
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
