const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const func = require('../func');
const paypay = require('../paypayfunc');
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('paypay')
        .addStringOption(option => option.setName("signin_or_signup").setDescription("サインインアップまたはサインインを選択してください。").addChoices({ name: 'Singn_Up', value: 'singnup' }, { name: 'Sign_In', value: 'signin' }).setRequired(true))
        .addStringOption(option => option.setName("label").setDescription("PayPayアカウントにニックネームをつけてください。(重複不可)").setRequired(true))
        .addStringOption(option => option.setName("phone").setDescription("PayPayに登録している電話番号を入力してください。(ハイフンなし)").setRequired(true))
        .addStringOption(option => option.setName("password").setDescription('PayPayのパスワードを入力してください。').setRequired(true))
        .addStringOption(option => option.setName("new_password").setDescription('PayPayの変更後のパスワードを入力してください。(必要な場合のみ)').setRequired(false))
        .setDescription('PayPayアカウントにログインを行います。'),
    async execute(interaction) {
        if (interaction.options.getString("signin_or_signup") === "singnup") {
            if (!func.isHanEisu(interaction.options.getString("label"))) return await interaction.reply({ embeds: [{ title: "エラー", description: "ユーザー名は半角英数字にしてください。", color: 0x3aeb34 }], ephemeral: true });
            if (interaction.options.getString("password").length >= 32) return await interaction.reply({ embeds: [{ title: "エラー", description: "パスワードは32字以下です。", color: 0x3aeb34 }], ephemeral: true });
            if (interaction.options.getString("label").length > 10) return await interaction.reply({ embeds: [{ title: "エラー", description: "ユーザー名は10字未満にしてください。", color: 0x3aeb34 }], ephemeral: true });
            const uuidc = uuidv4();
            const uuidd = uuidv4();
            let header = {
                "Client-Mode": "NORMAL",
                "Client-OS-Version": "13.3.0",
                "Client-Type": "PAYPAYAPP",
                "Network-Status": "WIFI",
                "System-Locale": "ja",
                "Client-Version": "3.50.0",
                "Is-Emulator": "false",
                "Device-Name": "iPhone8,1",
                "Client-UUID": uuidc,
                Timezone: "Asia/Tokyo",
                "Client-OS-Type": "IOS",
                "Device-UUID": uuidd,
            };
            const response = await axios.post(
                "https://app4.paypay.ne.jp/bff/v1/signIn",
                {
                    payPayLang: "ja",
                    signInAttemptCount: 1,
                    phoneNumber: interaction.options.getString("phone"),
                    password: interaction.options.getString("password")
                },
                {
                    headers: header
                }
            ).catch(() => { });
            if (response.data?.error?.displayErrorResponse) return await interaction.reply({ embeds: [{ title: response.data?.error?.displayErrorResponse.title, description: response.data?.error?.displayErrorResponse.description, color: 0x3aeb34 }], ephemeral: true });
            const pay = await paypay.aut({ ps: interaction.options.getString("password"), uidd: uuidd, rid: response.data.error.otpReferenceId, name: interaction.options.getString("label"), id: interaction.user.id, uidc: uuidc });
            if (pay === 1) return interaction.reply({ embeds: [{ title: "エラー", description: `すでにこの名前のアカウントがあります。`, color: 0x3aeb34 }], ephemeral: true });
            if (pay === 2) return interaction.reply({ embeds: [{ title: "エラー", description: `1分以上時間をおいて試してください。`, color: 0x3aeb34 }], ephemeral: true });
            if (pay === 3) return interaction.reply({ embeds: [{ title: "エラー", description: `あなたのアカウントは既にあります。`, color: 0x3aeb34 }], ephemeral: true });
            const modal = new ModalBuilder()
                .setCustomId(`pay,${interaction.user.id}`)
                .setTitle('電話番号に送られてきた四桁の認証コードを打ってください。');
            const aut = new TextInputBuilder()
                .setCustomId('aut')
                .setLabel("認証コード")
                .setRequired(true)
                .setPlaceholder('1234')
                .setMaxLength(4)
                .setStyle(TextInputStyle.Short);
            const autActionRow = new ActionRowBuilder().addComponents(aut);
            modal.addComponents(autActionRow);
            await interaction.showModal(modal);
        };
        if (interaction.options.getString("signin_or_signup") === "signin") {
            if (interaction.options._hoistedOptions.map(x => x.name).includes('new_password')) {
                if (interaction.options.getString("new_password").length >= 32) return await interaction.reply({ embeds: [{ title: "エラー", description: "パスワードは32字以下です。", color: 0x3aeb34 }], ephemeral: true });
            };
            if (!func.isHanEisu(interaction.options.getString("label"))) return await interaction.reply({ embeds: [{ title: "エラー", description: "ユーザー名は半角英数字にしてください。", color: 0x3aeb34 }], ephemeral: true });
            if (interaction.options.getString("password").length >= 32) return await interaction.reply({ embeds: [{ title: "エラー", description: "パスワードは32字以下です。", color: 0x3aeb34 }], ephemeral: true });
            if (interaction.options.getString("label").length > 10) return await interaction.reply({ embeds: [{ title: "エラー", description: "ユーザー名は10字未満にしてください。", color: 0x3aeb34 }], ephemeral: true });
            const check = await func.dbget({ tabel: "paypay", v: `name="${interaction.options.getString("label")}"` });
            if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `paypayにサインアップしてください。`, color: 0x3aeb34 }], ephemeral: true });
            if (check[0].pass !== interaction.options.getString("password")) return await interaction.reply({ embeds: [{ title: "エラー", description: `入力された情報に間違いがあります。`, color: 0x3aeb34 }], ephemeral: true });
            const uuidc = uuidv4();
            const uuidd = uuidv4();
            let header = {
                "Client-Mode": "NORMAL",
                "Client-OS-Version": "13.3.0",
                "Client-Type": "PAYPAYAPP",
                "Network-Status": "WIFI",
                "System-Locale": "ja",
                "Client-Version": "3.50.0",
                "Is-Emulator": "false",
                "Device-Name": "iPhone8,1",
                "Client-UUID": uuidc,
                Timezone: "Asia/Tokyo",
                "Client-OS-Type": "IOS",
                "Device-UUID": uuidd,
            };
            const response = await axios.post(
                "https://app4.paypay.ne.jp/bff/v1/signIn",
                {
                    payPayLang: "ja",
                    signInAttemptCount: 1,
                    phoneNumber: interaction.options.getString("phone"),
                    password: (interaction.options._hoistedOptions.map(x => x.name).includes('new_password')) ? interaction.options.getString("new_password") : interaction.options.getString("password")
                },
                {
                    headers: header
                }
            ).catch(() => { });
            if (response.data?.error?.displayErrorResponse) return await interaction.reply({ embeds: [{ title: response.data?.error?.displayErrorResponse.title, description: response.data?.error?.displayErrorResponse.description, color: 0x3aeb34 }], ephemeral: true });
            const pay = await paypay.aut({ ps: (interaction.options._hoistedOptions.map(x => x.name).includes('new_password')) ? interaction.options.getString("new_password") : interaction.options.getString("password"), uidd: uuidd, rid: response.data.error.otpReferenceId, name: interaction.options.getString("label"), id: interaction.user.id, uidc: uuidc });
            if (pay === 2) return interaction.reply({ embeds: [{ title: "エラー", description: `1分以上時間をおいて試してください。`, color: 0x3aeb34 }], ephemeral: true });
            const modal = new ModalBuilder()
                .setCustomId(`pay,${interaction.user.id}`)
                .setTitle('電話番号に送られてきた四桁の認証コードを打ってください。');
            const aut = new TextInputBuilder()
                .setCustomId('aut')
                .setLabel("認証コード")
                .setRequired(true)
                .setPlaceholder('1234')
                .setMaxLength(4)
                .setStyle(TextInputStyle.Short);
            const autActionRow = new ActionRowBuilder().addComponents(aut);
            modal.addComponents(autActionRow);
            await interaction.showModal(modal);
        };
    }
};