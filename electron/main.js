// electron/main.js
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  nativeImage,
  dialog,
  shell,
  Notification,
  // session,
} = require("electron");
const { closeShotScreenWin, openShotScreenWin } = require("./utils");
const { ipcMainFn } = require("./ipcMain");
const { createTray, createShortcutKeys } = require("./utils/tray");
const path = require("path");
const process = require("process");
const fs = require("fs");
const schedule = require("node-schedule");
const notifier = require("node-notifier");
const nodemailer = require("nodemailer");
const mm = require("music-metadata"); // 用于解析音频文件元数据
const archiver = require("archiver"); // 用于创建zip文件
const { updater } = require("./buildConfig/updater.ts");

class TodoScheduler {
  constructor() {
    this.jobs = new Map();
    this.mailTransporter = null;
    this.initMailTransporter();
  }

  initMailTransporter() {
    // 配置邮件服务（这里使用QQ邮箱示例，你可以替换为其他服务商）
    this.mailTransporter = nodemailer.createTransport({
      host: "smtp.163.com", // 替换为你的 SMTP 服务器地址
      port: 465, // 替换为你的 SMTP 服务器端口
      secure: true, // 如果使用 TLS，则设置为 true
      auth: {
        user: "xxx@163.com", // 你的邮箱地址
        pass: "123456", // 你的授权码
      },
    });
  }

  scheduleTask(task) {
    const jobId = task.id;
    const scheduledTime = new Date(task.scheduledTime);

    const job = schedule.scheduleJob(scheduledTime, async () => {
      try {
        // 发送系统通知
        notifier.notify({
          title: "待办事项提醒",
          message: `任务: ${task.title}`,
          sound: true,
          wait: true,
        });

        // 发送邮件通知
        if (task.email && this.mailTransporter) {
          await this.mailTransporter.sendMail({
            from: "your-email@qq.com",
            to: task.email,
            subject: `待办提醒: ${task.title}`,
            text: `您的待办事项 "${task.title}" 时间到了！\n\n描述: ${task.description || "无"}`,
          });
        }

        // 触发窗口抖动和声音
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => {
          if (win && !win.isDestroyed()) {
            // 窗口抖动效果
            this.shakeWindow(win);
            // 发送渲染进程通知
            win.webContents.send("task-notification", task);
          }
        });

        // 任务完成后从列表中移除
        this.jobs.delete(jobId);
      } catch (error) {
        console.error("任务执行失败:", error);
      }
    });

    this.jobs.set(jobId, job);
    return jobId;
  }

  shakeWindow(win) {
    const initialPosition = win.getPosition();
    const shakeIntensity = 10;
    const shakeDuration = 500;
    const startTime = Date.now();

    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < shakeDuration) {
        const x =
          initialPosition[0] + (Math.random() - 0.5) * shakeIntensity * 2;
        const y =
          initialPosition[1] + (Math.random() - 0.5) * shakeIntensity * 2;
        win.setPosition(Math.floor(x), Math.floor(y));
        setTimeout(shake, 10);
      } else {
        win.setPosition(initialPosition[0], initialPosition[1]);
      }
    };
    shake();
  }

  cancelTask(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.cancel();
      this.jobs.delete(jobId);
      return true;
    }
    return false;
  }

  getScheduledTasks() {
    return Array.from(this.jobs.keys());
  }
}

const todoScheduler = new TodoScheduler();
// 打印环境变量，用于调试
console.log("当前环境:", process.env.NODE_ENV);

const gotTheLock = app.requestSingleInstanceLock();
let mainWindow;

let tray = null; // 在外面创建tray变量，防止被自动删除，导致图标自动消失

