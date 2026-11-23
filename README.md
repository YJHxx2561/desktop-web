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
| 音乐播放器 | 65 首本地音乐，旋转封面、播放/暂停、上下曲、三种循环模式、音量、播放列表、系统媒体键 |
| 壁纸 | 樱花 DMOE / 作者自建随机图 / 两者随机三种图源，按屏幕比例自动选横屏或竖屏，可手动换图 |
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
│   ├── icons/                 ★ 所有图标资源集中在此
│   │   ├── icons-data.js      图标 SVG 数据
│   │   ├── iconify-icon.min.js 轻量图标组件
│   │   ├── doubao.png         豆包站点图片图标
│   │   └── gov.svg            萌ICP备案徽标
│   ├── music/                 本地音乐与封面（约 615 MB，按播放列表顺序编号 01-）
│   │   ├── 01-歌名.mp3
│   │   └── cover/01-歌名.webp
│   └── vendor/                第三方库，运行时不访问 CDN
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
| 增删音乐 | `MUSIC_SONGS`，每首一行 `song(文件名, 歌名, 歌手)`；mp3 放 `assets/music/`，封面放 `assets/music/cover/`（同名，webp/jpg/png 自动识别） |
| 改站点起始时间 | `UPTIME_START` |
| 改统计后端 | `STATS_API` |

> **新增网站/应用**：在 `SITES` 里加一行 `site(标题, 网址, 图标名)` 即可（见文件内 `site()` 辅助函数）。图标名来自 [Iconify](https://icon-sets.iconify.design/)，用新图标名时需把它加进 `assets/icons/icons-data.js` 的 `window.__ICONS__`（格式 `{"前缀:名称":{"body":"<svg内部内容>","w":24,"h":24}}`），否则图标空白；也可用 `img` 字段直接指定 `assets/icons/` 下的本地图片。
>
> **音乐文件命名**：`assets/music/` 里的 mp3 与 `assets/music/cover/` 里的封面按播放列表顺序统一编号为 `01-歌名`、`02-歌名`……，封面与音频同名、扩展名任意（webp/jpg/png 自动识别）。新增歌曲后按此格式命名并在 `MUSIC_SONGS` 加一行 `song(文件名, 歌名, 歌手)`。

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

> 注意：项目约 615 MB（音乐文件），上传可能较慢；单文件最大 14.5 MB，在 Pages 单文件限制内。

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

- **音乐资源较大 / R2 加速**：`assets/music/` 约 615 MB。项目内置 **本地优先、Cloudflare R2 回退** 机制：
  - `assets/music/` 下全部 65 首 mp3 + 65 张封面已上传到 R2 的 `music` 桶，键名与本地一一对应（`music/01-歌名.mp3`、`music/cover/01-歌名.webp`）；
  - 桶已绑定公开自定义域 `https://musicfiles.yjh-web.eu.cc`（公开可读，无需任何密钥，仓库中无敏感信息），已填入 `config.js` 的 `MUSIC_CDN_BASE`；
  - 本地文件加载超过 `MUSIC_CDN_TIMEOUT`（默认 3000 毫秒）仍未就绪、或加载失败时，自动切到 R2 同名文件，播放器歌名旁显示 `R2` 标记；本地正常则显示 `本地`；
  - 把 `MUSIC_CDN_BASE` 留空即关闭回退，只用本地文件（不会有任何等待）。
  
  日后新增歌曲：文件同时放进本地 `assets/music/` 和 R2 桶（同名），再在 `MUSIC_SONGS` 加一行即可。
- **访问统计**：使用与 SunPanel 相同的 WebViso 后端（`stats.web.yjhup.com`）。若不想统计，删除 `config.js` 中的 `statsApi` 即可。
- **天气 / 壁纸**：来自 Open-Meteo、樱花 DMOE 和作者自建随机图，均为公开接口，无需 Key。
- **浏览器兼容**：使用了 Custom Elements 与 CSS 变量，建议 Chrome / Edge / Firefox / Safari 最新版。
