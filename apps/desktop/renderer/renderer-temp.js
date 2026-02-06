/**
 * 获取面板 URL 基础路径
 */
function getPanelUrl(name) {
  // 在 Electron 中，我们需要使用完整的 file:// 路径
  // 面板文件位于 out/renderer/panels/ 目录
  const { app } = window.electronAPI || {}
  const basePath = app.getPath ? app.getAppPath() : ''
  
  // 如果在打包后的应用中，路径是 app.getPath('exe')/../out/renderer/panels/
  // 如果在开发模式，使用相对路径由开发服务器处理
  
  const isDev = !window.electronAPI || process.env.NODE_ENV !== 'production'
  
  if (isDev) {
    // 开发模式：使用绝对路径
    return `file:///D:/project/V-V/apps/desktop/renderer/panels/${name}.html`
  } else {
    // 生产模式：使用相对于应用资源的路径
    // BrowserView 需要完整的 file:// 路径
    return `file:///${basePath}/out/renderer/panels/${name}.html`
  }
}
