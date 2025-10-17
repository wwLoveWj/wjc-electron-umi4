import { uploadChunk } from "@/service/api/upload";

self.onmessage = async (e) => {
  const { fileId, file, fileHash, uploadedChunks = [], chunkSize } = e.data;

  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadedSet = new Set(uploadedChunks);

  console.log(`Starting upload for file ${fileId}: ${totalChunks} chunks`);

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (uploadedSet.has(chunkIndex)) {
        const progress = Math.round((uploadedSet.size / totalChunks) * 100);
        self.postMessage({
          type: "progress",
          fileId, // 传递 fileId
          data: {
            uploadedChunks: Array.from(uploadedSet),
            progress,
            currentChunk: chunkIndex,
            totalChunks,
          },
        });
        continue;
      }

      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      // 方法1：使用原始文件名和切片索引
      const originalExtension = file.name.includes(".")
        ? file.name.split(".").pop()
        : "bin";
      const chunkFileName = `chunk-${chunkIndex}.${originalExtension}`;

      // 为文件字段指定文件名，这样 file.originalname 就不会是 "blob"
      formData.append("chunk", chunkBlob, chunkFileName);
      formData.append("fileHash", fileHash);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("totalChunks", totalChunks.toString());
      formData.append("fileName", file.name);
      const result = await uploadChunk(formData);
      debugger;
      // const response = await fetch("/api/bigFile/upload-chunk", {
      //   method: "POST",
      //   body: formData,
      // });
      // if (!response.ok) {
      //   throw new Error(`Upload failed with status: ${response.status}`);
      // }

      // const result = await response.json();

      if (result.success) {
        uploadedSet.add(chunkIndex);

        const progress = Math.round((uploadedSet.size / totalChunks) * 100);
        self.postMessage({
          type: "progress",
          fileId, // 传递 fileId
          data: {
            uploadedChunks: Array.from(uploadedSet),
            progress,
            currentChunk: chunkIndex,
            totalChunks,
          },
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    }

    // 所有切片上传完成，传递完整文件信息
    self.postMessage({
      type: "completed",
      fileId, // 传递 fileId
      data: {
        fileHash,
        fileName: file.name,
        totalChunks,
      },
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      fileId, // 传递 fileId
      data: { error: error.message },
    });
  }
};
