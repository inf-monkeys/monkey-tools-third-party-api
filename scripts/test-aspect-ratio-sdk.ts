import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 测试 Google GenAI SDK 是否支持通过 config.imageConfig.aspectRatio 自定义宽高比
 *
 * 根据官方文档,应该可以通过以下方式设置宽高比:
 * config: {
 *   imageConfig: {
 *     aspectRatio: "16:9"
 *   }
 * }
 *
 * 但实际上 @google/genai SDK 可能不支持或会忽略这个配置
 */

async function testAspectRatioWithSDK() {
  // 从环境变量获取 API Key
  const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY';

  if (apiKey === 'YOUR_API_KEY') {
    console.error('❌ 请设置环境变量 GEMINI_API_KEY');
    process.exit(1);
  }

  console.log('🧪 测试 1: 使用 SDK 的 config.imageConfig.aspectRatio');
  console.log('━'.repeat(60));

  try {
    const client = new GoogleGenAI({ apiKey });

    const testCases = [
      { ratio: '16:9', description: '横屏比例' },
      { ratio: '9:16', description: '竖屏比例' },
      { ratio: '1:1', description: '正方形' },
      { ratio: '21:9', description: '超宽屏' },
    ];

    for (const testCase of testCases) {
      console.log(
        `\n📐 测试宽高比: ${testCase.ratio} (${testCase.description})`,
      );

      const prompt = `Create a simple abstract geometric pattern with circles and triangles. The composition should clearly show the ${testCase.ratio} aspect ratio.`;

      console.log('📤 发送请求 (使用 SDK config)...');

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
          responseModalities: ['Image'],
          imageConfig: {
            aspectRatio: testCase.ratio,
          },
        } as any, // 使用 as any 绕过类型检查
      });

      console.log('✅ 收到响应');

      // 处理响应
      const candidates = response.candidates || [];
      for (const candidate of candidates) {
        const content = candidate.content || candidate;
        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.inlineData) {
              const buffer = Buffer.from(part.inlineData.data, 'base64');
              const fileName = `test-sdk-${testCase.ratio.replace(':', 'x')}.png`;
              const filePath = path.join(__dirname, '..', fileName);
              fs.writeFileSync(filePath, buffer);

              // 尝试获取图片尺寸
              const dimensions = await getImageDimensions(filePath);
              if (dimensions) {
                const actualRatio = (
                  dimensions.width / dimensions.height
                ).toFixed(2);
                const expectedRatio = eval(
                  testCase.ratio.replace(':', '/'),
                ).toFixed(2);
                const match =
                  Math.abs(
                    parseFloat(actualRatio) - parseFloat(expectedRatio),
                  ) < 0.01;

                console.log(
                  `   📊 期望比例: ${testCase.ratio} (${expectedRatio})`,
                );
                console.log(
                  `   📊 实际尺寸: ${dimensions.width}x${dimensions.height}`,
                );
                console.log(`   📊 实际比例: ${actualRatio}`);
                console.log(
                  `   ${match ? '✅ 宽高比匹配' : '❌ 宽高比不匹配 - SDK config 可能被忽略'}`,
                );
                console.log(`   💾 已保存: ${fileName}`);
              } else {
                console.log(`   💾 已保存: ${fileName} (无法解析尺寸)`);
              }
            }
          }
        }
      }
    }

    console.log('\n' + '━'.repeat(60));
    console.log('✅ SDK 测试完成');
    console.log('\n💡 结论:');
    console.log(
      '   如果所有图片都是 1024x1024 (1:1),说明 SDK 的 config.imageConfig',
    );
    console.log('   配置被忽略了,需要使用 REST API 方式传递 aspectRatio');
  } catch (error: any) {
    console.error('❌ SDK 测试失败:', error.message);
    if (error.response) {
      console.error(
        '   响应数据:',
        JSON.stringify(error.response.data, null, 2),
      );
    }
  }
}

// 获取图片尺寸的辅助函数
async function getImageDimensions(
  filePath: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const buffer = fs.readFileSync(filePath);

    // PNG 格式
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // JPEG 格式
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        if (marker === 0xd9 || marker === 0xda) break;
        const length = buffer.readUInt16BE(offset + 2);
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        offset += 2 + length;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// 运行测试
testAspectRatioWithSDK();
