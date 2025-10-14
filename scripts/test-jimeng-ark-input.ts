import axios from 'axios';

const API_KEY = '181551fe-897f-4a6d-97dc-10df7bccc7f1';
const BASE_URL = 'http://localhost:3005';

interface TestCase {
  name: string;
  payload: any;
}

const testCases: TestCase[] = [
  {
    name: '1. 使用新的 input 参数 - 文本生图',
    payload: {
      input: {
        prompt: '一只可爱的橘猫，坐在窗台上晒太阳',
        size: '2K',
      },
      credential: {
        encryptedData: JSON.stringify({
          api_key: API_KEY,
        }),
      },
    },
  },
  {
    name: '2. 使用新的 input 参数 - 图生图',
    payload: {
      input: {
        prompt: '将这只猫变成水彩画风格',
        image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006',
        size: '2K',
      },
      credential: {
        encryptedData: JSON.stringify({
          api_key: API_KEY,
        }),
      },
    },
  },
  {
    name: '3. 使用新的 input 参数 - 组图生成',
    payload: {
      input: {
        prompt: '一组可爱的小猫咪表情包',
        size: '2K',
        sequential_image_generation: 'auto',
        sequential_image_generation_options: {
          max_images: 3,
        },
      },
      credential: {
        encryptedData: JSON.stringify({
          api_key: API_KEY,
        }),
      },
    },
  },
  {
    name: '4. 使用新的 input 参数 - 完整参数',
    payload: {
      input: {
        prompt: '一只科技感十足的赛博朋克猫咪',
        size: '2K',
        seed: 12345,
        response_format: 'url',
        watermark: true,
        stream: false,
      },
      credential: {
        encryptedData: JSON.stringify({
          api_key: API_KEY,
        }),
      },
    },
  },
];

async function runTest(testCase: TestCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log('请求参数:');
  console.log(JSON.stringify(testCase.payload, null, 2));

  try {
    const startTime = Date.now();
    const response = await axios.post(
      `${BASE_URL}/jimeng/ark/generate`,
      testCase.payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    const duration = Date.now() - startTime;

    console.log('\n✅ 测试成功!');
    console.log(`耗时: ${duration}ms`);
    console.log('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));

    // 提取图片 URL
    if (response.data.data?.data) {
      const images = response.data.data.data;
      if (Array.isArray(images)) {
        console.log(`\n生成了 ${images.length} 张图片:`);
        images.forEach((img: any, index: number) => {
          if (img.url) {
            console.log(`  图片 ${index + 1}: ${img.url}`);
          }
        });
      }
    }
  } catch (error: any) {
    console.error('\n❌ 测试失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

async function main() {
  console.log('开始测试即梦 Ark 新的 input 参数方式...');
  console.log(`API 端点: ${BASE_URL}/jimeng/ark/generate`);

  for (const testCase of testCases) {
    await runTest(testCase);
    // 等待一下，避免请求太快
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('\n所有测试完成!');
}

main().catch(console.error);
