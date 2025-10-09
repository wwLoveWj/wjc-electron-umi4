// pages/index.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Slider,
  message,
  Upload,
  Card,
  Space,
  InputNumber,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ScissorOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import styles from "./style.less";

const AudioClipper = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(0);
  const [clippedAudioUrl, setClippedAudioUrl] = useState("");
  const [audioContext, setAudioContext] = useState(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioSourceRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 初始化音频上下文
  useEffect(() => {
    const initAudioContext = async () => {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);
    };

    initAudioContext();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
      // 清理URL对象防止内存泄漏
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (clippedAudioUrl) {
        URL.revokeObjectURL(clippedAudioUrl);
      }
    };
  }, []);

  // 处理文件上传
  const handleFileUpload = (file) => {
    // 清理之前的URL和状态
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (clippedAudioUrl) {
      URL.revokeObjectURL(clippedAudioUrl);
    }

    // 停止当前播放
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 取消动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // 断开之前的音频节点
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioUrl(url);
    setClippedAudioUrl("");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setClipStart(0);
    setClipEnd(0);

    return false;
  };

  // 初始化音频分析器
  const initAudioAnalyser = () => {
    if (!audioContext || !audioRef.current || audioSourceRef.current) return;

    try {
      // 创建新的音频源和分析器
      const source = audioContext.createMediaElementSource(audioRef.current);
      const analyser = audioContext.createAnalyser();

      source.connect(analyser);
      analyser.connect(audioContext.destination);

      analyser.fftSize = 2048;
      audioSourceRef.current = source;
      analyserRef.current = analyser;

      startWaveformVisualization();
    } catch (error) {
      console.error("初始化音频分析器失败:", error);
    }
  };

  // 开始波形可视化
  const startWaveformVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgb(240, 240, 240)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(0, 100, 200)";
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // 绘制剪辑区域
      if (duration > 0) {
        const startX = (clipStart / duration) * canvas.width;
        const endX = (clipEnd / duration) * canvas.width;

        ctx.fillStyle = "rgba(255, 200, 0, 0.3)";
        ctx.fillRect(startX, 0, endX - startX, canvas.height);

        ctx.strokeStyle = "rgb(255, 150, 0)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, canvas.height);
        ctx.stroke();
      }

      // 绘制当前播放位置
      if (duration > 0 && !isDraggingProgress) {
        const currentX = (currentTime / duration) * canvas.width;

        ctx.strokeStyle = "rgb(255, 0, 0)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, canvas.height);
        ctx.stroke();
      }
    };

    draw();
  };

  // 播放/暂停控制
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // 确保音频上下文处于运行状态（解决浏览器自动播放策略）
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 更新当前播放时间
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDraggingProgress) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // 处理播放结束
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 跳转到指定时间
  const seekToTime = (time) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, time));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // 设置剪辑开始时间
  const handleClipStartChange = (value) => {
    if (value === null || isNaN(value)) return;

    const newStart = Math.max(0, Math.min(clipEnd - 0.1, value));
    setClipStart(newStart);
  };

  // 设置剪辑结束时间
  const handleClipEndChange = (value) => {
    if (value === null || isNaN(value)) return;

    const newEnd = Math.max(clipStart + 0.1, Math.min(duration, value));
    setClipEnd(newEnd);
  };

  // 设置当前时间为剪辑开始
  const setCurrentAsStart = () => {
    setClipStart(currentTime);
  };

  // 设置当前时间为剪辑结束
  const setCurrentAsEnd = () => {
    setClipEnd(currentTime);
  };

  // 处理进度条拖拽开始
  const handleProgressDragStart = () => {
    setIsDraggingProgress(true);
  };

  // 处理进度条拖拽变化
  const handleProgressChange = (value) => {
    setCurrentTime(value);
  };

  // 处理进度条拖拽结束
  const handleProgressDragEnd = (value) => {
    setIsDraggingProgress(false);
    seekToTime(value);
  };

  // 剪辑音频
  const clipAudio = async () => {
    if (!audioFile || !audioContext) {
      message.error("请先上传音频文件");
      return;
    }

    if (clipStart >= clipEnd) {
      message.error("剪辑结束时间必须大于开始时间");
      return;
    }

    try {
      message.loading("正在剪辑音频...", 0);

      // 解码音频文件
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 计算剪辑的样本范围
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(clipStart * sampleRate);
      const endSample = Math.floor(clipEnd * sampleRate);
      const clipLength = endSample - startSample;

      // 创建新的音频缓冲区
      const clipBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        clipLength,
        sampleRate
      );

      // 复制音频数据
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const clipData = clipBuffer.getChannelData(channel);

        for (let i = 0; i < clipLength; i++) {
          clipData[i] = channelData[startSample + i];
        }
      }

      // 将剪辑后的音频转换为Blob URL
      const wavBlob = bufferToWave(clipBuffer, clipLength);
      const clipUrl = URL.createObjectURL(wavBlob);

      // 清理之前的剪辑URL
      if (clippedAudioUrl) {
        URL.revokeObjectURL(clippedAudioUrl);
      }

      setClippedAudioUrl(clipUrl);
      message.destroy();
      message.success("音频剪辑成功！");
    } catch (error) {
      console.error("剪辑音频时出错:", error);
      message.destroy();
      message.error("音频剪辑失败");
    }
  };

  // 将AudioBuffer转换为WAV格式的Blob
  const bufferToWave = (buffer, length) => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const lengthSample = length;

    // 创建WAV文件头
    const bufferHeader = new ArrayBuffer(44 + lengthSample * numOfChan * 2);
    const view = new DataView(bufferHeader);

    // WAV文件头
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + lengthSample * numOfChan * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * 2, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, lengthSample * numOfChan * 2, true);

    // 写入音频数据
    let offset = 44;
    for (let i = 0; i < lengthSample; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, buffer.getChannelData(channel)[i])
        );
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        );
        offset += 2;
      }
    }

    return new Blob([bufferHeader], { type: "audio/wav" });
  };

  // 调整Canvas大小
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // 初始化音频分析器当音频准备好时
  useEffect(() => {
    if (audioRef.current && audioContext) {
      const audio = audioRef.current;
      const handleCanPlay = () => {
        initAudioAnalyser();
      };

      audio.addEventListener("canplay", handleCanPlay);

      return () => {
        audio.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [audioContext, audioUrl]);

  // 当音频URL变化时重置状态
  useEffect(() => {
    if (audioUrl) {
      // 设置初始剪辑范围为整个音频
      const audio = new Audio();
      audio.src = audioUrl;
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        setClipStart(0);
        setClipEnd(audio.duration);
      };
    }
  }, [audioUrl]);

  return (
    <div className={styles.container}>
      <h1>音频剪辑工具</h1>

      <Card title="上传音频文件" className={styles.card}>
        <Upload
          accept="audio/*"
          beforeUpload={handleFileUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>选择音频文件</Button>
        </Upload>

        {audioFile && (
          <div className={styles.fileInfo}>
            已选择文件: {audioFile.name} ({formatTime(duration) || "加载中..."})
          </div>
        )}
      </Card>

      {audioUrl && (
        <>
          <Card title="音频预览" className={styles.card}>
            <div className={styles.audioControls}>
              <Button
                icon={
                  isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />
                }
                onClick={togglePlayback}
                type="primary"
              >
                {isPlaying ? "暂停" : "播放"}
              </Button>

              <div className={styles.timeDisplay}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* 进度条 */}
            <div className={styles.progressContainer}>
              <Slider
                min={0}
                max={duration || 1}
                step={0.01}
                value={currentTime}
                onChange={handleProgressChange}
                onAfterChange={handleProgressDragEnd}
                onMouseDown={handleProgressDragStart}
                tipFormatter={formatTime}
                className={styles.progressSlider}
              />
            </div>

            <div className={styles.waveformContainer}>
              <canvas
                ref={canvasRef}
                className={styles.waveform}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percent = clickX / rect.width;
                  seekToTime(percent * duration);
                }}
              />
            </div>

            <div className={styles.timeSelection}>
              <Button size="small" onClick={setCurrentAsStart}>
                设为开始时间
              </Button>
              <Button size="small" onClick={setCurrentAsEnd}>
                设为结束时间
              </Button>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  const newDuration = audioRef.current.duration;
                  setDuration(newDuration);
                  setClipEnd(newDuration);
                }
              }}
            />
          </Card>

          <Card title="剪辑设置" className={styles.card}>
            <div className={styles.clipControls}>
              <div className={styles.timeInputs}>
                <div className={styles.timeInput}>
                  <label>开始时间:</label>
                  <div className={styles.timeDisplayInput}>
                    <span className={styles.timeValue}>
                      {formatTime(clipStart)}
                    </span>
                    <div className={styles.sliderContainer}>
                      <Slider
                        min={0}
                        max={duration}
                        step={0.01}
                        value={clipStart}
                        onChange={handleClipStartChange}
                        tipFormatter={formatTime}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.timeInput}>
                  <label>结束时间:</label>
                  <div className={styles.timeDisplayInput}>
                    <span className={styles.timeValue}>
                      {formatTime(clipEnd)}
                    </span>
                    <div className={styles.sliderContainer}>
                      <Slider
                        min={0}
                        max={duration}
                        step={0.01}
                        value={clipEnd}
                        onChange={handleClipEndChange}
                        tipFormatter={formatTime}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.clipInfo}>
                剪辑时长: {formatTime(clipEnd - clipStart)}
              </div>

              <Button
                icon={<ScissorOutlined />}
                onClick={clipAudio}
                type="primary"
                className={styles.clipButton}
                disabled={clipEnd - clipStart < 0.1}
              >
                剪辑音频
              </Button>
            </div>
          </Card>
        </>
      )}

      {clippedAudioUrl && (
        <Card title="剪辑结果" className={styles.card}>
          <div className={styles.result}>
            <audio
              controls
              src={clippedAudioUrl}
              className={styles.clippedAudio}
            />

            <Button
              icon={<DownloadOutlined />}
              href={clippedAudioUrl}
              download={`clipped_audio_${Date.now()}.wav`}
              type="primary"
            >
              下载剪辑后的音频
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

// 格式化时间显示 (秒 -> 分:秒.毫秒)
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "0:00.00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}.${ms < 10 ? "0" : ""}${ms}`;
};

export default AudioClipper;
