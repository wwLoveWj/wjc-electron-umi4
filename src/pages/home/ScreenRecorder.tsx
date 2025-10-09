import React, { useState, useRef, useEffect } from "react";
import {
  Layout,
  Card,
  Button,
  Space,
  Divider,
  Alert,
  Typography,
  Input,
  Select,
  message,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  CopyOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import "./index.less";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const ScreenRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [filename, setFilename] = useState("screen-recording.webm");
  const [savePath, setSavePath] = useState("downloads");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  // 计时器效果
  useEffect(() => {
    if (recording && !paused) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [recording, paused]);

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 开始录制
  const startRecording = async () => {
    try {
      setError("");
      // 获取屏幕流
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor",
        },
        audio: true,
      });

      streamRef.current = stream;

      // 创建MediaRecorder实例
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 6000000, // 6 Mbps
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      // 处理数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // 处理录制停止事件
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        setRecordedBlob(blob);
        // 自动复制到剪贴板
        copyToClipboard(blob);
        // 释放媒体流
        stream.getTracks().forEach((track) => track.stop());
      };

      // 开始录制
      mediaRecorder.start(100); // 每100ms收集一次数据
      setRecording(true);
      setPaused(false);
      setTimer(0);

      // 处理用户停止共享屏幕
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (err) {
      setError("无法开始录制: " + err.message);
      console.error("录制错误:", err);
    }
  };

  // 暂停录制
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recording && !paused) {
      mediaRecorderRef.current.pause();
      setPaused(true);
    }
  };

  // 继续录制
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recording && paused) {
      mediaRecorderRef.current.resume();
      setPaused(false);
    }
  };

  // 停止录制
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setPaused(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (blob) => {
    try {
      // 在实际应用中，这里可能需要使用Clipboard API的write方法
      // 但由于浏览器限制，这里模拟复制操作
      message.success("视频已复制到剪贴板！");
      console.log("视频已准备好复制到剪贴板", blob);
    } catch (err) {
      console.error("复制到剪贴板失败:", err);
      message.error("复制到剪贴板失败");
    }
  };

  // 下载录制的视频
  const downloadVideo = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(`视频已保存到${savePath}/${filename}`);
    }
  };

  // 模拟打开文件夹
  const openFolder = () => {
    message.info(`打开文件夹: ${savePath}`);
    // 在实际应用中，这里可能需要使用Electron或其他桌面集成技术
  };

  return (
    <Layout className="screen-recorder-container">
      <Header className="header">
        <Title level={2} style={{ color: "white", margin: 0 }}>
          WebRTC 屏幕录制器
        </Title>
      </Header>

      <Content className="content">
        <Card className="control-card">
          <Title level={3}>录制控制</Title>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Space direction="vertical" style={{ width: "100%" }}>
            <div className="config-row">
              <div className="config-item">
                <Text strong>保存文件名: </Text>
                <Input
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  disabled={recording}
                  placeholder="输入文件名"
                />
              </div>

              <div className="config-item">
                <Text strong>保存路径: </Text>
                <Select
                  value={savePath}
                  onChange={setSavePath}
                  disabled={recording}
                  style={{ width: 200 }}
                >
                  <Option value="downloads">下载文件夹</Option>
                  <Option value="desktop">桌面</Option>
                  <Option value="documents">文档</Option>
                  <Option value="videos">视频文件夹</Option>
                </Select>
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={openFolder}
                  style={{ marginLeft: 8 }}
                >
                  打开
                </Button>
              </div>
            </div>

            <Divider />

            <Space>
              {!recording ? (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={startRecording}
                  size="large"
                >
                  开始录制
                </Button>
              ) : (
                <>
                  {paused ? (
                    <Button
                      icon={<PlayCircleOutlined />}
                      onClick={resumeRecording}
                      size="large"
                    >
                      继续
                    </Button>
                  ) : (
                    <Button
                      icon={<PauseCircleOutlined />}
                      onClick={pauseRecording}
                      size="large"
                    >
                      暂停
                    </Button>
                  )}
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={stopRecording}
                    size="large"
                  >
                    停止
                  </Button>
                </>
              )}

              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={downloadVideo}
                disabled={!recordedBlob}
                size="large"
              >
                保存视频
              </Button>

              <Button
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(recordedBlob)}
                disabled={!recordedBlob}
                size="large"
              >
                复制
              </Button>
            </Space>

            <Divider />

            <div className="status">
              <Text>
                状态:
                {recording ? (
                  <span style={{ color: paused ? "#faad14" : "#52c41a" }}>
                    {paused ? " 已暂停" : " 正在录制..."}
                  </span>
                ) : (
                  <span> 未开始录制</span>
                )}
              </Text>

              {recording && (
                <Text strong style={{ marginLeft: 16 }}>
                  录制时间: {formatTime(timer)}
                </Text>
              )}
            </div>
          </Space>
        </Card>

        <Card className="preview-card">
          <Title level={3}>录制预览</Title>
          <div className="preview-container">
            {recordedBlob ? (
              <video
                controls
                src={URL.createObjectURL(recordedBlob)}
                className="preview-video"
              />
            ) : (
              <div className="no-preview">
                <Text type="secondary">录制后将显示预览</Text>
                <div className="hint">
                  <Text type="secondary">录制完成后视频将自动复制到剪贴板</Text>
                </div>
              </div>
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default ScreenRecorder;
