// Simple validation middleware for career applications
exports.validateCareerApplication = (req, res, next) => {
  // Example: check if required fields exist
  const { firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  next();
};