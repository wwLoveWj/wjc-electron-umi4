// import { is } from "@electron-toolkit/utils";
const { BrowserWindow, dialog, shell, ipcMain, app } = require("electron");
const { autoUpdater } = require("electron-updater");

function updater(win) {
  // 自动下载更新
  autoUpdater.autoDownload = false;
  // 退出时自动安装更新
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.forceDevUpdateConfig = true;
  // 需要调试本地更新时下面这行请注释
  if (process.env.NODE_ENV === "development") return;
  const checkForUpdates = (manual = false) => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("Error checking for updates:", error);
    });

    if (manual) {
      dialog.showMessageBox({
        type: "info",
        title: "检查更新",
        message: "正在检查更新...",
      });
    }
  };
  // 监听来自渲染进程的手动检查更新请求
  ipcMain.on("startForCheckUpdate", () => {
    checkForUpdates();
  });

  // 监听来自渲染进程的手动检查更新请求，我们需要主动触发一次更新检查
  ipcMain.on("checkForUpdate", () => {
    console.log("更新吗======");
    // 当我们收到渲染进程传来的消息，主进程就就进行一次更新检查
    checkForUpdates(true);
  });
  // 当前引用的版本告知给渲染层
  ipcMain.on("checkAppVersion", () => {
    win.webContents.send("version", app.getVersion());
  });
  // 检测是否需要更新
  // autoUpdater.on("checking-for-update", () => {
  //   checkForUpdates(true);
  //   console.log("检查============");
  // });
  // 有新版本时
  autoUpdater.on("update-available", (info) => {
    dialog
      .showMessageBox({
        type: "info",
        title: "更新提示",
        message: `发现新版本 ${info.version}，是否更新？`,
        detail: info.releaseNotes ? `更新说明：${info.releaseNotes}` : "",
        buttons: ["更新", "取消"],
        cancelId: 1,
      })
      .then((res) => {
        if (res.response === 0) {
          // 开始下载更新
          autoUpdater.downloadUpdate();
        }
      });
  });

  // 没有新版本时
  autoUpdater.on("update-not-available", (info) => {
    dialog.showMessageBox({
      type: "info",
      title: "更新提示",
      message: `当前版本 ${info.version} 已是最新版本`,
    });
  });

  // 监听下载进度
  autoUpdater.on("download-progress", (prog) => {
    win.webContents.send("downloadProgress", {
      speed: Math.ceil(prog.bytesPerSecond / 1000), // 网速
      percent: Math.ceil(prog.percent), // 百分比
    });
  });

  // 更新下载完毕
  autoUpdater.on("update-downloaded", () => {
    win.webContents.send("downloaded");
    dialog
      .showMessageBox({
        type: "info",
        title: "更新已就绪",
        message: "更新已下载完成，是否立即安装？",
        buttons: ["是", "否"],
        cancelId: 1,
      })
      .then((res) => {
        if (res.response === 0) {
          // 退出并安装更新
          autoUpdater.quitAndInstall();
        }
      });
  });

  // 更新发生错误
  autoUpdater.on("error", (error) => {
    dialog
      .showMessageBox({
        type: "error",
        title: "更新错误",
        message: "软件更新过程中发生错误",
        detail: error ? error.toString() : "",
        buttons: ["网站下载", "取消更新"],
        cancelId: 1,
      })
      .then((res) => {
        if (res.response === 0) {
          shell.openExternal(
            "https://github.com/wwLoveWj/wjc-electron-umi4/releases"
          );
        }
      });
  });
}

module.exports = { updater };
