# Facebook Marketplace Vehicle Monitor

A Node.js automation tool that monitors **Facebook Marketplace vehicle listings** and sends email notifications when **new listings appear**.

The bot continuously scans a Marketplace category (for example vehicles in Victoria, Australia) and alerts you when new listings are posted. It avoids duplicate alerts by tracking previously detected listing IDs.

This project uses:

* Playwright browser automation
* Persistent browser profile for Facebook login
* Gmail SMTP notifications
* Configurable filters for vehicles and price ranges

---

# Features

* Monitors Facebook Marketplace listings automatically
* Detects newly posted vehicles
* Avoids duplicate notifications
* Sends grouped email alerts
* Supports multiple email recipients
* Stores session login so you only log in once
* Uses Git-friendly configuration (no credentials in code)
* Runs continuously with an adjustable scan interval

---

# Project Structure

```
fb-marketplace-monitor/
│
├ monitor.js            Main monitoring script
├ email.js              Email notification module
├ package.json          Node dependencies
├ .env                  Environment variables (not in Git)
├ .env.example          Example configuration file
├ .gitignore            Git ignore rules
│
├ fb-profile/           Persistent browser profile (created automatically)
├ seenListings.json     Stored listing IDs to avoid duplicates
```

---

# Requirements

Install the following software before running the bot:

* Node.js (v18 or newer recommended)
* npm
* Playwright browsers

You can install Node.js from:

https://nodejs.org/

---

# Installation

Clone the repository:

```
git clone https://github.com/abdulqadeeritcs/fb-marketplace-monitor.git
```

Enter the project folder:

```
cd fb-marketplace-monitor
```

Install dependencies:

```
npm install
```

Install Playwright browsers:

```
npx playwright install
```

---

# Environment Configuration

Create a `.env` file in the project root.

Example:

```
GMAIL_USER=yourgmail@gmail.com
GMAIL_PASS=your_gmail_app_password
EMAIL_RECEIVERS=email1@gmail.com,email2@gmail.com
```

Explanation:

| Variable        | Description                              |
| --------------- | ---------------------------------------- |
| GMAIL_USER      | Gmail account used to send alerts        |
| GMAIL_PASS      | Gmail App Password                       |
| EMAIL_RECEIVERS | Comma-separated list of recipient emails |

Important: Use a Gmail **App Password**, not your normal password.

Create it here:

https://myaccount.google.com/apppasswords

---

# Running the Bot

Start the monitoring system:

```
node monitor.js
```

The script will:

1. Open a browser using a persistent profile
2. Load Facebook Marketplace
3. Monitor listings every 80 seconds
4. Detect new vehicles
5. Send email alerts

---

# First Run (Facebook Login)

On the first run:

1. A browser window will open
2. Log into your Facebook account manually
3. The session will be saved in:

```
fb-profile/
```

Future runs will reuse this session and will not require login.

---

# Email Notifications

When new listings are detected, an email is sent containing all new vehicles discovered during that scan.

Example email:

Subject:

```
Marketplace Alert (3 new listings)
```

Body:

```
🚗 New Facebook Marketplace Vehicles

1. Toyota Corolla 2012 $6500
https://facebook.com/marketplace/item/123456

2. Honda Civic 2011 $5800
https://facebook.com/marketplace/item/987654

3. Mazda 3 2014 $7200
https://facebook.com/marketplace/item/456789
```

---

# Scan Interval

The default scan interval is **80 seconds**.

You can change it inside `monitor.js`:

```
await page.waitForTimeout(80000);
```

---

# Running on a Server / VM

Recommended setup:

1. Install Node.js
2. Clone the repository
3. Install dependencies
4. Configure `.env`
5. Run the monitor script

```
node monitor.js
```

For long-running automation, use a process manager such as **PM2**.

Install PM2:

```
npm install -g pm2
```

Start the bot:

```
pm2 start monitor.js
```

PM2 will automatically restart the bot if it crashes.

---

# Security Notes

Do not commit sensitive files to Git:

```
.env
fb-profile/
seenListings.json
node_modules/
```

These are already excluded in `.gitignore`.

---

# Possible Improvements

Future enhancements may include:

* Telegram notifications
* Discord alerts
* SQLite database instead of JSON
* Price filtering
* Vehicle brand filters
* Multi-location monitoring
* GraphQL feed monitoring for faster detection

---

# Disclaimer

This project is for educational and personal automation purposes. Automated access to Facebook services should respect Facebook's terms of service.

---

# License

MIT License
