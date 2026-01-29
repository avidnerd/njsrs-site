"use client";

import { useState } from "react";

interface FileUploadProps {
  label: string;
  accept: string;
  onUpload: (file: File) => Promise<void>;
  currentFile?: string;
  maxSizeMB?: number;
}

export default function FileUpload({
  label,
  accept,
  onUpload,
  currentFile,
  maxSizeMB = 10,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess(false);

    try {
      await onUpload(file);
      setSuccess(true);
      setFile(null);
      const input = document.getElementById(`file-${label}`) as HTMLInputElement;
      if (input) input.value = "";
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-4 items-center">
        <input
          id={`file-${label}`}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-green file:text-white hover:file:bg-primary-darkGreen"
        />
        {file && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="bg-primary-green text-white px-4 py-2 rounded-md hover:bg-primary-darkGreen disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        )}
      </div>
      {currentFile && (
        <div className="text-sm text-gray-600">
          Current file:{" "}
          <a
            href={currentFile}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-blue hover:underline"
          >
            View
          </a>
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="text-sm text-green-600">File uploaded successfully!</div>
      )}
    </div>
  );
}
