# چند میشه؟ | Chand Mishe? 💱

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK_58-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)

**ابزاری سبک، مدرن و سریع برای محاسبه قیمت خریدهای دلاری شما به تومان یا بالعکس بر اساس نرخ آنلاین یا دستی**

*A lightweight, modern and fast tool to calculate your USD purchase prices in Toman or vice versa based on live or custom rates.*

[فارسی](#fa-راهنمای-فارسی) • [English](#en-english-documentation)

---

</div>

<a name="fa-راهنمای-فارسی"></a>
## 🇮🇷 راهنمای فارسی

### ✨ ویژگی‌های کلیدی

- 🟢 **استعلام آنلاین نرخ لحظه‌ای تتر (دلار آزاد):** دریافت مستقیم و لحظه‌ای قیمت از API تترلند به عنوان منبع اصلی و والکس به عنوان پشتیبان بدون قطعی.
- 🔄 **تبدیل دوطرفه و فوری:** تبدیل دلار به تومان و تومان به دلار با تفکیک سه رقمی ارقام و محاسبه هم‌زمان با تایپ.
- ✍️ **پشتیبانی کامل از نرخ دستی:** امکان ویرایش دستی و تغییر نرخ مبنا در هر لحظه، مناسب برای محاسبات با نرخ‌های شخصی.
- 🛡️ **سیستم هوشمند محافظت از آی‌پی (Anti-Spam):** تایمر خنک‌سازی ۳۰ ثانیه‌ای برای جلوگیری از ارسال درخواست‌های رگباری و مسدود شدن آی‌پی.
- 🌓 **پشتیبانی از تم تیره و روشن (Dark / Light Mode):** طراحی مدرن Glassmorphism با پالت رنگی چشم‌نواز نئونی در دارک‌مود.
- 🌐 **کاملاً دو زبانه (فارسی و انگلیسی):** با تغییر خودکار چیدمان و جهت متن‌ها (RTL / LTR).
- ⚡ **کلیدهای سریع مبالغ خرد:** دسترسی آسان و سریع به مبالغ پرکاربرد ارزی (مثل $0.99, $4.99, $9.99 و...).
- 🕒 **تاریخچه محاسبات:** ذخیره خودکار محاسبات با امکان بازخوانی مجدد، کپی مبالغ و حذف تاریخچه.
- 🔔 **بررسی خودکار بروزرسانی (Auto-Update):** بررسی هوشمند و دریافت نسخه جدید برنامه به صورت مستقیم از گیت‌هاب.

---

### 📱 نحوه دریافت فایل APK

1. **دانلود مستقیم از گیت‌هاب (GitHub Actions):**  
   با هر بار بروزرسانی پروژه، فایل APK به صورت خودکار توسط **GitHub Actions** بیلد شده و در تب [Actions](../../actions) یا بخش [Releases](../../releases) ریپازیتوری برای دانلود در دسترس قرار می‌گیرد.
2. **ساخت ابری از طریق EAS Build:**
   ```bash
   npx eas-cli login
   npx eas-cli build -p android --profile preview
   ```

---

### 💻 اجرای محلی پروژه (Development)

برای اجرای پروژه روی سیستم خود:

```bash
# ۱. کلون کردن ریپازیتوری
git clone https://github.com/AmirNrfox/Chand-Mishe.git
cd Chand-Mishe

# ۲. نصب وابستگی‌ها
npm install

# ۳. اجرای سرور توسعه با اکسپو
npx expo start
```

---

<a name="en-english-documentation"></a>
## 🇬🇧 English Documentation

### ✨ Key Features

- 🟢 **Live USDT / Free USD Rate:** Real-time rate fetching from Tetherland API with automatic fallback to Wallex API.
- 🔄 **Instant Two-Way Conversion:** Real-time conversion from USD to Toman and Toman to USD as you type.
- ✍️ **Manual Custom Rate Input:** Fully editable base rate for offline use or custom calculations.
- 🛡️ **Rate-Limit & Anti-Spam Protection:** 30-second cooldown timer to prevent API IP blocking.
- 🌓 **Dark and Light Modes:** Polished Glassmorphism UI with neon accents.
- 🌐 **Fully Bilingual (FA / EN):** Native RTL/LTR layout transitions.
- ⚡ **Quick Micro-Amounts:** Fast one-tap chips for frequent pricing tiers ($0.99, $4.99, $9.99, etc.).
- 🕒 **Calculation History:** Automatically saves conversions with one-tap copy and reload.
- 🔔 **Auto-Update Notifications:** Built-in version checker connected directly to GitHub repository releases.

---

### 🚀 Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) / [Expo SDK 58](https://expo.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Typography:** [Vazirmatn Font](https://github.com/rastikerdar/vazirmatn)
- **Local Storage:** [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage)
- **Icons:** [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons, MaterialCommunityIcons, FontAwesome)

---

### 👨‍💻 Developer & Author

**طراحی و توسعه توسط امیرعلی نظری**  
*Designed and Developed by AmirAli Nazari*

- 🐙 **GitHub:** [@AmirNrfox](https://github.com/AmirNrfox)
- ✈️ **Telegram:** [@AmirAliNazari2001](https://t.me/AmirAliNazari2001)
- 📧 **Email:** [amirnrfox@gmail.com](mailto:amirnrfox@gmail.com)

---

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
