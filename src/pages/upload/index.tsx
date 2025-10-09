// src/App.tsx
import React from "react";
import { ConfigProvider } from "antd";
import FileUploader from "@/components/FileUploader";
import AdvancedFileUploader from "@/components/AdvancedFileUploader";

const App: React.FC = () => {
  return (
    <ConfigProvider>
      <div className="App">
        <h1 style={{ textAlign: "center", margin: "24px 0" }}>文件上传演示</h1>

        {/* 使用基础上传组件 */}
        <FileUploader />

        {/* 或者使用高级上传组件 */}
        {/* <AdvancedFileUploader /> */}
      </div>
    </ConfigProvider>
  );
};

export default App;