// 创建主窗口
function createWindow() {
  // 避免可以重复打开多个程序
  if (gotTheLock) {
    app.on("second-instance", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  } else {
    app.quit();
  }

  // 原文链接：https://blog.csdn.net/F520Hz/article/details/136544798
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // 保留菜单栏显示
    // titleBarStyle: "default",
    // frame: false,
    // autoHideMenuBar: false, // 确保菜单栏不自动隐藏
    // 以下两行是用来控制标题隐藏的
    titleBarStyle: "hidden",
    ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
    frame: true, //隐藏所有的边框，最小化那些
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      // // 禁用磁盘缓存
      // partition: "persist:main",
    },
    // 更换任务栏图标
    icon: nativeImage.createFromPath(
      path.resolve(
        __dirname,
        "/coding/20240320ww/my-umi-app/umi-template-wj/src/assets/imgs/flower.png"
      )
    ),
  });

  // 启用 Chrome DevTools Protocol
  win.webContents.debugger.attach("1.3");
  // 加载应用
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:8000");
    // win.loadFile("./electron/index.html");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  // 创建右下角的托盘图标
  createTray(win, tray);

  win.on("closed", (e) => {
    closeShotScreenWin();
    // e.preventDefault(); // 阻止退出程序
    // win.setSkipTaskbar(true); // 取消任务栏显示
    // win.hide(); // 隐藏主程序窗口
  });

  // mainWindow = win; // 将创建的窗口赋值给 mainWindow

  // 仅在开发环境下启用调试工具
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }

  return win;
}

