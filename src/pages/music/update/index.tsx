import React, { useState, useEffect } from "react";
const { ipcRender } = window.electronAPI;

const App = () => {
  // 页面上的提示信息
  const [text, setText] = useState("");
  // 当前应用版本信息
  const [version, setVersion] = useState("0.0.0");
  // 当前下载进度
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 给主进程发通知，让主进程告诉我们当前应用的版本是多少
    ipcRender.send("checkAppVersion");
    // 接收主进程发来的通知，检测当前应用版本
    ipcRender.receive("version", (version) => {
      setVersion(version);
    });

    // 给主进程发通知，检测当前应用是否需要更新
    ipcRender.send("checkForUpdate");
    // 接收主进程发来的通知，告诉用户当前应用是否需要更新
    ipcRender.receive("message", (data) => {
      setText(data);
    });
    // 如果当前应用有新版本需要下载，则监听主进程发来的下载进度
    ipcRender.receive("downloadProgress", (data) => {
      const progress = parseInt(data.percent, 10);
      setProgress(progress);
    });
  }, []);

  return (
    <div>
      <p>current app version: {version}</p>
      <p>{text}</p>
      {progress ? <p>下载进度：{progress}%</p> : null}
    </div>
  );
};

export default App;
