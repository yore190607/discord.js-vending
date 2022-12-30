const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
const setting = require("../config.json");
const { utcToZonedTime, format } = require("date-fns-tz");
const axios = require('axios');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('activate')
        .addStringOption(option => option.setName("paypaylink").setDescription(`${setting.amount}円分のpaypayリンク`).setRequired(true))
        .addStringOption(option => option.setName("paypaypass").setDescription(`${setting.amount}円分のpaypayリンクのパスコード(必要な場合のみ)`).setRequired(false))
        .setDescription('アカウントを有効にします。'),
    async execute(interaction) {
        const get_paypay = await func.dbget({ tabel: "paypay", v: `id="${interaction.user.id}"` });
        if (!get_paypay[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `アカウントがありませんです。`, color: 0x3aeb34 }], ephemeral: true });
        const blink = interaction.options.getString("paypaylink");
        if (!blink.includes("https://pay.paypay.ne.jp/")) return await interaction.reply({ embeds: [{ title: "エラー", description: `リンクが無効です。`, color: 0x3aeb34 }], ephemeral: true });
        const link = blink.replace("https://pay.paypay.ne.jp/", "");
        const pass = interaction.options.getString('paypaypass');
        const header = { "Content-Type": "application/json", Authorization: `Bearer ${setting.paypay.token}`, "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0", "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": setting.paypay.id, Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": setting.paypay.id }
        const response = await axios.get(`https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?verificationCode=${link}&payPayLang=ja`, { headers: header }).catch(e => { console.log(`link解析中のエラー:${e}`) });
        if (response.data.header.resultCode == "S9999") await interaction.reply({ embeds: [{ title: "エラー", description: `リンクが無効または期限切れです。`, color: 0x3aeb34 }], ephemeral: true });
        if (response.data.header.resultCode == "S0000") {
            if (response.data.payload.orderStatus == "SUCCESS") return await interaction.reply({ embeds: [{ title: "エラー", description: `受け取り済みのリンクです。`, color: 0x3aeb34 }], ephemeral: true });
            if (response.data.payload.orderStatus == "PENDING") {
                if (response.data.payload.pendingP2PInfo.amount !== setting.amount) return await interaction.reply({ embeds: [{ title: "エラー", description: `金額が一致しません`, color: 0x3aeb34 }], ephemeral: true });
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
                    const usercheck = await func.dbget({ tabel: "subsc", v: `name="${get_paypay[0].name}"` });
                    if (usercheck[0]?.name) {
                        const now = func.nowdate(usercheck[0]?.subsc);
                        const date = format(func.getAddMonthDate(now[0], now[1], now[2], 1), "yyyy-MM-dd", { timeZone: "Asia/Tokyo" });
                        const update = await func.dbupdate({ tabel: `subsc`, set: `subsc="${date}"`, v: `name="${get_paypay[0].name}"` });
                        if (!update) return await interaction.reply({ embeds: [{ title: "エラー", description: `データの更新に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                        await interaction.reply({ embeds: [{ title: "おしらせ", description: `1ヶ月分有効になりました。`, color: 0x3aeb34 }], ephemeral: true });
                    } else {
                        const now = func.nowdate();
                        const date = format(func.getAddMonthDate(now[0], now[1], now[2], 1), "yyyy-MM-dd", { timeZone: "Asia/Tokyo" });
                        const update = await func.dbset({ tabel: `subsc`, v: `"${get_paypay[0].name}","${date}"` });
                        if (!update) return await interaction.reply({ embeds: [{ title: "エラー", description: `データの保存に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                        await interaction.reply({ embeds: [{ title: "おしらせ", description: `1ヶ月分有効になりました。`, color: 0x3aeb34 }], ephemeral: true });
                    };
                };
            };
        };
    }
};