import React, { useCallback, useState } from "react";
import { UploadCloud, FileType, AlertCircle } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { cn, API_URL } from "../lib/utils";
import axios from "axios";
import { encryptFile } from "../utils/crypto";

export function UploadZone() {
  const { setStatus, setError, setResult, status, error, setFileInfo, framework } =
    useAppStore();
  const [isDragActive, setIsDragActive] = useState(false);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setError("Please upload a valid .zip file");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Max size is 20MB.");
      return;
    }

    setFileInfo({ name: file.name, size: file.size });
    setStatus("uploading");
    setError(null);

    try {
      // 1. Fetch Public Key from Backend
      const {
        data: { publicKey },
      } = await axios.get(`${API_URL}/public-key`);

      // 2. Encrypt File Locally
      setStatus("analyzing"); // Show progress
      const encryptedPayload = await encryptFile(file, publicKey);

      // 3. Send Encrypted Data
      const formData = new FormData();
      formData.append("encryptedData", JSON.stringify(encryptedPayload));
      formData.append("framework", framework);

      const response = await axios.post(
        `${API_URL}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setResult(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to upload and analyze",
      );
      setStatus("error");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative group border border-dashed rounded-xl p-4 flex items-center justify-between transition-all duration-200 cursor-pointer overflow-hidden",
          isDragActive
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/30",
          (status === "uploading" || status === "analyzing") &&
            "pointer-events-none opacity-75",
        )}
      >
        <input
          type="file"
          accept=".zip,application/zip"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={onFileChange}
          disabled={status === "uploading" || status === "analyzing"}
        />

        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-105 transition-transform duration-200">
            {status === "uploading" || status === "analyzing" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
            ) : (
              <UploadCloud size={20} />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-300">
              {status === "uploading"
                ? "Uploading file..."
                : status === "analyzing"
                  ? "AI is analyzing your project..."
                  : "Upload a Project ZIP instead"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag and drop, or click to browse
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-900/50 px-2.5 py-1 rounded-md border border-slate-800">
          <FileType size={12} />
          <span>Max 20MB</span>
        </div>
      </div>

      {error && status === 'error' && (
        <div className="mt-6 flex items-center p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
          <AlertCircle className="shrink-0 mr-3" size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
