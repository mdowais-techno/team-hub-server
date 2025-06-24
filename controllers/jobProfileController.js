import JobProfile from '../models/JobProfile.js';

// Get all job profiles
export const getJobProfiles = async (req, res) => {
  try {
    console.log('💼 Fetching job profiles...');
    const { department, experienceLevel, search } = req.query;
    
    const query = { isActive: true };
    if (department) query.department = department;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const jobProfiles = await JobProfile.find(query)
      .populate('department', 'name')
      .populate('createdBy', 'name email')
      .sort({ title: 1 });

    console.log(`✅ Found ${jobProfiles.length} job profiles`);
    res.json({ jobProfiles });
  } catch (error) {
    console.error('❌ Get job profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch job profiles' });
  }
};

// Get job profile by ID
export const getJobProfileById = async (req, res) => {
  try {
    console.log('💼 Fetching job profile by ID:', req.params.id);
    const jobProfile = await JobProfile.findById(req.params.id)
      .populate('department', 'name')
      .populate('createdBy', 'name email');

    if (!jobProfile) {
      console.log('❌ Job profile not found:', req.params.id);
      return res.status(404).json({ error: 'Job profile not found' });
    }

    console.log('✅ Job profile found:', jobProfile.title);
    res.json({ jobProfile });
  } catch (error) {
    console.error('❌ Get job profile error:', error);
    res.status(500).json({ error: 'Failed to fetch job profile' });
  }
};

// Create new job profile
export const createJobProfile = async (req, res) => {
  try {
    console.log('➕ Creating job profile:', req.body.title);
    
    const jobProfileData = {
      ...req.body,
      createdBy: req.user.id
    };

    const jobProfile = new JobProfile(jobProfileData);
    await jobProfile.save();

    console.log('✅ Job profile created:', jobProfile.title);

    const populatedJobProfile = await JobProfile.findById(jobProfile._id)
      .populate('department', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Job profile created successfully',
      jobProfile: populatedJobProfile
    });
  } catch (error) {
    console.error('❌ Create job profile error:', error);
    res.status(500).json({ error: 'Failed to create job profile' });
  }
};

// Update job profile
export const updateJobProfile = async (req, res) => {
  try {
    console.log('✏️ Updating job profile:', req.params.id);
    
    const jobProfile = await JobProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department', 'name').populate('createdBy', 'name email');

    if (!jobProfile) {
      console.log('❌ Job profile not found for update:', req.params.id);
      return res.status(404).json({ error: 'Job profile not found' });
    }

    console.log('✅ Job profile updated:', jobProfile.title);
    res.json({
      message: 'Job profile updated successfully',
      jobProfile
    });
  } catch (error) {
    console.error('❌ Update job profile error:', error);
    res.status(500).json({ error: 'Failed to update job profile' });
  }
};

// Delete job profile
export const deleteJobProfile = async (req, res) => {
  try {
    console.log('🗑️ Deleting job profile:', req.params.id);
    const jobProfile = await JobProfile.findById(req.params.id);
    
    if (!jobProfile) {
      console.log('❌ Job profile not found for deletion:', req.params.id);
      return res.status(404).json({ error: 'Job profile not found' });
    }

    // Soft delete
    jobProfile.isActive = false;
    await jobProfile.save();

    console.log('✅ Job profile deleted:', jobProfile.title);
    res.json({ message: 'Job profile deleted successfully' });
  } catch (error) {
    console.error('❌ Delete job profile error:', error);
    res.status(500).json({ error: 'Failed to delete job profile' });
  }
};