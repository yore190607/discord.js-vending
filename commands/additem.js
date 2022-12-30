const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
const { v4: uuidv4 } = require('uuid');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('additem')
        .addStringOption(option => option.setName("name").setDescription("商品名(20文字)").setRequired(true))
        .addStringOption(option => option.setName("item").setDescription("半角空白で複数(1商品当たり20文字)").setRequired(true))
        .addNumberOption(option => option.setName("amount").setDescription("値段を入力してください(最大10万)").setRequired(true))
        .setDescription('商品を追加します。'),
    async execute(interaction) {
        const option = interaction.options;
        if (option.getString("name").length > 20) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品名は20字以内にしてください。`, color: 0x3aeb34 }], ephemeral: true });
        if (option.getNumber("amount") < 1) return await interaction.reply({ embeds: [{ title: "エラー", description: `値段は1円以下にしてください。`, color: 0x3aeb34 }], ephemeral: true });
        if (option.getNumber("amount") > 100000) return await interaction.reply({ embeds: [{ title: "エラー", description: `値段は10万以下にしてください。`, color: 0x3aeb34 }], ephemeral: true });
        const check = await func.dbget({ tabel: "paypay", v: `id="${interaction.user.id}"` });
        if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `paypayにサインアップまたはサインインしてください。`, color: 0x3aeb34 }], ephemeral: true });
        const subsc = await func.dbget({tabel:"subsc",v:`name="${check[0]?.name}"`});
        if(!subsc[0]?.subsc) return await interaction.reply({ embeds: [{ title: "エラー", description: `サブスクが有効ではありません。`, color: 0x3aeb34 }], ephemeral: true });
        if(subsc[0]?.subsc <= new Date())return await interaction.reply({ embeds: [{ title: "エラー", description: `サブスクの有効期限切れです。`, color: 0x3aeb34 }], ephemeral: true });
        const shop = await func.dbget({ tabel: "goods", v: `name="${option.getString("name")}" and username="${check[0]?.name}"` });
        const items = option.getString("item").split(" ");
        if (!shop[0]?.name) {
            const id = uuidv4();
            await func.dbset({ tabel: "goods", v: `"${option.getString("name")}","${option.getNumber("amount")}","${check[0]?.name}","${id}"` });
            const bshop = await func.dbget({ tabel: "inventory", v: `id="${id}"` });
            const q = bshop.map(item => item).length;
            if ((q + items.length) > 500) return await interaction.reply({ embeds: [{ title: "エラー", description: `在庫最大数は500個です。`, color: 0x3aeb34 }], ephemeral: true });
            await Promise.all(items.map(async item => {
                if (item.length > 20) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品内容は20字以内にしてください。`, color: 0x3aeb34 }], ephemeral: true });
                await func.dbset({ tabel: "inventory", v: `"${id}","${item}"` });
            }));
        } else {
            const id = shop[0].id;
            const bshop = await func.dbget({ tabel: "inventory", v: `id="${id}"` });
            const q = bshop.map(item => item).length;
            if ((q + items.length) > 500) return await interaction.reply({ embeds: [{ title: "エラー", description: `在庫最大数は500個です。`, color: 0x3aeb34 }], ephemeral: true });
            await Promise.all(items.map(async item => {
                if (item.length > 20) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品内容は20字以内にしてください。`, color: 0x3aeb34 }], ephemeral: true });
                await func.dbset({ tabel: "inventory", v: `"${id}","${item}"` });
            }));
        };

        await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了。`, color: 0x3aeb34 }], ephemeral: true });
    }
};