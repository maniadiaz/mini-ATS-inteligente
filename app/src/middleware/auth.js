const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

function requireJWT(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'TOKEN_MISSING' })
  }
  try {
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ error: 'TOKEN_INVALID' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos' })
    }
    next()
  }
}

module.exports = { requireJWT, requireRole }
