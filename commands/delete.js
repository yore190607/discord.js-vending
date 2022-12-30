const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .addStringOption(option => option.setName("item_or_account").setDescription("商品の削除またはアカウントの削除です。").addChoices({ name: 'item', value: 'item' }, { name: 'account', value: 'account' }).setRequired(true))
        .addStringOption(option => option.setName("item_name").setDescription('商品名を入力してください(必要な場合のみ)。').setRequired(false))
        .setDescription('選択されたものを削除します。'),
    async execute(interaction) {
        if (interaction.options.getString("item_or_account") === "account") {
            const paypay = await func.dbget({ tabel: "paypay", v: `id="${interaction.user.id}"` });
            if (!paypay[0].id) return await interaction.reply({ embeds: [{ title: "エラー", description: `あなたのアカウントはpaypayと紐付けられていません。`, color: 0x3aeb34 }], ephemeral: true });
            await func.dbdelete({ tabel: "paypay", v: `id="${interaction.user.id}"` });
            const goods = await func.dbget({ tabel: "goods", v: `username="${paypay[0].name}"` });
            if (!goods[0].id) return await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了。`, color: 0x3aeb34 }], ephemeral: true });
            await func.dbdelete({ tabel: "goods", v: `username="${paypay[0].name}"` });
            const item = await func.dbget({ tabel: "inventory", v: `id="${goods[0].id}"` });
            if (!item[0].id) return await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了。`, color: 0x3aeb34 }], ephemeral: true });
            await Promise.all(goods.map(async v => await func.dbdelete({ tabel: "inventory", v: `id="${v.id}"` })));
            await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了。`, color: 0x3aeb34 }], ephemeral: true });
        };
        if (interaction.options.getString("item_or_account") === "item") {
            const check = interaction.options._hoistedOptions.map(x => x.name).includes('item_name');
            if (!check) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品名を指定してください。`, color: 0x3aeb34 }], ephemeral: true });
            const paypay = await func.dbget({ tabel: "paypay", v: `id="${interaction.user.id}"` });
            if (!paypay[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `あなたのアカウントはpaypayと紐付けられていません。`, color: 0x3aeb34 }], ephemeral: true });
            const name = interaction.options.getString("item_name");
            const info = await func.dbget({ tabel: "goods", v: `name="${name}" and username="${paypay[0].name}"` });
            if (!info[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
            await func.dbdelete({ tabel: "goods", v: `name="${name}" and username="${paypay[0].name}"` });
            await Promise.all(info.map(async v => await func.dbdelete({ tabel: "inventory", v: `id="${v.id}"` })));
            await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了。`, color: 0x3aeb34 }], ephemeral: true });
        };
    }
};