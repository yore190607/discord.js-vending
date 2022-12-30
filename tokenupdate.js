const axios = require('axios');
const setting = require('./config.json');
const sleep = waitTime => new Promise( resolve => setTimeout(resolve, waitTime) );
module.exports = {
    refresh: async func => {
        console.log("token更新中...")
        const get_data = await func.dbget({ tabel: "token", v: "userid" });
        const datas = get_data.map(c => c);
        await Promise.all(datas.map(async token => {
            await sleep( 3000 );
            const data = await axios.post("https://discord.com/api/oauth2/token", {
                'client_id': setting.discord.clientid,
                'client_secret': setting.discord.clientsecret,
                'grant_type': 'refresh_token',
                'refresh_token': token.token
            }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Accept-Encoding": "gzip,deflate,compress" } })
                .catch(async e => {
                    console.log(`TOKEN更新エラー:${e.message}`);
                    await func.dbdelete({ tabel: `token`, v: `userid="${token.userid}"` });
                });
            if (!data?.data) return;
            await func.dbupdate({ tabel: `token`, set: `token="${data.data.refresh_token}"`, v: `userid="${token.userid}"` });
        }));
        console.log("TOKENの更新が終了しました")
    }
};