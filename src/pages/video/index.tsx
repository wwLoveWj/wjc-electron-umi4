import React from "react";
import VideoPlayer from "./components/Player";
import ScreenCast from "./components/ScreenCast";
import VideoUpload from "./components/Upload";
import styles from "./index.less";

const HomePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <VideoPlayer />
      <ScreenCast />
      <VideoUpload />
    </div>
  );
};

export default HomePage;
