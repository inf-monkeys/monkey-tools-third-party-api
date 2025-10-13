import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { config } from '@/common/config';
import {
  JimengV4SubmitRequestDto,
  JimengV4GetResultRequestDto,
} from '@/common/schemas/jimeng-v4';
import { volcSign } from '@/common/volc/signature';
import { processContentUrls } from '@/common/utils/output';

@Injectable()
export class JimengV4Service {
  private readonly host = config.volcVisual.host || 'visual.volcengineapi.com';
  private readonly endpoint = `https://${this.host}`;
  private readonly version = '2022-08-31';
  private readonly reqKey = 'jimeng_t2i_v40';

  private getAkSkFromCredential(
    credential?: {
      encryptedData?: string;
    } | null,
  ) {
    if (!credential) return null;
    try {
      const data = JSON.parse(credential.encryptedData || '{}');
      const ak = data.access_key_id || data.accessKeyId || data.ak || data.AK;
      const sk =
        data.secret_access_key || data.secretAccessKey || data.sk || data.SK;
      if (ak && sk) return { ak, sk };
    } catch {}
    return null;
  }

  private resolveCredentials(
    inputCredential?: { encryptedData?: string } | null,
  ) {
    const fromInput = this.getAkSkFromCredential(inputCredential);
    if (fromInput) return fromInput;
    const ak = config.volcVisual?.accessKeyId;
    const sk = config.volcVisual?.secretAccessKey;
    if (!ak || !sk) {
      throw new Error('未配置火山引擎 Visual AK/SK，请在凭证或配置中提供。');
    }
    return { ak, sk };
  }

  private async signedPost(
    action: string,
    bodyObj: Record<string, any>,
    ak: string,
    sk: string,
  ) {
    const path = '/';
    const query = {
      Action: action,
      Version: this.version,
    } as Record<string, string>;
    const body = JSON.stringify(bodyObj || {});

    const { headers } = volcSign({
      method: 'POST',
      host: this.host,
      path,
      query,
      headers: {},
      body,
      accessKeyId: ak,
      secretAccessKey: sk,
      region: config.volcVisual?.region || 'cn-north-1',
      service: config.volcVisual?.service || 'cv',
    });

    const url = `${this.endpoint}?Action=${encodeURIComponent(
      action,
    )}&Version=${encodeURIComponent(this.version)}`;

    const response = await axios.post(url, body, {
      headers,
      proxy: config.proxy?.url
        ? {
            host: new URL(config.proxy.url).hostname,
            port: parseInt(new URL(config.proxy.url).port),
            protocol: new URL(config.proxy.url).protocol.slice(0, -1),
          }
        : undefined,
    });

    return response;
  }

  async submitTask(input: JimengV4SubmitRequestDto) {
    const { ak, sk } = this.resolveCredentials(input.credential);

    const body: Record<string, any> = {
      req_key: this.reqKey,
      prompt: input.prompt,
    };
    if (input.imageUrls && input.imageUrls.length)
      body.image_urls = input.imageUrls;
    if (typeof input.size === 'number') body.size = input.size;
    if (typeof input.width === 'number' && typeof input.height === 'number') {
      body.width = input.width;
      body.height = input.height;
    }
    if (typeof input.scale === 'number') body.scale = input.scale;
    if (typeof input.forceSingle === 'boolean')
      body.force_single = input.forceSingle;
    if (typeof input.minRatio === 'number') body.min_ratio = input.minRatio;
    if (typeof input.maxRatio === 'number') body.max_ratio = input.maxRatio;
    if (typeof input.seed === 'number') body.seed = input.seed;

    const res = await this.signedPost('CVSync2AsyncSubmitTask', body, ak, sk);
    const output = await processContentUrls(res.data);
    return {
      data: output,
      requestId: res.data?.request_id || res.headers['x-request-id'] || '',
    };
  }

  async getResult(input: JimengV4GetResultRequestDto) {
    const { ak, sk } = this.resolveCredentials(input.credential);
    const body: Record<string, any> = {
      req_key: this.reqKey,
      task_id: input.taskId,
    };
    if (input.reqJson) body.req_json = input.reqJson;

    const res = await this.signedPost('CVSync2AsyncGetResult', body, ak, sk);

    const output = await processContentUrls(res.data);

    return {
      data: output,
      requestId: res.data?.request_id || res.headers['x-request-id'] || '',
    };
  }
}
