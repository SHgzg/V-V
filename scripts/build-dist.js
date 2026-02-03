#!/usr/bin/env node

/**
 * V-V PKM Desktop - L1 构建产物生成脚本
 *
 * 遵循发布和部署规范 v1
 * 生成符合 L1 层级的 dist 目录结构
 */

import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const desktopDir = join(rootDir, 'apps', 'desktop')
const distDir = join(desktopDir, 'dist')
const outDir = join(desktopDir, 'out')

/**
 * 递归复制目录
 */
function copyDirectory(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }

  const entries = readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * 递归计算目录哈希
 */
function computeHash(dir) {
  const hash = createHash('sha256')

  function walk(path) {
    const stat = statSync(path)
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path)) {
        walk(join(path, entry))
      }
    } else {
      const content = readFileSync(path)
      hash.update(content)
      hash.update(path)
    }
  }

  walk(dir)
  return hash.digest('hex').substring(0, 16)
}

/**
 * 获取 Git commit hash
 */
function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: rootDir, encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

/**
 * 获取包版本
 */
function getPackageVersion() {
  const pkgPath = join(desktopDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  return pkg.version
}

/**
 * 生成 manifest.json
 */
function generateManifest() {
  const gitHash = getGitCommitHash()
  const version = getPackageVersion()
  const buildTime = new Date().toISOString()
  const artifactsHash = computeHash(outDir)

  const manifest = {
    name: 'v-v-pkm-desktop',
    version,
    buildTime,
    gitCommit: gitHash,
    artifactsHash,
    structure: {
      main: 'main/',
      preload: 'preload/',
      renderer: 'renderer/',
      runtime: 'runtime/'
    },
    modules: {
      '@v-v/shared': getModuleVersion('shared'),
      '@v-v/git-adapter': getModuleVersion('git-adapter'),
      '@v-v/window-manager': getModuleVersion('window-manager')
    }
  }

  writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`✓ Generated manifest.json`)
}

/**
 * 获取模块版本
 */
function getModuleVersion(name) {
  const pkgPath = join(rootDir, 'packages', name, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return pkg.version
  }
  return 'unknown'
}

/**
 * 复制 runtime 依赖
 */
function copyRuntimeDeps() {
  const runtimeDir = join(distDir, 'runtime')
  const nodeModulesDir = join(runtimeDir, 'node_modules')

  console.log('Copying runtime dependencies...')

  // 创建 runtime/node_modules 目录
  if (!existsSync(nodeModulesDir)) {
    mkdirSync(nodeModulesDir, { recursive: true })
  }

  // 复制 workspace 包到 runtime/node_modules
  const packages = ['shared', 'git-adapter', 'window-manager']
  for (const pkg of packages) {
    const srcDistDir = join(rootDir, 'packages', pkg, 'dist')
    const destDir = join(nodeModulesDir, `@v-v`, pkg)

    if (existsSync(srcDistDir)) {
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true })
      }
      copyDirectory(srcDistDir, destDir)
      console.log(`  ✓ Copied @v-v/${pkg}`)
    } else {
      console.warn(`  ⚠ Warning: ${srcDistDir} not found. Run 'pnpm -r build' first.`)
    }
  }

  // 复制 workspace 包的 package.json
  for (const pkg of packages) {
    const srcPkgJson = join(rootDir, 'packages', pkg, 'package.json')
    const destPkgJson = join(nodeModulesDir, `@v-v`, pkg, 'package.json')

    if (existsSync(srcPkgJson)) {
      copyFileSync(srcPkgJson, destPkgJson)
    }
  }

  // 创建 runtime package.json（用于依赖解析）
  const runtimePkg = {
    name: 'v-v-runtime',
    private: true,
    dependencies: {
      '@v-v/shared': 'workspace:*',
      '@v-v/git-adapter': 'workspace:*',
      '@v-v/window-manager': 'workspace:*',
      'isomorphic-git': '^1.27.1'
    }
  }
  writeFileSync(join(runtimeDir, 'package.json'), JSON.stringify(runtimePkg, null, 2))
}

/**
 * 复制 desktop package.json
 */
function copyPackageJson() {
  const srcPkg = join(desktopDir, 'package.json')
  const destPkg = join(distDir, 'package.json')

  const pkg = JSON.parse(readFileSync(srcPkg, 'utf-8'))

  // 修改 main 字段指向 dist 目录
  pkg.main = './main/index.js'

  writeFileSync(destPkg, JSON.stringify(pkg, null, 2))
  console.log(`✓ Copied package.json`)
}

/**
 * 主构建流程
 */
function build() {
  console.log('Building V-V PKM Desktop L1 artifacts...\n')

  // 清理旧 dist
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true })
  }
  mkdirSync(distDir, { recursive: true })

  // 1. 构建 workspace 包
  console.log('\n1. Building workspace packages...')
  try {
    execSync('pnpm -r --filter "./packages/*" build', { cwd: rootDir, stdio: 'inherit' })
  } catch (err) {
    console.error('Failed to build workspace packages')
    process.exit(1)
  }

  // 2. 构建 Electron 应用
  console.log('\n2. Building Electron app...')
  try {
    execSync('pnpm --filter desktop build', { cwd: rootDir, stdio: 'inherit' })
  } catch (err) {
    console.error('Failed to build Electron app')
    process.exit(1)
  }

  // 3. 复制构建产物到 dist
  console.log('\n3. Copying build artifacts to dist/...')
  if (!existsSync(outDir)) {
    console.error(`out/ directory not found at ${outDir}`)
    process.exit(1)
  }

  copyDirectory(outDir, distDir)
  console.log('  ✓ Copied out/ → dist/')

  // 4. 复制 runtime 依赖
  console.log('\n4. Setting up runtime dependencies...')
  copyRuntimeDeps()

  // 5. 生成 manifest.json
  console.log('\n5. Generating manifest.json...')
  generateManifest()

  // 6. 复制 package.json
  console.log('\n6. Copying package.json...')
  copyPackageJson()

  console.log('\n✓ L1 build artifacts generated successfully!')
  console.log(`  dist/ location: ${distDir}`)
  console.log('\nStructure:')
  console.log('  dist/')
  console.log('  ├── main/')
  console.log('  ├── preload/')
  console.log('  ├── renderer/')
  console.log('  ├── runtime/')
  console.log('  │   └── node_modules/')
  console.log('  │       └── @v-v/')
  console.log('  ├── manifest.json')
  console.log('  └── package.json')
}

// 运行构建
build()
