// src/components/FileUploader.tsx
import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  Button,
  Progress,
  message,
  List,
  Space,
  Typography,
  Card,
  Tag,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import {
  uploadService,
  FileInfo,
  UploadProgressInfo,
  UploadResponse,
} from "@/service/request/uploadService";
import { deleteFileAPI } from "@/service/api/file";
import { useRequest } from "ahooks";
import "./style.less";

const { Text, Title } = Typography;

// 文件图标映射
const fileIcons: { [key: string]: React.ReactNode } = {
  image: <FileImageOutlined style={{ color: "#ff4d4f" }} />,
  pdf: <FilePdfOutlined style={{ color: "#ff4d4f" }} />,
  doc: <FileWordOutlined style={{ color: "#1890ff" }} />,
  docx: <FileWordOutlined style={{ color: "#1890ff" }} />,
  xls: <FileExcelOutlined style={{ color: "#52c41a" }} />,
  xlsx: <FileExcelOutlined style={{ color: "#52c41a" }} />,
  zip: <FileZipOutlined style={{ color: "#faad14" }} />,
  rar: <FileZipOutlined style={{ color: "#faad14" }} />,
  default: <FileOutlined style={{ color: "#722ed1" }} />,
};

const FileUploader: React.FC = () => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [speed, setSpeed] = useState<string>("0 B/s");
  const [estimated, setEstimated] = useState<string>("计算中...");
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // 使用 ref 来跟踪上传状态，防止重复上传
  const isUploadingRef = useRef<boolean>(false);
  const processedFilesRef = useRef<Set<string>>(new Set());

  // 生成文件唯一标识
  const getFileKey = (file: File): string => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  const getFileIcon = (
    fileType: string,
    extension: string
  ): React.ReactNode => {
    if (fileType.includes("image")) return fileIcons.image;
    if (extension === "pdf") return fileIcons.pdf;
    if (["doc", "docx"].includes(extension)) return fileIcons.docx;
    if (["xls", "xlsx"].includes(extension)) return fileIcons.xlsx;
    if (["zip", "rar"].includes(extension)) return fileIcons.zip;
    return fileIcons.default;
  };

  const handleUpload = useCallback(async (files: File[]): Promise<void> => {
    if (!files || files.length === 0) return;

    // 检查是否正在上传
    if (isUploadingRef.current) {
      message.warning("文件正在上传中，请等待完成");
      return;
    }

    // 过滤已处理的文件
    const newFiles = files.filter((file) => {
      const fileKey = getFileKey(file);
      return !processedFilesRef.current.has(fileKey);
    });

    if (newFiles.length === 0) {
      message.info("没有新文件需要上传");
      return;
    }

    // 标记文件为已处理
    newFiles.forEach((file) => {
      processedFilesRef.current.add(getFileKey(file));
    });

    setUploading(true);
    setIsDragOver(false);
    isUploadingRef.current = true;
    setProgress(0);
    setSpeed("0 B/s");
    setEstimated("计算中...");

    try {
      let response: UploadResponse;

      if (newFiles.length === 1) {
        response = await uploadService.uploadSingle(
          newFiles[0],
          (progressInfo: UploadProgressInfo) => {
            setProgress(progressInfo.percent);
            setSpeed(progressInfo.speed);
            setEstimated(progressInfo.estimated);
          }
        );
      } else {
        response = await uploadService.uploadMultiple(
          newFiles,
          (progressInfo: UploadProgressInfo) => {
            setProgress(progressInfo.percent);
            setSpeed(progressInfo.speed);
            setEstimated(progressInfo.estimated);
          }
        );
      }

      if (response.success) {
        message.success(response.message);

        if (Array.isArray(response.data)) {
          setUploadedFiles((prev) => [...prev, ...response.data]);
        } else {
          setUploadedFiles((prev) => [...prev, response.data]);
        }
      } else {
        message.error(response.message);
        // 上传失败时，从已处理集合中移除文件
        newFiles.forEach((file) => {
          processedFilesRef.current.delete(getFileKey(file));
        });
      }
    } catch (error) {
      console.error("上传失败:", error);
      message.error("文件上传失败");
      // 上传异常时，从已处理集合中移除文件
      newFiles.forEach((file) => {
        processedFilesRef.current.delete(getFileKey(file));
      });
    } finally {
      setUploading(false);
      isUploadingRef.current = false;
    }
  }, []);

  // 删除文件
  const { runAsync: deleteFileAPIRunAsync } = useRequest(deleteFileAPI, {
    manual: true,
  });
  const handleDeleteFile = useCallback(async (fileInfo: FileInfo) => {
    await deleteFileAPIRunAsync(fileInfo.filePath);

    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileInfo.id));
  }, []);

  // 预览文件
  const handlePreviewFile = useCallback((fileInfo: FileInfo): void => {
    const previewUrl = uploadService.getFilePreviewUrl(fileInfo);
    window.open(previewUrl, "_blank");
  }, []);

  return (
    <div className="file-uploader-container">
      <Card
        className="uploader-card"
        bordered={false}
        bodyStyle={{ padding: 0 }}
      >
        {/* 标题区域 */}
        <div className="uploader-header">
          <Title level={3} className="uploader-title">
            <InboxOutlined /> 文件上传
          </Title>
          <Text type="secondary">支持拖拽上传，单次最多可上传10个文件</Text>
        </div>

        {/* 文件上传区域 */}
        <div className="upload-area-wrapper">
          <Upload.Dragger
            multiple
            showUploadList={false}
            beforeUpload={() => false}
            onChange={(info) => {
              if (info.fileList.length > 0) {
                const files = info.fileList
                  .map((item) => item.originFileObj)
                  .filter(Boolean) as File[];
                debugger;
                handleUpload(files);
              }
            }}
            disabled={uploading}
            onDrop={() => setIsDragOver(false)}
            onDragOver={() => setIsDragOver(true)}
            onDragLeave={() => setIsDragOver(false)}
            // className={`upload-dragger ${isDragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
          >
            <div className="upload-content">
              <div className="upload-icon">
                {uploading ? (
                  <div className="uploading-spinner">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <InboxOutlined className="main-icon" />
                )}
              </div>
              <div className="upload-text">
                <Title level={4} className="upload-title">
                  {uploading ? "文件上传中..." : "点击或拖拽文件到此处"}
                </Title>
                <Text type="secondary" className="upload-subtitle">
                  {uploading ? "请耐心等待上传完成" : "支持单个或多个文件上传"}
                </Text>
              </div>
              {!uploading && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  size="large"
                  className="upload-button"
                >
                  选择文件
                </Button>
              )}
            </div>
          </Upload.Dragger>
        </div>

        {/* 上传进度显示 */}
        {uploading && (
          <Card className="progress-card" size="small">
            <div className="progress-header">
              <Text strong>上传进度</Text>
              <Tag color="blue">{progress}%</Tag>
            </div>
            <Progress
              percent={progress}
              status="active"
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              className="custom-progress"
            />
            <div className="progress-stats">
              <Space size="large" className="stats-container">
                <div className="stat-item">
                  <Text type="secondary">上传速度</Text>
                  <Text strong>{speed}</Text>
                </div>
                <div className="stat-item">
                  <Text type="secondary">剩余时间</Text>
                  <Text strong>{estimated}</Text>
                </div>
                <div className="stat-item">
                  <Text type="secondary">文件数量</Text>
                  <Text strong>{uploadedFiles.length + 1}</Text>
                </div>
              </Space>
            </div>
          </Card>
        )}

        {/* 已上传文件列表 */}
        {uploadedFiles.length > 0 && (
          <Card
            className="files-card"
            title={
              <div className="files-header">
                <Text strong>已上传文件</Text>
                <Tag color="green">{uploadedFiles.length} 个文件</Tag>
              </div>
            }
            size="small"
          >
            <List
              className="files-list"
              dataSource={uploadedFiles}
              renderItem={(file) => (
                <List.Item className="file-item">
                  <div className="file-content">
                    <div className="file-icon">
                      {getFileIcon(file.fileType, file.extension)}
                    </div>
                    <div className="file-info">
                      <Text strong className="file-name">
                        {file.originalName}
                      </Text>
                      <div className="file-meta">
                        <Space
                          size="small"
                          split={<Text type="secondary">•</Text>}
                        >
                          <Text type="secondary" className="file-size">
                            {uploadService.formatFileSize(file.fileSize)}
                          </Text>
                          <Text type="secondary" className="file-type">
                            {file.extension.toUpperCase()}
                          </Text>
                          <Text type="secondary" className="file-time">
                            {new Date(file.uploadTime).toLocaleString()}
                          </Text>
                        </Space>
                      </div>
                    </div>
                  </div>
                  <div className="file-actions">
                    <Space>
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreviewFile(file)}
                        className="action-btn preview-btn"
                      >
                        预览
                      </Button>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteFile(file)}
                        className="action-btn delete-btn"
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Card>
    </div>
  );
};

export default FileUploader;