app.whenReady().then(() => {
  // 解决窗口调用 hide() 和 show()  事件有明显闪屏现象
  app.commandLine.appendSwitch("wm-window-animations-disabled");
  // // 禁用缓存
  // session.defaultSession.clearCache();

  mainWindow = createWindow();
  // 更新版本
  updater(mainWindow, ipcMain);
  // 注册快捷键
  createShortcutKeys(mainWindow);
  // 注册全局快捷键
  globalShortcut.register("CommandOrControl+Shift+A", () => {
    if (mainWindow) {
      // mainWindow.webContents.send("ss:open-win");
      // TODO: 暂时注释掉，因为截图功能需要优化
      closeShotScreenWin();
      mainWindow.hide();
      openShotScreenWin();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 在应用退出时注销快捷键
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("ss:open-win", () => {
  closeShotScreenWin();
  mainWindow.hide();
  openShotScreenWin();
});

// document.addEventListener("keydown", (event) => {
//   // 检测是否同时按下Ctrl + Shift + I,自动打开开发者模式
//   if (event.ctrlKey && event.shiftKey && event.key === "I") {
//     // 阻止默认行为
//     event.preventDefault();

//     // 导入electron的进程通信API
//     const { ipcRenderer } = require("electron");
//     // 设置应用的控制台打开/关闭
//     ipcRenderer.send("SET_CONSOLE");
//   }
// });

// electron的入口文件
// 监听主线程的打开/关闭控制台事件
ipcMain.on("SET_CONSOLE", () => {
  // 判断当前是否打开控制台
  const isOpen = mainWindow.webContents.isDevToolsOpened();

  // 根据当前控制台的状态选择关闭/打开控制台
  if (isOpen) {
    // 关闭控制台
    mainWindow.webContents.closeDevTools();
  } else {
    // 打开控制台
    mainWindow.webContents.openDevTools();
  }
});

// 处理获取下载路径的请求
ipcMain.handle("get-downloads-path", (event, { filename }) => {
  return app.getPath(filename);
});

// 处理保存对话框
ipcMain.handle("show-save-dialog", async (event, options) => {
  const { filePath } = await dialog.showSaveDialog(options);
  return filePath;
});

// 处理文件保存
ipcMain.handle("save-file", async (event, { content, path }) => {
  try {
    await fs.promises.writeFile(path, Buffer.from(content));
    return path; // 返回保存的文件路径，而不是 true
  } catch (error) {
    console.error("保存文件失败:", error);
    throw error;
  }
});

// 添加 show-open-dialog 处理器
ipcMain.handle("show-open-dialog", async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(options);
    return result.filePaths;
  } catch (error) {
    console.error("打开对话框失败:", error);
    throw error;
  }
});

// 自定义标题栏窗口控制指令监听
ipcMain.handle("window-minimize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.handle("window-maximize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.handle("window-close", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

ipcMainFn();

// IPC 通信处理
ipcMain.handle("schedule-task", (event, task) => {
  return todoScheduler.scheduleTask(task);
});

ipcMain.handle("cancel-task", (event, jobId) => {
  return todoScheduler.cancelTask(jobId);
});

ipcMain.handle("get-scheduled-tasks", () => {
  return todoScheduler.getScheduledTasks();
});

// ============================音乐模块================================
// 检查路径是否存在
function checkPathExists(path) {
  try {
    return fs.existsSync(path);
  } catch (error) {
    return false;
  }
}

// 创建目录（如果不存在）
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 获取默认存储路径
function getDefaultStoragePath() {
  // 优先使用 W: 盘
  const wDrivePath = "W:\\WeddingMusic";
  if (checkPathExists("W:\\")) {
    ensureDirectoryExists(wDrivePath);
    return wDrivePath;
  }

  // 备用方案：用户文档目录
  const documentsPath = path.join(app.getPath("documents"), "WeddingMusic");
  ensureDirectoryExists(documentsPath);
  return documentsPath;
}

// 初始化存储路径
let currentStoragePath = getDefaultStoragePath();

// 选择存储目录
ipcMain.handle("select-storage-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "选择音乐存储目录",
    defaultPath: currentStoragePath,
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const newPath = result.filePaths[0];
    ensureDirectoryExists(newPath);
    currentStoragePath = newPath;

    // 保存配置
    const config = {
      storagePath: currentStoragePath,
      lastUpdated: new Date().toISOString(),
    };

    const configPath = path.join(app.getPath("userData"), "config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return {
      success: true,
      path: currentStoragePath,
    };
  }

  return { success: false };
});

// 获取存储路径
ipcMain.handle("get-storage-path", () => {
  // 尝试从配置文件读取
  try {
    const configPath = path.join(app.getPath("userData"), "config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.storagePath && checkPathExists(config.storagePath)) {
        currentStoragePath = config.storagePath;
      }
    }
  } catch (error) {
    console.log("Using default storage path");
  }

  return currentStoragePath;
});

// 打开存储目录
ipcMain.handle("open-storage-directory", () => {
  if (checkPathExists(currentStoragePath)) {
    shell.openPath(currentStoragePath);
    return { success: true };
  }
  return { success: false, error: "存储目录不存在" };
});

// 处理音乐文件选择和上传
ipcMain.handle("select-and-upload-music", async () => {
  try {
    // 选择文件
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "音频文件",
          extensions: ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"],
        },
      ],
      title: "选择音乐文件",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: "未选择文件" };
    }

    const uploadedFiles = [];

    for (const filePath of result.filePaths) {
      try {
        // 解析音乐文件元数据
        const metadata = await mm.parseFile(filePath);

        // 生成安全的文件名
        const originalName = path.basename(filePath);
        const fileExt = path.extname(filePath);
        const safeName = originalName.replace(
          /[^a-zA-Z0-9.\u4e00-\u9fa5]/g,
          "_"
        );
        const destPath = path.join(currentStoragePath, safeName);

        // 如果文件已存在，添加时间戳
        let finalDestPath = destPath;
        if (fs.existsSync(destPath)) {
          const timestamp = Date.now();
          const nameWithoutExt = path.basename(safeName, fileExt);
          finalDestPath = path.join(
            currentStoragePath,
            `${nameWithoutExt}_${timestamp}${fileExt}`
          );
        }

        // 复制文件到存储目录
        fs.copyFileSync(filePath, finalDestPath);

        // 提取封面图片
        let coverPath = null;
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const picture = metadata.common.picture[0];
          const coverExt = picture.format === "image/jpeg" ? ".jpg" : ".png";
          const coverName = `${path.basename(finalDestPath, fileExt)}${coverExt}`;
          coverPath = path.join(currentStoragePath, coverName);
          fs.writeFileSync(coverPath, picture.data);
        }

        // 格式化时长
        const duration = metadata.format.duration
          ? Math.floor(metadata.format.duration)
          : 0;

        uploadedFiles.push({
          success: true,
          title: metadata.common.title || path.basename(originalName, fileExt),
          artist: metadata.common.artist || "未知艺术家",
          album: metadata.common.album || "",
          duration: duration,
          cover: coverPath ? `file://${coverPath}` : "/api/placeholder/80/80",
          filePath: finalDestPath,
          url: `file://${finalDestPath}`,
          fileName: path.basename(finalDestPath),
          fileSize:
            Math.round((fs.statSync(finalDestPath).size / 1024 / 1024) * 100) /
            100, // MB
        });
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        uploadedFiles.push({
          success: false,
          filePath: filePath,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      files: uploadedFiles,
      total: result.filePaths.length,
      successful: uploadedFiles.filter((f) => f.success).length,
    };
  } catch (error) {
    console.error("Error in select-and-upload-music:", error);
    return { success: false, error: error.message };
  }
});

