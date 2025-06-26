import {
  listFilesAndFolders,
  createFolder as createS3Folder,
  getFileUploadUrl as getSignedUploadUrl,
  getFileUrl,
  renameFile as renameS3File,
  deleteFile as deleteS3File
} from "../utils/s3Service.js";

import SharingFile from "../models/FileSharing.js";
import FileUpload from "../models/FileUpload.js";
import Department from "../models/Department.js";
import JobProfile from "../models/JobProfile.js";
import Folder from "../models/Folder.js";

// --- Helpers ---
function extractFolderInfo(normalizedPath) {
  const trimmed = normalizedPath.replace(/^\/|\/$/g, "");
  const segments = trimmed.split("/").filter(Boolean);
  const name = segments.length ? segments[segments.length - 1] : "";
  const parent = segments.slice(0, -1).join("/");
  const path = trimmed;
  return {
    name,
    path: path ? path + "/" : "",
    parent: parent ? parent + "/" : "",
  };
}

function extractFolderPath(fileKey) {
  if (!fileKey.includes("/")) return "";
  const lastSlashIndex = fileKey.lastIndexOf("/");
  return fileKey.slice(0, lastSlashIndex + 1);
}

// --- Controllers ---

export const getFolderAndFiles = async (req, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.id) return res.status(401).json({ message: "Unauthorized" });

    let { path: currentPath = "" } = req.query;
    const normalizedPath = currentPath.endsWith("/") || currentPath === "" ? currentPath : `${currentPath}/`;

    console.log("🔍 Normalized Path:", normalizedPath);
    console.log("👤 User ID:", currentUser.id);

    const folders = await Folder.find({ parent: normalizedPath, user: currentUser.id });

    const files = await FileUpload.find({ path: normalizedPath, user: currentUser.id });
    console.log("✅ Files found:", files.length);

    // shared file keys
    const sharedFileKeys = await SharingFile.find({
      $or: [
        { user: currentUser.id },
        { department: currentUser.department },
        { jobProfile: currentUser.jobProfile }
      ]
    }).distinct("key");

    const sharedFiles = await FileUpload.find({
      key: { $in: sharedFileKeys },
      path: normalizedPath,
      user: { $ne: currentUser.id },
    }).populate("user", "name");

    const allFiles = [
      ...files,
      ...sharedFiles.map(file => ({
        ...file.toObject(),
        shared: true,
        owner: file.user?.name || "Unknown"
      }))
    ];

    res.json({ folders, files: allFiles });
  } catch (error) {
    console.error("❌ Error in getFolderAndFiles:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const createFolder = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const { currentPath, folderName } = req.body;

    const normalizedPath = currentPath?.endsWith("/") ? currentPath : `${currentPath}/`;
    const fullPath =
      currentPath && currentPath.length > 1
        ? `${normalizedPath}${folderName}/`
        : `${folderName}/`;

    await createS3Folder(fullPath);
    const folderInfo = extractFolderInfo(fullPath);

    const newFolder = await Folder.create({
      ...folderInfo,
      user: req.currentUser.id,
    });

    res.json({ folderCreated: newFolder });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const { key, type, name, size } = req.body;

    const fileUpload = await FileUpload.create({
      key,
      path: extractFolderPath(key),
      type,
      user: req.currentUser.id,
      name,
      size,
    });

    res.json({ fileUpload });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFileUploadUrl = async (req, res) => {
  try {
    const { path, fileName } = req.query;
    const normalizedPath = path ? (path.endsWith("/") ? path : `${path}/`) : "";
    const key = `${normalizedPath}${fileName}`;
    const signedUrl = await getSignedUploadUrl(key);
    res.json({ signedUrl });
  } catch (error) {
    console.error("Error getting upload URL:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFileViewUrl = async (req, res) => {
  try {
    const { key } = req.query;
    const signedUrl = await getFileUrl(key);
    res.json({ signedUrl });
  } catch (error) {
    console.error("Error getting view URL:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const renameFile = async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      return res.status(400).json({ message: "Missing oldPath or newPath" });
    }
    await renameS3File(oldPath, newPath);
    res.json({ message: "File/folder renamed successfully" });
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ message: "Missing key" });
    }
    await deleteS3File(key);
    res.json({ message: "File/folder deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const shareWithUser = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const { key, user, accessType = "viewer" } = req.body;

    const file = await FileUpload.findOne({ key }) || await Folder.findOne({ path: key });
    if (!file) return res.status(404).json({ message: "File or folder not found" });

    const existing = await SharingFile.findOne({ key, user });
    if (existing) {
      existing.accessType = accessType;
      await existing.save();
    } else {
      await SharingFile.create({ key, user, sharedBy: req.currentUser.id, accessType });
    }

    res.json({ message: "File shared successfully with user" });
  } catch (error) {
    console.error("Error sharing with user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const shareWithDepartment = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const { key, department, accessType = "viewer" } = req.body;

    const dept = await Department.findById(department);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const existing = await SharingFile.findOne({ key, department });
    if (existing) {
      existing.accessType = accessType;
      await existing.save();
    } else {
      await SharingFile.create({ key, department, sharedBy: req.currentUser.id, accessType });
    }

    res.json({ message: "File shared successfully with department" });
  } catch (error) {
    console.error("Error sharing with department:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const shareWithJobProfile = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const { key, jobProfile, accessType = "viewer" } = req.body;

    const jp = await JobProfile.findById(jobProfile);
    if (!jp) return res.status(404).json({ message: "Job profile not found" });

    const existing = await SharingFile.findOne({ key, jobProfile });
    if (existing) {
      existing.accessType = accessType;
      await existing.save();
    } else {
      await SharingFile.create({ key, jobProfile, sharedBy: req.currentUser.id, accessType });
    }

    res.json({ message: "File shared successfully with job profile" });
  } catch (error) {
    console.error("Error sharing with job profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFilesSharedWithMe = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const userId = req.currentUser.id;

    const sharedItems = await SharingFile.find({
      $or: [
        { user: userId },
        { department: req.currentUser.department },
        { jobProfile: req.currentUser.jobProfile },
      ],
    }).populate("sharedBy", "name");

    const keys = sharedItems.map((i) => i.key);

    const sharedFiles = await FileUpload.find({ key: { $in: keys } }).populate("user", "name");
    const sharedFolders = await Folder.find({ path: { $in: keys } }).populate("user", "name");

    const enrichedFiles = sharedFiles.map((file) => {
      const info = sharedItems.find((i) => i.key === file.key);
      return {
        ...file.toObject(),
        shared: true,
        sharedBy: info?.sharedBy?.name || "Unknown",
        accessType: info?.accessType || "viewer",
      };
    });

    const enrichedFolders = sharedFolders.map((folder) => {
      const info = sharedItems.find((i) => i.key === folder.path);
      return {
        ...folder.toObject(),
        shared: true,
        sharedBy: info?.sharedBy?.name || "Unknown",
        accessType: info?.accessType || "viewer",
      };
    });

    res.json({ files: enrichedFiles, folders: enrichedFolders });
  } catch (error) {
    console.error("Error getting shared files:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSharingDetails = async (req, res) => {
  try {
    const { key } = req.params;
    const records = await SharingFile.find({ key })
      .populate("user", "name email")
      .populate("department", "name")
      .populate("jobProfile", "title")
      .populate("sharedBy", "name");

    const users = records.filter((r) => r.user).map((r) => ({
      id: r.user._id,
      name: r.user.name,
      email: r.user.email,
      role: r.accessType,
      sharedBy: r.sharedBy?.name || "Unknown",
      sharedAt: r.createdAt,
    }));

    const departments = records.filter((r) => r.department).map((r) => ({
      id: r.department._id,
      name: r.department.name,
      role: r.accessType,
      sharedBy: r.sharedBy?.name || "Unknown",
      sharedAt: r.createdAt,
    }));

    const jobProfiles = records.filter((r) => r.jobProfile).map((r) => ({
      id: r.jobProfile._id,
      title: r.jobProfile.title,
      role: r.accessType,
      sharedBy: r.sharedBy?.name || "Unknown",
      sharedAt: r.createdAt,
    }));

    res.json({ users, departments, jobProfiles });
  } catch (error) {
    console.error("Error getting sharing details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeShare = async (req, res) => {
  try {
    const { key, user, department, jobProfile } = req.body;
    if (!key || (!user && !department && !jobProfile)) {
      return res.status(400).json({ message: "Missing key or target entity" });
    }

    const query = { key };
    if (user) query.user = user;
    if (department) query.department = department;
    if (jobProfile) query.jobProfile = jobProfile;

    const result = await SharingFile.deleteOne(query);
    if (!result.deletedCount)
      return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Sharing removed successfully" });
  } catch (error) {
    console.error("Error removing share:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
