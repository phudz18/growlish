const https = require('https');

const httpGetJson = (url, headers = {}) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode && res.statusCode >= 400) {
                        const error = new Error(json.error || `Request failed with status ${res.statusCode}`);
                        error.statusCode = res.statusCode;
                        return reject(error);
                    }
                    resolve(json);
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', (err) => reject(err));
    });
};

const verifyGoogleToken = async (token) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        const error = new Error('GOOGLE_CLIENT_ID is not configured');
        error.statusCode = 500;
        throw error;
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`;
    const payload = await httpGetJson(url);

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        const error = new Error('Google token audience does not match');
        error.statusCode = 401;
        throw error;
    }

    return {
        providerUserId: payload.sub,
        email: payload.email,
        username: payload.name || payload.email,
        avatar: payload.picture || null
    };
};

const verifyFacebookToken = async (token) => {
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
        const error = new Error('FACEBOOK_APP_ID or FACEBOOK_APP_SECRET is not configured');
        error.statusCode = 500;
        throw error;
    }

    const meUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(
        token
    )}`;
    const payload = await httpGetJson(meUrl);

    return {
        providerUserId: payload.id,
        email: payload.email || '',
        username: payload.name || payload.email || '',
        avatar: payload.picture && payload.picture.data ? payload.picture.data.url : null
    };
};

const verifyGithubToken = async (token) => {
    const headers = {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'growlish-backend',
        Accept: 'application/vnd.github+json'
    };

    const user = await httpGetJson('https://api.github.com/user', headers);

    let email = user.email || '';
    if (!email) {
        const emails = await httpGetJson('https://api.github.com/user/emails', headers);
        const primary = Array.isArray(emails) ? emails.find((e) => e.primary) : null;
        email = (primary && primary.email) || (emails[0] && emails[0].email) || '';
    }

    return {
        providerUserId: String(user.id),
        email,
        username: user.name || user.login || email,
        avatar: user.avatar_url || null
    };
};

module.exports = {
    verifyGoogleToken,
    verifyFacebookToken,
    verifyGithubToken
};

