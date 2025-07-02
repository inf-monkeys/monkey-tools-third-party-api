import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { config } from './common/config';
import {
  ApiType,
  CredentialAuthType,
  ManifestJson,
  SchemaVersion,
} from './common/typings/manifest';

@Controller()
export class AppController {
  constructor() {}

  @Get('/healthz')
  public async healthz() {
    return {
      status: 'OK',
    };
  }

  @Get('/manifest.json')
  @ApiExcludeEndpoint()
  public getManifestJson(): ManifestJson {
    return {
      schema_version: SchemaVersion.v1,
      display_name: 'ThirdPartyAPI',
      namespace: 'third_party_api',
      auth: config.server.auth,
      api: {
        type: ApiType.openapi,
        url: `/openapi-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
      credentials: [
        {
          name: 'fal-ai',
          type: CredentialAuthType.AKSK,
          displayName: 'Fal AI',
          // @ts-ignore
          iconUrl: 'https://fal.ai/favicon.png',
          properties: [
            {
              displayName:
                '从 [Fal AI](https://fal.ai/dashboard) 获取你的 API Key。',
              type: 'notice',
              name: 'docs',
            },
            {
              displayName: 'API Key',
              type: 'string',
              name: 'api_key',
              required: true,
            },
          ],
        },
        {
          name: 'jimeng',
          type: CredentialAuthType.AKSK,
          displayName: '即梦',
          logo: '',
          // @ts-ignore
          properties: [
            {
              displayName: 'API Key',
              type: 'string',
              name: 'api_key',
              required: true,
            },
          ],
        },
        {
          name: 'tripo-api',
          type: CredentialAuthType.AKSK,
          displayName: 'Tripo API',
          logo: '',
          // @ts-ignore
          properties: [
            {
              displayName: 'API Key',
              type: 'string',
              name: 'api_key',
              required: true,
            },
          ],
        },
        {
          name: 'bfl',
          type: CredentialAuthType.AKSK,
          displayName: 'BFL API',
          logo: '',
          // @ts-ignore
          properties: [
            {
              displayName: 'API Key',
              type: 'string',
              name: 'api_key',
              required: true,
            },
          ],
        },
        {
          name: 'gemini',
          type: CredentialAuthType.AKSK,
          displayName: 'Google Gemini',
          // @ts-ignore
          iconUrl:
            'https://www.gstatic.com/lamda/images/favicon_v1_70c80ffdf27202fd2e84f.png',
          properties: [
            {
              displayName:
                '从 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取你的 API Key。',
              type: 'notice',
              name: 'docs',
            },
            {
              displayName: 'API Key',
              type: 'string',
              name: 'api_key',
              required: true,
            },
          ],
        },
      ],
    };
  }
}
