const axios = require("axios");

async function verifyFacebookToken(accessToken) {

    const url =
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;

    const { data } = await axios.get(url);

    return {
        providerId: data.id,
        email: data.email,
        name: data.name,
        avatar: data.picture?.data?.url
    };
}

module.exports = { verifyFacebookToken };