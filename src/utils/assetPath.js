/**
 * 资源路径工具函数
 * 用于处理开发环境和生产环境的资源路径差异
 */

/**
 * 获取正确的资源路径
 * @param {string} path - 相对于 public 目录的路径，以 / 开头
 * @returns {string} 处理后的完整路径
 */
export function getAssetPath(path) {
  // 确保路径以 / 开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // 在生产环境中，Vite 会自动处理 base URL
  // 在开发环境中，直接返回路径
  return path;
}

/**
 * 获取事件图片路径
 * @param {string} imageName - 图片文件名
 * @returns {string} 完整的图片路径
 */
export function getEventImagePath(imageName) {
  return getAssetPath(`/assets/events/${imageName}`);
}
