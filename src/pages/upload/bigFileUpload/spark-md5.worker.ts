// src/pages/Upload/spark-md5.worker.ts
importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js"
);

self.onmessage = function (e) {
  const { file } = e.data;

  const chunkSize = 2 * 1024 * 1024; // 2MB chunks
  const chunks = Math.ceil(file.size / chunkSize);
  const spark = new self.SparkMD5.ArrayBuffer();
  const fileReader = new FileReader();

  let currentChunk = 0;

  fileReader.onload = function (e) {
    spark.append(e.target?.result as ArrayBuffer);
    currentChunk++;

    // 发送进度更新
    self.postMessage({
      type: "progress",
      progress: Math.round((currentChunk / chunks) * 100),
    });

    if (currentChunk < chunks) {
      loadNextChunk();
    } else {
      const hash = spark.end();
      self.postMessage({
        type: "complete",
        hash: hash,
      });
    }
  };

  fileReader.onerror = function () {
    self.postMessage({
      type: "error",
      error: "File read error",
    });
  };

  function loadNextChunk() {
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    fileReader.readAsArrayBuffer(chunk);
  }

  loadNextChunk();
};
