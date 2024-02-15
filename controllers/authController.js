const qs = require('querystring');

const getAccessToken = async (code) => {
  try {
    if (!code) {
      return { 'status': false, 'message': 'Code is Missing', status_code: 400 };
    }

    const payload = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECTION_URL,
      grant_type: 'authorization_code',
      code: code
    };

    const response = await fetch(`https://linkedin.com/oauth/v2/accessToken?${qs.stringify(payload)}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();

    if (response.status === 200) {
      const accessToken = data['access_token'];
      const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const userData = await userInfoResponse.json();
      return { 'status': true, 'access_token': accessToken, 'user_data': userData, 'status_code': 200 };
    } else {

      return { 'status': false, 'message': 'Error getting access token', 'status_code': 400 };
    }

  } catch (error) {
    console.error(error);
    return { 'status': false, 'message': 'Something went wrong', 'status_code': 400 };
  }
};

const LinkedInAuthorizer = (req, resp) => {
  const client_id = process.env.CLIENT_ID;
  const scope = process.env.SCOPE;
  const redirect_uri = process.env.REDIRECTION_URL;
  const redirection_url = encodeURI(`https://linkedin.com/oauth/v2/authorization?response_type=code&client_id=${client_id}&response_type=code&scope=${scope}&redirect_uri=${redirect_uri}&state=foobar`);
  resp.json({'url':redirection_url});
};

const LinkedInCallback = async (req, resp) => {
  try {
    const response = await getAccessToken(req.query.code);
    const access_token = response['access_token']
    const sub = response['user_data']['sub']
    const url = process.env.FRONTEND_URL + 'callback'
    resp.redirect(`${url}?access_token=${access_token}&sub=${sub}`)
  } catch (error) {
    const url = process.env.FRONTEND_URL + 'login'
    console.error(error);
    resp.redirect(url)
  }
};

const LinkedInCreatePost = async (req, resp) => {
    const access_token = req.body.access_token
    const user_id = req.body.user_id
    const post = req.body.text
    try {
        const payload = {
          "author": `urn:li:person:${user_id}`,
          "lifecycleState": "PUBLISHED",
          "specificContent": {
              "com.linkedin.ugc.ShareContent": {
                  "shareCommentary": {
                      "text": post
                  },
                  "shareMediaCategory": "NONE"
              }
          },
          "visibility": {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
          }
      }
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method:"POST",
        headers:{
          'Content-Type':'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(payload)
      })
      if (response.ok)
      {
        const data = await response.json()
        resp.json({'status':true})
      }
      else{
        resp.json({"status":false})
      }


    } catch (error) {
      console.error(error);
      resp.status(500).send('Internal Server Error');
    }
};

const LinkedInProfile = async (req, resp) => {
  const accessToken = req.body.access_token;

  const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const userData = await userInfoResponse.json();
  resp.json({userData})
}

const LinkedInLogout = async (req, res)=>{
    const accessToken = req.body.access_token
    const response = await fetch('https://www.linkedin.com/oauth/v2/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      token: accessToken,
    }),
  });
  if (response.ok) {
    console.log('Token revoked successfully');
    res.json({"status":true})
  } else {
    console.error('Failed to revoke token');
    res.json({"status":false})
  }
}
module.exports = {
  LinkedInAuthorizer,
  LinkedInCallback,
  LinkedInCreatePost,
  LinkedInProfile,
  LinkedInLogout
};
