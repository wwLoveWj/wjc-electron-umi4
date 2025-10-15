// src/pages/Upload/index.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Button,
  Progress,
  message,
  Card,
  List,
  Tag,
  Space,
  Typography,
} from "antd";
import {
  InboxOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloudUploadOutlined,
  FileZipOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  checkFile,
  mergeChunks,
  getUploadProgress,
} from "@/service/api/upload";
import styles from "./index.less";

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "paused" | "completed" | "error";
  uploadedChunks: number[];
  totalChunks: number;
  fileHash: string;
  worker: Worker | null;
}

const FileUpload: React.FC = () => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 使用 useRef 来跟踪最新的 uploadFiles 状态
  const uploadFilesRef = useRef<UploadFile[]>([]);

  // 同步 ref 和 state
  useEffect(() => {
    uploadFilesRef.current = uploadFiles;
  }, [uploadFiles]);
  // 在组件中更新哈希计算方法
  const calculateFileHash = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("./spark-md5.worker.ts", import.meta.url)
      );

      worker.postMessage({ file });

      worker.onmessage = (e) => {
        const { type, hash, error, progress } = e.data;

        switch (type) {
          case "progress":
            console.log(`Hash calculation progress: ${progress}%`);
            break;
          case "complete":
            worker.terminate();
            resolve(hash);
            break;
          case "error":
            worker.terminate();
            reject(new Error(error || "Hash calculation failed"));
            break;
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
    });
  };
  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);
  // 处理选择的文件
  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const uploadFile: UploadFile = {
        id: fileId,
        file,
        progress: 0,
        status: "pending",
        uploadedChunks: [],
        totalChunks: Math.ceil(file.size / (2 * 1024 * 1024)),
        fileHash: "",
        worker: null,
      };

      setUploadFiles((prev) => [...prev, uploadFile]);
      await startUpload(uploadFile);
    }
  };
  const removeFile = (fileId: string) => {
    const uploadFile = uploadFiles.find((f) => f.id === fileId);
    if (uploadFile?.worker) {
      uploadFile.worker.terminate();
    }

    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId));
    message.info("文件已移除");
  };
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileHash = await calculateFileHash(file);
      const uploadFile: UploadFile = {
        id: `${file.name}-${Date.now()}`,
        file,
        progress: 0,
        status: "pending",
        uploadedChunks: [],
        totalChunks: Math.ceil(file.size / (2 * 1024 * 1024)), // 2MB chunks
        fileHash,
        worker: null,
      };

      setUploadFiles((prev) => [...prev, uploadFile]);
      await startUpload(uploadFile);
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 新增：直接传递数据的完成处理函数
  const handleUploadCompleteWithData = async (
    fileId: string,
    fileData: { fileHash: string; fileName: string; totalChunks: number }
  ) => {
    try {
      console.log("Merging chunks with data:", fileData);

      await mergeChunks({
        fileHash: fileData.fileHash,
        fileName: fileData.fileName,
        totalChunks: fileData.totalChunks,
      });

      message.success(`${fileData.fileName} 上传完成！`);
      updateFileStatus(fileId, "completed", 100);
      updateFileWorker(fileId, null);
    } catch (error) {
      console.error("Merge chunks error:", error);
      message.error(`${fileData.fileName} 文件合并失败: ${error.message}`);
      updateFileStatus(fileId, "error");
    }
  };
  const startUpload = async (uploadFile: UploadFile) => {
    try {
      // 检查文件状态
      const checkResult = await checkFile({
        fileHash: uploadFile.fileHash,
        fileName: uploadFile.file.name,
        fileSize: uploadFile.file.size,
      });
      if (checkResult.exists) {
        message.success(`${uploadFile.file.name} 秒传成功！`);
        updateFileStatus(uploadFile.id, "completed", 100);
        return;
      }

      // 更新已上传的切片
      updateFileUploadedChunks(uploadFile.id, checkResult.uploadedChunks || []);

      // 创建 Web Worker 进行上传
      const worker = new Worker(new URL("./upload.worker.ts", import.meta.url));

      worker.postMessage({
        file: uploadFile.file,
        fileHash: uploadFile.fileHash,
        uploadedChunks: checkResult.uploadedChunks || [],
        chunkSize: 2 * 1024 * 1024,
      });

      worker.onmessage = (e) => {
        const { type, data } = e.data;

        switch (type) {
          case "progress":
            updateFileProgress(
              uploadFile.id,
              data.uploadedChunks,
              data.progress
            );
            break;
          case "completed":
            handleUploadComplete(uploadFile.id, data.fileHash);
            break;
          case "error":
            message.error(`${uploadFile.file.name} 上传失败: ${data.error}`);
            updateFileStatus(uploadFile.id, "error");
            break;
        }
      };

      updateFileWorker(uploadFile.id, worker);
      updateFileStatus(uploadFile.id, "uploading");
    } catch (error) {
      message.error(`开始上传失败: ${error}`);
      updateFileStatus(uploadFile.id, "error");
    }
  };

  const handleUploadComplete = async (fileId: string, fileHash: string) => {
    console.log("Handling upload complete for fileId:", fileId);

    // 使用 ref 来获取最新的状态
    const currentUploadFiles = uploadFilesRef.current;
    const uploadFile = currentUploadFiles.find((f) => f.id === fileId);

    console.log("Found uploadFile:", uploadFile);
    console.log(
      "All upload files:",
      currentUploadFiles.map((f) => ({ id: f.id, name: f.file.name }))
    );
    if (!uploadFile) {
      console.error(`Upload file not found for id: ${fileId}`);
      message.error("上传文件信息丢失，请重新上传");
      return;
    }

    try {
      console.log("Merging chunks for file:", uploadFile.file.name);
      await mergeChunks({
        fileHash,
        fileName: uploadFile.file.name,
        totalChunks: uploadFile.totalChunks,
      });

      message.success(`${uploadFile.file.name} 上传完成！`);
      updateFileStatus(fileId, "completed");
      // 可选：完成后移除 Worker 引用
      updateFileWorker(fileId, null);
    } catch (error) {
      message.error(`文件合并失败: ${error}`);
      updateFileStatus(fileId, "error");
    }
  };

  const pauseUpload = (fileId: string) => {
    const uploadFile = uploadFiles.find((f) => f.id === fileId);
    if (uploadFile?.worker) {
      uploadFile.worker.terminate();
      updateFileWorker(fileId, null);
      updateFileStatus(fileId, "paused");
    }
  };

  // 继续上传
  const resumeUpload = async (fileId: string) => {
    const uploadFile = uploadFiles.find((f) => f.id === fileId);
    if (!uploadFile) return;

    // 获取最新进度
    const progress = await getUploadProgress(uploadFile.fileHash);
    updateFileUploadedChunks(fileId, progress.uploadedChunks);

    await startUpload(uploadFile);
  };

  // 更新函数
  const updateFileStatus = (
    fileId: string,
    status: UploadFile["status"],
    progress?: number
  ) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, status, ...(progress !== undefined && { progress }) }
          : file
      )
    );
  };

  const updateFileProgress = (
    fileId: string,
    uploadedChunks: number[],
    progress: number
  ) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, uploadedChunks, progress } : file
      )
    );
  };

  const updateFileUploadedChunks = (
    fileId: string,
    uploadedChunks: number[]
  ) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, uploadedChunks } : file
      )
    );
  };

  const updateFileWorker = (fileId: string, worker: Worker | null) => {
    setUploadFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, worker } : file))
    );
  };

  const getStatusColor = (status: UploadFile["status"]) => {
    const colors = {
      pending: "default",
      uploading: "processing",
      paused: "warning",
      completed: "success",
      error: "error",
    };
    return colors[status];
  };
  // 获取文件类型图标
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
      return <FileZipOutlined className={styles.fileIcon} />;
    } else if (["mp4", "avi", "mov", "wmv", "flv", "mkv"].includes(ext || "")) {
      return <VideoCameraOutlined className={styles.fileIcon} />;
    } else if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext || "")) {
      return <AudioOutlined className={styles.fileIcon} />;
    } else {
      return <FileZipOutlined className={styles.fileIcon} />;
    }
  };

  // 获取状态文本
  const getStatusText = (status: UploadFile["status"]) => {
    const texts = {
      pending: "等待中",
      uploading: "上传中",
      paused: "已暂停",
      completed: "已完成",
      error: "错误",
      processing: "处理中",
    };
    return texts[status];
  };

  return (
    <div className={styles.containerVideo}>
      {/* 粒子背景 */}
      <div className={styles.particles} id="particles-js"></div>

      <div className={styles.contentVideo}>
        <div className={styles.header}>
          <Title level={2} className={styles.title}>
            <CloudUploadOutlined /> 大文件上传管理
          </Title>
          <Text className={styles.subtitle}>
            支持大规模、大备份文件，自动切片上传，支持断点续传
          </Text>
        </div>

        {/* 上传区域 */}
        <Card className={styles.uploadCard} bordered={false}>
          <div
            className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileSelect}
              className={styles.fileInput}
            />

            <div className={styles.uploadContent}>
              <InboxOutlined className={styles.uploadIcon} />
              <Title level={4} className={styles.uploadTitle}>
                拖拽文件到此处或点击上传
              </Title>
              <Text className={styles.uploadTip}>
                支持大视频、大音频、压缩包等文件类型
              </Text>
              <Button
                type="primary"
                size="large"
                icon={<CloudUploadOutlined />}
                onClick={() => fileInputRef.current?.click()}
                className={styles.uploadButton}
              >
                选择文件
              </Button>
            </div>
          </div>
        </Card>

        {/* 文件列表 */}
        {uploadFiles.length > 0 && (
          <Card
            title={
              <Space>
                <span>上传队列</span>
                <Tag color="blue">{uploadFiles.length} 个文件</Tag>
              </Space>
            }
            className={styles.fileListCard}
            bordered={false}
          >
            <List
              dataSource={uploadFiles}
              renderItem={(file) => (
                <List.Item className={styles.fileItem}>
                  <div className={styles.fileContent}>
                    <div className={styles.fileHeader}>
                      <div className={styles.fileInfo}>
                        {getFileIcon(file.file.name)}
                        <div className={styles.fileDetails}>
                          <div className={styles.fileName}>
                            {file.file.name}
                          </div>
                          <div className={styles.fileMeta}>
                            <Space size="middle">
                              <Text type="secondary">
                                {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                              </Text>
                              <Text type="secondary">
                                {file.uploadedChunks.length}/{file.totalChunks}
                                切片
                              </Text>
                              <Tag
                                color={getStatusColor(file.status)}
                                className={styles.statusTag}
                              >
                                {getStatusText(file.status)}
                              </Tag>
                            </Space>
                          </div>
                        </div>
                      </div>
                      <div className={styles.fileActions}>
                        {file.status === "uploading" && (
                          <Button
                            icon={<PauseCircleOutlined />}
                            onClick={() => pauseUpload(file.id)}
                            className={styles.actionButton}
                          >
                            暂停
                          </Button>
                        )}
                        {file.status === "paused" && (
                          <Button
                            icon={<PlayCircleOutlined />}
                            type="primary"
                            onClick={() => resumeUpload(file.id)}
                            className={styles.actionButton}
                          >
                            继续
                          </Button>
                        )}
                        {(file.status === "completed" ||
                          file.status === "error") && (
                          <Button
                            icon={<DeleteOutlined />}
                            onClick={() => removeFile(file.id)}
                            className={styles.actionButton}
                            danger
                          >
                            移除
                          </Button>
                        )}
                      </div>
                    </div>

                    {file.status !== "completed" && file.status !== "error" && (
                      <div className={styles.progressSection}>
                        <Progress
                          percent={file.progress}
                          status={
                            file.status === "uploading"
                              ? "active"
                              : file.status === "error"
                                ? "exception"
                                : "normal"
                          }
                          strokeColor={{
                            "0%": "#00d4ff",
                            "100%": "#0099ff",
                          }}
                          className={styles.progressBar}
                        />
                        <div className={styles.progressText}>
                          {file.progress}% - {file.uploadedChunks.length}/
                          {file.totalChunks} 切片
                        </div>
                      </div>
                    )}

                    {file.status === "completed" && (
                      <div className={styles.completedSection}>
                        <div className={styles.completedBadge}>
                          <Tag color="success" className={styles.completedTag}>
                            上传完成
                          </Tag>
                          <Text type="secondary">
                            文件哈希: {file.fileHash.substring(0, 20)}...
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
