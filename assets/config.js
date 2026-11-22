/* ============================================================
 * Desktop · 我的桌面 —— 配置文件
 *
 * 【日常维护只需改这个文件】
 *   · 增删网站      → SITES
 *   · 搜索引擎      → SEARCH_ENGINES
 *   · 壁纸图源      → WALLPAPER_SOURCES
 *   · 主题色        → THEMES
 *   · 歌单          → MUSIC_PLAYLIST
 *   · 天气城市      → WEATHER_LOCATIONS
 *   · 站点运行时间  → UPTIME_START
 *
 * 各项均为普通 JS 变量，改完保存刷新页面即可生效。
 * ============================================================ */

(function (global) {
    'use strict';

    /* ---------- 网站快捷方式 ----------
     * 增加一个网站：复制一行，改 title / url / icon 即可。
     * 删除一个网站：直接删掉对应行（或行首加 // 注释）。
     * icon 可用任意 Iconify 图标名，如 "mdi:github"、"logos:chrome"；
     * 也可用 img 指定本地图片路径（如豆包 "assets/icons/doubao.png"）。
     * icon/img 都留空则显示标题首字。desc 为可选副标题。
     */
    const SITES = [
        { title: "Google", url: "https://www.google.com/", icon: "devicon:google", desc: "" },
        { title: "Gemini", url: "https://gemini.google.com/app", icon: "vscode-icons:file-type-gemini", desc: "" },
        { title: "豆包", url: "https://www.doubao.com/chat/", img: "assets/icons/doubao.png", desc: "" },
        { title: "Kimi", url: "https://www.kimi.com/", icon: "hugeicons:kimi-ai", desc: "" },
        { title: "Deepseek", url: "https://chat.deepseek.com/", icon: "logos:deepseek-icon", desc: "" },
        { title: "TikTok", url: "https://www.tiktok.com/", icon: "ic:baseline-tiktok", desc: "" },
        { title: "抖音", url: "https://www.douyin.com/?recommend=1", icon: "logos:tiktok-icon", desc: "" },
        { title: "哔哩哔哩", url: "https://www.bilibili.com/", icon: "ant-design:bilibili-filled", desc: "" },
        { title: "Youtube", url: "https://www.youtube.com/", icon: "logos:youtube-icon", desc: "" },
        { title: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox", icon: "logos:google-gmail", desc: "" },
        { title: "QQ邮箱", url: "https://wx.mail.qq.com/", icon: "ri:qq-fill", desc: "" },
        { title: "Outlook", url: "https://outlook.office.com/", icon: "selfhst:microsoft-outlook", desc: "" },
        { title: "Lark邮箱", url: "https://gjpxlsii7pct.jp.larksuite.com/mail", icon: "arcticons:lark", desc: "" },
        { title: "swjtu邮箱", url: "https://mail.swjtu.edu.cn/cmcuapi/sso/cas", icon: "pajamas:mail", desc: "" },
        { title: "Cloudflare", url: "https://dash.cloudflare.com/", icon: "logos:cloudflare-icon", desc: "" },
        { title: "github", url: "https://github.com/", icon: "ri:github-fill", desc: "" },
        { title: "Cudy-TR3000", url: "http://192.168.100.1", icon: "streamline-color:wifi-router-flat", desc: "" },
        { title: "ZashBoard", url: "http://192.168.100.1:9090/ui/zashboard/#/proxies", icon: "arcticons:clash-meta", desc: "" },
        { title: "DNS管理", url: "https://dns.sad.hk.yjhup.com", icon: "gcp:cloud-dns", desc: "" },
        { title: "订阅转换前端", url: "https://sub.yjhup.com/", icon: "at-icons:arrows-counterclockwise", desc: "" },
        { title: "password", url: "https://password.web.yjhup.com/", icon: "formkit:password", desc: "" },
        { title: "Inkstone", url: "https://inkstone.web.yjhup.com/", icon: "ix:ink-pen", desc: "" },
        { title: "IP检测", url: "https://oneip.web.yjhup.com", icon: "mdi:ip", desc: "" }
    ];

    /* ---------- 搜索引擎（默认第一个 google） ---------- */
    const SEARCH_ENGINES = {
        google:     { url: 'https://www.google.com/search?q=', label: 'Google', icon: 'devicon:google' },
        bing:       { url: 'https://www.bing.com/search?q=',   label: 'Bing',   icon: 'logos:bing' },
        baidu:      { url: 'https://www.baidu.com/s?wd=',      label: '百度',   icon: 'ri:baidu-fill' },
        duckduckgo: { url: 'https://duckduckgo.com/?q=',        label: 'DuckDuckGo', icon: 'logos:duckduckgo' }
    };

    /* ---------- 壁纸图源 ----------
     * 程序按屏幕宽高比自动为「自建图库」选择 landscape/portrait。
     * mixed = 在 dmoe 与 selfhost 之间随机。
     */
    const WALLPAPER_SOURCES = {
        dmoe:     { name: '樱花 DMOE · 二次元', url: 'https://www.dmoe.cc/random.php' },
        selfhost: { name: '自建图库', url: 'https://static-imgapi.web.yjhup.com/api/' },
        mixed:    { name: '两者随机', url: '' }
    };

    /* ---------- 主题色 ----------
     * rgb 为主色 RGB 值（用于半透明），second 为深色渐变端。
     */
    const THEMES = {
        amber:  { rgb: '251, 191, 36',  second: '#f59e0b', label: '琥珀' },
        blue:   { rgb: '96, 165, 250',  second: '#3b82f6', label: '蔚蓝' },
        green:  { rgb: '52, 211, 153',  second: '#10b981', label: '青竹' },
        purple: { rgb: '167, 139, 250', second: '#8b5cf6', label: '紫藤' },
        rose:   { rgb: '251, 113, 133', second: '#f43f5e', label: '玫红' },
        cyan:   { rgb: '34, 211, 238',  second: '#06b6d4', label: '青蓝' }
    };

    /* ---------- 天气城市（Open-Meteo，无需 Key） ---------- */
    const WEATHER_LOCATIONS = [
        { key: '0', name: '成都·郫都', lat: 30.8136, lon: 103.8797 },
        { key: '1', name: '南充·西充', lat: 31.0556, lon: 106.0028 }
    ];

    /* ---------- 歌单（本地文件位于 assets/music/） ---------- */
    const MUSIC_PLAYLIST = [
        { name: '使一颗心免于哀伤', artist: '知更鸟 / HOYO-MiX', url: 'assets/music/01-使一颗心免于哀伤-知更鸟.mp3', cover: 'assets/music/cover/01-使一颗心免于哀伤-知更鸟.webp' },
        { name: '在银河中孤独摇摆', artist: '知更鸟 / HOYO-MiX', url: 'assets/music/02-在银河中孤独摇摆-知更鸟.mp3', cover: 'assets/music/cover/02-在银河中孤独摇摆-知更鸟.webp' },
        { name: '希望有羽毛和翅膀', artist: '知更鸟 / HOYO-MiX', url: 'assets/music/03-希望有羽毛和翅膀-知更鸟.mp3', cover: 'assets/music/cover/03-希望有羽毛和翅膀-知更鸟.webp' },
        { name: '玻璃', artist: 'Gareth.T', url: 'assets/music/04-玻璃-Gareth.T.mp3', cover: 'assets/music/cover/04-玻璃-Gareth.T.webp' },
        { name: 'Take me hand', artist: 'DAISHI DANCE & Cécile Corbel', url: 'assets/music/05-Take-me-hand-DAISHI-DANCE.mp3', cover: 'assets/music/cover/05-Take-me-hand-DAISHI-DANCE.jpg' },
        { name: '九张机', artist: '叶炫清', url: 'assets/music/06-九张机-叶炫清.mp3', cover: 'assets/music/cover/06-九张机-叶炫清.jpg' },
        { name: '失控', artist: '井迪儿', url: 'assets/music/07-失控-井迪儿.mp3', cover: 'assets/music/cover/07-失控-井迪儿.webp' },
        { name: '想你时风起', artist: '单依纯', url: 'assets/music/08-想你时风起-单依纯.mp3', cover: 'assets/music/cover/08-想你时风起-单依纯.webp' },
        { name: '叹云兮', artist: '鞠婧祎', url: 'assets/music/09-叹云兮-鞠婧祎.mp3', cover: 'assets/music/cover/09-叹云兮-鞠婧祎.jpg' },
        { name: '知我', artist: '国风堂, 哦漏', url: 'assets/music/10-知我-国风堂.mp3', cover: 'assets/music/cover/10-知我-国风堂.jpg' },
        { name: '如果突然想起我', artist: '喵酱油 & 花玲', url: 'assets/music/11-如果突然想起我-喵酱油.mp3', cover: 'assets/music/cover/11-如果突然想起我-喵酱油.jpg' },
        { name: '我不难过', artist: '孙燕姿', url: 'assets/music/12-我不难过-孙燕姿.mp3', cover: 'assets/music/cover/12-我不难过-孙燕姿.jpg' },
        { name: '心似烟火', artist: '陈壹千', url: 'assets/music/13-心似烟火-陈壹千.mp3', cover: 'assets/music/cover/13-心似烟火-陈壹千.jpg' },
        { name: '吹梦到西洲', artist: '恋恋故人难、黄诗扶、妖扬', url: 'assets/music/14-吹梦到西洲-恋恋故人难.mp3', cover: 'assets/music/cover/14-吹梦到西洲-恋恋故人难.webp' },
        { name: '昔涟', artist: '张韶涵 & HOYO-MiX', url: 'assets/music/15-昔涟-张韶涵.mp3', cover: 'assets/music/cover/15-昔涟-张韶涵.jpg' },
        { name: '雨爱', artist: '杨丞琳', url: 'assets/music/16-雨爱-杨丞琳.mp3', cover: 'assets/music/cover/16-雨爱-杨丞琳.webp' },
        { name: '离开我的依赖', artist: '王艳薇', url: 'assets/music/17-离开我的依赖-王艳薇.mp3', cover: 'assets/music/cover/17-离开我的依赖-王艳薇.jpg' },
        { name: '我不曾忘记', artist: '花玲 & 张安琪 & 沐霏', url: 'assets/music/18-我不曾忘记-花玲.mp3', cover: 'assets/music/cover/18-我不曾忘记-花玲.webp' },
        { name: '让风告诉你', artist: '花玲 & 喵酱油 & 宴宁', url: 'assets/music/19-让风告诉你-花玲.mp3', cover: 'assets/music/cover/19-让风告诉你-花玲.jpg' },
        { name: '此生不换', artist: '青鸟飞鱼', url: 'assets/music/20-此生不换-青鸟飞鱼.mp3', cover: 'assets/music/cover/20-此生不换-青鸟飞鱼.webp' }
    ];

    /* ---------- 访问统计（与 SunPanel 相同的 WebViso 后端） ---------- */
    const STATS_API = 'https://stats.web.yjhup.com/api/visit';

    /* ---------- 本站开始运行时间（页脚计时） ---------- */
    const UPTIME_START = new Date(2026, 10, 21, 19, 0, 0); // 2026-11-21 19:00（月份从 0 起）

    global.DESKTOP_CONFIG = {
        sites: SITES,
        searchEngines: SEARCH_ENGINES,
        wallpaperSources: WALLPAPER_SOURCES,
        themes: THEMES,
        weatherLocations: WEATHER_LOCATIONS,
        musicPlaylist: MUSIC_PLAYLIST,
        statsApi: STATS_API,
        uptimeStart: UPTIME_START
    };
})(window);
