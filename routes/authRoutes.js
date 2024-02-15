const express = require('express')
const { LinkedInAuthorizer, LinkedInCallback, LinkedInCreatePost, LinkedInProfile, LinkedInLogout } = require('../controllers/authController')

const authRoutes = express.Router()

authRoutes.get('/linkedin/authorize', LinkedInAuthorizer)
authRoutes.get('/linkedin/callback', LinkedInCallback)
authRoutes.post('/linkedin/createPost', LinkedInCreatePost)
authRoutes.post('/linkedin/profile', LinkedInProfile)
authRoutes.post('/linkedin/logout', LinkedInLogout)

module.exports = authRoutes