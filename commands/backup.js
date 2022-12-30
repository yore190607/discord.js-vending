const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
const axios = require('axios');
const setting = require("../config.json");
const sleep = waitTime => new Promise( resolve => setTimeout(resolve, waitTime) );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .addStringOption(option => option.setName("guildid").setDescription("サーバーIDを入力してください").setRequired(true))
        .setDescription('メンバーを復元します。'),
    async execute(interaction) {
        const adata = await func.dbget({ tabel: "account", v: `id="${interaction.user.id}"` });
        if (!adata[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `あなたのアカウントが見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
        const backupdata = await func.dbget({ tabel: "backup", v: `username="${adata[0].name}"` });
        if (!backupdata[0]?.username) return await interaction.reply({ embeds: [{ title: "エラー", description: `あなたのバックアップデータが見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
        const backupdata2 = await func.dbget({ tabel: "backup", v: `guildid="${interaction.options.getString("guildid")}"` });
        if (!backupdata2[0]?.username) return await interaction.reply({ embeds: [{ title: "エラー", description: `指定したギルドの情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
        if (backupdata[0]?.username !== backupdata2[0]?.username) return await interaction.reply({ embeds: [{ title: "エラー", description: `指定したギルドにアクセスする権限が貴方にありません。`, color: 0x3aeb34 }], ephemeral: true });
        const users = await func.dbget({ tabel: "guild", v: `guildid="${interaction.options.getString("guildid")}"` });
        const datas = users.map(c => c.userid);
        if (!datas[0]) return await interaction.reply({ embeds: [{ title: "エラー", description: `認証したユーザーが見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
        await interaction.reply({ embeds: [{ title: "お知らせ", description: `処理中...`, color: 0x3aeb34 }], ephemeral: true });
        await Promise.all(datas.map(async id => {
            await interaction.editReply({ embeds: [{ title: "お知らせ", description: `ID:${id}にリクエスト送信中...`, color: 0x3aeb34 }], ephemeral: true });
            await sleep( 2000 );
            const tokens = await func.dbget({ tabel: `token`, v: `userid="${id}"` });
            const get_data = tokens[0];
            const data = await axios.post("https://discord.com/api/oauth2/token", {
                'client_id': setting.discord.clientid,
                'client_secret': setting.discord.clientsecret,
                'grant_type': 'refresh_token',
                'refresh_token': get_data.token
            }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Accept-Encoding": "gzip,deflate,compress" } }).catch(async e => {
                console.log(`token取得中のエラー:${e}`)
                await func.dbdelete({ tabel: `token`, v: `userid="${get_data.userid}"` });
            });
            if (!data?.data) return;
            await func.dbupdate({ tabel: `token`, set: `token="${data.data.refresh_token}"`, v: `userid="${get_data.userid}"` });
            const user = await axios.get('https://discordapp.com/api/users/@me', { headers: { "Authorization": `Bearer ${data.data.access_token}`, "Accept-Encoding": "gzip,deflate,compress" } });
            await axios.put(`https://discord.com/api/guilds/${interaction.guildId}/members/${user.data.id}`, { access_token: data.data.access_token }, {
                headers: {
                    authorization: `Bot ${setting.discord.token}`,
                    'Content-Type': 'application/json'
                }
            });
        }));
        await interaction.editReply({ embeds: [{ title: "お知らせ", description: `完了。`, color: 0x3aeb34 }], ephemeral: true });
    }
};