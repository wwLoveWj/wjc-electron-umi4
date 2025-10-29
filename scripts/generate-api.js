const { generate  } = require('openapi-typescript-codegen');
const path = require('path');

const swaggerUrl = 'http://localhost:3000/swagger/docs.json'; // 你的 Swagger 地址
const outputPath = path.resolve(process.cwd(), './src/services');
async function generateApi() {
  try {
    await generate({
      input: swaggerUrl,
      output: outputPath,
      httpClient: 'axios', // 或者 'fetch'
      useOptions: true,
      useUnionTypes: true,
    });
    console.log('✅ API 生成成功！');
  } catch (error) {
    console.error('❌ API 生成失败:', error);
  }
}

generateApi();
