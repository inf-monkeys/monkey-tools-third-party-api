import { AuthConfig, AuthType } from '../typings/manifest';
import { readConfig } from './readYaml';

export interface ServerConfig {
  port: number;
  auth: AuthConfig;
  appUrl: string;
}

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  modelBucketName: string;
  bucket: string;
  publicAccessUrl: string;
  forcePathStyle: boolean;
}

export interface ProxyConfig {
  enabled: boolean;
  url?: string;
  exclude?: string[];
}

export interface FalConfig {
  apiKey?: string;
}

export interface BflConfig {
  apiKey?: string;
}

export interface RedisConfig {
  url: string;
  prefix: string;
}

export interface JimengConfig {
  apiKey?: string;
}

export interface TripoConfig {
  apiKey?: string;
}

export interface GeminiConfig {
  apiKey?: string;
}

export interface ByteArkConfig {
  apiKey?: string;
}

export interface OpenAiConfig {
  apiKey?: string;
}

export interface GoogleSearchConfig {
  apiKey?: string;
}

export interface RunwayConfig {
  apiKey?: string;
}

export interface Config {
  server: ServerConfig;
  s3?: S3Config;
  fal: FalConfig;
  proxy: ProxyConfig;
  redis: RedisConfig;
  jimeng: JimengConfig;
  tripo: TripoConfig;
  bfl: BflConfig;
  gemini: GeminiConfig;
  byteArk: ByteArkConfig;
  openai: OpenAiConfig;
  googleSearch: GoogleSearchConfig;
  runway: RunwayConfig;
}

const port = readConfig('server.port', 3000);

export const config: Config = {
  server: {
    port,
    auth: {
      type: readConfig('server.auth.type', AuthType.none),
      authorization_type: 'bearer',
      verification_tokens: {
        monkeys: readConfig('server.auth.bearerToken'),
      },
    },
    appUrl: readConfig('server.appUrl', `http://localhost:${port}`),
  },
  s3: readConfig('s3', undefined),
  fal: {
    apiKey: readConfig('fal.apiKey'),
  },
  proxy: {
    enabled: readConfig('proxy.enabled', false),
    url: readConfig('proxy.url'),
    exclude: readConfig('proxy.exclude', []),
  },
  redis: {
    url: readConfig('redis.url'),
    prefix: readConfig('redis.prefix', 'monkeys:third-party-api:'),
  },
  jimeng: {
    apiKey: readConfig('jimeng.apiKey'),
  },
  tripo: {
    apiKey: readConfig('tripo.apiKey'),
  },
  bfl: {
    apiKey: readConfig('bfl.apiKey'),
  },
  gemini: {
    apiKey: readConfig('gemini.apiKey'),
  },
  byteArk: {
    apiKey: readConfig('byteArk.apiKey'),
  },
  openai: {
    apiKey: readConfig('openai.apiKey'),
  },
  googleSearch: {
    apiKey:
      readConfig('googleSearch.apiKey') || process.env.GOOGLE_SEARCH_API_KEY,
  },
  runway: {
    apiKey: readConfig('runway.apiKey') || process.env.RUNWAY_API_KEY,
  },
};

const validateConfig = () => {
  if (config.server.auth.type === AuthType.service_http) {
    if (!config.server.auth.verification_tokens['monkeys']) {
      throw new Error(
        'Invalid Config: auth.bearerToken must not empty when auth.type is service_http',
      );
    }
  }

  // if (!config.goapi.apikey) {
  //   throw new Error('Invalid Config: goapi.apikey must not empty');
  // }

  if (config.proxy.enabled) {
    if (!config.proxy.url) {
      throw new Error('Proxy enabled but no url provided');
    }
    if (config.proxy.exclude && !Array.isArray(config.proxy.exclude)) {
      throw new Error('Proxy exclude must be an array');
    }
  }
};

validateConfig();

if (config.proxy.enabled) {
  const { url, exclude } = config.proxy;
  // Exclude localhost from proxy
  exclude.push('localhost');
  exclude.push('127.0.0.1');
  process.env.HTTP_PROXY = url;
  process.env.HTTPS_PROXY = url;
  process.env.http_proxy = url;
  process.env.https_proxy = url;
  process.env.NO_PROXY = exclude.join(',');
}
