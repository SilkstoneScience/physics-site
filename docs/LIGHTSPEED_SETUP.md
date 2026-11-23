# Lightspeed: setting up the class leaderboard

Lightspeed (`lightspeed.html`) works without any of this. Each student's best scores are then saved only in their own browser. These steps switch on the **shared leaderboard**. Scores are stored in a Google Sheet that you own, and a small Google Apps Script connects it to the website. (Apps Script is Google's free way of running a few lines of code attached to a Sheet.) It takes about 10 minutes, and you only do it once.

## What students see and what is stored
- Before playing, students type a name. The page tells them to use a first name and an initial, or a nickname, never a full name, because **the leaderboard is public**: anyone who opens the page can see it.
- Each finished round adds one row to your Sheet: the time, name, theme, score and number right. Nothing else is collected (no emails or accounts).
- The leaderboard shows each name's best score for the chosen theme, either this week (from Monday) or all time. It shows the top 20.

## 1. Make the Sheet and the script
1. Go to sheets.google.com and create a blank spreadsheet. Name it **Lightspeed leaderboard**.
2. In the menu, choose **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete everything in the editor. Then open `tools/lightspeed/leaderboard.gs` from the physics-site folder, copy all of it, and paste it into the editor.
4. Click the **Save** icon (the disk).
5. In the bar above the code, choose **setup** from the list of functions, then click **Run**.
6. Google asks for permission. Click **Review permissions**, choose your account, then **Advanced → Go to (project name) (unsafe)**, then **Allow**. The warning appears because you wrote the script yourself; it only gets access to this one spreadsheet.
7. Go back to the Sheet tab. It now has a tab called **Scores** with the column headings.

## 2. Publish it as a web app
1. In the Apps Script tab, click **Deploy → New deployment**.
2. Click the gear icon beside "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. "Anyone" is needed so students can send scores without signing in to Google.
4. Click **Deploy** and copy the **Web app URL**. It looks like `https://script.google.com/macros/s/…/exec`.

## 3. Connect the website
1. Open `js/lightspeed.js` and find this line near the top:
   `const LEADERBOARD_URL = '';`
2. Paste the URL between the quotes, then save the file.
3. Test it in the preview: play one round and check that a row appears in the Sheet and on the leaderboard.
4. Commit and push as usual.

## Looking after it
- **Remove a score** (a rude name, a test round): type anything (for example `x`) in that row's **Hide** cell. It disappears from the leaderboard within about 20 seconds. You can also delete the row.
- **Blocked words:** the script refuses names containing common swear words. You can add more to the `BLOCKED` list in the script. After any change to the script, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**, so the address stays the same.
- **Fair play:** the script refuses impossible scores (more than 3400, or more than 400 per right answer) and only accepts one score per name every 30 seconds. A determined student could still send a fake score that is possible, so treat the board as a bit of fun, and use the Hide column if needed.
- **A fresh start for a new class:** make a copy of the Sheet or clear the rows below the headings. The address doesn't change.
- **Time zone:** "This week" starts on Monday at midnight in the script's time zone. Check it under **Project settings (gear icon) → Time zone** in Apps Script.
