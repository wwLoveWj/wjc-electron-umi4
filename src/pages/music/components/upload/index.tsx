import React, { useState } from "react";
import { Modal, message, Button, Progress } from "antd";
import { CheckOutlined, UploadOutlined } from "@ant-design/icons";
import styles from "./index.less";
// import { uploadMinioFilesAPI } from "@/service/api/minio";

// 在文件顶部添加类型定义
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
  uploadedAt?: string;
}

// 上传组件
export const MusicUploadModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}> = ({ visible, onCancel, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // 支持的音频格式
  const supportedFormats = [
    "audio/mpeg",
    "audio/mp3",
    "audio/x-mpeg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/x-aac",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/flac",
    "audio/x-flac",
    "audio/aac",
    "audio/ogg",
    "audio/m4a",
    "audio/x-ogg",
    "audio/opus",
    "audio/x-opus",
  ];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  // 验证文件
  const validateFile = (file: File): string | null => {
    if (!supportedFormats.includes(file.type)) {
      return `不支持的音频格式: ${file.type}`;
    }
    if (file.size > maxFileSize) {
      return `文件大小不能超过 50MB`;
    }
    return null;
  };

  // 处理文件选择
  const handleFileSelect = async (files: FileList) => {
    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        message.error(`${file.name}: ${error}`);
        return;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      newFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        url: "",
        status: "uploading",
        progress: 0,
      });
    });

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      await uploadFiles(newFiles);
    }
  };

  // 上传文件到Minio
  const uploadFiles = async (files: UploadedFile[]) => {
    setUploading(true);

    for (const fileInfo of files) {
      const file = Array.from(
        (document.getElementById("file-input") as HTMLInputElement)?.files || []
      ).find((f) => f.name === fileInfo.name);

      if (!file) continue;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("fileSize", file.size.toString());

      try {
        // const result = await uploadMinioFilesAPI(formData);

        // 调用Minio上传接口
        const response = await fetch("http://localhost:3000/api/minio/upload", {
          method: "POST",
          body: formData,
          headers: {
            // 如果需要认证，可以在这里添加token
            // 'Authorization': `Bearer ${token}`
          },
        });
        if (!response.ok) {
          throw new Error(`上传失败: ${response.statusText}`);
        }

        const result = await response.json();

        // 更新文件状态为成功
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileInfo.id
              ? {
                  ...f,
                  status: "success",
                  progress: 100,
                  url: result?.url,
                  uploadedAt: new Date().toISOString(),
                }
              : f
          )
        );

        message.success(`${fileInfo.name} 上传成功`);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileInfo.id
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "上传失败",
                }
              : f
          )
        );
        message.error(`${fileInfo.name} 上传失败`);
      }
    }

    setUploading(false);
  };

  // 处理拖放
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 处理文件输入变化
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 清除已上传文件列表
  const clearUploadedFiles = () => {
    setUploadedFiles([]);
  };

  // 重新上传失败的文件
  const retryFailedUploads = () => {
    const failedFiles = uploadedFiles.filter((f) => f.status === "error");
    if (failedFiles.length > 0) {
      uploadFiles(failedFiles);
    }
  };

  return (
    <Modal
      title="上传音乐文件"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button
          key="clear"
          onClick={clearUploadedFiles}
          disabled={uploadedFiles.length === 0}
        >
          清空列表
        </Button>,
        <Button
          key="retry"
          onClick={retryFailedUploads}
          disabled={!uploadedFiles.some((f) => f.status === "error")}
        >
          重新上传失败文件
        </Button>,
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
      width={800}
      className={styles.uploadModal}
    >
      <div className={styles.uploadContainer}>
        {/* 上传区域 */}
        <div
          className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={styles.uploadIcon}>
            <UploadOutlined />
          </div>
          <div className={styles.uploadText}>
            <h3>拖放音频文件到此处</h3>
            <p>支持 MP3, WAV, FLAC, AAC, OGG, M4A 格式，最大 10MB</p>
          </div>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".mp3,.wav,.flac,.aac,.ogg,.m4a,audio/*"
            onChange={handleFileInputChange}
            className={styles.fileInput}
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => document.getElementById("file-input")?.click()}
            className={styles.uploadButton}
            loading={uploading}
          >
            选择文件
          </Button>
        </div>

        {/* 上传文件列表 */}
        {uploadedFiles.length > 0 && (
          <div className={styles.uploadList}>
            <div className={styles.uploadListHeader}>
              <h4>上传文件列表 ({uploadedFiles.length})</h4>
              <div className={styles.uploadStats}>
                <span className={styles.successCount}>
                  成功:
                  {uploadedFiles.filter((f) => f.status === "success").length}
                </span>
                <span className={styles.errorCount}>
                  失败:
                  {uploadedFiles.filter((f) => f.status === "error").length}
                </span>
                <span className={styles.uploadingCount}>
                  上传中:
                  {uploadedFiles.filter((f) => f.status === "uploading").length}
                </span>
              </div>
            </div>

            <div className={styles.fileList}>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`${styles.fileItem} ${styles[file.status]}`}
                >
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileMeta}>
                      <span>{formatFileSize(file.size)}</span>
                      {file.uploadedAt && (
                        <span>
                          {new Date(file.uploadedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fileStatus}>
                    {file.status === "uploading" && (
                      <div className={styles.uploadProgress}>
                        <Progress
                          percent={file.progress}
                          size="small"
                          strokeColor="#6c5ce7"
                        />
                      </div>
                    )}

                    {file.status === "success" && (
                      <div className={styles.statusSuccess}>
                        <CheckOutlined />
                        <span>上传成功</span>
                      </div>
                    )}

                    {file.status === "error" && (
                      <div className={styles.statusError}>
                        <span className={styles.errorText}>{file.error}</span>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => {
                            // 重新上传单个文件
                            uploadFiles([file]);
                          }}
                        >
                          重试
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
