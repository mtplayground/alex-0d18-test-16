"use client";

import { type ChangeEvent, useId, useRef, useState } from "react";

import {
  getUploadLimitMegabytes,
  isAllowedUploadContentType,
  type UploadPurpose,
  uploadAccept,
  uploadLimits,
} from "@/lib/upload-validation";

export type UploadedAttachment = Readonly<{
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: string;
  purpose: UploadPurpose;
  url: string;
}>;

type UploadResponse = Readonly<{
  attachment?: UploadedAttachment;
  error?: string;
}>;

type FileUploadProps = Readonly<{
  purpose: UploadPurpose;
  label?: string;
  accept?: string;
  inputName?: string;
  disabled?: boolean;
  onUploaded?: (attachment: UploadedAttachment) => void;
}>;

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.ceil(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function getDefaultLabel(purpose: UploadPurpose) {
  return purpose === "avatar" ? "Avatar image" : "Document";
}

function validateFile(file: File, purpose: UploadPurpose) {
  if (file.size <= 0) {
    return "File must not be empty.";
  }

  if (file.size > uploadLimits[purpose]) {
    return `File exceeds the ${getUploadLimitMegabytes(purpose)} MB limit.`;
  }

  if (!isAllowedUploadContentType(purpose, file.type)) {
    return "File type is not allowed for this upload purpose.";
  }

  return undefined;
}

function uploadFile(
  file: File,
  purpose: UploadPurpose,
  onProgress: (progress: number) => void
) {
  return new Promise<UploadedAttachment>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/upload");
    request.responseType = "json";
    request.withCredentials = true;

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      const response = request.response as UploadResponse | null;

      if (
        request.status >= 200 &&
        request.status < 300 &&
        response?.attachment
      ) {
        resolve(response.attachment);
        return;
      }

      reject(new Error(response?.error ?? "Upload failed."));
    };

    request.onerror = () => {
      reject(new Error("Upload failed."));
    };

    request.send(formData);
  });
}

export function FileUpload({
  purpose,
  label = getDefaultLabel(purpose),
  accept = uploadAccept[purpose],
  inputName,
  disabled = false,
  onUploaded,
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [uploadedAttachment, setUploadedAttachment] =
    useState<UploadedAttachment>();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setSelectedFile(file);
    setUploadedAttachment(undefined);
    setProgress(0);
    setError(undefined);

    if (file) {
      setError(validateFile(file, purpose));
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError("Choose a file first.");
      return;
    }

    const validationError = validateFile(selectedFile, purpose);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError(undefined);
    setProgress(0);

    try {
      const attachment = await uploadFile(selectedFile, purpose, setProgress);
      setUploadedAttachment(attachment);
      setProgress(100);
      onUploaded?.(attachment);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setSelectedFile(undefined);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium" htmlFor={inputId}>
          {label}
        </label>
        <input
          ref={inputRef}
          className="border-border bg-surface focus:border-foreground mt-2 w-full rounded-md border px-3 py-2 text-base outline-none"
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled || isUploading}
          onChange={handleFileChange}
        />
      </div>

      {selectedFile ? (
        <p className="text-muted text-sm">
          {selectedFile.name} · {formatBytes(selectedFile.size)}
        </p>
      ) : null}

      {isUploading ? (
        <div>
          <div
            className="bg-border h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="bg-foreground h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p
            className="text-muted mt-2 text-sm"
            role="status"
            aria-live="polite"
          >
            Uploading {progress}%
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {uploadedAttachment ? (
        <p className="text-sm text-green-800" role="status">
          Uploaded {uploadedAttachment.fileName}
        </p>
      ) : null}

      {inputName && uploadedAttachment ? (
        <input name={inputName} type="hidden" value={uploadedAttachment.id} />
      ) : null}

      <button
        className="bg-foreground text-surface rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        type="button"
        disabled={disabled || isUploading || !selectedFile || Boolean(error)}
        onClick={handleUpload}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
