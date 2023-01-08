const func = require("./func");
const axios = require('axios');
let user = [];
module.exports = {
    aut: async data => {
        console.log(data)
        if (user[data.id]) return 2;
        const check = await func.dbget({ tabel: "paypay", v: `name="${data.name}"` });
        user[data.id] = { ps: data.ps, uid: data.uidd, rid: data.rid, name: data.name, id: data.id,uidc:data.uidc };
        if (check[0]?.name) return 1;
        const check2 = await func.dbget({ tabel: "paypay", v: `id="${data.id}"` });
        if (check2[0]?.name) return 3;
        setTimeout(() => delete user[data.id], 60 * 1000);
    },
    otp: async id => {
        const data = user[id];
        delete user[id]
        if (!data) return false;
        return data;
    },
    check: async us => {
        const user = await func.dbget({tabel:"paypay",v:`id="${us.id}"`});
        if(!user[0]?.id) return 1;
        const headers = {
            "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0",
            Authorization: `Bearer ${user[0].token}`,
            "Client-Type": "PAYPAYAPP",
            "Client-OS-Type": "IOS",
            "Client-Version": "3.31.0",
            "Client-OS-Version": "13.3.1",
            "Client-UUID": user[0].uuidc,
            "Device-UUID": user[0].uuid,
            "Device-Name": "iPad8,3",
            "Network-Status": "WIFI",
            "Content-Type": "application/json"
        }
        if (us.pass) headers["passcode"] = String(us.pass);
        const { data } = await axios.get(
            `https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?payPayLang=ja&verificationCode=${us.code}`,
            {headers: headers}
        ).catch(() => { });
        if (!data.payload?.pendingP2PInfo) return 2;
        return data.payload.pendingP2PInfo.amount;
    }
}