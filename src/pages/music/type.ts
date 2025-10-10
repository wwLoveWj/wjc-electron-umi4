// 音乐类型定义
export interface Music {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  cover: string;
  liked: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  addedDate?: string;
}

// 播放列表类型定义
export interface Playlist {
  id: string;
  name: string;
  musics: Music[];
}

// 专辑类型定义
export interface Album {
  id: string;
  name: string;
  artist: string;
  cover: string;
  year: string;
  musics: Music[];
}
