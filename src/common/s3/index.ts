import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { config } from '../config';

export class S3Helpers {
  client: S3Client;

  constructor() {
    if (!config.s3) {
      return;
    }

    this.checkS3Config();
    this.client = new S3Client({
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      forcePathStyle: config.s3.forcePathStyle,
    });
  }

  private checkS3Config() {
    if (
      config.s3.accessKeyId &&
      config.s3.secretAccessKey &&
      config.s3.region &&
      config.s3.endpoint &&
      config.s3.bucket &&
      config.s3.publicAccessUrl
    ) {
      return;
    }
    throw new Error('S3 config is not set properly.');
  }

  public async getFile(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
    });
    const res = await this.client.send(command);
    return res;
  }

  public async uploadFile(
    fileBuffer:
      | string
      | Buffer
      | Readable
      | ReadableStream<any>
      | Blob
      | Uint8Array,
    fileKey: string,
    contentType?: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: contentType,
    });
    await this.client.send(command);
    return config.s3.publicAccessUrl + '/' + fileKey;
  }

  public async deleteFile(fileKey: string) {
    const command = new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
    });
    const res = await this.client.send(command);
    return res;
  }

  public async getFileSignedUrl(fileKey: string, bucket = config.s3.bucket) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const res = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return res;
  }
}