// 获取所有本地音乐
ipcMain.handle("get-local-music", async () => {
  try {
    if (!checkPathExists(currentStoragePath)) {
      ensureDirectoryExists(currentStoragePath);
      return [];
    }

    const files = fs.readdirSync(currentStoragePath);
    const musicFiles = files.filter((file) =>
      [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma"].includes(
        path.extname(file).toLowerCase()
      )
    );

    const musicList = [];
    for (const file of musicFiles) {
      const filePath = path.join(currentStoragePath, file);
      try {
        const metadata = await mm.parseFile(filePath);

        // 查找对应的封面文件
        const coverFiles = files.filter((f) => {
          const baseName = path.basename(file, path.extname(file));
          return (
            f.startsWith(baseName) &&
            [".jpg", ".jpeg", ".png"].includes(path.extname(f).toLowerCase())
          );
        });

        let cover = null;
        if (coverFiles.length > 0) {
          cover = `file://${path.join(currentStoragePath, coverFiles[0])}`;
        }

        const stats = fs.statSync(filePath);

        musicList.push({
          id: `music-${path.basename(file, path.extname(file))}`,
          title:
            metadata.common.title || path.basename(file, path.extname(file)),
          artist: metadata.common.artist || "未知艺术家",
          album: metadata.common.album || "",
          duration: metadata.format.duration
            ? Math.floor(metadata.format.duration)
            : 0,
          cover: cover || "/api/placeholder/80/80",
          filePath: filePath,
          url: `file://${filePath}`,
          fileName: file,
          fileSize: Math.round((stats.size / 1024 / 1024) * 100) / 100,
          addedDate: stats.birthtime.toISOString(),
        });
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
      }
    }

    return musicList;
  } catch (error) {
    console.error("Error reading music directory:", error);
    return [];
  }
});

// 下载选中的音乐为zip
ipcMain.handle("download-music-zip", async (event, musicList) => {
  try {
    const { filePath: zipPath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `婚礼音乐包_${new Date().toISOString().split("T")[0]}.zip`,
      filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
    });

    if (!zipPath) {
      return { success: false, error: "用户取消保存" };
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        resolve({
          success: true,
          path: zipPath,
          size: Math.round((archive.pointer() / 1024 / 1024) * 100) / 100,
        });
      });

      output.on("error", (err) => {
        reject(err);
      });

      archive.pipe(output);

      // 添加音乐文件到归档
      musicList.forEach((music) => {
        if (music.filePath && fs.existsSync(music.filePath)) {
          archive.file(music.filePath, {
            name: music.fileName || path.basename(music.filePath),
          });
        }
      });

      archive.finalize();
    });
  } catch (error) {
    console.error("Error creating zip archive:", error);
    return { success: false, error: error.message };
  }
});

// 删除音乐文件
ipcMain.handle("delete-music-file", async (event, music) => {
  try {
    if (music.filePath && fs.existsSync(music.filePath)) {
      fs.unlinkSync(music.filePath);

      // 尝试删除对应的封面文件
      const coverExts = [".jpg", ".jpeg", ".png"];
      const baseName = path.basename(
        music.filePath,
        path.extname(music.filePath)
      );

      coverExts.forEach((ext) => {
        const coverPath = path.join(
          path.dirname(music.filePath),
          baseName + ext
        );
        if (fs.existsSync(coverPath)) {
          fs.unlinkSync(coverPath);
        }
      });

      return { success: true };
    }
    return { success: false, error: "文件不存在" };
  } catch (error) {
    console.error("Error deleting music file:", error);
    return { success: false, error: error.message };
  }
});
