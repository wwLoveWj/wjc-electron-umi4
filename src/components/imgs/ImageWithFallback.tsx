import React, { useState } from "react";
import { getDefaultCover } from "@/utils/imageUtils";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSeed?: string;
  type?: "album" | "music";
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = "",
  fallbackSeed = "",
  type = "music",
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const getFallbackSrc = () => {
    return getDefaultCover(fallbackSeed || alt);
  };

  const finalSrc = hasError || !src ? getFallbackSrc() : src;

  return (
    <div
      className={`image-container ${className} ${isLoading ? "loading" : ""}`}
    >
      <img
        src={finalSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        style={{ opacity: isLoading ? 0 : 1 }}
      />
      {isLoading && (
        <div className="image-skeleton">
          <div className="skeleton-animation" />
        </div>
      )}
    </div>
  );
};

export default ImageWithFallback;
