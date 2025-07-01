import {
  listFilesAndFolders,
  createFolder as createS3Folder,
  getFileUploadUrl as getSignedUploadUrl,
  getFileUrl,
  renameFile as renameS3File,
  deleteFile as deleteS3File,
  uploadFile as uploadS3File,
  uploadFolder as uploadS3Folder,
  moveFile as moveS3File,
  copyFile as copyS3File
} from "../utils/s3Service.js";

import SharingFile from "../models/FileSharing.js";
import FileUpload from "../models/FileUpload.js";
import ExternalLink from "../models/ExternalLink.js";
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
    if (!currentUser?.id)
      return res.status(401).json({ message: "Unauthorized" });

    let { path: currentPath = "" } = req.query;
    const normalizedPath =
      currentPath.endsWith("/") || currentPath === ""
        ? currentPath
        : `${currentPath}/`;

    console.log("🔍 Normalized Path:", normalizedPath);
    console.log("👤 User ID:", currentUser.id);

    // ✅ Get folders at this path
    const folders = await Folder.find({
      parent: normalizedPath,
      user: currentUser.id,
    });

    // ✅ Add folder/file count for each folder
    const folderWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const folderCount = await Folder.countDocuments({
          parent: folder.path,
          user: currentUser.id,
        });

        const fileCount = await FileUpload.countDocuments({
          path: folder.path,
          user: currentUser.id,
        });

        return {
          ...folder.toObject(),
          folderCount,
          fileCount,
        };
      })
    );

    // ✅ Get files at this path
    const files = await FileUpload.find({
      path: normalizedPath,
      user: currentUser.id,
    });
    console.log("✅ Files found:", files.length);

    // ✅ Get external links
    const links = await ExternalLink.find({
      path: normalizedPath,
      user: currentUser.id,
    });
    console.log("✅ External links found:", links.length);

    // ✅ Get shared file keys
    const sharedFileKeys = await SharingFile.find({
      $or: [
        { user: currentUser.id },
        { department: currentUser.department },
        { jobProfile: currentUser.jobProfile },
      ],
    }).distinct("key");

    const sharedFiles = await FileUpload.find({
      key: { $in: sharedFileKeys },
      path: normalizedPath,
      user: { $ne: currentUser.id },
    }).populate("user", "name");

    // ✅ Merge all files
    const allFiles = [
      ...files,
      ...links.map((link) => ({
        ...link.toObject(),
        isExternalLink: true,
      })),
      ...sharedFiles.map((file) => ({
        ...file.toObject(),
        shared: true,
        owner: file.user?.name || "Unknown",
      })),
    ];

    // ✅ Return folders with counts and all files
    res.json({
      folders: folderWithCounts,
      files: allFiles,
    });
  } catch (error) {
    console.error("❌ Error in getFolderAndFiles:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};


export const getFolderAndFiles3 = async (req, res) => {
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

    // Get external links
    const links = await ExternalLink.find({ path: normalizedPath, user: currentUser.id });
    console.log("✅ External links found:", links.length);

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
      ...links.map(link => ({
        ...link.toObject(),
        isExternalLink: true
      })),
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



export const getFolderAndFiles2 = async (req, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.id) return res.status(401).json({ message: "Unauthorized" });

    let { path: currentPath = "" } = req.query;
    const normalizedPath = currentPath.endsWith("/") || currentPath === "" ? currentPath : `${currentPath}/`;

    console.log("🔍 Normalized Path:", normalizedPath);
    console.log("👤 User ID:", currentUser.id);

    // ✅ Get ALL folders for navigation (flat array)
    const allFolders = await Folder.find({ user: currentUser.id });

    // ✅ Get only folders in the current path (optional: for display in center pane)
    const currentFolders = allFolders.filter(folder => folder.parent === normalizedPath);

    // ✅ Get files in the current path
    const files = await FileUpload.find({ path: normalizedPath, user: currentUser.id });
    console.log("✅ Files found:", files.length);

    // ✅ Get external links in the current path
    const links = await ExternalLink.find({ path: normalizedPath, user: currentUser.id });
    console.log("✅ External links found:", links.length);

    // ✅ Get shared file keys
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
      ...links.map(link => ({
        ...link.toObject(),
        isExternalLink: true
      })),
      ...sharedFiles.map(file => ({
        ...file.toObject(),
        shared: true,
        owner: file.user?.name || "Unknown"
      }))
    ];

    res.json({
      folders: allFolders,         // ✅ pass all folders (for left nav/tree)
      currentFolders,              // optional: pass current level folders (for center display)
      files: allFiles
    });

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

export const createExternalLink = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const { name, url, currentPath } = req.body;

    if (!name || !url) {
      return res.status(400).json({ message: "Name and URL are required" });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    const normalizedPath = currentPath?.endsWith("/") ? currentPath : `${currentPath}/`;

    const newLink = await ExternalLink.create({
      name,
      url,
      path: normalizedPath,
      user: req.currentUser.id,
      type: 'link'
    });

    res.json({ linkCreated: newLink });
  } catch (error) {
    console.error("Error creating external link:", error);
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

export const uploadFolderStructure = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const { folderPath, files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const normalizedPath = folderPath?.endsWith("/") ? folderPath : `${folderPath}/`;

    // Process each file in the folder structure
    const fileUploads = [];
    const folderPaths = new Set();

    // First, collect all folder paths
    for (const file of files) {
      const filePath = file.path;
      const folderPath = extractFolderPath(filePath);

      if (folderPath) {
        // Add this folder and all parent folders
        let currentPath = "";
        const segments = folderPath.split("/").filter(Boolean);

        for (const segment of segments) {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;
          folderPaths.add(`${currentPath}/`);
        }
      }
    }

    // Create all folders first
    for (const path of folderPaths) {
      const fullPath = normalizedPath + path;
      await createS3Folder(fullPath);

      const folderInfo = extractFolderInfo(fullPath);
      await Folder.findOneAndUpdate(
        { path: fullPath, user: req.currentUser.id },
        { ...folderInfo, user: req.currentUser.id },
        { upsert: true, new: true }
      );
    }

    // Then process all files
    for (const file of files) {
      const { path: filePath, type, name, size, url } = file;
      const fullPath = normalizedPath + filePath;

      // If we have a file URL, upload it to S3
      if (url) {
        // In a real implementation, you would fetch the file and upload to S3
        // For demo purposes, we'll just create the record
      }

      const fileUpload = await FileUpload.create({
        key: fullPath,
        path: extractFolderPath(fullPath),
        type,
        user: req.currentUser.id,
        name,
        size,
      });

      fileUploads.push(fileUpload);
    }

    res.json({
      message: "Folder structure uploaded successfully",
      foldersCreated: folderPaths.size,
      filesUploaded: fileUploads.length
    });
  } catch (error) {
    console.error("Error uploading folder structure:", error);
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

    // Rename in S3
    await renameS3File(oldPath, newPath);

    // Update in database
    if (oldPath.endsWith('/')) {
      // It's a folder
      const oldFolderPath = oldPath;
      const newFolderPath = newPath;

      // Update the folder itself
      await Folder.findOneAndUpdate(
        { path: oldFolderPath },
        { path: newFolderPath, name: newFolderPath.split('/').filter(Boolean).pop() }
      );

      // Update all child folders (their paths and parents)
      const childFolders = await Folder.find({ path: { $regex: `^${oldFolderPath}` } });
      for (const folder of childFolders) {
        const updatedPath = folder.path.replace(oldFolderPath, newFolderPath);
        const updatedParent = folder.parent.replace(oldFolderPath, newFolderPath);

        await Folder.findByIdAndUpdate(folder._id, {
          path: updatedPath,
          parent: updatedParent
        });
      }

      // Update all files within the folder
      const childFiles = await FileUpload.find({ key: { $regex: `^${oldFolderPath}` } });
      for (const file of childFiles) {
        const updatedKey = file.key.replace(oldFolderPath, newFolderPath);
        const updatedPath = extractFolderPath(updatedKey);

        await FileUpload.findByIdAndUpdate(file._id, {
          key: updatedKey,
          path: updatedPath
        });
      }

      // Update external links within the folder
      const childLinks = await ExternalLink.find({ path: { $regex: `^${oldFolderPath}` } });
      for (const link of childLinks) {
        const updatedPath = link.path.replace(oldFolderPath, newFolderPath);

        await ExternalLink.findByIdAndUpdate(link._id, {
          path: updatedPath
        });
      }
    } else {
      // It's a file
      const oldKey = oldPath;
      const newKey = newPath;

      // Check if it's an external link
      const externalLink = await ExternalLink.findOne({ name: oldKey.split('/').pop(), path: extractFolderPath(oldKey) });

      if (externalLink) {
        await ExternalLink.findByIdAndUpdate(externalLink._id, {
          name: newKey.split('/').pop()
        });
      } else {
        // Regular file
        await FileUpload.findOneAndUpdate(
          { key: oldKey },
          {
            key: newKey,
            name: newKey.split('/').pop(),
            path: extractFolderPath(newKey)
          }
        );
      }
    }

    res.json({ message: "File renamed successfully" });
  } catch (error) {
    console.error("Error renaming file:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { key, isExternalLink } = req.body;

    if (isExternalLink) {
      // Delete external link from database
      await ExternalLink.findOneAndDelete({
        name: key.split('/').pop(),
        path: extractFolderPath(key)
      });
    } else {
      // Delete from S3
      await deleteS3File(key);

      if (key.endsWith('/')) {
        // It's a folder - delete all child items recursively

        // Delete the folder itself
        await Folder.findOneAndDelete({ path: key });

        // Delete all child folders
        await Folder.deleteMany({ path: { $regex: `^${key}` } });

        // Delete all files within the folder
        await FileUpload.deleteMany({ key: { $regex: `^${key}` } });

        // Delete all external links within the folder
        await ExternalLink.deleteMany({ path: { $regex: `^${key}` } });

        // Delete all sharing records for this folder and its contents
        await SharingFile.deleteMany({ key: { $regex: `^${key}` } });
      } else {
        // It's a file
        await FileUpload.findOneAndDelete({ key });

        // Delete sharing records for this file
        await SharingFile.deleteMany({ key });
      }
    }

    res.json({ message: "File removed successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const extractFolderPathMove = (key) => {
  const parts = key.split('/');
  parts.pop(); // remove file name
  return parts.length > 0 ? parts.join('/') + '/' : '';
};

export const moveFile = async (req, res) => {
  try {
    const { sourceKey, destinationPath, isExternalLink } = req.body;

    if (!req.currentUser?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fileName = sourceKey.endsWith('/')
      ? sourceKey.split('/').filter(Boolean).pop()
      : sourceKey.split('/').pop();

    if (!fileName) {
      return res.status(400).json({ message: 'Invalid file/folder name' });
    }

    const destinationKey = destinationPath ? `${destinationPath}${fileName}${sourceKey.endsWith('/') ? '/' : ''}` : fileName;

    if (isExternalLink) {
      // Just update the path of the external link in DB
      await ExternalLink.findOneAndUpdate(
        {
          name: fileName,
          path: extractFolderPathMove(sourceKey),
          user: req.currentUser.id
        },
        { path: destinationPath }
      );
    } else {
      if (sourceKey.endsWith('/')) {
        // It's a folder
        const sourceFolder = await Folder.findOne({ path: sourceKey, user: req.currentUser.id });

        if (!sourceFolder) {
          return res.status(404).json({ message: "Folder not found" });
        }

        // Move the folder in S3
        await moveS3File(sourceKey, destinationKey);

        // Update current folder info
        sourceFolder.path = destinationKey;
        sourceFolder.parent = destinationPath;
        sourceFolder.name = fileName;
        await sourceFolder.save();

        // Update all subfolders
        const childFolders = await Folder.find({ path: { $regex: `^${sourceKey}` } });
        for (const folder of childFolders) {
          const updatedPath = folder.path.replace(sourceKey, destinationKey);
          const updatedParent = folder.parent.replace(sourceKey, destinationKey);

          await Folder.findByIdAndUpdate(folder._id, {
            path: updatedPath,
            parent: updatedParent
          });
        }

        // Update all files in folder
        const childFiles = await FileUpload.find({ key: { $regex: `^${sourceKey}` } });
        for (const file of childFiles) {
          const updatedKey = file.key.replace(sourceKey, destinationKey);
          const updatedPath = extractFolderPathMove(updatedKey);

          await FileUpload.findByIdAndUpdate(file._id, {
            key: updatedKey,
            path: updatedPath
          });
        }

        // Update all external links in folder
        const childLinks = await ExternalLink.find({ path: { $regex: `^${sourceKey}` } });
        for (const link of childLinks) {
          const updatedPath = link.path.replace(sourceKey, destinationKey);
          await ExternalLink.findByIdAndUpdate(link._id, {
            path: updatedPath
          });
        }

      } else {
        // It's a file
        await moveS3File(sourceKey, destinationKey);

        await FileUpload.findOneAndUpdate(
          { key: sourceKey, user: req.currentUser.id },
          {
            key: destinationKey,
            path: extractFolderPathMove(destinationKey)
          }
        );
      }
    }

    res.json({ message: "File moved successfully" });

  } catch (error) {
    console.error("Error moving file/folder:", error);
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
    const sharedLinks = await ExternalLink.find({
      $or: [
        { path: { $in: keys.map(k => extractFolderPath(k)) } },
        { _id: { $in: keys } }
      ]
    }).populate("user", "name");

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

    const enrichedLinks = sharedLinks.map((link) => {
      const info = sharedItems.find((i) =>
        i.key === link._id.toString() ||
        extractFolderPath(i.key) === link.path
      );
      return {
        ...link.toObject(),
        shared: true,
        sharedBy: info?.sharedBy?.name || "Unknown",
        accessType: info?.accessType || "viewer",
        isExternalLink: true
      };
    });

    res.json({
      files: [...enrichedFiles, ...enrichedLinks],
      folders: enrichedFolders
    });
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

// New controller for saving edited images
export const saveEditedImage = async (req, res) => {
  try {
    if (!req.currentUser?.id) return res.status(401).json({ message: "Unauthorized" });
    const { key, imageData } = req.body;

    if (!key || !imageData) {
      return res.status(400).json({ message: "Key and image data are required" });
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to S3 (overwrite existing file)
    await uploadS3File(buffer, key, 'image/png');

    // Update file record if needed (e.g., update size)
    const fileSize = buffer.length;
    await FileUpload.findOneAndUpdate(
      { key },
      { size: fileSize }
    );

    // Get a new signed URL for the updated file
    const signedUrl = await getFileUrl(key);

    res.json({
      message: "Image saved successfully",
      signedUrl
    });
  } catch (error) {
    console.error("Error saving edited image:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};