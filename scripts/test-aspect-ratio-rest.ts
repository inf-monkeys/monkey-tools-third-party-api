import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 测试 Gemini REST API 是否支持 aspectRatio 配置
 *
 * 根据官方文档,REST API 应该支持通过 generationConfig.imageConfig.aspectRatio 设置宽高比
 */

async function testAspectRatioWithREST() {
  const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY';

  if (apiKey === 'YOUR_API_KEY') {
    console.error('❌ 请设置环境变量 GEMINI_API_KEY');
    process.exit(1);
  }

  console.log(
    '🧪 测试: 使用 REST API 的 generationConfig.imageConfig.aspectRatio',
  );
  console.log('━'.repeat(60));

  const testCases = [
    {
      ratio: '16:9',
      description: '横屏比例',
      expectedWidth: 1344,
      expectedHeight: 768,
    },
    {
      ratio: '9:16',
      description: '竖屏比例',
      expectedWidth: 768,
      expectedHeight: 1344,
    },
    {
      ratio: '1:1',
      description: '正方形',
      expectedWidth: 1024,
      expectedHeight: 1024,
    },
    {
      ratio: '21:9',
      description: '超宽屏',
      expectedWidth: 1536,
      expectedHeight: 672,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📐 测试宽高比: ${testCase.ratio} (${testCase.description})`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Create a simple test image with a large text "${testCase.ratio}" in the center to verify the aspect ratio.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['Image'],
        imageConfig: {
          aspectRatio: testCase.ratio,
        },
      },
    };

    console.log('📤 发送 REST 请求...');
    console.log(
      '   配置:',
      JSON.stringify(requestBody.generationConfig, null, 2),
    );

    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      console.log('✅ 收到响应');

      // 处理响应
      const candidates = response.data.candidates || [];
      for (const candidate of candidates) {
        const content = candidate.content || candidate;
        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.inlineData) {
              const buffer = Buffer.from(part.inlineData.data, 'base64');
              const fileName = `test-rest-${testCase.ratio.replace(':', 'x')}.png`;
              const filePath = path.join(__dirname, '..', fileName);
              fs.writeFileSync(filePath, buffer);

              // 获取图片尺寸
              const dimensions = getImageDimensions(buffer);
              if (dimensions) {
                const actualRatio = (
                  dimensions.width / dimensions.height
                ).toFixed(2);
                const expectedRatioValue = eval(
                  testCase.ratio.replace(':', '/'),
                ).toFixed(2);
                const sizeMatch =
                  dimensions.width === testCase.expectedWidth &&
                  dimensions.height === testCase.expectedHeight;

                console.log(
                  `   📊 期望尺寸: ${testCase.expectedWidth}x${testCase.expectedHeight}`,
                );
                console.log(
                  `   📊 实际尺寸: ${dimensions.width}x${dimensions.height}`,
                );
                console.log(
                  `   📊 实际比例: ${actualRatio} (期望: ${expectedRatioValue})`,
                );
                console.log(
                  `   ${sizeMatch ? '✅ 尺寸完全匹配' : '⚠️ 尺寸不匹配'}`,
                );
                console.log(`   💾 已保存: ${fileName}`);
              } else {
                console.log(`   💾 已保存: ${fileName} (无法解析尺寸)`);
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.response) {
        console.error(
          `❌ REST API 调用失败 (${error.response.status}):`,
          error.response.data,
        );
      } else if (error.code === 'ECONNABORTED') {
        console.error('❌ 请求超时');
      } else {
        console.error('❌ 请求失败:', error.message);
      }
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log('✅ REST API 测试完成');
  console.log('\n💡 结论:');
  console.log('   - 如果实际尺寸与期望尺寸匹配,说明 REST API 支持 aspectRatio');
  console.log('   - 如果所有图片都是 1024x1024,说明 aspectRatio 参数被忽略');
  console.log('   - SDK 不支持此参数,必须使用 REST API');
}

// 获取图片尺寸
function getImageDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  try {
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
testAspectRatioWithREST();
