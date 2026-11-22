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

    // ---------- 存储辅助（隐私模式下 localStorage 可能抛错） ----------
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    };

    const $ = id => document.getElementById(id);
    const pad = n => String(n).padStart(2, '0');

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

        function renderDigital(now) {
            let h = now.getHours();
            let ampm = '';
            if (hour12) {
                ampm = h < 12 ? 'AM' : 'PM';
                h = h % 12; if (h === 0) h = 12;
            }
            const timeEl = $('clockTime');
            if (timeEl) timeEl.textContent = pad(h) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
            const ampmEl = $('clockAmPm');
            if (ampmEl) ampmEl.textContent = ampm;
            const greetEl = $('clockGreet');
            if (greetEl) greetEl.textContent = greeting(now.getHours());
            const dateEl = $('clockDate');
            if (dateEl) dateEl.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
            const weekEl = $('clockWeek');
            if (weekEl) weekEl.textContent = '星期' + WEEK[now.getDay()];
            const lunarEl = $('clockLunar');
            const festivalEl = $('clockFestival');
            if (lunarEl || festivalEl) {
                const parts = lunarParts(now);
                if (lunarEl) lunarEl.textContent = parts.lunar;
                if (festivalEl) festivalEl.textContent = parts.festival;
            }
        }

        function tick() {
            const now = new Date();
            const ms = now.getMilliseconds();
            const s = now.getSeconds() + ms / 1000;
            const m = now.getMinutes() + s / 60;
            const h = (now.getHours() % 12) + m / 60;
            const hs = $('handSecond'), hm = $('handMinute'), hh = $('handHour');
            if (hs) hs.style.transform = 'rotate(' + (s * 6) + 'deg)';
            if (hm) hm.style.transform = 'rotate(' + (m * 6) + 'deg)';
            if (hh) hh.style.transform = 'rotate(' + (h * 30) + 'deg)';
            renderDigital(now);
            requestAnimationFrame(tick);
        }

        function bindToggle() {
            const el = $('clockTime');
            if (!el) return;
            el.addEventListener('click', function () {
                hour12 = !hour12;
                store.set('clock-hour12', hour12 ? '1' : '0');
                renderDigital(new Date());
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

        function applyEngine(key) {
            engine = key;
            store.set('search-engine', key);
            if (engineIcon) engineIcon.setAttribute('icon', SEARCH_ENGINES[key].icon);
            if (input) input.placeholder = '使用 ' + key.charAt(0).toUpperCase() + key.slice(1) + ' 搜索，或直接按回车……';
            document.querySelectorAll('.engine-option').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-engine') === key);
            });
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

        document.querySelectorAll('.engine-option').forEach(option => {
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

        // 自建图库按屏幕宽高比自动选横屏/竖屏接口
        function selfhostBase() {
            const ratio = window.innerWidth / window.innerHeight;
            const orientation = ratio >= 1 ? 'landscape' : 'portrait';
            return WALLPAPER_SOURCES.selfhost.url + orientation;
        }

        function buildUrl() {
            // 第三个选项：在樱花 DMOE 与自建图库之间随机挑一个
            let chosen = source;
            if (source === 'mixed') chosen = Math.random() < 0.5 ? 'dmoe' : 'selfhost';
            const base = chosen === 'dmoe' ? WALLPAPER_SOURCES.dmoe.url : selfhostBase();
            const sep = base.indexOf('?') === -1 ? '?' : '&';
            return base + sep + 't=' + Date.now() + '&r=' + Math.random().toString(36).slice(2);
        }

        function load() {
            const el = $('wallpaper');
            const refreshBtn = $('refreshBgBtn');
            if (refreshBtn) refreshBtn.classList.add('loading');
            const img = new Image();
            const url = buildUrl();
            img.onload = function () {
                if (el) {
                    el.style.backgroundImage = 'url("' + url + '")';
                    el.classList.add('loaded');
                }
                if (refreshBtn) refreshBtn.classList.remove('loading');
            };
            img.onerror = function () {
                // 换图失败时保留上一张，仅取消加载动画
                if (refreshBtn) refreshBtn.classList.remove('loading');
            };
            img.src = url;
        }

        function applySourceMenu() {
            document.querySelectorAll('.wp-source-option').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-source') === source);
            });
        }

        function init() {
            applySourceMenu();
            load();

            const refreshBtn = $('refreshBgBtn');
            if (refreshBtn) refreshBtn.addEventListener('click', load);

            const srcBtn = $('wpSourceBtn');
            const menu = $('wpSourceMenu');
            if (srcBtn) srcBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (menu) menu.classList.toggle('hidden');
            });
            document.querySelectorAll('.wp-source-option').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    source = this.getAttribute('data-source');
                    store.set('wallpaper-source', source);
                    applySourceMenu();
                    if (menu) menu.classList.add('hidden');
                    load();
                });
            });
            document.addEventListener('click', function () {
                if (menu) menu.classList.add('hidden');
            });
        }

        return { init: init };
    })();

    /* ============================================================
     * 5. 天气（Open-Meteo，免费无需 Key）
     *    固定两地：① 成都郫都（主要，优先展示）② 四川西充
     * ============================================================ */
    const weather = (function () {
        const LOCATIONS = CFG.weatherLocations || [];
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
        function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }
        function json(url) { return fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }); }

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

            json(wxUrl).then(j => {
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

            json(aqUrl).then(j => {
                setText('wxAqi' + k, aqiInfo(j && j.current ? j.current.us_aqi : null));
            }).catch(() => {});
        }

        function init() {
            LOCATIONS.forEach(fetchWeather);
            // 30 分钟刷新一次
            setInterval(function () { LOCATIONS.forEach(fetchWeather); }, 30 * 60 * 1000);
        }
        return { init: init };
    })();

    /* ============================================================
     * 6. 日历（可翻月，含农历/节气/节日高亮，回到今天）
     * ============================================================ */
    const calendar = (function () {
        let viewYear, viewMonth; // viewMonth: 0-11
        const today = new Date();
        viewYear = today.getFullYear();
        viewMonth = today.getMonth();

        function lunarText(y, m, d) {
            try {
                if (typeof Solar === 'undefined') return '';
                const solar = Solar.fromYmd(y, m, d);
                const lunar = solar.getLunar();
                // 公历节日 > 农历节日 > 节气 > 农历日
                const sf = solar.getFestivals() || [];
                const lf = lunar.getFestivals() || [];
                const jq = lunar.getJieQi() || '';
                if (sf.length) return sf[0];
                if (lf.length) return lf[0];
                if (jq) return jq;
                return lunar.getDayInChinese() === '初一' ? lunar.getMonthInChinese() + '月' : lunar.getDayInChinese();
            } catch (e) { return ''; }
        }

        function isFestival(y, m, d) {
            try {
                if (typeof Solar === 'undefined') return false;
                const solar = Solar.fromYmd(y, m, d);
                const lunar = solar.getLunar();
                return !!((solar.getFestivals() || []).length || (lunar.getFestivals() || []).length || lunar.getJieQi());
            } catch (e) { return false; }
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
                const festival = !other && isFestival(y, m, d);
                if (festival) cell.classList.add('festival');
                if (!other && y === today.getFullYear() && m === today.getMonth() && d === today.getDate()) cell.classList.add('today');

                const num = document.createElement('div');
                num.className = 'cal-num';
                num.textContent = d;
                cell.appendChild(num);

                const lunar = document.createElement('div');
                lunar.className = 'cal-lunar';
                lunar.textContent = other ? '' : lunarText(y, m, d);
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
                    const cover = s.coverFile
                        ? COVER_DIR + s.coverFile
                        : { candidates: COVER_EXTS.map(ext => COVER_DIR + base + '.' + ext) };
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

        // 自动探测封面：按候选扩展名依次尝试，找到第一个能加载的（结果缓存）
        const coverCache = {};
        function resolveCover(song, cb) {
            const c = song.cover;
            if (typeof c === 'string') { cb(c); return; }
            if (!c || !c.candidates || !c.candidates.length) { cb(''); return; }
            const key = c.candidates[0];
            if (coverCache[key] !== undefined) { cb(coverCache[key]); return; }
            let i = 0;
            (function next() {
                if (i >= c.candidates.length) { coverCache[key] = ''; cb(''); return; }
                const url = c.candidates[i++];
                const img = new Image();
                img.onload = () => { coverCache[key] = url; cb(url); };
                img.onerror = next;
                img.src = url;
            })();
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
        function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }

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
                name.className = 'mpl-name'; name.textContent = song.name;
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
            document.querySelectorAll('.mp-playlist-item').forEach((el, i) => {
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

        function loadTrack(i, autoplay) {
            index = (i + PLAYLIST.length) % PLAYLIST.length;
            audio.src = PLAYLIST[index].url;
            renderTrack();
            setText('mpCurTime', '0:00');
            setText('mpDurTime', '0:00');
            const bar = $('mpProgressBar'); if (bar) bar.style.width = '0%';
            if (autoplay) {
                audio.play().catch(() => {});
            }
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
            if (listBtn) listBtn.addEventListener('click', function (e) { e.stopPropagation(); if (list) list.classList.toggle('hidden'); });
            document.addEventListener('click', function (e) {
                if (list && !list.contains(e.target) && e.target !== listBtn && !listBtn.contains(e.target)) list.classList.add('hidden');
            });

            // 进度条：支持点击 + 按住拖动（参考 Firefly 的 pointer 事件实现）
            const progress = $('mpProgress');
            if (progress) {
                let dragging = false;
                let dragPercent = 0;
                function getPercent(e) {
                    const rect = progress.getBoundingClientRect();
                    if (!rect.width) return 0;
                    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                }
                function paintProgress(pct) {
                    const bar = $('mpProgressBar');
                    if (bar) bar.style.width = (pct * 100) + '%';
                    if (audio.duration) setText('mpCurTime', fmt(pct * audio.duration));
                }
                progress.addEventListener('pointerdown', function (e) {
                    if (e.button !== 0 || !audio.duration) return;
                    dragging = true;
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
                    try { progress.releasePointerCapture(e.pointerId); } catch (err) {}
                    if (audio.duration) audio.currentTime = dragPercent * audio.duration;
                }
                progress.addEventListener('pointerup', finishDrag);
                progress.addEventListener('pointercancel', function (e) {
                    if (!dragging) return;
                    dragging = false;
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
                const bar = $('mpProgressBar');
                if (bar && audio.duration) bar.style.width = (audio.currentTime / audio.duration * 100) + '%';
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

        // 十六进制 → RGB 字符串，如 #fbbf24 → "251, 191, 36"
        function hexToRgb(hex) {
            const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
            return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)].join(', ') : null;
        }
        // 加深颜色（用于渐变深色端）
        function darken(hex, ratio) {
            const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
            if (!m) return '#000000';
            const c = [m[1], m[2], m[3]].map(h => Math.round(parseInt(h, 16) * (1 - ratio)).toString(16).padStart(2, '0'));
            return '#' + c.join('');
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
            document.querySelectorAll('.theme-option').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
            });
            const customLabel = document.querySelector('.theme-custom');
            if (customLabel) customLabel.classList.toggle('active', theme === 'custom');
            const colorInput = $('themeColorInput');
            if (colorInput && /^#[0-9a-f]{6}$/i.test(customColor)) colorInput.value = customColor;
        }
        apply();

        const btn = $('themeBtn');
        const menu = $('themeMenu');
        if (btn) btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (menu) menu.classList.toggle('hidden');
        });
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', function (e) {
                e.stopPropagation();
                theme = this.getAttribute('data-theme');
                store.set('theme', theme);
                apply();
                if (menu) menu.classList.add('hidden');
            });
        });
        // 自定义颜色：input 事件实时预览，change 事件持久化
        const colorInput = $('themeColorInput');
        if (colorInput) {
            colorInput.addEventListener('input', function () {
                theme = 'custom';
                customColor = this.value;
                apply();
            });
            colorInput.addEventListener('change', function () {
                store.set('theme', 'custom');
                store.set('theme-custom-color', this.value);
            });
            // 点击颜色框/标签不关闭菜单
            colorInput.addEventListener('click', e => e.stopPropagation());
            const customLabel = document.querySelector('.theme-custom');
            if (customLabel) customLabel.addEventListener('click', e => e.stopPropagation());
        }
        document.addEventListener('click', function () {
            if (menu) menu.classList.add('hidden');
        });
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
        let timer = null, hidden = false, fading = false;
        function show() {
            if (fading) { clearInterval(window.__fadeIv); fading = false; }
            // 恢复组件时同步恢复壁纸遮罩（壁纸回到变暗状态，保证文字可读）
            document.body.classList.remove('idle');
            if (hidden || layer.style.opacity !== '' && layer.style.opacity !== '1') {
                layer.style.opacity = '1';
                layer.style.pointerEvents = '';
                hidden = false;
            }
        }
        function reset() {
            show();
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                // 开始淡出时移除遮罩，让壁纸随组件一起逐渐恢复原有亮度
                document.body.classList.add('idle');
                let op = 1;
                fading = true;
                window.__fadeIv = setInterval(() => {
                    op -= 0.05;
                    if (op <= 0) {
                        op = 0; clearInterval(window.__fadeIv);
                        fading = false; hidden = true;
                        layer.style.pointerEvents = 'none'; // 淡出后不拦截壁纸交互
                    }
                    layer.style.opacity = op;
                }, 100);
            }, 30000);
        }
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(ev => {
            document.addEventListener(ev, reset, { passive: true });
        });
        reset();
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
