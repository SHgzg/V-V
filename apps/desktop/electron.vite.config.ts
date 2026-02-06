import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

// V-V PKM Desktop - electron-vite 配置
// 遵循构建约束规范 v1

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    // 主进程配置
    main: {
      plugins: [externalizeDepsPlugin()],
      build: {
        sourcemap: isProduction ? false : 'inline',
        rollupOptions: {
          input: 'main/index.ts',
          // 白名单机制：明确声明所有外部模块
          external: [
            'electron',
            '@v-v/shared',
            '@v-v/git-adapter',
            '@v-v/layout-manager',
            '@v-v/window-manager',
            // 禁止使用宽泛正则：/^@v-v\//
          ]
        },
        minify: isProduction
      }
    },

    // 预加载脚本配置（多个预加载脚本）
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        sourcemap: isProduction ? 'hidden' : 'inline',
        rollupOptions: {
          // 多个输入入口
          input: {
            index: 'preload/index.ts',
            'sub-frontend-preload': 'preload/sub-frontend-preload.ts'
          },
          external: [
            'electron'
          ]
        },
        minify: isProduction
      }
    },

    // 渲染进程配置
    renderer: {
      root: 'renderer',
      build: {
        sourcemap: isProduction ? true : 'inline',
        rollupOptions: {
          input: 'renderer/index.html'
        },
        minify: isProduction
      }
    }
  }
})
