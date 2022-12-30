
const axios = require('axios');
const router = require("express").Router();
const setting = require('../config.json');
const func = require("../func");
const client = globalThis.client;

router.get('/', async (req, res) => {
    if (!req?.query?.code) return res.render("./login.ejs", { content: "パラメーターが指定されていません。" });
    axios.post("https://discord.com/api/oauth2/token", {
        'client_id': setting.discord.clientid,
        'client_secret': setting.discord.clientsecret,
        'grant_type': 'authorization_code',
        'code': `${req.query.code}`,
        'redirect_uri': setting.discord.siteurl,
    }, { headers: { "Accept-Encoding": "gzip,deflate,compress", 'Content-Type': 'application/x-www-form-urlencoded' } })
        .catch(() => { })
        .then(async data => {
            if (!data) return res.render("./login.ejs", { content: "認証に失敗しました。" });
            if (!data?.data?.scope.split(" ")?.includes("guilds.join")) return res.render("./login.ejs", { content: "scope不足" });
            if (!data?.data?.scope.split(" ")?.includes("identify")) return res.render("./login.ejs", { content: "scope不足" });
            const user = await axios.get('https://discordapp.com/api/users/@me', { headers: { "Accept-Encoding": "gzip,deflate,compress", "Authorization": `Bearer ${data.data.access_token}` } });
            if (!user?.data?.id) return res.render("./login.ejs", { content: "userを取得できませんでした。" });
            if (!req?.query?.state) return res.render("./login.ejs", { content: "ギルドが指定されていません。" });
            const guild = req?.query?.state;
            const user_check = await func.dbget({ tabel: `guild`, v: `userid="${user.data.id}" and guildid=${guild}` });
            if (!user_check[0]?.userid) {
                const set = await func.dbset({ tabel: `guild`, v: `${guild},${user.data.id}` });
                if (!set) return res.send("setエラー");
            };
            const token_check = await func.dbget({ tabel: "token", v: `userid="${user.data.id}"` });
            if (token_check[0]?.userid) {
                const set2 = await func.dbupdate({ tabel: `token`, set: `token="${data.data.refresh_token}"`, v: `userid="${user.data.id}"` });
                if (!set2) return res.render("./login.ejs", { content: "データを更新できませんでした。" });
            } else {
                const set2 = await func.dbset({ tabel: `token`, v: `${user.data.id},"${data.data.refresh_token}"` });
                if (!set2) return res.render("./login.ejs", { content: "データを保存できませんでした。" });
            };
            const roleb = await func.dbget({ tabel: "verify", v: `guildid=${guild}` });
            const rolea = String(roleb[0]?.roleid)?.replace("n", "");
            if (!rolea) return res.render("./login.ejs", { content: "ロールが登録されていません。" });
            const check = await client.guilds.cache.get(guild).members.fetch(user.data.id).catch(() => { });
            if (!check) return res.send("ユーザーが見つかりませんでした");
            const add = await check.roles.add(rolea).catch(() => { });
            if (!add) return res.render("./login.ejs", { content: "ロールをつけられませんでした。" });
            return res.render("./login.ejs", { content: "完了。" });
        });
});
module.exports = router;