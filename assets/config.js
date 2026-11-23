/* ============================================================
 * Desktop · 我的桌面 —— 配置文件
 *
 * 【日常维护只需改这个文件，改完保存刷新即可】
 *   · 增删网站      → SITES
 *   · 搜索引擎      → SEARCH_ENGINES
 *   · 壁纸图源      → WALLPAPER_SOURCES
 *   · 主题色        → THEMES
 *   · 歌单          → MUSIC_SONGS
 *   · 天气城市      → WEATHER_LOCATIONS
 *   · 站点运行时间  → UPTIME_START
 *
 * 各项均为普通 JS 变量，改完保存刷新页面即可生效。
 * ============================================================ */

(function (global) {
    'use strict';

    /* ---------- 网站快捷方式 ----------
     * 【增删应用只需改这里，每个应用一行】
     *   site(标题, 网址, 图标名)
     *   · 图标名：任意 Iconify 名称，如 "mdi:github"、"logos:chrome"
     *   · 如要用本地图片：第 4 个参数传图片路径，如 'assets/icons/doubao.png'
     *   · 删除应用：删掉/注释掉对应那一行即可
     */
    function site(title, url, icon, img) {
        return { title: title, url: url, icon: icon || '', img: img || '', desc: '' };
    }
    const SITES = [
        site("Google", "https://www.google.com/", "devicon:google"),
        site("Gemini", "https://gemini.google.com/app", "vscode-icons:file-type-gemini"),
        site("豆包", "https://www.doubao.com/chat/", "", "assets/icons/doubao.png"),
        site("Kimi", "https://www.kimi.com/", "hugeicons:kimi-ai"),
        site("Deepseek", "https://chat.deepseek.com/", "logos:deepseek-icon"),
        site("TikTok", "https://www.tiktok.com/", "ic:baseline-tiktok"),
        site("抖音", "https://www.douyin.com/?recommend=1", "logos:tiktok-icon"),
        site("哔哩哔哩", "https://www.bilibili.com/", "ant-design:bilibili-filled"),
        site("Youtube", "https://www.youtube.com/", "logos:youtube-icon"),
        site("Gmail", "https://mail.google.com/mail/u/0/#inbox", "logos:google-gmail"),
        site("QQ邮箱", "https://wx.mail.qq.com/", "ri:qq-fill"),
        site("Outlook", "https://outlook.office.com/", "selfhst:microsoft-outlook"),
        site("Lark邮箱", "https://gjpxlsii7pct.jp.larksuite.com/mail", "arcticons:lark"),
        site("swjtu邮箱", "https://mail.swjtu.edu.cn/cmcuapi/sso/cas", "pajamas:mail"),
        site("Cloudflare", "https://dash.cloudflare.com/", "logos:cloudflare-icon"),
        site("github", "https://github.com/", "ri:github-fill"),
        site("Cudy-TR3000", "http://192.168.100.1", "streamline-color:wifi-router-flat"),
        site("ZashBoard", "http://192.168.100.1:9090/ui/zashboard/#/proxies", "arcticons:clash-meta"),
        site("DNS管理", "https://dns.sad.hk.yjhup.com", "gcp:cloud-dns"),
        site("订阅转换前端", "https://sub.yjhup.com/", "at-icons:arrows-counterclockwise"),
        site("password", "https://password.web.yjhup.com/", "formkit:password"),
        site("Inkstone", "https://inkstone.web.yjhup.com/", "ix:ink-pen"),
        site("IP检测", "https://oneip.web.yjhup.com", "mdi:ip"),
    ];

    /* ---------- 搜索引擎（默认第一个 google） ---------- */
    const SEARCH_ENGINES = {
        google:     { url: 'https://www.google.com/search?q=', label: 'Google', icon: 'devicon:google' },
        bing:       { url: 'https://www.bing.com/search?q=',   label: 'Bing',   icon: 'logos:bing' },
        baidu:      { url: 'https://www.baidu.com/s?wd=',      label: '百度',   icon: 'ri:baidu-fill' },
        duckduckgo: { url: 'https://duckduckgo.com/?q=',        label: 'DuckDuckGo', icon: 'logos:duckduckgo' }
    };

    /* ---------- 壁纸图源 ----------
     * 程序按屏幕宽高比自动为「作者自建随机图」选择 landscape/portrait。
     * mixed = 在 dmoe 与 selfhost 之间随机。
     */
    const WALLPAPER_SOURCES = {
        dmoe:     { name: '樱花 DMOE · 二次元', url: 'https://www.dmoe.cc/random.php' },
        selfhost: { name: '作者自建随机图', url: 'https://static-imgapi.web.yjhup.com/api/' },
        mixed:    { name: '两者随机', url: '' },
        custom:   { name: '自定义图源', url: '' } // API 地址由用户在页面上输入，保存在浏览器端
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

    /* ---------- 音乐 ----------
     * 【增删音乐只需改这里，每首一行】
     *   song(文件名, 歌曲名, 歌手)
     *   · 文件名：放在 assets/music/ 下的 mp3 名（如 '01-歌名-歌手.mp3'）
     *   · 歌曲名/歌手：可选，省略时会自动从文件名解析
     *   · 封面：自动按同名文件在 assets/music/cover/ 下查找（支持 webp/jpg/png/jpeg），
     *     也可传第 4 个参数手动指定封面文件名
     * 删除一首歌：删掉/注释掉对应那一行即可。
     */
    const MUSIC_DIR = 'assets/music/';
    const MUSIC_COVER_DIR = 'assets/music/cover/';
    function song(file, name, artist, coverFile) {
        return { file: file, name: name, artist: artist, coverFile: coverFile || '' };
    }
    const MUSIC_SONGS = [
        song('01-使一颗心免于哀伤.mp3', '使一颗心免于哀伤', '知更鸟 / HOYO-MiX'),
        song('02-在银河中孤独摇摆.mp3', '在银河中孤独摇摆', '知更鸟 / HOYO-MiX'),
        song('03-希望有羽毛和翅膀.mp3', '希望有羽毛和翅膀', '知更鸟 / HOYO-MiX'),
        song('04-昔涟.mp3', '昔涟', '张韶涵 & HOYO-MiX'),
        song('05-唯有追赶风的方向 (Only By Chasing the Wind).mp3', '唯有追赶风的方向 (Only By Chasing the Wind)', '知更鸟 / HOYO-MiX / Chevy'),
        song('06-玻璃.mp3', '玻璃', 'Gareth.T'),
        song('07-Take me hand.mp3', 'Take me hand', 'DAISHI DANCE & Cécile Corbel'),
        song('08-九张机.mp3', '九张机', '叶炫清'),
        song('09-失控.mp3', '失控', '井迪儿'),
        song('10-想你时风起.mp3', '想你时风起', '单依纯'),
        song('11-叹云兮.mp3', '叹云兮', '鞠婧祎'),
        song('12-知我.mp3', '知我', '国风堂, 哦漏'),
        song('13-如果突然想起我.mp3', '如果突然想起我', '喵酱油 & 花玲'),
        song('14-我不难过.mp3', '我不难过', '孙燕姿'),
        song('15-心似烟火.mp3', '心似烟火', '陈壹千'),
        song('16-吹梦到西洲.mp3', '吹梦到西洲', '恋恋故人难、黄诗扶、妖扬'),
        song('17-雨爱.mp3', '雨爱', '杨丞琳'),
        song('18-离开我的依赖.mp3', '离开我的依赖', '王艳薇'),
        song('19-我不曾忘记.mp3', '我不曾忘记', '花玲 & 张安琪 & 沐霏'),
        song('20-让风告诉你.mp3', '让风告诉你', '花玲 & 喵酱油 & 宴宁'),
        song('21-此生不换.mp3', '此生不换', '青鸟飞鱼'),
        song('22-踮起脚尖爱 (Live).mp3', '踮起脚尖爱 (Live)', '单依纯'),
        song('23-春娇与志明.mp3', '春娇与志明', '街道办GDC / 欧阳耀莹'),
        song('24-小宇.mp3', '小宇', '蓝心羽'),
        song('25-关键词.mp3', '关键词', '林俊杰'),
        song('26-唯一.mp3', '唯一', 'G.E.M.邓紫棋'),
        song('27-空心 (Live).mp3', '空心 (Live)', '黄霄雲 / 刘端端'),
        song('28-晴天.mp3', '晴天', '周杰伦'),
        song('29-回到你身边 (让你知道).mp3', '回到你身边 (让你知道)', 'h3R3刘清云'),
        song('30-NIGHT DANCER.mp3', 'NIGHT DANCER', 'imase'),
        song('31-迷人的危险.mp3', '迷人的危险', '姚晓棠'),
        song('32-Deadman.mp3', 'Deadman', '蔡徐坤'),
        song('33-寂寞烟火.mp3', '寂寞烟火', '蓝心羽'),
        song('34-恋爱画板.mp3', '恋爱画板', '锦零'),
        song('35-雨天.mp3', '雨天', '孙燕姿'),
        song('36-戒烟.mp3', '戒烟', '李荣浩'),
        song('37-多远都要在一起.mp3', '多远都要在一起', 'G.E.M.邓紫棋'),
        song('38-甲乙丙丁 (粤语版).mp3', '甲乙丙丁 (粤语版)', '李佳薇'),
        song('39-可惜没如果.mp3', '可惜没如果', '林俊杰'),
        song('40-如果爱忘了.mp3', '如果爱忘了', '戚薇'),
        song('41-后来的我们.mp3', '后来的我们', '五月天'),
        song('42-私奔.mp3', '私奔', '郑钧'),
        song('43-多远都要在一起.mp3', '多远都要在一起', 'G.E.M.邓紫棋'),
        song('44-空山新雨后.mp3', '空山新雨后', '音阙诗听 / 锦零'),
        song('45-舍得.mp3', '舍得', '王唯旖'),
        song('46-雨过后的风景.mp3', '雨过后的风景', 'Dizzy Dizzo (蔡诗芸)'),
        song('47-慢慢.mp3', '慢慢', '小乐哥（王唯乐）'),
        song('48-指纹.mp3', '指纹', '杜宣达'),
        song('49-愿与愁.mp3', '愿与愁', '林俊杰'),
        song('50-如果突然想起我.mp3', '如果突然想起我', '喵酱油 / 花玲 / 爆裂菊是也'),
        song('51-Letting Go.mp3', 'Letting Go', '蔡健雅'),
        song('52-Blueming.mp3', 'Blueming', 'IU (아이유)'),
        song('53-凑热闹.mp3', '凑热闹', 'BY2'),
        song('54-嚣张.mp3', '嚣张', 'en (王翊恩)'),
        song('55-叹云兮.mp3', '叹云兮', '鞠婧祎'),
        song('56-遇见.mp3', '遇见', '孙燕姿'),
        song('57-一程山路.mp3', '一程山路', '毛不易'),
        song('58-群青.mp3', '群青', 'YOASOBI (ヨアソビ)'),
        song('59-富士山下.mp3', '富士山下', '陈奕迅'),
        song('60-Always Online.mp3', 'Always Online', '林俊杰'),
        song('61-盛夏的果实.mp3', '盛夏的果实', '莫文蔚'),
        song('62-海阔天空.mp3', '海阔天空', 'BEYOND'),
        song('63-嘉宾.mp3', '嘉宾', '张远'),
        song('64-把回忆拼好给你.mp3', '把回忆拼好给你', '苏星婕'),
        song('65-海屿你 (Single Version).mp3', '海屿你 (Single Version)', '马也_Crabbit / Big Cole'),
    ];

    /* ---------- 音乐 CDN 回退（Cloudflare R2 自定义域，公开可读） ----------
     * 本地文件作为首选；加载慢/失败时切换到 R2 同名文件。
     * 桶 music 已上传全部 65 首 + 封面，目录结构与本地 assets/music/ 一致：
     *   https://musicfiles.yjh-web.eu.cc/music/01-歌名.mp3  ←→  assets/music/01-歌名.mp3
     * 公开域名无需任何密钥，仓库中不含敏感信息。
     * 留空 MUSIC_CDN_BASE 即关闭回退，只用本地文件。
     */
    const MUSIC_CDN_BASE = 'https://musicfiles.yjh-web.eu.cc';
    const MUSIC_CDN_TIMEOUT = 3000;

    /* ---------- 封面加载策略 ----------
     * 本地封面（assets/music/cover/）优先；本地静态资源在 5s 内仍未加载完成，
     * 则放弃本地、改用 R2 上的同名封面文件。
     */
    const MUSIC_COVER_TIMEOUT = 5000;

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
        musicDir: MUSIC_DIR,
        musicCoverDir: MUSIC_COVER_DIR,
        musicSongs: MUSIC_SONGS,
        musicCdnBase: MUSIC_CDN_BASE,
        musicCdnTimeout: MUSIC_CDN_TIMEOUT,
        musicCoverTimeout: MUSIC_COVER_TIMEOUT,
        statsApi: STATS_API,
        uptimeStart: UPTIME_START
    };
})(window);
