const axios = require('axios');

async function verifyGithubToken(codeOrToken) {
    let accessToken = codeOrToken;

    if (!codeOrToken.startsWith('gh')) {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: codeOrToken
        }, {
            headers: {
                Accept: 'application/json'
            }
        });

        accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            throw new Error('Failed to exchange GitHub code for access token: ' + JSON.stringify(tokenResponse.data));
        }
    }

    const userUrl = 'https://api.github.com/user';
    const emailsUrl = 'https://api.github.com/user/emails';


    const { data: profile } = await axios.get(userUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json'
        }
    });

    let primaryEmail = profile.email;


    if (!primaryEmail) {
        const { data: emails } = await axios.get(emailsUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });


        const primary = emails.find(email => email.primary) || emails[0];
        if (primary && primary.email) {
            primaryEmail = primary.email;
        }
    }

    if (!primaryEmail) {
        throw new Error('No email found for this GitHub account');
    }

    return {
        providerId: profile.id.toString(),
        email: primaryEmail,
        name: profile.name || profile.login,
        avatar: profile.avatar_url
    };
}

module.exports = { verifyGithubToken };
