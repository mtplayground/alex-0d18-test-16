import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getStorageConfig, type StorageEnv } from "@/lib/env";

type UploadObjectInput = Readonly<{
  key: string;
  body: PutObjectCommandInput["Body"];
  contentType: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}>;

type StoredObject = Readonly<{
  body: NonNullable<GetObjectCommandOutput["Body"]>;
  contentType: string;
  contentLength?: number;
  lastModified?: Date;
}>;

let cachedClient: S3Client | undefined;

function normalizeStorageKey(key: string) {
  const normalizedKey = key.trim().replace(/^\/+/, "");

  if (!normalizedKey) {
    throw new Error("Object storage key is required.");
  }

  return normalizedKey;
}

function encodeStorageKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function createStorageClient(config: StorageEnv) {
  return new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
  });
}

export function getStorageClient() {
  cachedClient ??= createStorageClient(getStorageConfig());
  return cachedClient;
}

export function getObjectUrl(key: string) {
  const config = getStorageConfig();
  const normalizedKey = normalizeStorageKey(key);
  const encodedKey = encodeStorageKey(normalizedKey);

  if (config.S3_PUBLIC_BASE_URL) {
    return `${trimTrailingSlash(config.S3_PUBLIC_BASE_URL)}/${encodedKey}`;
  }

  if (config.S3_FORCE_PATH_STYLE) {
    return `${trimTrailingSlash(config.S3_ENDPOINT)}/${encodeURIComponent(
      config.S3_BUCKET
    )}/${encodedKey}`;
  }

  const endpointUrl = new URL(config.S3_ENDPOINT);
  endpointUrl.hostname = `${config.S3_BUCKET}.${endpointUrl.hostname}`;
  endpointUrl.pathname = `${trimTrailingSlash(endpointUrl.pathname)}/${encodedKey}`;

  return endpointUrl.toString();
}

export async function uploadObject(input: UploadObjectInput) {
  const config = getStorageConfig();
  const key = normalizeStorageKey(input.key);

  await getStorageClient().send(
    new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
      Metadata: input.metadata,
    })
  );

  return {
    key,
    url: getObjectUrl(key),
  };
}

export async function deleteObject(key: string) {
  const config = getStorageConfig();

  await getStorageClient().send(
    new DeleteObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: normalizeStorageKey(key),
    })
  );
}

export async function getObject(key: string): Promise<StoredObject> {
  const config = getStorageConfig();
  const normalizedKey = normalizeStorageKey(key);
  const response = await getStorageClient().send(
    new GetObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: normalizedKey,
    })
  );

  if (!response.Body) {
    throw new Error(
      `Object storage returned an empty body for key ${normalizedKey}.`
    );
  }

  return {
    body: response.Body,
    contentType: response.ContentType ?? "application/octet-stream",
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
  };
}

export async function createPresignedGetUrl(
  key: string,
  expiresInSeconds = 3600
) {
  const config = getStorageConfig();
  return getSignedUrl(
    getStorageClient(),
    new GetObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: normalizeStorageKey(key),
    }),
    {
      expiresIn: expiresInSeconds,
    }
  );
}

export async function createPresignedPutUrl(
  input: Omit<UploadObjectInput, "body" | "metadata">
) {
  const config = getStorageConfig();
  return getSignedUrl(
    getStorageClient(),
    new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: normalizeStorageKey(input.key),
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    }),
    {
      expiresIn: 3600,
    }
  );
}
