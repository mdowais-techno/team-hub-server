import jwt from 'jsonwebtoken';

const validateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Token missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.currentUser = { id: payload.id, department: payload.department, jobProfile: payload.jobProfile };
    next();
  } catch (err) {
    console.error('Error validating user:', err);
    return res.status(403).json({ message: 'Invalid token', error: err.message });
  }
};


export default validateUser;
