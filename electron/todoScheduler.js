const schedule = require("node-schedule");
const notifier = require("node-notifier");
const nodemailer = require("nodemailer");
const { BrowserWindow } = require("electron");

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
        user: process.env.EMIAL_USER, // 你的邮箱地址
        pass: process.env.EMIAL_PWD, // 你的授权码
      },
    });
  }

  scheduleTask(task) {
    const jobId = task.id;
    // const scheduledTime = dayjs(task.scheduledTime).format("YYYY-MM-DD HH:mm:ss");
    console.log("========定时通知时间=====", task.scheduledTime);
    const job = schedule.scheduleJob(jobId, task.scheduledTime, async () => {
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
            from: process.env.EMIAL_USER,
            to: task.email,
            subject: `待办提醒: ${task.title}`,
            text: `您的待办事项 "${task.title}" 时间到了！\n\n描述: ${task.description || "无"}`,
          });
        }

        // 触发窗口抖动和声音
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => {
          if (win && !win.isDestroyed()) {
            console.log("都懂了？");
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

module.exports = TodoScheduler;
