import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_CONFIG } from '../config/aws.js';

const config = {
  bucketName: AWS_CONFIG.bucketName,
  region: AWS_CONFIG.region,
  accessKeyId: AWS_CONFIG.credentials.accessKeyId,
  secretAccessKey: AWS_CONFIG.credentials.secretAccessKey,
  localStorageMode: AWS_CONFIG.localStorageMode
};

const s3Client = new S3Client({
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey
  }
});

export const listFilesAndFolders = async (prefix = '') => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix,
      Delimiter: '/'
    });

    const response = await s3Client.send(command);

    const folders = response.CommonPrefixes?.map(prefix => ({
      key: prefix.Prefix || '',
      name: prefix.Prefix?.split('/').slice(-2, -1)[0] || '',
      lastModified: new Date().toISOString()
    })) || [];

    const files = response.Contents?.filter(item =>
      item.Key && !item.Key.endsWith('/') && item.Key !== prefix
    ).map(item => ({
      key: item.Key || '',
      name: item.Key?.split('/').pop() || '',
      size: item.Size,
      lastModified: item.LastModified?.toISOString()
    })) || [];

    return { folders, files };
  } catch (error) {
    console.error("Error listing files and folders:", error);
    throw error;
  }
};

export const getFileUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 1800 });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw error;
  }
};

export const getFileUploadUrl = async (key) => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw error;
  }
};

export const deleteFile = async (key) => {
  try {
    if (key.endsWith('/')) {
      // It's a folder, delete all contents
      const listCommand = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: key
      });
      
      const { Contents } = await s3Client.send(listCommand);
      
      if (Contents && Contents.length > 0) {
        for (const item of Contents) {
          if (item.Key) {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: config.bucketName,
              Key: item.Key
            }));
          }
        }
      }
    }
    
    // Delete the file or empty folder marker
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export const renameFile = async (oldPath, newPath) => {
  try {
    if (oldPath.endsWith('/')) {
      // It's a folder, rename all contents
      const listCommand = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: oldPath
      });
      
      const { Contents } = await s3Client.send(listCommand);
      
      if (Contents && Contents.length > 0) {
        for (const item of Contents) {
          if (item.Key) {
            const newKey = item.Key.replace(oldPath, newPath);
            
            // Copy to new location
            await s3Client.send(new CopyObjectCommand({
              Bucket: config.bucketName,
              CopySource: `${config.bucketName}/${item.Key}`,
              Key: newKey
            }));
            
            // Delete from old location
            await s3Client.send(new DeleteObjectCommand({
              Bucket: config.bucketName,
              Key: item.Key
            }));
          }
        }
      }
      
      // Create the new folder marker
      await createFolder(newPath);
    } else {
      // It's a file, simple rename
      await s3Client.send(new CopyObjectCommand({
        Bucket: config.bucketName,
        CopySource: `${config.bucketName}/${oldPath}`,
        Key: newPath
      }));
      
      await s3Client.send(new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: oldPath
      }));
    }
  } catch (error) {
    console.error("Error renaming file/folder:", error);
    throw error;
  }
};

export const createFolder = async (path) => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: path,
      Body: ''
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
};

export const moveFile = async (sourcePath, destinationPath) => {
  try {
    await copyFile(sourcePath, destinationPath);
    await deleteFile(sourcePath);
  } catch (error) {
    console.error("Error moving file/folder:", error);
    throw error;
  }
};

export const copyFile = async (sourcePath, destinationPath) => {
  try {
    if (sourcePath.endsWith('/')) {
      // It's a folder
      const listCommand = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: sourcePath
      });
      
      const { Contents } = await s3Client.send(listCommand);
      
      if (Contents && Contents.length > 0) {
        for (const item of Contents) {
          if (item.Key) {
            const newKey = item.Key.replace(sourcePath, destinationPath);
            
            await s3Client.send(new CopyObjectCommand({
              Bucket: config.bucketName,
              CopySource: `${config.bucketName}/${item.Key}`,
              Key: newKey
            }));
          }
        }
      }
      
      // Create destination folder marker
      await createFolder(destinationPath);
    } else {
      // It's a file
      await s3Client.send(new CopyObjectCommand({
        Bucket: config.bucketName,
        CopySource: `${config.bucketName}/${sourcePath}`,
        Key: destinationPath
      }));
    }
  } catch (error) {
    console.error("Error copying file/folder:", error);
    throw error;
  }
};

export const getFileInfo = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: key
    });
    const response = await s3Client.send(command);
    return {
      key,
      size: response.ContentLength,
      lastModified: response.LastModified?.toISOString(),
      contentType: response.ContentType
    };
  } catch (error) {
    console.error("Error getting file info:", error);
    throw error;
  }
};

export const uploadFile = async (file, path = '', onProgress) => {
  try {
    const normalizedPath = path ? (path.endsWith('/') ? path : `${path}/`) : '';
    const key = `${normalizedPath}${file.name}`;
    
    // If file is a Buffer (for edited images)
    if (Buffer.isBuffer(file)) {
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: path, // Use the provided path directly
        Body: file,
        ContentType: 'image/png' // Default to PNG for edited images
      });
      
      if (onProgress) onProgress(0);
      await s3Client.send(command);
      if (onProgress) onProgress(100);
      
      return path;
    }
    
    // Regular file upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: uint8Array,
      ContentType: file.type || 'application/octet-stream'
    });

    if (onProgress) onProgress(0);
    await s3Client.send(command);
    if (onProgress) onProgress(100);

    return key;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const uploadFolder = async (files, basePath = '', relativePath = '', onProgress) => {
  try {
    const uploadedKeys = [];
    let completedFiles = 0;
    const normalizedBasePath = basePath ? (basePath.endsWith('/') ? basePath : `${basePath}/`) : '';

    if (relativePath) {
      const folderPath = `${normalizedBasePath}${relativePath}/`;
      await createFolder(folderPath);
    }

    for (const file of files) {
      const filePath = file.webkitRelativePath ||
        (relativePath ? `${relativePath}/${file.name}` : file.name);
      const key = `${normalizedBasePath}${filePath}`;

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: uint8Array,
        ContentType: file.type || 'application/octet-stream'
      });

      await s3Client.send(command);
      uploadedKeys.push(key);
      completedFiles++;

      if (onProgress) {
        onProgress((completedFiles / files.length) * 100);
      }
    }

    return uploadedKeys;
  } catch (error) {
    console.error("Error uploading folder:", error);
    throw error;
  }
};