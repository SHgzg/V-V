# V-V PKM Desktop

Personal Knowledge Management Desktop System - 基于 Electron + TypeScript 的个人知识管理桌面系统。

## 技术栈

- **Electron** - 桌面应用框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **pnpm** - 高效的包管理器
- **isomorphic-git** - 纯 JavaScript Git 实现

## 项目结构

```
pkm-desktop/
├── apps/
│   └── desktop/              # Electron 应用
│       ├── main/             # 主进程
│       ├── preload/          # IPC Bridge
│       └── renderer-host/    # 前端宿主
│
├── packages/
│   ├── shared/               # 通用类型
│   ├── window-manager/       # 多窗口管理
│   └── git-adapter/          # Git 引擎
│
└── workspace/                # 用户本地工作区（运行时生成）
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

## 核心设计原则

1. **Git 是唯一事实源** - 所有数据通过 Git 管理
2. **AI 永不直接写文件或操作 Git** - AI 仅提供辅助建议
3. **Electron 只提供 OS 能力** - 不承载业务逻辑
4. **前端应用可插拔** - 支持多种前端框架
5. **主进程是系统状态裁决者** - 所有有副作用的操作在主进程

## MVP 功能

- ✅ 单仓库管理
- ✅ 单窗口界面
- ✅ Git 操作（clone, pull, status, commit, push）

## 后续计划

- [ ] 多仓库支持
- [ ] 多窗口管理
- [ ] Markdown 编辑器
- [ ] AI 辅助功能
- [ ] 全文搜索
- [ ] 前端子应用系统

## License

MIT
