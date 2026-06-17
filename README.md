# Discord Announcer Bot 📢

بوت ديسكورد يرسل كل رسالة تُكتب في روم محددة كـ DM خاص لجميع أعضاء السيرفر.

## المميزات

- `/setroom` — تحديد الروم المخصصة للإعلانات (للمشرفين فقط)
- `/showroom` — عرض الروم المحددة حالياً
- `/clearroom` — إلغاء تحديد الروم
- دعم `(منشن)` — إذا كتبت `(منشن)` في الرسالة يتم استبدالها بمنشن الشخص المُرسَل إليه
- دعم الايموجيات الخاصة بالسيرفر تلقائياً
- دعم المرفقات والصور
- ✅ ريأكشن على الرسالة الأصلية بعد الإرسال

## طريقة التشغيل على Railway

### 1. ضبط البيئة

انسخ ملف `.env.example` وسمّه `.env`:
```
DISCORD_TOKEN=توكن_البوت_حقك
GUILD_ID=ايدي_السيرفر_حقك
```

> **ملاحظة:** `GUILD_ID` اختياري — إذا حطيته يتسجل الأوامر على السيرفر مباشرة (أسرع)، بدونه تتسجل بشكل global (تاخذ حتى ساعة).

### 2. إنشاء البوت على Discord Developer Portal

1. روح على [discord.com/developers/applications](https://discord.com/developers/applications)
2. اضغط **New Application**
3. روح على **Bot** → اضغط **Add Bot**
4. من نفس صفحة Bot، فعّل هذي الصلاحيات تحت **Privileged Gateway Intents**:
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**
5. انسخ **Token** حق البوت وحطه في `.env`

### 3. دعوة البوت للسيرفر

من صفحة **OAuth2 → URL Generator**، اختر:
- Scopes: `bot`, `applications.commands`
- Bot Permissions:
  - ✅ Read Messages/View Channels
  - ✅ Send Messages
  - ✅ Add Reactions
  - ✅ Read Message History

انسخ الرابط وافتحه لإضافة البوت لسيرفرك.

### 4. النشر على Railway

1. افتح [railway.app](https://railway.app)
2. اضغط **New Project** → **Deploy from GitHub repo**
3. اختر مستودع `discord-announcer-bot`
4. في **Variables**، أضف:
   - `DISCORD_TOKEN`
   - `GUILD_ID`
5. في **Settings → Deploy**, تأكد إن الأمر هو `npm start`
6. اضغط **Deploy**!

## طريقة الاستخدام

1. بعد تشغيل البوت، روح لأي روم في سيرفرك
2. اكتب `/setroom` واختر الروم المخصصة
3. أي رسالة تكتبها في تلك الروم تُرسل تلقائياً كـ DM لجميع الأعضاء!

### مثال على `(منشن)`:
```
مرحباً (منشن)! عندنا اجتماع الساعة 9 الليلة 🎉
```
كل عضو يستلم رسالة فيها منشنه هو.

### الايموجيات الخاصة:
الايموجيات الخاصة بسيرفرك (مثل `<:myemoji:123456789>`) تُرسل تلقائياً وتظهر صح في الـ DM ما دام البوت موجود في نفس السيرفر.
