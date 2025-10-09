// 支持分类上传
import React, { useState, useCallback } from "react";
import {
  Tabs,
  Upload,
  Button,
  Progress,
  message,
  Card,
  Space,
  Typography,
} from "antd";
import {
  UploadOutlined,
  PictureOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  uploadService,
  UploadProgressInfo,
} from "@/service/request/uploadService";

const { TabPane } = Tabs;
const { Text } = Typography;

const AdvancedFileUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [progressInfo, setProgressInfo] = useState<UploadProgressInfo>({
    percent: 0,
    loaded: 0,
    total: 0,
    speed: "0 B/s",
    estimated: "计算中...",
  });

  // 单文件上传
  const handleSingleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setProgressInfo({
      percent: 0,
      loaded: 0,
      total: 0,
      speed: "0 B/s",
      estimated: "计算中...",
    });

    try {
      const response = await uploadService.uploadSingle(file, (progress) =>
        setProgressInfo(progress)
      );
      debugger;
      if (response.success) {
        message.success(`文件 "${file.name}" 上传成功`);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error("上传失败:", error);
      message.error("文件上传失败");
    } finally {
      setUploading(false);
    }
  }, []);

  // 多文件上传
  const handleMultipleUpload = useCallback(async (files: File[]) => {
    setUploading(true);
    setProgressInfo({
      percent: 0,
      loaded: 0,
      total: 0,
      speed: "0 B/s",
      estimated: "计算中...",
    });

    try {
      const response = await uploadService.uploadMultiple(files, (progress) =>
        setProgressInfo(progress)
      );

      if (response.success) {
        message.success(`成功上传 ${files.length} 个文件`);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error("上传失败:", error);
      message.error("文件上传失败");
    } finally {
      setUploading(false);
    }
  }, []);

  // 分类上传
  const handleCategorizedUpload = useCallback(
    async (images: File[], documents: File[]) => {
      setUploading(true);
      setProgressInfo({
        percent: 0,
        loaded: 0,
        total: 0,
        speed: "0 B/s",
        estimated: "计算中...",
      });

      try {
        const response = await uploadService.uploadCategorized(
          images,
          documents,
          (progress) => setProgressInfo(progress)
        );

        if (response.success) {
          message.success("分类文件上传成功");
        } else {
          message.error(response.message);
        }
      } catch (error) {
        console.error("上传失败:", error);
        message.error("文件上传失败");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return (
    <Card title="文件上传" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 单文件上传 */}
        <TabPane tab="单文件上传" key="single">
          <Upload.Dragger
            multiple={false}
            showUploadList={false}
            beforeUpload={(file) => {
              handleSingleUpload(file);
              return false; // 阻止默认上传
            }}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽单个文件到此处上传</p>
          </Upload.Dragger>
        </TabPane>

        {/* 多文件上传 */}
        <TabPane tab="多文件上传" key="multiple">
          <Upload.Dragger
            multiple
            showUploadList={false}
            beforeUpload={() => false}
            onChange={(info) => {
              const files = info.fileList
                .map((item) => item.originFileObj)
                .filter(Boolean) as File[];
              if (files.length > 0) {
                handleMultipleUpload(files);
              }
            }}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽多个文件到此处上传</p>
            <p className="ant-upload-hint">支持一次选择多个文件</p>
          </Upload.Dragger>
        </TabPane>

        {/* 分类上传 */}
        <TabPane tab="分类上传" key="categorized">
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Upload.Dragger
              accept="image/*"
              multiple
              showUploadList={false}
              beforeUpload={() => false}
            >
              <p className="ant-upload-drag-icon">
                <PictureOutlined />
              </p>
              <p className="ant-upload-text">上传图片文件</p>
              <p className="ant-upload-hint">支持 JPG、PNG、GIF 等图片格式</p>
            </Upload.Dragger>

            <Upload.Dragger
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              multiple
              showUploadList={false}
              beforeUpload={() => false}
            >
              <p className="ant-upload-drag-icon">
                <FileTextOutlined />
              </p>
              <p className="ant-upload-text">上传文档文件</p>
              <p className="ant-upload-hint">
                支持 PDF、Word、Excel 等文档格式
              </p>
            </Upload.Dragger>

            <Button
              type="primary"
              size="large"
              block
              onClick={() => {
                // 这里需要实现获取已选择文件并分类的逻辑
                message.info("分类上传功能待实现");
              }}
              disabled={uploading}
            >
              开始分类上传
            </Button>
          </Space>
        </TabPane>
      </Tabs>

      {/* 进度显示 */}
      {uploading && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#f5f5f5",
            borderRadius: 6,
          }}
        >
          <Progress percent={progressInfo.percent} status="active" />
          <Space style={{ marginTop: 8 }} size="large">
            <Text>进度: {progressInfo.percent}%</Text>
            <Text>速度: {progressInfo.speed}</Text>
            <Text>剩余时间: {progressInfo.estimated}</Text>
            <Text>
              已上传: {uploadService.formatFileSize(progressInfo.loaded)}
            </Text>
            <Text>
              总大小: {uploadService.formatFileSize(progressInfo.total)}
            </Text>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default AdvancedFileUploader;
