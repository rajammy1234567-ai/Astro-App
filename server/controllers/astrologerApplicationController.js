const crypto = require('crypto');
const AstrologerApplication = require('../models/AstrologerApplication');
const Astrologer = require('../models/Astrologer');
const User = require('../models/User');
const { pushNotification } = require('../utils/notificationHelper');

const generatePassword = () => crypto.randomBytes(4).toString('hex');

const formatApplication = (app) => {
  const obj = app.toObject ? app.toObject() : app;
  if (obj.user?.name) {
    obj.userName = obj.user.name;
    obj.userPhone = obj.user.phone;
    obj.userEmail = obj.user.email;
  }
  return obj;
};

const apply = async (req, res) => {
  try {
    const { name, phone, email, specialty, experience, bio, languages } = req.body;

    if (!name?.trim() || !phone?.trim() || !specialty?.trim()) {
      return res.status(400).json({ message: 'Name, phone and specialty are required' });
    }

    const existing = await AstrologerApplication.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'interview_scheduled', 'selected'] },
    });

    if (existing) {
      return res.status(400).json({
        message: 'You already have an active application',
        application: formatApplication(existing),
      });
    }

    const application = await AstrologerApplication.create({
      user: req.user._id,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim().toLowerCase() || req.user.email,
      specialty: specialty.trim(),
      experience: Number(experience) || 0,
      bio: bio?.trim(),
      languages: Array.isArray(languages) ? languages : languages?.split(',').map((l) => l.trim()).filter(Boolean),
      status: 'pending',
    });

    await pushNotification(req.user._id, {
      type: 'application',
      title: 'Application Submitted',
      message: 'Your astrologer application has been submitted. Admin will review it soon.',
      data: { applicationId: application._id },
    });

    res.status(201).json(formatApplication(await application.populate('user', 'name phone email')));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyApplication = async (req, res) => {
  try {
    const application = await AstrologerApplication.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name phone email')
      .populate('astrologer', 'name phone specialty');

    res.json(application ? formatApplication(application) : null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    const notifications = (user?.notifications || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notif = user.notifications.id(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    notif.read = true;
    await user.save();
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user?.notifications?.length) {
      user.notifications.forEach((n) => { n.read = true; });
      await user.save();
    }
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const applications = await AstrologerApplication.find(filter)
      .populate('user', 'name phone email avatar')
      .sort({ createdAt: -1 });
    res.json(applications.map(formatApplication));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const scheduleInterview = async (req, res) => {
  try {
    const { date, day, time, googleMeetLink, notes } = req.body;

    if (!date || !day || !time || !googleMeetLink) {
      return res.status(400).json({ message: 'Date, day, time and Google Meet link are required' });
    }

    const meetLink = String(googleMeetLink).trim();
    if (!/^https?:\/\//i.test(meetLink)) {
      return res.status(400).json({
        message: 'Google Meet link must start with https:// (e.g. https://meet.google.com/abc-defg-hij)',
      });
    }

    const application = await AstrologerApplication.findById(req.params.id).populate('user', 'name phone email');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (!['pending', 'interview_scheduled'].includes(application.status)) {
      return res.status(400).json({ message: 'Cannot schedule interview for this application' });
    }

    application.status = 'interview_scheduled';
    application.interview = { date, day, time, googleMeetLink: meetLink, notes };
    await application.save();

    const meetMsg = `Interview scheduled!\n\nDate: ${date} (${day})\nTime: ${time}\nGoogle Meet: ${meetLink}${notes ? `\n\nNote: ${notes}` : ''}`;

    await pushNotification(application.user._id, {
      type: 'interview',
      title: 'Astrologer Interview Scheduled',
      message: meetMsg,
      data: {
        applicationId: application._id,
        date,
        day,
        time,
        googleMeetLink: meetLink,
      },
    });

    res.json(formatApplication(application));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveApplication = async (req, res) => {
  try {
    const { pricePerMin, password, adminNotes } = req.body;

    const application = await AstrologerApplication.findById(req.params.id).populate('user', 'name phone email');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (!['pending', 'interview_scheduled'].includes(application.status)) {
      return res.status(400).json({ message: 'Application cannot be approved in current status' });
    }

    const plainPassword = password?.trim() || generatePassword();
    const loginId = application.phone;

    const existingAstro = await Astrologer.findOne({ phone: loginId });
    if (existingAstro) {
      return res.status(400).json({ message: 'An astrologer with this phone already exists' });
    }

    const astrologer = await Astrologer.create({
      name: application.name,
      phone: loginId,
      email: application.email,
      password: plainPassword,
      specialty: application.specialty,
      bio: application.bio,
      experience: application.experience,
      languages: application.languages,
      pricePerMin: Number(pricePerMin) || 20,
      image: application.user?.avatar,
      isVerified: true,
      isOnline: false,
      chatEnabled: true,
      callEnabled: true,
      isPublished: false,
      approvedViaApplication: true,
      user: application.user._id,
    });

    application.status = 'selected';
    application.astrologer = astrologer._id;
    application.panelCredentials = { loginId, password: plainPassword };
    if (adminNotes) application.adminNotes = adminNotes;
    await application.save();

    const panelUrl = process.env.ASTRO_PANEL_URL || 'astro-app://login';
    const credMsg = `Congratulations! You are selected as an Astrologer.\n\nAstrologer Panel Login:\nID (Phone): ${loginId}\nPassword: ${plainPassword}\nPanel Link: ${panelUrl}\n\nAdmin will add your profile details. Once published, you will appear on the user app. Use credentials in AstroTalk Partner app.`;

    await pushNotification(application.user._id, {
      type: 'selected',
      title: 'Selected as Astrologer!',
      message: credMsg,
      data: {
        applicationId: application._id,
        loginId,
        password: plainPassword,
        panelUrl,
      },
    });

    res.json(formatApplication(application));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectApplication = async (req, res) => {
  try {
    const { reason } = req.body;

    const application = await AstrologerApplication.findById(req.params.id).populate('user', 'name phone email');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (application.status === 'selected') {
      return res.status(400).json({ message: 'Cannot reject a selected application' });
    }

    application.status = 'rejected';
    application.rejectedReason = reason || 'Application not approved';
    await application.save();

    await pushNotification(application.user._id, {
      type: 'rejected',
      title: 'Application Update',
      message: `Your astrologer application was not approved.${reason ? `\n\nReason: ${reason}` : ''}`,
      data: { applicationId: application._id },
    });

    res.json(formatApplication(application));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  apply,
  getMyApplication,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  listApplications,
  scheduleInterview,
  approveApplication,
  rejectApplication,
};