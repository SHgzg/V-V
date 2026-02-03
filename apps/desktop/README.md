# V-V PKM Desktop

Personal Knowledge Management Desktop System

遵循 [构建约束规范 v1](../../参考/构建/构建约束规范v1.md) | [发布和部署规范 v1](../../参考/构建/发布和部署规范.md) | [插件与子前端构建隔离规范 v1](../../参考/构建/插件与子前端构建隔离规范v1.md)

## 项目结构

```
apps/desktop/
├── main/               # Electron 主进程
│   ├── index.ts        # 应用入口
│   ├── ipc/            # IPC 处理器
│   ├── window/         # 窗口创建
│   └── updater/        # 自动更新模块
├── preload/            # 预加载脚本
│   └── index.ts        # ContextBridge API 暴露
├── renderer/           # 渲染进程
│   ├── index.html      # HTML 入口
│   └── renderer.js     # 应用逻辑
├── out/                # Electron-vite 构建输出（中间产物）
├── dist/               # L1 构建产物（可运行内核）
├── release/            # L2 发布物料（安装包）
├── build/              # electron-builder 资源
├── electron.vite.config.ts
├── electron-builder.config.js
└── package.json

packages/               # Workspace 包
├── shared/             # L0 - 纯类型/常量
├── git-adapter/        # L1 - Node 运行时库
└── window-manager/     # L2 - Electron 专属库
```

## 架构设计原则

### 1. 三层构建模型

```
L1: 构建产物 (dist/)
    ├── main/
    ├── preload/
    ├── renderer/
    ├── runtime/node_modules/
    ├── manifest.json
    └── package.json
    ↓ (electron-builder)
L2: 发布物料 (release/)
    ├── V-V-PKM-Setup-1.0.0.exe
    ├── V-V-PKM-1.0.0-win.zip
    └── latest.yml
    ↓ (自动更新)
L3: 更新增量包 (用户端)
```

### 2. 构建隔离原则

| 层级 | 模块系统 | 外部依赖 | sourcemap |
|------|---------|---------|-----------|
| 主进程 | CommonJS | electron, @v-v/* | 生产关闭，开发内联 |
| 预加载 | CommonJS | electron | 生产 hidden，开发内联 |
| 渲染 | ESM | 完全打包 | 始终开启 |

### 3. Workspace 包分级

- **L0** (`@v-v/shared`): 纯类型/常量，无运行时依赖
- **L1** (`@v-v/git-adapter`): Node 运行时库
- **L2** (`@v-v/window-manager`): Electron 专属库

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 构建 workspace 包
pnpm -r --filter "./packages/*" build

# 构建 Electron 应用 (out/)
pnpm build

# 构建 L1 产物 (dist/)
pnpm build:l1

# 构建 L2 发布物料 (release/)
pnpm build:l2

# 完整构建流程
pnpm build:all

# 清理构建产物
pnpm clean

# 类型检查
pnpm typecheck

# 预览构建后的应用
pnpm preview
```

## 发布流程

### Git Tag 发布（推荐）

```bash
# 1. 更新版本号
npm version patch/minor/major

# 2. 提交并推送标签
git push origin main --tags

# 3. GitHub Actions 自动构建并发布到 Release
```

### 本地构建发布

```bash
# 1. 构建 L1 + L2
pnpm build:all

# 2. 检查 release/ 目录
ls apps/desktop/release/
```

## 技术栈

- **构建工具**: electron-vite 4.0 (Vite 5.4)
- **打包工具**: electron-builder 25.1
- **自动更新**: electron-updater 6.3
- **框架**: Electron 30
- **语言**: TypeScript 5.3
- **包管理**: pnpm workspace (shamefully-hoist=false)

## 构建产物

### L1 构建产物 (dist/)

```
dist/
├── main/index.js           # 主进程
├── preload/index.js        # 预加载脚本
├── renderer/               # 渲染进程
│   ├── index.html
│   └── assets/
├── runtime/                # 运行时依赖
│   ├── node_modules/
│   │   └── @v-v/
│   └── package.json
├── manifest.json           # 构建清单
└── package.json
```

### L2 发布物料 (release/)

**Windows**:
- `V-V-PKM-Setup-1.0.0.exe` - 安装程序
- `V-V-PKM-1.0.0-win.zip` - 便携版
- `latest.yml` - 更新清单

**macOS**:
- `V-V-PKM-1.0.0.dmg` - 磁盘映像
- `V-V-PKM-1.0.0-mac.zip` - 归档
- `latest-mac.yml` - 更新清单

**Linux**:
- `V-V-PKM-1.0.0.AppImage` - 便携应用

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Electron 30
- Git (用于发布流程)

## 工作空间包

所有 workspace 包遵循强制规范：

- `type: "commonjs"` - CommonJS 模块系统
- `level: "L0/L1/L2"` - 包级别声明
- `exports: { ".": "./dist/index.js" }` - 导出入口
- `sideEffects: false` - 无副作用优化

### 包列表

- `@v-v/shared` - 共享类型定义和常量 (L0)
- `@v-v/git-adapter` - Git 操作适配器 (L1)
- `@v-v/window-manager` - Electron 窗口管理器 (L2)

## 自动更新机制

应用在打包后会自动检查 GitHub Release 上的更新：

- 检查频率: 每 4 小时
- 更新源: GitHub Release
- 更新方式: 静默下载 + 退出时安装

## 配置文件说明

| 文件 | 用途 |
|------|------|
| [.npmrc](../../.npmrc) | pnpm 配置 (public-hoist-pattern) |
| [tsconfig.base.json](../../tsconfig.base.json) | TypeScript 基础配置 |
| [electron.vite.config.ts](electron.vite.config.ts) | electron-vite 构建配置 |
| [electron-builder.config.js](electron-builder.config.js) | electron-builder 打包配置 |
| [.github/workflows/release.yml](../../.github/workflows/release.yml) | GitHub Actions 发布流程 |

## 注意事项

⚠️ **pnpm 配置**: 禁止使用 `shamefully-hoist=true`，改用 `public-hoist-pattern[]`

⚠️ **external 策略**: 禁止使用宽泛正则 `@v-v/*`，必须使用白名单

⚠️ **构建顺序**: 必须先构建 workspace 包，再构建 Electron 应用

## 常见问题

### Windows + Git Bash 环境问题

在某些环境中 Electron 模块注入可能失效。建议：
- 使用 PowerShell 或 CMD 运行
- 或在纯 Windows 环境中开发

### workspace 包找不到

```bash
# 确保所有包已构建
pnpm -r --filter "./packages/*" build

# 清理并重新安装
pnpm clean
pnpm install
```

### 发布失败

检查以下配置：
1. `package.json` 中的 `build.publish.owner` 和 `repo`
2. GitHub Token 权限
3. Git tag 格式是否正确 (v*.*.*)

## 架构文档

- [构建约束规范 v1](../../参考/构建/构建约束规范v1.md)
- [发布和部署规范 v1](../../参考/构建/发布和部署规范.md)
- [插件与子前端构建隔离规范 v1](../../参考/构建/插件与子前端构建隔离规范v1.md)
- [构建分析](../../参考/构建/当前构建分析.md)
