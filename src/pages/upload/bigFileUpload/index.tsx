// src/pages/Upload/index.tsx
import React, { useState, useRef, useEffect } from "react";
import { Upload, Button, Progress, message, Card, List, Tag } from "antd";
import {
  InboxOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import {
  checkFile,
  mergeChunks,
  getUploadProgress,
} from "@/service/api/upload";
import styles from "./index.less";

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

  return (
    <div className={styles.container}>
      <Card title="大文件上传" className={styles.uploadCard}>
        <div className={styles.uploadArea}>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <Button
            type="primary"
            size="large"
            onClick={() => fileInputRef.current?.click()}
            className={styles.uploadButton}
          >
            选择文件
          </Button>
          <p className={styles.uploadTip}>
            支持大视频、大音频文件，自动切片上传，支持断点续传
          </p>
        </div>

        <div className={styles.fileList}>
          <List
            dataSource={uploadFiles}
            renderItem={(file) => (
              <List.Item className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.file.name}</div>
                  <div className={styles.fileMeta}>
                    <Tag color={getStatusColor(file.status)}>
                      {file.status === "uploading" && "上传中"}
                      {file.status === "paused" && "已暂停"}
                      {file.status === "completed" && "已完成"}
                      {file.status === "error" && "错误"}
                      {file.status === "pending" && "等待中"}
                    </Tag>
                    <span>
                      {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <span>
                      {file.uploadedChunks.length}/{file.totalChunks} 切片
                    </span>
                  </div>
                  <Progress
                    percent={file.progress}
                    status={
                      file.status === "uploading"
                        ? "active"
                        : file.status === "error"
                          ? "exception"
                          : "normal"
                    }
                    className={styles.progress}
                  />
                </div>
                <div className={styles.fileActions}>
                  {file.status === "uploading" && (
                    <Button
                      icon={<PauseCircleOutlined />}
                      onClick={() => pauseUpload(file.id)}
                    >
                      暂停
                    </Button>
                  )}
                  {file.status === "paused" && (
                    <Button
                      icon={<PlayCircleOutlined />}
                      type="primary"
                      onClick={() => resumeUpload(file.id)}
                    >
                      继续
                    </Button>
                  )}
                </div>
              </List.Item>
            )}
          />
        </div>
      </Card>
    </div>
  );
};

export default FileUpload;
