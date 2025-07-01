import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getFolderAndFiles,
  createFolder,
  getFileUploadUrl,
  getFileViewUrl,
  renameFile,
  deleteFile,
  uploadFile,
  uploadFolderStructure,
  moveFile,
  shareWithUser,
  shareWithDepartment,
  shareWithJobProfile,
  getFilesSharedWithMe,
  getSharingDetails,
  removeShare,
  createExternalLink,
  saveEditedImage
} from '../controllers/fileController.js';
import validateUser from '../utils/validator.js';

const router = express.Router();

// Public endpoints
router.get("/file-upload-url", getFileUploadUrl);
router.get("/file-view-url", getFileViewUrl);

// Authenticated endpoints
router.get("/", validateUser, getFolderAndFiles);
router.post("/folder", validateUser, authenticateToken, createFolder);
router.post("/file-upload", validateUser, authenticateToken, uploadFile);
router.post("/folder-upload", validateUser, authenticateToken, uploadFolderStructure);
router.post("/external-link", validateUser, authenticateToken, createExternalLink);

// File operations
router.put("/rename", renameFile);
router.put("/move",validateUser, authenticateToken, moveFile);
router.delete("/remove", deleteFile);
router.post("/save-edited-image", authenticateToken, saveEditedImage);

// Sharing endpoints
router.post("/share-user", validateUser, shareWithUser);
router.post("/share-department", validateUser, shareWithDepartment);
router.post("/share-job-profile", validateUser, shareWithJobProfile);
router.get("/shared-with-me", validateUser, getFilesSharedWithMe);
router.get("/shared-with/:key", validateUser, getSharingDetails);
router.delete("/remove-share", validateUser, removeShare);

export default router;