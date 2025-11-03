//check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({
      error: "Unauthorized: You must be logged in to access this resource.",
    });
  }
};

//check if the user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user.role === "admin") {
    return next();
  } else {
    return res
      .status(403)
      .json({ error: "Forbidden: Access denied. Admin permissions required." });
  }
};

module.exports = {
  isAuthenticated,
  isAdmin
};
