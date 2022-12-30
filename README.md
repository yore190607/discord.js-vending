# discord.js-vending-machine
 discord.jsで作成した自販機BOT

依頼受け付けています

**Discord:田中#1204**

詳しくはDMしてください。


# テスト環境
<p> 
Node.js(v19)<br>
npm(v9.1.3)<br>
axios(v1.2.1)<br>
date-fns-tz(v1.3.7)<br>
discord.js(v14.7.1)<br>
ejs(v3.1.8)<br>
express(v4.18.2)<br>
mariadb(v3.0.2)<br>
uuid(v9.0.0)<br>
windows(11)<br>
</p>

 # 初回
 コマンドラインにて

 `npm install`

 と打ち必要なmoduleをインストールします。

`config.json`でいろいろ設定します

[SQLはmariadbです(各自で鯖立ててください)](#sqlの立ち上げ方)

初回起動時は`func.dbsetup()`と`index.js`内の**readyイベント**内に書いてください(コメントアウトしてあるのでそれ参考に)

[Discorddevサイト](https://discord.com/developers/applications/)で**リダイレクトURL**を`http://(https://)ドメイン/login`にしてください。

![例](https://media.discordapp.net/attachments/1054323958096339005/1058264338282070126/image.png?width=1440&height=603 "例")

スコープをindentifyとguilds.joinにチェックしたURLを取得し、config.jsonに書き込む

![例](https://media.discordapp.net/attachments/1054323958096339005/1058265019801948180/image.png?width=1396&height=670 "例")

シークレットとIDはここで取得できます。

![image.png](https://media.discordapp.net/attachments/1054323958096339005/1058265654832144405/image.png?width=1371&height=671)

TOKENはここです

![image.png](https://media.discordapp.net/attachments/1054323958096339005/1058266082097512498/image.png?width=1382&height=671)


`node index.js`で起動できます。

コマンドについてはスラッシュコマンドなので起動すればわかると思います。

`func.js`に独自の関数あります(SQLの操作はそっち使ったほうが楽？かも)

tabelってスペル間違っていますけど気にしないでください。(途中で気づいた)

# SQLの立ち上げ方
[windows](https://www.trifields.jp/how-to-install-mariadb-on-windows-2440)

[linux](https://libproc.com/install-mariadb-on-linux-and-create-database/)

テーブル名、ユーザー名、パスワード、ホストが必要になります(rootでもいいですけどお勧めはしないです)

# ライセンス

<h3>著作者表示</h3>

<h3>非営利のみ</h3>

<h3>ライセンスの継承</h3>

![ライセンス](https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Cc-by-nc-sa_icon.svg/1280px-Cc-by-nc-sa_icon.svg.png "コモンズライセンス")
