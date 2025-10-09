const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
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
