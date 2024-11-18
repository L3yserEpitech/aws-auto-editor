"use client";
import React, { useState, useEffect, DragEvent, ChangeEvent } from "react";

const DragAndDrop: React.FC = () => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploadedFile = e.dataTransfer.files[0];
      if (uploadedFile.type.startsWith("video/")) {
        setFile(uploadedFile);
      } else {
        alert("Please upload a video file.");
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type.startsWith("video/")) {
      setFile(uploadedFile);
    } else {
      alert("Please upload a video file.");
    }
  };

  // Fonction d'upload vers S3 avec suivi de progression
  async function uploadToS3() {
    if (!file) return;

    const response = await fetch("/api/media/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { uploadUrl, Key } = data;

    const xhr = new XMLHttpRequest();

    return new Promise<string>((resolve, reject) => {
      let lastLoggedPercent = 0;

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          if (percentComplete !== lastLoggedPercent && percentComplete % 2 === 0) {
            setUploadProgress(percentComplete);
            lastLoggedPercent = percentComplete;
          }
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setFileKey(Key); // Stocker la clé pour vérification
          setUploadProgress(null); // Réinitialiser la progression
          setIsProcessing(true); // Activer la vérification périodique
          resolve(Key); // Résoudre la promesse avec la clé
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type); // Type MIME réel
      xhr.send(file); // Envoyer le fichier à S3 via l'URL signée
    });
  }

  // Fonction de vérification périodique du traitement
  useEffect(() => {
    if (isProcessing && fileKey) {
      const url = fileKey.replace(/^queue\//, "");
      const interval = setInterval(async () => {
        const response = await fetch("/api/media/download", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileKey: `processed/${url}`,
          }),
        });

        if (response.status === 200) {
          const { downloadUrl } = await response.json();
          if (downloadUrl) {
            clearInterval(interval);
            window.location.href = downloadUrl;
            setIsProcessing(false);
          } else {
            console.error("DEBUG: URL de téléchargement non définie");
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isProcessing, fileKey]);

  const handleUpload = async () => {
    try {
      await uploadToS3();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-4 border-dashed p-10 rounded-lg ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        } flex flex-col items-center justify-center transition-colors`}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          id="videoUpload"
        />
        <label htmlFor="videoUpload" className="cursor-pointer">
          <div className="text-center text-gray-700">
            <p className="text-2xl font-semibold mb-2">
              {file ? file.name : "Drag & Drop your video here"}
            </p>
            <p className="text-sm text-gray-500">or click to browse</p>
          </div>
        </label>
      </div>

      {file && (
        <div className="mt-5 flex flex-col items-center">
          {uploadProgress !== null && (
            <p className="text-gray-700 mb-2">Upload Progress: {uploadProgress}%</p>
          )}

          <button
            onClick={handleUpload}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
          >
            Upload Video
          </button>
        </div>
      )}
    </div>
  );
};

export default DragAndDrop;
