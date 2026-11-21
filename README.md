# Desktop · 我的桌面

一个纯静态的浏览器主页 / 桌面导航页。玻璃拟态风格，把常用网站、时钟、日历、天气、音乐播放器整合在一屏之内；可以换壁纸、换主题色，闲置一段时间后所有组件会自动淡出，只留下壁纸。

**无需构建、无需后端、无需数据库**，所有依赖已本地化，双击 `index.html` 即可打开（本地打开时仅天气需要联网）。

---

## 功能一览

| 模块 | 说明 |
|---|---|
| 组合时钟 | 模拟表盘（平滑扫秒）+ 数字时间叠加；点击时间切换 12/24 小时制；左侧公历、右侧农历，含节日与节气 |
| 搜索框 | 支持 Google / Bing / 百度 / DuckDuckGo，可切换并记忆 |
| 日历 | 可翻月、回到今天，标注农历、节日、节气 |
| 天气 | 成都·郫都（主要）与南充·西充两地，温度、天气、高低温、空气质量，30 分钟自动刷新 |
| 网站 dock | 常用网站快捷入口，宽屏一行、窄屏多排居中 |
| 音乐播放器 | 20 首本地音乐，旋转封面、播放/暂停、上下曲、三种循环模式、音量、播放列表、系统媒体键 |
| 壁纸 | 樱花 DMOE / 自建图库 / 两者随机三种图源，按屏幕比例自动选横屏或竖屏，可手动换图 |
| 主题色 | 琥珀 / 蔚蓝 / 青竹 / 紫藤 / 玫红 / 青蓝六色，全站联动 |
| 闲置淡出 | 30 秒无操作后所有组件渐隐，任意操作恢复 |
| 访问统计 | 使用 WebViso 后端统计 PV/UV |

---

## 目录结构

```
.
├── index.html                 页面结构
├── assets/
│   ├── config.js              ★ 所有可配置项（日常维护只改这里）
│   ├── script.js              交互逻辑（不含数据）
│   ├── style.css              样式
│   ├── music/                 本地音乐与封面（约 185 MB）
│   │   ├── *.mp3
│   │   └── cover/*
│   └── vendor/                本地化依赖，运行时不访问 CDN
│       ├── icons-data.js      图标 SVG 数据
│       ├── iconify-icon.min.js 轻量图标组件
│       └── lunar.js           农历计算库
└── README.md
```

### 常见修改

全部集中在 `assets/config.js`，改完刷新页面即可：

| 需求 | 修改位置 |
|---|---|
| 增删网站 | `SITES` 数组（复制一行改 `title`/`url`/`icon`，或删掉该行） |
| 加搜索引擎 | `SEARCH_ENGINES` |
| 换壁纸图源 | `WALLPAPER_SOURCES` |
| 加主题色 | `THEMES` |
| 换天气城市 | `WEATHER_LOCATIONS`（经纬度可在 Open-Meteo 查询） |
| 改歌单 | `MUSIC_PLAYLIST`（文件放 `assets/music/`） |
| 改站点起始时间 | `UPTIME_START` |
| 改统计后端 | `STATS_API` |

> 新增网站时若用了新的图标名，需要重新生成本地图标数据包，否则图标会空白。生成方式：把新图标名对应的 SVG 加入 `assets/vendor/icons-data.js` 的 `window.__ICONS__` 对象（格式 `{"前缀:名称":{"body":"<svg内部内容>","w":24,"h":24}}`），数据可从 [Iconify API](https://icon-sets.iconify.design/) 获取。

---

## 本地预览

直接双击 `index.html` 即可。若希望统计、壁纸等网络功能表现与线上一致，可起一个本地静态服务器：

```bash
# Python 3
python -m http.server 8777

# 或 Node.js
npx serve -l 8777
```

然后访问 `http://localhost:8777`。

---

## 部署方式

本项目是纯静态站点，**构建命令留空，输出目录为 `.`**（或 `/`）。以下任选其一。

### 1. Cloudflare Pages（推荐）

**A. 连接 Git 仓库**
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. 选择本仓库
3. 构建设置：Framework preset = `None`，Build command 留空，Build output directory = `/`
4. 点击 Deploy

**B. 直接上传**
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Upload assets
2. 把整个项目目录拖进去（含 `assets/` 和 `index.html`）
3. Deploy

> 注意：项目约 185 MB（音乐文件），上传可能较慢；单文件最大 12.8 MB，在 Pages 单文件限制内。

### 2. GitHub Pages

1. 仓库 → Settings → Pages
2. Source 选 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`
3. 保存后等待部署，访问 `https://<用户名>.github.io/desktop-web/`
4. 若部署后样式或脚本 404，检查 `index.html` 中的资源路径是否为相对路径（本项目已使用相对路径）

### 3. Vercel

1. Vercel → Add New → Project，导入本仓库
2. Framework Preset 选 `Other`
3. Build Command 留空，Output Directory 填 `.`
4. Deploy

### 4. Netlify

1. Netlify → Add new site → Import an existing project
2. 选择仓库
3. Build command 留空，Publish directory 填 `.`
4. Deploy

### 5. 任意静态服务器 / 对象存储

把整个目录上传到 Nginx、Apache、腾讯云 COS、阿里云 OSS 等支持静态托管的服务，入口指向 `index.html` 即可，无需任何特殊配置。

---

## 说明

- **音乐资源较大**：`assets/music/` 约 185 MB。如果介意仓库体积，可把音乐上传到对象存储或图床，然后把 `config.js` 中 `MUSIC_PLAYLIST` 的 `url`/`cover` 改成外链，并删除本地音乐目录。
- **访问统计**：使用与 SunPanel 相同的 WebViso 后端（`stats.web.yjhup.com`）。若不想统计，删除 `config.js` 中的 `statsApi` 即可。
- **天气 / 壁纸**：来自 Open-Meteo、樱花 DMOE 和自建图库，均为公开接口，无需 Key。
- **浏览器兼容**：使用了 Custom Elements 与 CSS 变量，建议 Chrome / Edge / Firefox / Safari 最新版。
