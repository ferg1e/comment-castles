const db = require('./db')

module.exports = {
    getClient: async (clientId, clientSecret) => {

        //
        const {rows} = await db.getClient(clientId)

        //
        if(rows.length > 0) {
            return {
                privateId: rows[0].client_id,
                id: clientId,
                redirectUris: [rows[0].redirect_uri],
                grants: ['authorization_code'],
            }
        }
    },

    saveAuthorizationCode: async (code, client, user) => {

        //
        await db.createAuthCode(
            client.privateId,
            user.user_id,
            code.authorizationCode,
            code.redirectUri,
            code.expiresAt,
            user.code_challenge,
            user.code_challenge_method)

        //
        return {
            authorizationCode: code.authorizationCode,
            expiresAt: code.expiresAt,
            redirectUri: code.redirectUri,
            client: client,
            user: user,
        }
    },

    getAccessToken: async (accessToken) => {

        //
        const {rows} = await db.getAccessToken(accessToken)

        //
        if(rows.length > 0) {
            const row = rows[0]

            return {
                accessToken: accessToken,
                accessTokenExpiresAt: new Date(row.expires_on),
                client: {
                    id: row.public_client_id,
                },
                user: {
                    user_id: row.logged_in_user_id,
                    time_zone: row.time_zone,
                }
            }
        }
    },

    getAuthorizationCode: async (authorizationCode) => {

        //
        const {rows} = await db.getAuthCode(authorizationCode)

        //
        if(rows.length > 0) {
            const row = rows[0]

            return {
                code: authorizationCode,
                expiresAt: new Date(row.expires_on),
                redirectUri: row.redirect_uri,
                client: {
                    id: row.public_client_id,
                },
                user: {
                    user_id: row.logged_in_user_id,
                },
            }
        }
    },

    revokeAuthorizationCode: async (codeObj) => {
        await db.deleteAuthCode(codeObj.code)
        return true
    },

    saveToken: async (token, client, user) => {

        //
        await db.createAccessToken(
            client.privateId,
            user.user_id,
            token.accessToken,
            token.accessTokenExpiresAt)

        //
        return {
            accessToken: token.accessToken,
            accessTokenExpiresAt: new Date(token.accessTokenExpiresAt),
            client: client,
            user: user,
        }
    },
}
