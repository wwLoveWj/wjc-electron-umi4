import request from "../request";
// 删除minio文件
export const deleteMinioFileAPI = (fileName: string) => {
  return request.delete<{ success: boolean; message: string }>(
    "/api/minio/file",
    {
      fileName,
    }
  );
};

// 获取minio文件列表
export const getMinioFilesAPI = (
  page: number = 1,
  limit: number = 20,
  fileType: string = ""
) => {
  return request.get("/api/minio/files", {
    params: { page, limit, fileType },
  });
};

export const uploadMinioFilesAPI = (formData) => {
  return request.upload("/api/minio/upload7", formData).promise;
};
