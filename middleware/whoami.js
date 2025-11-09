// middleware/whoami.js
module.exports = (req, _res, next) => {
  const fromHeader = req.header('x-user-id'); 
  if (fromHeader) {
    req.userId = fromHeader;
  }
  next();
};
