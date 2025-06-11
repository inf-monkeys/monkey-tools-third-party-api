import axios from 'axios';
import { S3Helpers } from '../s3';
import { logger } from '../logger';
import { config } from '../config';

const s3Client = new S3Helpers();

/**
 * 从文本中提取URL列表
 */
function extractUrls(text: string): string[] {
  // Markdown图片语法匹配
  const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
  // 普通URL匹配
  const urlRegex = /(https?:\/\/[^\s<>"']*)/g;

  const urls = new Set<string>();

  // 提取Markdown图片URL
  let match;
  while ((match = markdownImageRegex.exec(text)) !== null) {
    urls.add(match[1]);
  }

  // 提取普通URL
  while ((match = urlRegex.exec(text)) !== null) {
    urls.add(match[0]);
  }

  return Array.from(urls);
}

/**
 * 检查URL是否为文件
 */
async function isFileUrl(url: string): Promise<boolean> {
  try {
    // 先尝试 HEAD 请求
    try {
      const headResponse = await axios.head(url);
      const contentType = headResponse.headers['content-type'];
      return contentType && !contentType.startsWith('text/html');
    } catch {
      // HEAD 请求失败时尝试 GET 请求
      const source = axios.CancelToken.source();

      const response = await axios.get(url, {
        // 只获取响应头,不下载内容
        responseType: 'stream',
        maxContentLength: 0,
        cancelToken: source.token,
      });

      // 收到响应头后立即取消请求
      response.request.on('response', () => {
        source.cancel('Got headers');
      });

      const contentType = response.headers['content-type'];
      return contentType && !contentType.startsWith('text/html');
    }
  } catch (error) {
    logger.error(`检查URL失败: ${url}`, error);
    return false;
  }
}

/**
 * 从URL中提取文件扩展名
 */
function getExtensionFromUrl(url: string): string {
  const urlWithoutQuery = url.split('?')[0];
  const matches = urlWithoutQuery.match(/\.([^.]+)$/);
  return matches ? matches[1] : 'bin';
}

/**
 * 下载文件并上传到S3
 */
async function uploadToS3(url: string): Promise<string> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    let fileExtension: string;

    // 从Content-Disposition获取文件名
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename=["']?([^"']+)["']?/,
      );
      if (filenameMatch) {
        const filename = filenameMatch[1];
        const extMatch = filename.match(/\.([^.]+)$/);
        if (extMatch) {
          fileExtension = extMatch[1];
        }
      }
    }

    // 如果Content-Disposition中没有文件名，从Content-Type获取
    if (!fileExtension) {
      const contentType = response.headers['content-type'];
      const mimeExtension = contentType.split('/')[1];

      // 如果是通用二进制类型，从URL获取扩展名
      if (['octet-stream', 'bin', 'binary'].includes(mimeExtension)) {
        fileExtension = getExtensionFromUrl(url);
      } else {
        fileExtension = mimeExtension;
      }
    }

    const fileKey = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const newUrl = await s3Client.uploadFile(
      response.data,
      fileKey,
      response.headers['content-type'],
    );

    return newUrl;
  } catch (error) {
    logger.error(`上传到S3失败: ${url}`, error);
    return url;
  }
}

/**
 * 处理内容中的URL,将文件上传至S3并替换URL
 */
export async function processContentUrls(content: any): Promise<any> {

  if (!s3Client || !config.s3) {
    return content;
  }

  logger.info(`S3 已配置，开始处理内容`);

  // 如果是字符串类型
  if (typeof content === 'string') {
    let processedContent = content;
    const urls = extractUrls(content);

    for (const url of urls) {
      if (await isFileUrl(url)) {
        const newUrl = await uploadToS3(url);
        processedContent = processedContent.replace(url, newUrl);
      }
    }

    return processedContent;
  }

  // 如果是对象类型
  if (typeof content === 'object' && content !== null) {
    const processedContent = Array.isArray(content)
      ? [...content]
      : { ...content };

    for (const key in processedContent) {
      if (typeof processedContent[key] === 'string') {
        processedContent[key] = await processContentUrls(processedContent[key]);
      } else if (
        typeof processedContent[key] === 'object' &&
        processedContent[key] !== null
      ) {
        processedContent[key] = await processContentUrls(processedContent[key]);
      }
    }

    return processedContent;
  }

  return content;
}
