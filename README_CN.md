# Video Wallet

[English](./README.md) | 中文

Video Wallet 是一个现代化的网络应用程序，用于从各种在线平台下载和管理视频，使用 React.js、Tailwind CSS 和 FastAPI 构建。使用 yt-dlp 提供视频下载功能。

![](./assets/images/video-wallet-chs.png)

## 项目结构

```
vid-toolkit/
├── src/
│   ├── web/          # React.js 前端，使用 Tailwind CSS 和 TypeScript
│   └── server/       # FastAPI 后端服务
├── .vercel/          # Vercel 部署配置
├── README.md
└── package.json      # 根目录 package.json，包含便捷脚本
```

## 功能特性

- **视频页面分析**：分析视频 URL 以提取可用格式和质量选项
- **视频下载**：使用 yt-dlp 从支持的平台下载视频
- **视频库**：管理已下载的视频，包含元数据和缩略图
- **多语言支持**：英文和中文界面
- **现代化 UI**：响应式设计，深色主题和流畅动画
- **视频播放器**：内置视频播放器，支持本地播放

## 系统要求

- Node.js (v18 或更高版本)
- Python (v3.8 或更高版本)
- npm 或 yarn
- pip
- yt-dlp (随后端依赖自动安装)
- FFmpeg (yt-dlp 视频处理所需)

## 安装说明

### 快速安装（推荐）

使用根目录的便捷脚本：

1. 安装所有依赖：
   ```bash
   npm run setup
   ```

2. 启动前端：
   ```bash
   npm run dev:web
   ```

3. 启动后端（在另一个终端中）：
   ```bash
   npm run dev:server
   ```

### 手动安装

#### 前端安装 (React.js + Tailwind + TypeScript)

1. 进入 web 目录：
   ```bash
   cd src/web
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

   前端将在 `http://localhost:6173` 可用

#### 后端安装 (FastAPI)

1. 进入 server 目录：
   ```bash
   cd src/server
   ```

2. 创建虚拟环境（推荐）：
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

4. 启动 FastAPI 服务器：
   ```bash
   python main.py
   ```

   API 将在 `http://localhost:6800` 可用
   API 文档：`http://localhost:6800/docs`

## 配置

### Cookies（可选）

对于需要身份验证的某些平台，您可以在适当的位置放置 `cookies.txt` 文件。后端配置为在 `/home/azureuser/source/cookies.txt` 查找 cookies。如需要，您可以在 `main.py` 文件中修改此路径。

### 支持的平台

此应用程序支持从 yt-dlp 支持的任何平台下载视频，包括：
- YouTube
- Vimeo
- Dailymotion
- 以及更多（参见 [yt-dlp 支持的网站](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)）

## 使用方法

1. 启动前端和后端服务器（参见上面的安装说明）
2. 打开浏览器并导航到 `http://localhost:6173`
3. 输入来自支持平台的视频 URL（如 YouTube 等）
4. 点击"分析"查看可用的视频格式和质量选项
5. 选择您偏好的格式并点击"下载"
6. 下载完成后，视频将出现在您的视频库中
7. 使用视频库可以：
   - 本地播放视频
   - 将视频下载到您的设备
   - 管理您的视频收藏

## API 端点

### 视频分析和下载
- `POST /videopage_analyze` - 分析视频 URL 以提取可用格式
- `POST /videopage_download` - 下载特定视频格式
- `POST /videopage_save` - 将下载的视频保存到库中

### 视频库管理
- `GET /videopage_list` - 获取所有已保存视频的列表
- `GET /videopage_file/{video_id}` - 通过 ID 提供视频文件
- `GET /video_library/{filename}` - 直接提供视频文件
- `GET /download/{filename}` - 下载处理过的文件

## 开发

### 前端开发

前端使用以下技术构建：
- **React.js 18** 配合 TypeScript
- **Tailwind CSS** 用于样式和响应式设计
- **Vite** 用于构建工具和开发服务器
- **Lucide React** 用于图标
- **多语言支持**（英文/中文）
- **Context API** 用于状态管理

### 后端开发

后端使用以下技术构建：
- **FastAPI** 作为 Web 框架
- **Uvicorn** 作为 ASGI 服务器
- **yt-dlp** 用于视频下载和分析
- **python-multipart** 用于文件上传
- **python-ffmpeg** 用于视频处理
- **CORS 中间件** 用于跨域请求

### 已实现的关键功能

- ✅ 视频 URL 分析和格式检测
- ✅ 多质量视频下载
- ✅ 缩略图提取和管理
- ✅ 带元数据存储的视频库
- ✅ 本地视频播放
- ✅ 深色主题的响应式 UI
- ✅ 多语言界面
- ✅ 文件服务和下载功能

## 许可证

MIT License