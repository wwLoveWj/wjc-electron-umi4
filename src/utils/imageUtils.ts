// 默认专辑封面图片URL
const DEFAULT_COVERS = [
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop", // 婚礼音乐1
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop", // 婚礼音乐2
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop", // 浪漫钢琴
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop", // 音乐符号
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop", // 爱情音乐
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop", // 音乐现场
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop", // 婚礼戒指
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop", // 浪漫烛光
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop", // 音乐爱情
  "https://images.unsplash.com/photo-1571974599782-87624638275f?w=300&h=300&fit=crop", // 永恒誓言
];

// 根据文本生成确定性随机封面
export const getDefaultCover = (seed: string = ""): string => {
  if (!seed) {
    // 完全随机
    return DEFAULT_COVERS[Math.floor(Math.random() * DEFAULT_COVERS.length)];
  }

  // 基于种子生成确定性随机
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash; // 转换为32位整数
  }
  const index = Math.abs(hash) % DEFAULT_COVERS.length;
  return DEFAULT_COVERS[index];
};

// 检查图片URL是否有效
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith("/api/placeholder")) return false;
  if (url === "/api/placeholder/80/80") return false;
  if (url === "/api/placeholder/300/300") return false;
  return true;
};

// 获取专辑封面 - 优先使用真实封面，没有则使用默认
export const getAlbumCover = (
  albumName: string,
  customCover?: string
): string => {
  if (customCover && isValidImageUrl(customCover)) {
    return customCover;
  }
  return getDefaultCover(albumName);
};

// 获取音乐封面 - 优先使用真实封面，没有则使用专辑封面或默认
export const getMusicCover = (
  musicTitle: string,
  albumName?: string,
  customCover?: string
): string => {
  if (customCover && isValidImageUrl(customCover)) {
    return customCover;
  }
  if (albumName) {
    return getDefaultCover(albumName);
  }
  return getDefaultCover(musicTitle);
};
