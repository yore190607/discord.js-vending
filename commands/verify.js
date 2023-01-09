const { SlashCommandBuilder, ActionRowBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const func = require('../func');
const setting = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .addRoleOption(option => option.setName("role").setDescription("認証ユーザーにつけるロールを選択").setRequired(true))
        .addStringOption(option => option.setName("title").setDescription("役職パネルのタイトル"))
        .addStringOption(option => option.setName("description").setDescription("役職パネルの説明文"))
        .addAttachmentOption(option => option.setName("image").setDescription('役職パネルに添付する画像'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription('ユーザーを認証します'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ embeds: [{ title: "エラー", description: "貴方の管理者権限が不足しています。", color: 0x3aeb34 }], ephemeral: true });
        const option = interaction.options;
        await interaction.guild.members.me.roles.add(option.getRole("role")).then(async () => {
            const name = await func.dbget({ tabel: "account", v: `id="${interaction.user.id}"` });
            if (!name[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: "backupアカウントを設定してください。", color: 0x3aeb34 }], ephemeral: true });
            const backup = await func.dbget({ tabel: "backup", v: `guildid="${interaction.guild.id}"` });
            if (backup[0]?.username) {
                const update = await func.dbupdate({ tabel: "backup", set: `username="${name[0].name}"`, v: `guildid="${interaction.guild.id}"` });
                if (!update) return await interaction.reply({ embeds: [{ title: "エラー", description: "データの更新に失敗しました。", color: 0x3aeb34 }], ephemeral: true });
            } else {
                const set = await func.dbset({ tabel: "backup", v: `"${name[0].name}","${interaction.guild.id}"` });
                if (!set) return await interaction.reply({ embeds: [{ title: "エラー", description: "データの保存に失敗しました。", color: 0x3aeb34 }], ephemeral: true });
            };
            const check = await func.dbget({ tabel: "verify", v: `guildid="${interaction.guildId}"` });
            if (check[0]?.roleid) {
                const update = await func.dbupdate({ tabel: `verify`, set: `roleid="${option.getRole("role").id}"`, v: `guildid="${interaction.guildId}"` });
                if (!update) return await interaction.reply({ embeds: [{ title: "エラー", description: "データの更新に失敗しました。", color: 0x3aeb34 }], ephemeral: true });
            } else {
                const set = await func.dbset({ tabel: "verify", v: `${interaction.guildId},${option.getRole("role").id}` });
                if (!set) return await interaction.reply({ embeds: [{ title: "エラー", description: "データの保存に失敗しました。", color: 0x3aeb34 }], ephemeral: true });
            };
            await interaction.guild.members.me.roles.remove(option.getRole("role"));
            const verify_button = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("✅Verify").setStyle(ButtonStyle.Link).setURL(`${setting.discord.auturl}&state=${interaction.guildId}`));
            await interaction.reply({ embeds: [{ title: option.getString("title") || "✅認証", description: option.getString("description") || "```✅ユーザー認証は下記ボタンを押すと開始されます```", color: 0x3aeb34 }], components: [verify_button] });
        });
    }
};