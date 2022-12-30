const { Client, GatewayIntentBits, Collection, ActionRowBuilder, StringSelectMenuBuilder, ActivityType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { utcToZonedTime, format } = require("date-fns-tz");
const client = new Client({ intents: [GatewayIntentBits.Guilds], rest: 60000 });
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const setting = require('./config.json');
const func = require('./func.js');
const tokenup = require('./tokenupdate.js');
const express = require('express');
const paypayfunc = require('./paypayfunc');
const app = express();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
globalThis.client = client;
client.commands = new Collection();
app.listen(setting.port);
app.use(express.static('./views'));
app.use("/login", require("./router/login.js"));
app.set("view engine", "ejs");
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) { client.commands.set(command.data.name, command) } else console.log(`[注意] ${filePath} のプロパティが無効です.`);
};
client.once("ready", async () => {
    client.user.setPresence({ activities: [{ name: `${setting.discord.name}`, type: ActivityType.Streaming }], status: 'dnd' });
    //await func.dbsetup()　　//初回のみ
    if (new Date().getHours() == 3) await tokenup.refresh(func);
    setInterval(() => {
        if (new Date().getHours() == 3) tokenup.refresh(func);
    }, 3300 * 1000);
    await client.application.commands.set(client.commands.map(d => d.data), "");
    console.log(`${client.user.username}を起動しました。`);
});
client.on("interactionCreate", async interaction => {
    if (interaction.user.bot) return;
    try {
        if (interaction.isChatInputCommand()) await interaction.client.commands.get(interaction.commandName).execute(interaction);
        if (interaction.isButton()) {
            if (interaction.customId.startsWith("buy")) {
                const id = interaction.customId.split(",")[1];
                const check = await func.dbget({ tabel: "paypay", v: `id="${id}"` });
                if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `販売者の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const items = await func.dbget({ tabel: "goods", v: `username="${check[0]?.name}"` });
                const goods = items.map(c => { return { name: c.name, amount: c.amount } });
                if (!goods[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const selectdata = items.map(data => { return { label: data.name.slice(0, 15), description: `${data.amount}円です`, value: data.id } })
                const select = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('buy')
                            .setPlaceholder('何も選択されていません')
                            .addOptions(selectdata),
                    );
                await interaction.reply({ embeds: [{ title: "shop", description: `${goods.map(data => `**${data.name}**\n${data.amount}円`).join("\n\n")}`, color: 0x3aeb34 }], components: [select], ephemeral: true });
            };
        };
        if (interaction.isStringSelectMenu()) {
            const buy = interaction.values[0];
            const item = await func.dbget({ tabel: "inventory", v: `id="${buy}"` });
            if (!item[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `在庫切れ`, color: 0x3aeb34 }], ephemeral: true });
            const modal = new ModalBuilder()
                .setCustomId(`buy,${item[0]?.id}`)
                .setTitle('支払い。');
            const link = new TextInputBuilder()
                .setCustomId('link')
                .setLabel("リンク")
                .setRequired(true)
                .setPlaceholder('https://pay.paypay.ne.jp/123456789ABCDEFG')
                .setStyle(TextInputStyle.Short);
            const pass = new TextInputBuilder()
                .setCustomId('pass')
                .setLabel("パスコード")
                .setRequired(false)
                .setPlaceholder('1234')
                .setMaxLength(4)
                .setStyle(TextInputStyle.Short);
            const linkActionRow = new ActionRowBuilder().addComponents(link);
            const passActionRow = new ActionRowBuilder().addComponents(pass);
            modal.addComponents(linkActionRow, passActionRow);
            await interaction.showModal(modal);
        };
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith("buy")) {
                const id = interaction.customId.split(",")[1];
                const goods = await func.dbget({ tabel: "goods", v: `id="${id}"` });
                if (!goods[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品情報を読み込めませんでした`, color: 0x3aeb34 }], ephemeral: true });
                const blink = interaction.fields.getTextInputValue("link")
                if (!blink.includes("https://pay.paypay.ne.jp/")) return await interaction.reply({ embeds: [{ title: "エラー", description: `リンクが無効です。`, color: 0x3aeb34 }], ephemeral: true });
                const link = blink.replace("https://pay.paypay.ne.jp/", "");
                const pass = interaction.fields.getTextInputValue('pass');
                const item = await func.dbget({ tabel: "inventory", v: `id="${id}"` });
                if (!item[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `在庫切れ`, color: 0x3aeb34 }], ephemeral: true });
                const paypay = await func.dbget({ tabel: "paypay", v: `name="${goods[0].username}"` });
                if (!paypay[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `販売者の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const header = { "Content-Type": "application/json", Authorization: `Bearer ${paypay[0].token}`, "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0", "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": paypay[0].uuid, Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": paypay[0].uuid }
                const response = await axios.get(`https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?verificationCode=${link}&payPayLang=ja`, { headers: header }).catch((e) => { console.log(`Paypayリンク解析エラー:${e.message}`) });
                if (response.data.header.resultCode == "S9999") await interaction.reply({ embeds: [{ title: "エラー", description: `リンクが無効または期限切れです。`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S0000") {
                    if (response.data.payload.orderStatus == "SUCCESS") return await interaction.reply({ embeds: [{ title: "エラー", description: `受け取り済みのリンクです。`, color: 0x3aeb34 }], ephemeral: true });
                    if (response.data.payload.orderStatus == "PENDING") {
                        if (response.data.payload.pendingP2PInfo.amount !== Number(goods[0].amount)) return await interaction.reply({ embeds: [{ title: "エラー", description: `金額が一致しません`, color: 0x3aeb34 }], ephemeral: true });
                        const zonedDate = utcToZonedTime(new Date(), "Asia/Tokyo");
                        const requestAt = format(zonedDate, "y-M-d'T'H:m:s+0900", { timeZone: "Asia/Tokyo" });
                        const json = {
                            payPayLang: "ja",
                            verificationCode: link,
                            requestId: response.data.payload.message.data.requestId,
                            orderId: response.data.payload.pendingP2PInfo.orderId,
                            verificationCode: String(link),
                            requestAt: requestAt,
                            iosMinimumVersion: "3.45.0",
                            androidMinimumVersion: "3.45.0",
                        };
                        if (pass) json["passcode"] = String(pass);
                        const r = await axios.post(
                            "https://app4.paypay.ne.jp/bff/v2/acceptP2PSendMoneyLink",
                            json,
                            { headers: header }
                        );
                        if (r.data.header.resultCode == "S9999") return interaction.reply({ embeds: [{ title: "エラー", description: `パスコードが間違っています。`, color: 0x3aeb34 }], ephemeral: true });
                        if (r.data.header.resultCode == "S0000") {
                            await func.dbdelete({ tabel: "inventory", v: `id="${id}" and item="${item[0].item}" limit 1` })
                            await interaction.reply({ embeds: [{ title: "購入完了", description: `${item[0].item}`, color: 0x3aeb34 }], ephemeral: true });
                        };
                    };
                };
            };
            if (interaction.customId.startsWith("pay")) {
                const id = interaction.customId.split(",")[1];
                const data = await paypayfunc.otp(id);
                if (!data) return await interaction.reply({ embeds: [{ title: "エラー", description: `タイムアウトしました。\nもう一度お試しください。`, color: 0x3aeb34 }], ephemeral: true })
                const aut = interaction.fields.getTextInputValue('aut');
                const header = { "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": data.uid, Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": data.uid };
                const response = await axios.post("https://app4.paypay.ne.jp/bff/v1/signInWithSms", { payPayLang: "ja", otp: aut, otpReferenceId: data.rid }, { headers: header }).catch(e => { console.log(`otp認証に失敗しました。\n詳細:${e.message}`) });
                if (!response) return await interaction.reply({ embeds: [{ title: "エラー", description: `リクエストに失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                if (response.error?.backendResultCode) return await interaction.reply({ embeds: [{ title: "エラー", description: `OTP認証に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                const check = await func.dbget({ tabel: "paypay", v: `name="${data.name}"` });
                if (check[0]?.name) {
                    const set = await func.dbupdate({ tabel: "paypay", set: `pass="${data.ps}",token="${response.data.payload.accessToken}",id="${data.id}",uuid="${data.uid}"`, v: `name="${data.name}"` });
                    if (!set) return await interaction.reply({ embeds: [{ title: "エラー", description: `データの保存に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                    await interaction.reply({ embeds: [{ title: "お知らせ", description: `設定しました。`, color: 0x3aeb34 }], ephemeral: true });
                } else {
                    const set = await func.dbset({ tabel: "paypay", v: `"${data.name}","${data.ps}","${response.data.payload.accessToken}","${data.id}","${data.uid}"` });
                    if (!set) return await interaction.reply({ embeds: [{ title: "エラー", description: `データの保存に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                    await interaction.reply({ embeds: [{ title: "お知らせ", description: `設定しました。`, color: 0x3aeb34 }], ephemeral: true });
                };
            };
        };
    } catch (error) {
        console.error(`コマンドを実行する際エラーが発生しました\n詳細:${error}\nコマンド実行者:${interaction.user.tag}`);
        await interaction.reply({ embeds: [{ title: "エラー", description: `コマンドを実行する際エラーが発生しました\n詳細:${error}`, color: 0x3aeb34 }], ephemeral: true }).catch(() => { });
    };
});
client.login(setting.discord.token)