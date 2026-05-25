function tenant(req, res, next) {
  if (req.user.role === 'superadmin') {
    // Superadmin can impersonate a company via query param
    req.company_id = req.query.company_id || null
  } else {
    req.company_id = req.user.company_id
  }
  next()
}

module.exports = tenant
