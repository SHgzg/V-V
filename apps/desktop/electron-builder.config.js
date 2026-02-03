/**
 * V-V PKM Desktop - electron-builder 配置
 *
 * 遵循发布和部署规范 v1
 * 生成符合 L2 层级的发布物料（安装包）
 */

module.exports = {
  productName: 'V-V PKM',
  appId: 'com.v-v.pkm.desktop',

  // 目录配置
  directories: {
    buildResources: 'build',
    output: 'release'
  },

  // 包含的文件（从 dist/ 目录打包）
  files: [
    'dist/**/*',
    'package.json'
  ],

  // 额外文件
  extraFiles: [],

  // 发布配置（用于自动更新）
  publish: {
    provider: 'github',
    owner: 'your-username', // 替换为实际的 GitHub 用户名
    repo: 'V-V'
  },

  // Windows 配置
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'zip',
        arch: ['x64']
      }
    ],
    icon: 'build/icon.ico',
    // 发布到 GitHub 生成 latest.yml
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}'
  },

  // NSIS 安装程序配置
  nsis: {
    oneClick: true,
    allowToChangeInstallationDirectory: false,
    perMachine: false,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'V-V PKM'
  },

  // macOS 配置
  mac: {
    target: [
      'dmg',
      'zip'
    ],
    category: 'public.app-category.productivity',
    icon: 'build/icon.icns',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}'
  },

  // Linux 配置
  linux: {
    target: ['AppImage'],
    category: 'Office',
    icon: 'build/icons',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}'
  },

  // 生成 checksums.txt
  afterPack: './scripts/afterPack.js',
  afterAllArtifactBuild: './scripts/afterAllArtifactBuild.js'
}
