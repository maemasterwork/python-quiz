// تنظیمات اتصال به Supabase
// اگر این دو مقدار خالی باشند، سایت در «حالت آزمایشی» کار می‌کند
// و اطلاعات را فقط در مرورگر ذخیره می‌کند (برای تست ظاهر سایت).
const CONFIG = {
  SUPABASE_URL: "https://rrovviiwgtvyylzbleaj.supabase.co",       // مثال: https://abcdxyz.supabase.co
  SUPABASE_ANON_KEY: "sb_publishable_TYHbdviZqOo9YPSY4hp0og_BxmtLGR9",  // کلید anon / public از Project Settings > API

  // فقط برای حالت آزمایشی (وقتی Supabase وصل نیست):
  DEMO_STUDENTS: {},
  DEMO_ADMIN_CODE: ""   // ورود به admin.html در حالت آزمایشی
};
