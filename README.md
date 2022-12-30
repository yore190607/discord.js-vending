# discord.js-vending
 discord.jsで作成した自販機BOT

# テスト環境
<p> 
Node.js(v19)<br>
axios(v1.2.1)<br>
date-fns-tz(v1.3.7)<br>
discord.js(v14.7.1)<br>
ejs(v3.1.8)<br>
express(v4.18.2)<br>
mariadb(v3.0.2)<br>
uuid(v9.0.0)<br>
</p>

 # 初回
 コマンドラインにて

 `npm install`

 と打ち必要なmoduleをインストールします。

`config.json`でいろいろ設定します

SQLはmariadbです(各自で鯖立ててください)

`SQL立ち上げ方`

[windows](https://www.trifields.jp/how-to-install-mariadb-on-windows-2440)
[linux](https://libproc.com/install-mariadb-on-linux-and-create-database/)

初回起動時は`func.dbsetup()`と`index.js`内の**readyイベント**内に書いてください(コメントアウトしてあるのでそれ参考に)

Discorddevサイトで**リダイレクトURL**を`http://(https://)ドメイン/login`にしてください。

`node index.js`で起動できます。

コマンドについてはスラッシュコマンドなので起動すればわかると思います。

`func.js`に独自の関数あります(SQLの操作はそっち使ったほうが楽？かも)

tabelってスペル間違っていますけど気にしないでください。(途中で気づいた)

# ライセンス

<h3>著作者表示</h3>

<h3>非営利のみ</h3>

<h3>ライセンスの継承</h3>

![ライセンス](https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Cc-by-nc-sa_icon.svg/1280px-Cc-by-nc-sa_icon.svg.png "コモンズライセンス")
