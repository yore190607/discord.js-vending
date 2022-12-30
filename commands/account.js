const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup_account')
        .addStringOption(option => option.setName("create_or_delete_or_login").setDescription("アカウントの削除または作成またはログインです。").addChoices({ name: 'create', value: 'create' }, { name: 'delete', value: 'delete' }, { name: 'login', value: 'login' }).setRequired(true))
        .addStringOption(option => option.setName("name").setDescription("アカウントの名前(重複不可)").setRequired(true))
        .addStringOption(option => option.setName("pass").setDescription('アカウントのパスワードを入力してください。').setRequired(true))
        .setDescription('アカウントの操作です。'),
    async execute(interaction) {
        if (!func.isHanEisu(interaction.options.getString("name"))) return await interaction.reply({ embeds: [{ title: "エラー", description: "ユーザー名は半角英数字にしてください。", color: 0x3aeb34 }], ephemeral: true });
        if (interaction.options.getString("pass").length >= 10) return await interaction.reply({ embeds: [{ title: "エラー", description: "パスワードは10字以下です。", color: 0x3aeb34 }], ephemeral: true });
        if (interaction.options.getString("name").length >= 10) return await interaction.reply({ embeds: [{ title: "エラー", description: "ユーザー名は10字以下にしてください。", color: 0x3aeb34 }], ephemeral: true });
        if (interaction.options.getString("create_or_delete_or_login") === "create") {
            const data = await func.dbget({ tabel: "account", v: `id="${interaction.user.id}"` });
            if (data[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `あなたは既にアカウントがあります。\n新しく作る場合アカウントを削除してください。`, color: 0x3aeb34 }], ephemeral: true });
            const check = await func.dbget({ tabel: "account", v: `name="${interaction.options.getString("name")}"` });
            if (check[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `指定の名前のアカウントは既にあります。`, color: 0x3aeb34 }], ephemeral: true });
            await func.dbset({ tabel: "account", v: `"${interaction.options.getString("name")}","${interaction.options.getString("pass")}","${interaction.user.id}"` });
            await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了しました。`, color: 0x3aeb34 }], ephemeral: true });
        };
        if (interaction.options.getString("create_or_delete_or_login") === "delete") {
            const check = await func.dbget({ tabel: "account", v: `name="${interaction.options.getString("name")}"` });
            if (!check[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `指定の名前のアカウントが見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
            if (check[0].pass !== interaction.options.getString("pass")) return await interaction.reply({ embeds: [{ title: "エラー", description: `パスワードが間違っています。`, color: 0x3aeb34 }], ephemeral: true });
            await func.dbdelete({ tabel: "account", v: `name="${interaction.options.getString("name")}" and pass="${interaction.options.getString("pass")}"` });
            await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了しました。`, color: 0x3aeb34 }], ephemeral: true })
        };
        if (interaction.options.getString("create_or_delete_or_login") === "login") {
            const data = await func.dbget({ tabel: "account", v: `id="${interaction.user.id}"` });
            if (data[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `あなたはすでにアカウントにloginしています。\n現在のアカウントを削除してからもう一度お試しください。`, color: 0x3aeb34 }], ephemeral: true });
            const check = await func.dbget({ tabel: "account", v: `name="${interaction.options.getString("name")}"` });
            if (!check[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `指定された名前のアカウントが見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
            if (check[0].pass !== interaction.options.getString("pass")) return await interaction.reply({ embeds: [{ title: "エラー", description: `パスワードが間違っています。`, color: 0x3aeb34 }], ephemeral: true });
            await func.dbupdate({ tabel: "account", set: `id="${interaction.user.id}"`, v: `name="${interaction.options.getString("name")}" and pass="${interaction.options.getString("pass")}"` });
            await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了しました。`, color: 0x3aeb34 }], ephemeral: true })
        };
    }
};