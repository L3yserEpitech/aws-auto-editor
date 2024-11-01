"use client";
import React, { useState, DragEvent, ChangeEvent } from 'react';

const DragAndDrop: React.FC = () => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileKey, setFileKey] = useState<string | null>(null);

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
    
    // Requête pour obtenir l'URL signée de l'API Next.js
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Aucun body spécifique à envoyer ici, peut être ajusté
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { uploadUrl, Key } = data;

    // Utilisation de XMLHttpRequest pour suivre la progression
    const xhr = new XMLHttpRequest();

    return new Promise<string>((resolve, reject) => {
      let lastLoggedPercent = 0;

      // Suivre l'événement 'progress'
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);

          // Logger toutes les 2% ou toutes les 2 secondes selon la progression
          if (percentComplete !== lastLoggedPercent && percentComplete % 2 === 0) {
            setUploadProgress(percentComplete);
            lastLoggedPercent = percentComplete;
          }
        }
      });

      // Surveiller l'achèvement de l'upload
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          console.log('Upload complete');
          setFileKey(Key); // Mettre à jour le fileKey après upload réussi
          resolve(Key); // Résoudre la promesse avec la clé du fichier
          setUploadProgress(null); // Réinitialiser la progression après upload
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      // Surveiller les erreurs d'upload
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // Configurer et démarrer l'upload
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type); // Type MIME réel du fichier vidéo
      xhr.send(file); // Envoyer le fichier à S3 via l'URL signée
    });
  }

  // Fonction de gestion du clic sur le bouton d'upload
  const handleUpload = async () => {
    try {
      const key = await uploadToS3();
      console.log('File uploaded successfully. Key:', key);
    } catch (error) {
      console.error('Error uploading file:', error);
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
          {/* Affichage de la progression d'upload */}
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

      {fileKey && (
        <p className="text-green-500 mt-3">
          File uploaded successfully! Key: {fileKey}
        </p>
      )}
    </div>
  );
};

export default DragAndDrop;
