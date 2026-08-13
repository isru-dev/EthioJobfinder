import dotenv from 'dotenv';
dotenv.config();
import sendJobAlertToUser from './src/bot/telegramBot'
const TELEGRAM_USER_ID = process.argv[2];
if (!TELEGRAM_USER_ID) {
  console.error('Usage: node testAlert.js <TELEGRAM_USER_ID>');
  process.exit(1);
}

(async () => {
  try {
    await sendJobAlertToUser(TELEGRAM_USER_ID, {
      title: 'Test Job Alert',
      company: 'EthioJobFinder TestCo',
      category: 'Software / IT',
      postUrl: 'https://t.me/example/1',
      contactEmail: 'test@example.com',
      contactPhone: '+251911000000',
    });
    console.log('Test alert sent (check Telegram).');
  } catch (err) {
    console.error('Test alert failed:', err);
  }
})();
