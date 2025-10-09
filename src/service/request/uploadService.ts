import request from "./index";

export interface UploadResponse {
  success: boolean;
  message: string;
  data: FileInfo | FileInfo[];
}
export interface FileInfo {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  extension: string;
  uploadTime: string;
}

export interface UploadProgressInfo {
  percent: number;
  loaded: number;
  total: number;
  speed: string;
  estimated: string;
}

class UploadService {
  // 单文件上传
  async uploadSingle(
    file: File,
    onProgress?: (progressInfo: UploadProgressInfo) => void
    // options: { timeout?: number; headers?: Record<string, string> } = {}
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    // 可以添加额外的元数据
    formData.append("fileName", file.name);
    formData.append("fileSize", file.size.toString());
    formData.append("uploadTime", new Date().toISOString());

    const response = await request.upload(
      "/api/upload/single",
      formData,
      onProgress,
      {
        // timeout: options.timeout || 300000,
        // headers: options.headers,
      }
    ).promise;
    return response;
  }

  // 多文件上传
  async uploadMultiple(
    files: File[],
    onProgress?: (progressInfo: UploadProgressInfo) => void
    // options: { timeout?: number; headers?: Record<string, string> } = {}
  ): Promise<UploadResponse> {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append("files", file);
      // 可以为每个文件添加元数据
      formData.append(`fileNames[${index}]`, file.name);
    });

    const response = await request.upload(
      "/api/upload/multiple",
      formData,
      onProgress
      //   {
      //     timeout: options.timeout || 300000,
      //     headers: options.headers,
      //   }
    ).promise;

    return response;
  }

  // 分类文件上传（图片和文档）
  async uploadCategorized(
    images: File[],
    documents: File[],
    onProgress?: (progressInfo: UploadProgressInfo) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();

    images.forEach((image, index) => {
      formData.append("images", image);
    });

    documents.forEach((doc, index) => {
      formData.append("documents", doc);
    });

    const response = await request.upload(
      "/api/upload/fields",
      formData,
      onProgress,
      {
        timeout: 600000, // 10分钟超时
      }
    ).promise;

    return response;
  }

  // 生成文件预览 URL
  getFilePreviewUrl(fileInfo: FileInfo): string {
    // 如果是图片，直接返回 URL
    if (fileInfo.fileType.startsWith("image/")) {
      return fileInfo.fileUrl;
    }

    // 其他文件类型可以生成预览链接或使用默认图标
    return this.getFileIconUrl(fileInfo.extension);
  }

  // 获取文件类型图标
  getFileIconUrl(extension: string): string {
    const iconMap: Record<string, string> = {
      ".pdf": "/icons/pdf-icon.png",
      ".doc": "/icons/doc-icon.png",
      ".docx": "/icons/doc-icon.png",
      ".xls": "/icons/xls-icon.png",
      ".xlsx": "/icons/xls-icon.png",
      ".txt": "/icons/txt-icon.png",
      ".zip": "/icons/zip-icon.png",
      ".rar": "/icons/zip-icon.png",
    };

    return iconMap[extension.toLowerCase()] || "/icons/file-icon.png";
  }

  // 格式化文件大小
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

export const uploadService = new UploadService();
