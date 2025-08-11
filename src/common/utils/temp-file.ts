import { writeFileSync } from 'fs';
import { join } from 'path';
import { config } from '../config';

/**
 * 将base64数据保存为临时文件并返回URL
 */
export function saveBase64AsTemp(base64Data: string, extension: string = 'png'): string {
  try {
    // 创建唯一文件名
    const fileName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = join(process.cwd(), 'temp', fileName);
    
    // 确保temp目录存在
    const { mkdirSync, existsSync } = require('fs');
    const tempDir = join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
    
    // 将base64转换为buffer并保存
    const buffer = Buffer.from(base64Data, 'base64');
    writeFileSync(filePath, buffer);
    
    // 返回访问URL
    const baseUrl = config.server.appUrl || `http://localhost:${config.server.port}`;
    return `${baseUrl}/temp/${fileName}`;
  } catch (error) {
    throw new Error(`保存临时文件失败: ${error.message}`);
  }
}