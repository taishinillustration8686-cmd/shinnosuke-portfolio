/**
 * しんのすけポートフォリオ お問い合わせフォーム
 *
 * このコードがやること
 *   1. サイトのフォームから送られた内容を受け取る
 *   2. 自分（OWNER_EMAIL）宛に通知メールを送る
 *   3. 送信してくれた相手にも「控え」のメールを自動で返す
 *   4. スプレッドシートに1行ずつ記録する（消えない台帳になります）
 */

// ▼ここだけ自分用に設定 ---------------------------------------
var OWNER_EMAIL = 'taishinillustration8686@gmail.com'; // 通知の宛先
var SENDER_NAME = 'しんのすけ';                          // 控えメールの差出人名
var SITE_URL    = 'https://taishinillustration8686-cmd.github.io/shinnosuke-portfolio/';
// -------------------------------------------------------------

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // 迷惑送信よけ（人には見えない欄が埋まっていたら、何もせず終了）
    if (p.company) return json({ ok: true });

    var name  = String(p.name  || '').trim();
    var email = String(p.email || '').trim();
    var type  = String(p.type  || '').trim();
    var body  = String(p.body  || '').trim();

    if (!name || !email || !body) return json({ ok: false, error: '未入力の項目があります' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'メールアドレスの形式が正しくありません' });
    if (body.length > 5000) return json({ ok: false, error: '本文が長すぎます' });

    // 1) 台帳に記録
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
      if (sheet.getLastRow() === 0) sheet.appendRow(['日時', 'お名前', 'メール', 'ご相談の種類', 'ご相談内容']);
      sheet.appendRow([new Date(), name, email, type, body]);
    } catch (err) {
      // シートに書けなくてもメールは送る
    }

    // 2) 自分あての通知
    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: '【お問い合わせ】' + (type || 'その他') + ' / ' + name + ' 様',
      replyTo: email,   // そのまま返信すれば相手に届きます
      body: [
        'ポートフォリオサイトからお問い合わせが届きました。',
        '',
        'お名前　　　：' + name,
        'メール　　　：' + email,
        'ご相談の種類：' + (type || '（未選択）'),
        '',
        '【ご相談内容】',
        body,
        '',
        '---',
        SITE_URL
      ].join('\n')
    });

    // 3) 送信者への控え（自動返信）
    MailApp.sendEmail({
      to: email,
      name: SENDER_NAME,
      subject: 'お問い合わせありがとうございます（自動返信）',
      body: [
        name + ' 様',
        '',
        'お問い合わせいただきありがとうございます。しんのすけです。',
        '以下の内容で承りました。24時間以内にあらためてご連絡いたします。',
        '',
        '──────────────────',
        'お名前　　　：' + name,
        'メール　　　：' + email,
        'ご相談の種類：' + (type || '（未選択）'),
        '',
        '【ご相談内容】',
        body,
        '──────────────────',
        '',
        '※このメールは自動送信です。ご返信いただいても問題ありません。',
        '',
        SENDER_NAME,
        OWNER_EMAIL,
        SITE_URL
      ].join('\n')
    });

    return json({ ok: true });

  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, message: 'このURLはフォームの送信先です' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
