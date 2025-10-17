export class FileUtils {
  static async selectVideoFiles(): Promise<string[]> {
    if (window.electronAPI) {
      return await window.electronAPI.selectVideoFiles();
    }
    // 浏览器环境处理
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = "video/*";
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          const fileUrls = Array.from(files).map((file) =>
            URL.createObjectURL(file)
          );
          resolve(fileUrls);
        }
      };
      input.click();
    });
  }

  static async saveVideoFile(videoBlob: Blob, filename: string): Promise<void> {
    if (window.electronAPI) {
      return await window.electronAPI.saveVideoFile(videoBlob, filename);
    }
    // 浏览器环境处理
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 从文件路径中提取干净的文件名
  static extractFileName(filePath: string): string {
    if (!filePath) return "未命名视频";

    // 处理各种路径分隔符
    const normalizedPath = filePath.replace(/\\/g, "/");
    const fileNameWithExt = normalizedPath.split("/").pop() || "未命名视频";

    // 移除文件扩展名
    const fileName = fileNameWithExt.replace(/\.[^/.]+$/, "");

    return fileName || "未命名视频";
  }

  static generateVideoItem(
    filePath: string,
    originalName: string
  ): API.VideoItem {
    // 使用提取的文件名而不是原始名称
    const cleanName = this.extractFileName(originalName);

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: cleanName, // 使用清理后的名称
      path: filePath,
      duration: 0,
      uploadTime: Date.now(),
    };
  }

  // 获取视频时长
  static getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        resolve(video.duration);
      });
      video.addEventListener("error", () => {
        resolve(0);
      });
    });
  }
}
