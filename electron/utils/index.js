const {
  app,
  BrowserWindow,
  shell,
  dialog,
  DownloadItem,
  WebContents,
  clipboard,
  nativeImage,
  screen,
} = require("electron");
const path = require("path");

let shotScreenWin = null;
let savePath = "";

function getScreenSize() {
  const { size, scaleFactor } = screen.getPrimaryDisplay();
  return {
    width: size.width * scaleFactor,
    height: size.height * scaleFactor,
  };
}

function createShotScreenWin() {
  const { width, height } = getScreenSize();
  shotScreenWin = new BrowserWindow({
    title: "pear-rec 截屏",
    // icon: path.join(PUBLIC, "logo@2x.ico"),
    width, // 宽度(px), 默认值为 800
    height, // 高度(px), 默认值为 600
    autoHideMenuBar: true, // 自动隐藏菜单栏
    useContentSize: true, // width 和 height 将设置为 web 页面的尺寸
    movable: false, // 是否可移动
    frame: false, // 无边框窗口
    resizable: false, // 窗口大小是否可调整
    hasShadow: false, // 窗口是否有阴影
    transparent: true, // 使窗口透明
    fullscreenable: true, // 窗口是否可以进入全屏状态
    fullscreen: true, // 窗口是否全屏
    simpleFullscreen: true, // 在 macOS 上使用 pre-Lion 全屏
    alwaysOnTop: false, // 窗口是否永远在别的窗口的上面
    webPreferences: {
      // preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  // shotScreenWin.webContents.openDevTools();

  shotScreenWin.loadURL("http://localhost:8000/#/album/screenshot");

  shotScreenWin.maximize();
  shotScreenWin.setFullScreen(true);

  shotScreenWin?.webContents.session.on(
    "will-download",
    (e, item, webContents) => {
      const fileName = item.getFilename();
      debugger;
      const ssFilePath = path.join(
        savePath || `${__dirname}/public`,
        `${fileName}`
      );
      item.setSavePath(ssFilePath);
      item.once("done", (event, state) => {
        if (state === "completed") {
          copyImg(ssFilePath);
          //   setHistoryImg(ssFilePath);
          setTimeout(() => {
            closeShotScreenWin();
            // shell.showItemInFolder(ssFilePath);
          }, 1000);
        }
      });
    }
  );

  return shotScreenWin;
}

// 打开关闭录屏窗口
function closeShotScreenWin() {
  shotScreenWin?.isDestroyed() || shotScreenWin?.close();
  shotScreenWin = null;
}

function openShotScreenWin() {
  if (!shotScreenWin || shotScreenWin?.isDestroyed()) {
    shotScreenWin = createShotScreenWin();
  }
  // createShotScreenWin();
  shotScreenWin?.show();
}

function showShotScreenWin() {
  shotScreenWin?.show();
}

function hideShotScreenWin() {
  shotScreenWin?.hide();
}

function minimizeShotScreenWin() {
  shotScreenWin?.minimize();
}

function maximizeShotScreenWin() {
  shotScreenWin?.maximize();
}

function unmaximizeShotScreenWin() {
  shotScreenWin?.unmaximize();
}

async function downloadURLShotScreenWin(downloadUrl, isShowDialog) {
  savePath = "";
  isShowDialog && (savePath = await showOpenDialogShotScreenWin());
  shotScreenWin?.webContents.downloadURL(downloadUrl);
}

async function showOpenDialogShotScreenWin() {
  let res = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  const savePath = res.filePaths[0] || "";

  return savePath;
}

function copyImg(filePath) {
  const image = nativeImage.createFromPath(filePath);
  clipboard.writeImage(image);
}
const guid = () => {
  return "xxxxxxxx-xxxx-6xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
// 原文链接：https://blog.csdn.net/F520Hz/article/details/136544798
module.exports = {
  createShotScreenWin,
  closeShotScreenWin,
  openShotScreenWin,
  showShotScreenWin,
  hideShotScreenWin,
  minimizeShotScreenWin,
  maximizeShotScreenWin,
  unmaximizeShotScreenWin,
  downloadURLShotScreenWin,
  getScreenSize,
  guid,
};
