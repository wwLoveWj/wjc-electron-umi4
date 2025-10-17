import { useState, useCallback } from "react";

export default function useVideoUploadModel() {
  const [isUploadVisible, setIsUploadVisible] = useState(false);

  const showUpload = useCallback(() => {
    setIsUploadVisible(true);
  }, []);

  const hideUpload = useCallback(() => {
    setIsUploadVisible(false);
  }, []);

  return {
    isUploadVisible,
    showUpload,
    hideUpload,
  };
}
