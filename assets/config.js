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
        song('01-使一颗心免于哀伤-知更鸟.mp3', '使一颗心免于哀伤', '知更鸟 / HOYO-MiX'),
        song('02-在银河中孤独摇摆-知更鸟.mp3', '在银河中孤独摇摆', '知更鸟 / HOYO-MiX'),
        song('03-希望有羽毛和翅膀-知更鸟.mp3', '希望有羽毛和翅膀', '知更鸟 / HOYO-MiX'),
        song('15-昔涟-张韶涵.mp3', '昔涟', '张韶涵 & HOYO-MiX'),
        song('29 - 唯有追赶风的方向 (Only By Chasing the Wind) - 知更鸟 HOYO-MiX Chevy.mp3', '唯有追赶风的方向 (Only By Chasing the Wind)', '知更鸟 / HOYO-MiX / Chevy'),
        song('04-玻璃-Gareth.T.mp3', '玻璃', 'Gareth.T'),
        song('05-Take-me-hand-DAISHI-DANCE.mp3', 'Take me hand', 'DAISHI DANCE & Cécile Corbel'),
        song('06-九张机-叶炫清.mp3', '九张机', '叶炫清'),
        song('07-失控-井迪儿.mp3', '失控', '井迪儿'),
        song('08-想你时风起-单依纯.mp3', '想你时风起', '单依纯'),
        song('09-叹云兮-鞠婧祎.mp3', '叹云兮', '鞠婧祎'),
        song('10-知我-国风堂.mp3', '知我', '国风堂, 哦漏'),
        song('11-如果突然想起我-喵酱油.mp3', '如果突然想起我', '喵酱油 & 花玲'),
        song('12-我不难过-孙燕姿.mp3', '我不难过', '孙燕姿'),
        song('13-心似烟火-陈壹千.mp3', '心似烟火', '陈壹千'),
        song('14-吹梦到西洲-恋恋故人难.mp3', '吹梦到西洲', '恋恋故人难、黄诗扶、妖扬'),
        song('16-雨爱-杨丞琳.mp3', '雨爱', '杨丞琳'),
        song('17-离开我的依赖-王艳薇.mp3', '离开我的依赖', '王艳薇'),
        song('18-我不曾忘记-花玲.mp3', '我不曾忘记', '花玲 & 张安琪 & 沐霏'),
        song('19-让风告诉你-花玲.mp3', '让风告诉你', '花玲 & 喵酱油 & 宴宁'),
        song('20-此生不换-青鸟飞鱼.mp3', '此生不换', '青鸟飞鱼'),
        song('01 - 踮起脚尖爱 (Live) - 单依纯.mp3', '踮起脚尖爱 (Live)', '单依纯'),
        song('02 - 春娇与志明 - 街道办GDC 欧阳耀莹.mp3', '春娇与志明', '街道办GDC / 欧阳耀莹'),
        song('03 - 小宇 - 蓝心羽.mp3', '小宇', '蓝心羽'),
        song('04 - 关键词 - 林俊杰.mp3', '关键词', '林俊杰'),
        song('05 - 唯一 - G.E.M.邓紫棋.mp3', '唯一', 'G.E.M.邓紫棋'),
        song('06 - 空心 (Live) - 黄霄雲 刘端端.mp3', '空心 (Live)', '黄霄雲 / 刘端端'),
        song('07 - 晴天 - 周杰伦.mp3', '晴天', '周杰伦'),
        song('08 - 回到你身边 (让你知道) - h3R3刘清云.mp3', '回到你身边 (让你知道)', 'h3R3刘清云'),
        song('09 - NIGHT DANCER - imase.mp3', 'NIGHT DANCER', 'imase'),
        song('10 - 迷人的危险 - 姚晓棠.mp3', '迷人的危险', '姚晓棠'),
        song('11 - Deadman - 蔡徐坤.mp3', 'Deadman', '蔡徐坤'),
        song('12 - 寂寞烟火 - 蓝心羽.mp3', '寂寞烟火', '蓝心羽'),
        song('13 - 恋爱画板 - 锦零.mp3', '恋爱画板', '锦零'),
        song('14 - 雨天 - 孙燕姿.mp3', '雨天', '孙燕姿'),
        song('15 - 戒烟 - 李荣浩.mp3', '戒烟', '李荣浩'),
        song('16 - 多远都要在一起 - G.E.M.邓紫棋.mp3', '多远都要在一起', 'G.E.M.邓紫棋'),
        song('17 - 甲乙丙丁 (粤语版) - 李佳薇.mp3', '甲乙丙丁 (粤语版)', '李佳薇'),
        song('18 - 可惜没如果 - 林俊杰.mp3', '可惜没如果', '林俊杰'),
        song('19 - 如果爱忘了 - 戚薇.mp3', '如果爱忘了', '戚薇'),
        song('20 - 后来的我们 - 五月天.mp3', '后来的我们', '五月天'),
        song('21 - 私奔 - 郑钧.mp3', '私奔', '郑钧'),
        song('22 - 多远都要在一起 - G.E.M.邓紫棋.mp3', '多远都要在一起', 'G.E.M.邓紫棋'),
        song('23 - 空山新雨后 - 音阙诗听 锦零.mp3', '空山新雨后', '音阙诗听 / 锦零'),
        song('24 - 舍得 - 王唯旖.mp3', '舍得', '王唯旖'),
        song('25 - 雨过后的风景 - Dizzy Dizzo (蔡诗芸).mp3', '雨过后的风景', 'Dizzy Dizzo (蔡诗芸)'),
        song('26 - 慢慢 - 小乐哥（王唯乐）.mp3', '慢慢', '小乐哥（王唯乐）'),
        song('27 - 指纹 - 杜宣达.mp3', '指纹', '杜宣达'),
        song('28 - 愿与愁 - 林俊杰.mp3', '愿与愁', '林俊杰'),
        song('30 - 如果突然想起我 - 喵酱油 花玲 爆裂菊是也.mp3', '如果突然想起我', '喵酱油 / 花玲 / 爆裂菊是也'),
        song('31 - Letting Go - 蔡健雅.mp3', 'Letting Go', '蔡健雅'),
        song('32 - Blueming - IU (아이유).mp3', 'Blueming', 'IU (아이유)'),
        song('33 - 凑热闹 - BY2.mp3', '凑热闹', 'BY2'),
        song('34 - 嚣张 - en (王翊恩).mp3', '嚣张', 'en (王翊恩)'),
        song('35 - 叹云兮 - 鞠婧祎.mp3', '叹云兮', '鞠婧祎'),
        song('36 - 遇见 - 孙燕姿.mp3', '遇见', '孙燕姿'),
        song('37 - 一程山路 - 毛不易.mp3', '一程山路', '毛不易'),
        song('38 - 群青 - YOASOBI (ヨアソビ).mp3', '群青', 'YOASOBI (ヨアソビ)'),
        song('39 - 富士山下 - 陈奕迅.mp3', '富士山下', '陈奕迅'),
        song('40 - Always Online - 林俊杰.mp3', 'Always Online', '林俊杰'),
        song('41 - 盛夏的果实 - 莫文蔚.mp3', '盛夏的果实', '莫文蔚'),
        song('42 - 海阔天空 - BEYOND.mp3', '海阔天空', 'BEYOND'),
        song('43 - 嘉宾 - 张远.mp3', '嘉宾', '张远'),
        song('44 - 把回忆拼好给你 - 苏星婕.mp3', '把回忆拼好给你', '苏星婕'),
        song('45 - 海屿你 (Single Version) - 马也_Crabbit Big Cole.mp3', '海屿你 (Single Version)', '马也_Crabbit / Big Cole'),
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
        musicDir: MUSIC_DIR,
        musicCoverDir: MUSIC_COVER_DIR,
        musicSongs: MUSIC_SONGS,
        statsApi: STATS_API,
        uptimeStart: UPTIME_START
    };
})(window);
