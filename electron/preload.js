const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // 置顶功能
  setAlwaysOnTop: (flag) =>
    ipcRenderer.invoke("window-set-always-on-top", flag),
  isAlwaysOnTop: () => ipcRenderer.invoke("window-is-always-on-top"),

  // 监听窗口状态变化
  onWindowStateChange: (callback) => {
    ipcRenderer.on("window-state-changed", callback);
    return () => ipcRenderer.removeListener("window-state-changed", callback);
  },
  // ===========================================
  scheduleTask: (task) => ipcRenderer.invoke("schedule-task", task),
  cancelTask: (jobId) => ipcRenderer.invoke("cancel-task", jobId),
  getScheduledTasks: () => ipcRenderer.invoke("get-scheduled-tasks"),
  onTaskNotification: (callback) =>
    ipcRenderer.on("task-notification", callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // 存储路径管理
  selectStorageDirectory: () => ipcRenderer.invoke("select-storage-directory"),
  getStoragePath: () => ipcRenderer.invoke("get-storage-path"),
  openStorageDirectory: () => ipcRenderer.invoke("open-storage-directory"),

  // 音乐文件管理
  selectAndUploadMusic: () => ipcRenderer.invoke("select-and-upload-music"),
  getLocalMusic: () => ipcRenderer.invoke("get-local-music"),
  deleteMusicFile: (music) => ipcRenderer.invoke("delete-music-file", music),

  // 下载功能
  downloadMusicZip: (musicList) =>
    ipcRenderer.invoke("download-music-zip", musicList),
});
