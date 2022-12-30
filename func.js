const setting = require('./config.json');
const tmp = new Set();
const mariadb = require('mariadb');
const pool = mariadb.createPool({ host: setting.db.host, user: setting.db.user, password: setting.db.pass, database: setting.db.name });
let conn;
function getEndOfMonth(year, month) {
    var endDate = new Date(year, month, 0);
    return endDate.getDate();
}
pool.getConnection()
    .then(first => conn = first)
    .catch(err => console.log(`接続エラー:${err}`));
module.exports = {
    delete_timer: channel => {
        if (channel.type == "delete") setTimeout(() => {
            if (tmp.has(channel.action.id)) return tmp.delete(channel.action.id);
            channel.action.delete().catch(() => { });
        }, 5 * 1000);
        if (channel.type == "cancel") tmp.add(channel.action.id);
    },
    dbset: async data => {
        const db = await conn.query(`insert into ${data.tabel} values (${data.v});`).catch(e => { console.log(`insert中のエラー:${e}`) });//insert into user values (3, 'Hoshino', default);
        if (!db) return false;
        return true;
    },
    dbget: async data => {
        const db = await conn.query(`select * from ${data.tabel} where ${data.v};`).catch(e => { console.log(`select中のエラー:${e}`) });//select * from friends where ;
        if (!db) return false;
        return db;
    },
    dbdelete: async data => {
        const db = await conn.query(`DELETE FROM ${data.tabel} WHERE ${data.v};`).catch(e => { console.log(`delete中のエラー:${e}`) });// DELETE FROM products WHERE id = 1;
        if (!db) return false;
        return true;
    },
    dbtabel: async data => {
        const db = await conn.query(`create table ${data.tabel} (${data.v});`).catch(e => { console.log(`create中のエラー:${e}`) });//create table friends (name varchar(10), old int, address varchar(10));
        if (!db) return false;
        return true;
    },
    dbtabeldrop: async data => {
        const db = await conn.query(`drop table ${data.tabel};`).catch(e => { console.log(`drop中のエラー:${e}`) });
        if (!db) return false;
        return true;
    },
    dbtabelcheck: async data => {
        const db = await conn.query(`SELECT 1 FROM ${data.tabel} LIMIT 1;`).catch(() => { });
        if (!db) return false;
        return true;
    },
    dbcheck: async data => {
        const db = await conn.query(`select * from ${data}`).catch(e => { console.log(`select中のエラー:${e}`) });
        console.log(db)
    },
    dbupdate: async data => {
        const db = await conn.query(`update ${data.tabel} set ${data.set} where ${data.v};`).catch(e => { console.log(`update中のエラー:${e}`) });
        if (!db) return false;
        return true;
    },
    dbsetup: async () => {
        await conn.query(`create table verify (guildid text(20),roleid text(20));`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//認証
        await conn.query(`create table backup (username text(20),guildid text(20));`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//backup
        await conn.query(`create table token (userid text(20),token text(20));`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//tokens
        await conn.query(`create table users (userid text(20),username text(10),pass text(10),subsc date);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//user
        await conn.query(`create table vending (name text(20),username text(10),item text(30));`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//自販機
        await conn.query(`create table guild (guildid text(20),userid text(10));`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//backup(guild)
        await conn.query(`create table paypay (name text(10),pass text(32),token text,id text,uuid text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//paypay(guild)
        await conn.query(`create table inventory (id text(20),item text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//inventory
        await conn.query(`create table goods (name text(20),amount bigint,username text(20),id text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//goods
        await conn.query(`create table account (name text(10),pass text(10),id text(10));`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//account
        await conn.query(`create table subsc (name text(10),subsc date);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//account subsc
    },
    dbgettable: async () => {
        return await conn.query("show tables;");
    },
    getAddMonthDate: (year, month, day, add) => {
        const addMonth = month + add;
        const endDate = getEndOfMonth(year, addMonth);
        if (day > endDate) {
            day = endDate;
        } else day = day - 1;
        const addMonthDate = new Date(year, addMonth - 1, day);
        return addMonthDate;
    },
    nowdate: data => {
        let now;
        if (!data) now = new Date();
        if (data) now = new Date(data);
        return [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    },
    isHanEisu(str) {
        str = (str == null) ? "" : str;
        if (str.match(/^[A-Za-z0-9]*$/)) return true;
        return false;
    }
}