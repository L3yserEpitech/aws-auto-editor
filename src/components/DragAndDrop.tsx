"use client";
import React, { useState, DragEvent, ChangeEvent } from 'react';

const DragAndDrop: React.FC = () => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

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

  const handleUpload = () => {
    if (file) {
      // upload file
      console.log("Uploading file:", file);
      alert("File uploaded successfully!");
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
