declare interface Window {
  __POWERED_BY_QIANKUN__?: boolean;
  __INJECTED_PUBLIC_PATH_BY_QIANKUN__: string;
  __QIANKUN_DEVELOPMENT__?: boolean;
  Zone?: CallableFunction;
  electronAPI: {
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    isWindowMaximized: () => Promise<boolean>;
    setAlwaysOnTop: (flag: boolean) => Promise<boolean>;
    isAlwaysOnTop: () => Promise<boolean>;
    onWindowStateChange: (
      callback: (event: any, isMaximized: boolean) => void
    ) => () => void;

    scheduleTask: (task: any) => Promise<string>;
    cancelTask: (jobId: string) => Promise<boolean>;
    getScheduledTasks: () => Promise<string[]>;
    onTaskNotification: (callback: (event: any, task: any) => void) => void;
    removeAllListeners: (channel: string) => void;
    // 存储路径管理
    selectStorageDirectory: () => Promise<{ success: boolean; path?: string }>;
    getStoragePath: () => Promise<string>;
    openStorageDirectory: () => Promise<{ success: boolean; error?: string }>;

    // 音乐文件管理
    selectAndUploadMusic: () => Promise<{
      success: boolean;
      files?: Array<{
        success: boolean;
        title?: string;
        artist?: string;
        album?: string;
        duration?: number;
        cover?: string;
        filePath?: string;
        url?: string;
        fileName?: string;
        fileSize?: number;
        error?: string;
      }>;
      total?: number;
      successful?: number;
      error?: string;
    }>;
    getLocalMusic: () => Promise<any[]>;
    deleteMusicFile: (
      music: any
    ) => Promise<{ success: boolean; error?: string }>;

    // 下载功能
    downloadMusicZip: (musicList: any[]) => Promise<{
      success: boolean;
      path?: string;
      size?: number;
      error?: string;
    }>;
    // 视频
    selectVideoFiles: () => Promise<string[]>;
    saveVideoFile: (videoBlob: Blob, filename: string) => Promise<void>;
  };
}

declare module "*.less" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}
