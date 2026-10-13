/* ==========================================================
   بانک سوال‌ها — ۲۰ سوال، مجموع ۱۰۰ امتیاز
   بخش تئوری: ۱۲ سوال × ۳ امتیاز = ۳۶
   بخش عملی : ۸ سوال × ۸ امتیاز = ۶۴
   برای تغییر سوال‌ها فقط همین فایل را ویرایش کن.
   ========================================================== */

const C = (...lines) => "```\n" + lines.join("\n") + "\n```";

const QUESTIONS = [
  /* ---------------------------- تئوری ---------------------------- */
  {
    id: 1, section: "theory", kind: "mcq", topic: "Types of numbers", points: 3,
    q: "کدام‌یک از مقدارهای زیر در پایتون از نوع **float** (عدد اعشاری) است؟",
    options: ["`7`", "`7.0`", '`"7.0"`', "`True`"],
    answer: 1,
    hint: "عدد اعشاری حتماً «نقطه» دارد؛ ولی اگر داخل نقل‌قول باشد دیگر عدد نیست!",
    explain: '`7` از نوع int است، `"7.0"` چون داخل نقل‌قول است یک رشته (str) است و `True` از نوع bool است. فقط `7.0` یک float است.'
  },
  {
    id: 2, section: "theory", kind: "mcq", topic: "Python Basic Arithmetic", points: 3,
    q: "خروجی کد زیر چیست؟\n" + C("print(2 ** 3 + 10 % 4)"),
    options: ["`10`", "`14`", "`11`", "`8`"],
    answer: 0,
    hint: "اول توان (`**`)، بعد باقیمانده (`%`) و در آخر جمع. عبارت `10 % 4` یعنی باقیمانده‌ی ۱۰ تقسیم بر ۴.",
    explain: "`2 ** 3` می‌شود ۸ و `10 % 4` می‌شود ۲ (چون ۱۰ = ۲×۴ + ۲). پس ۸ + ۲ = ۱۰."
  },
  {
    id: 3, section: "theory", kind: "tf", topic: "Variable Assignments", points: 3,
    q: "نام `2nd_place` یک نام متغیر **معتبر** در پایتون است. (درست یا نادرست؟)",
    answer: false,
    hint: "نام متغیر نمی‌تواند با «رقم» شروع شود.",
    explain: "نام متغیر باید با حرف یا زیرخط `_` شروع شود، نه با رقم. پس `2nd_place` خطا می‌دهد ولی `place_2` درست است."
  },
  {
    id: 4, section: "theory", kind: "mcq", topic: "Strings", points: 3,
    q: "کد زیر چه می‌کند؟\n" + C('s = "cat"', 's[0] = "b"', "print(s)"),
    options: ["`bat` چاپ می‌کند", "خطا (TypeError) می‌دهد", "`bcat` چاپ می‌کند", "`cat` چاپ می‌کند و خطایی نمی‌دهد"],
    answer: 1,
    hint: "رشته‌ها در پایتون «تغییرناپذیر» (immutable) هستند.",
    explain: "نمی‌شود یک حرفِ رشته را با اندیس عوض کرد. باید رشته‌ی تازه بسازی، مثلاً `s = \"b\" + s[1:]`."
  },
  {
    id: 5, section: "theory", kind: "mcq", topic: "String Indexing", points: 3,
    q: "خروجی کد زیر چیست؟\n" + C('s = "python"', "print(s[-2], s[1:4])"),
    options: ["`o yth`", "`h yth`", "`o pyt`", "`n yt`"],
    answer: 0,
    hint: "اندیس منفی از آخر می‌شمارد (`-1` آخرین حرف است). در برش `[1:4]` اندیس ۴ شامل نمی‌شود.",
    explain: "حروف: p(0) y(1) t(2) h(3) o(4) n(5). `s[-2]` همان `o` است و `s[1:4]` یعنی اندیس‌های ۱ تا ۳ یعنی `yth`."
  },
  {
    id: 6, section: "theory", kind: "fill", topic: "Indexing and Slicing Lists", points: 3,
    q: "خروجی کد زیر چیست؟ (جواب را دقیقاً مثل خروجی پایتون بنویس)\n" + C("nums = [10, 20, 30, 40, 50]", "print(nums[1:3])"),
    accept: ["[20, 30]"],
    hint: "اندیس‌ها از صفر شروع می‌شوند و اندیس پایانیِ برش شامل نمی‌شود.",
    explain: "`nums[1:3]` اندیس‌های ۱ و ۲ را برمی‌دارد، یعنی `[20, 30]`. نتیجه‌ی برش یک لیست جدید است."
  },
  {
    id: 7, section: "theory", kind: "mcq", topic: "Constructing Dictionary", points: 3,
    q: "خروجی کد زیر چیست؟\n" + C('d = {"x": 1, "y": 2}', 'd["x"] = 10', 'd["z"] = 3', "print(len(d))"),
    options: ["`2`", "`3`", "`4`", "خطا می‌دهد"],
    answer: 1,
    hint: 'با `d["x"] = 10` فقط مقدار یک کلید موجود عوض می‌شود؛ ولی `d["z"] = 3` یک کلید تازه می‌سازد.',
    explain: "اول دو کلید داریم (x و y). تغییر `x` تعداد را عوض نمی‌کند ولی افزودن `z` کلید سوم را می‌سازد. پس `len(d)` برابر ۳ است."
  },
  {
    id: 8, section: "theory", kind: "mcq", topic: "Constructing Tuples", points: 3,
    q: "کدام گزینه یک **تاپل با دقیقاً یک عضو** می‌سازد؟",
    options: ["`(5)`", "`(5,)`", "`[5]`", "`{5}`"],
    answer: 1,
    hint: "این «ویرگول» است که تاپل می‌سازد، نه پرانتز!",
    explain: "`(5)` فقط خود عدد ۵ است (پرانتز برای دسته‌بندی). برای تاپل تک‌عضوی باید ویرگول بگذاری: `(5,)`. `[5]` لیست و `{5}` مجموعه (set) است."
  },
  {
    id: 9, section: "theory", kind: "mcq", topic: "Booleans • Comparison Operators", points: 3,
    q: "خروجی کد زیر چیست؟\n" + C('print(bool(0), bool("0"), 5 != 5.0)'),
    options: ["`False True False`", "`False False False`", "`True True False`", "`False True True`"],
    answer: 0,
    hint: 'فقط `0`، رشته‌ی خالی `""`، `None` و لیست خالی معادل False هستند. رشته‌ی `"0"` خالی نیست! و ۵ و ۵٫۰ از نظر مقدار برابرند.',
    explain: '`bool(0)` نادرست است؛ `bool("0")` درست است چون رشته خالی نیست؛ و `5 != 5.0` نادرست است چون این دو عدد برابرند.'
  },
  {
    id: 10, section: "theory", kind: "fill", topic: "range function", points: 3,
    q: "خروجی کد زیر چیست؟ (دقیقاً مثل پایتون بنویس)\n" + C("print(list(range(2, 10, 3)))"),
    accept: ["[2, 5, 8]"],
    hint: "`range(شروع, پایان, گام)`: از ۲ شروع کن، هر بار ۳ تا جلو برو و قبل از رسیدن به ۱۰ بایست.",
    explain: "۲ ← ۵ ← ۸ ← (۱۱ که از ۱۰ بیشتر است، پس نمی‌آید). جواب: `[2, 5, 8]`."
  },
  {
    id: 11, section: "theory", kind: "mcq", topic: "for Loops • break, continue statements", points: 3,
    q: "خروجی کد زیر چیست؟\n" + C("for i in range(1, 10):", "    if i == 3:", "        continue", "    if i == 6:", "        break", '    print(i, end=" ")'),
    options: ["`1 2 4 5`", "`1 2 3 4 5`", "`1 2 4 5 6`", "`4 5`"],
    answer: 0,
    hint: "`continue` فقط همین دور را رد می‌کند، ولی `break` کل حلقه را تمام می‌کند.",
    explain: "۳ با `continue` رد می‌شود، و وقتی `i` به ۶ برسد `break` حلقه را قطع می‌کند و ۶ چاپ نمی‌شود. پس `1 2 4 5`."
  },
  {
    id: 12, section: "theory", kind: "mcq", topic: "Methods", points: 3,
    q: "خروجی کد زیر چیست؟\n" + C('text = "a-b-c"', 'print(text.split("-"))'),
    options: ["`['a', 'b', 'c']`", "`abc`", "`['a-b-c']`", "`('a', 'b', 'c')`"],
    answer: 0,
    hint: "متد `split` رشته را از هر جا که جداکننده را ببیند می‌شکند و یک «لیست» برمی‌گرداند.",
    explain: '`split("-")` رشته را از روی خط‌تیره تکه‌تکه می‌کند و لیست `[\'a\', \'b\', \'c\']` می‌دهد.'
  },

  /* ----------------------------- عملی ----------------------------- */
  {
    id: 13, section: "code", kind: "code", topic: "Python Basic Arithmetic • Variable Assignments", points: 8,
    q: "دو متغیر `a` و `b` (عدد صحیح) از قبل ساخته شده‌اند. کدی بنویس که در **سه خط جدا** این‌ها را چاپ کند:\n۱) خارج‌قسمت صحیح `a` تقسیم بر `b`\n۲) باقیمانده‌ی `a` تقسیم بر `b`\n۳) `a` به توان `b`",
    tests: ["a = 17\nb = 5", "a = 20\nb = 3", "a = 9\nb = 2", "a = 100\nb = 7"],
    ref: "print(a // b)\nprint(a % b)\nprint(a ** b)",
    hint: "سه تا `print` بنویس. تقسیم صحیح `//`، باقیمانده `%` و توان `**` است.",
    explain: "هر کدام از سه عملگر را داخل یک `print` جدا بگذار."
  },
  {
    id: 14, section: "code", kind: "code", topic: "Strings • Printing a String", points: 8,
    q: "متغیرهای `name` (اسم) و `age` (سن) از قبل ساخته شده‌اند. با یک `print` این جمله را چاپ کن (به‌جای Sara و 13 مقدار متغیرها بیاید):\n" + C("Hi Sara! You are 13 years old.") + "\nفاصله‌ها و علامت‌ها باید دقیقاً مثل نمونه باشند.",
    tests: ['name = "Sara"\nage = 13', 'name = "Ali"\nage = 12', 'name = "Mina"\nage = 14'],
    ref: 'print(f"Hi {name}! You are {age} years old.")',
    hint: 'از f-string استفاده کن: `f"Hi {name}!"`. یا رشته‌ها را با `+` بچسبان (و `str(age)` را فراموش نکن).',
    explain: "f-string ساده‌ترین راه است: `print(f\"Hi {name}! You are {age} years old.\")`."
  },
  {
    id: 15, section: "code", kind: "code", topic: "Constructing Lists • Indexing and Slicing Lists", points: 8,
    q: "لیست `nums` از قبل ساخته شده (حداقل ۳ عضو دارد). به ترتیب، در **چهار خط جدا** چاپ کن:\n۱) اولین عضو\n۲) آخرین عضو\n۳) لیست بدون اولین و آخرین عضو (با برش)\n۴) عدد `99` را به انتهای `nums` اضافه کن و بعد کل `nums` را چاپ کن.",
    tests: ["nums = [10, 20, 30, 40, 50]", "nums = [5, 6, 7]", "nums = [1, 2, 3, 4]", "nums = [8, 3, 9, 1, 4, 7]"],
    ref: "print(nums[0])\nprint(nums[-1])\nprint(nums[1:-1])\nnums.append(99)\nprint(nums)",
    hint: "اولین عضو `nums[0]` و آخرینش `nums[-1]` است. برش وسط: `nums[1:-1]`. برای اضافه کردن از متد `append` استفاده کن.",
    explain: "`nums[0]`، `nums[-1]`، `nums[1:-1]`، سپس `nums.append(99)` و چاپ `nums`."
  },
  {
    id: 16, section: "code", kind: "code", topic: "Constructing Dictionary", points: 8,
    q: "دیکشنری `student` از قبل ساخته شده (کلیدهای `name` و `score` دارد). به ترتیب:\n۱) مقدار `score` را چاپ کن.\n۲) مقدار `score` را به `20` تغییر بده.\n۳) کلید جدید `passed` را با مقدار `True` اضافه کن.\n۴) در آخر کل دیکشنری `student` را چاپ کن.",
    tests: ['student = {"name": "Mina", "score": 18}', 'student = {"name": "Reza", "score": 15}', 'student = {"name": "Sara", "score": 12}'],
    ref: 'print(student["score"])\nstudent["score"] = 20\nstudent["passed"] = True\nprint(student)',
    hint: 'مقدار یک کلید را با `student["score"]` می‌خوانی و با `student["score"] = 20` عوض می‌کنی. کلید تازه هم همین‌طور ساخته می‌شود.',
    explain: 'با `student["کلید"] = مقدار` هم می‌شود مقدار قدیمی را عوض کرد و هم کلید تازه ساخت.'
  },
  {
    id: 17, section: "code", kind: "code", topic: "Comparison Operators • if, elif, else Statements", points: 8,
    q: "متغیر `score` (نمره) از قبل ساخته شده. با `if / elif / else` این را چاپ کن:\n• اگر `score` برابر ۹۰ یا بیشتر بود: `Excellent`\n• اگر ۷۰ یا بیشتر (ولی کمتر از ۹۰) بود: `Good`\n• در غیر این صورت: `Try again`",
    tests: ["score = 95", "score = 90", "score = 89", "score = 70", "score = 69", "score = 0"],
    ref: 'if score >= 90:\n    print("Excellent")\nelif score >= 70:\n    print("Good")\nelse:\n    print("Try again")',
    hint: "اول شرط بزرگ‌تر را بررسی کن (`score >= 90`)، بعد با `elif` سراغ شرط ۷۰ برو. فراموش نکن بعد از هر شرط `:` بگذاری و داخلش را تو‌رفتگی بدهی.",
    explain: "ترتیب شرط‌ها مهم است: پایتون از بالا شرط‌ها را می‌خواند و اولین شرطی که درست باشد اجرا می‌شود."
  },
  {
    id: 18, section: "code", kind: "code", topic: "for Loops • range function", points: 8,
    q: "متغیر `n` (عدد صحیح مثبت) از قبل ساخته شده. با حلقه‌ی `for` و `range` همه‌ی عددهای **زوج** از ۱ تا `n` (اگر خود `n` زوج بود، آن هم) را هر کدام در یک خط چاپ کن. در آخر **مجموع** همین عددهای زوج را چاپ کن. (اگر عدد زوجی نبود فقط `0` چاپ شود.)",
    tests: ["n = 10", "n = 7", "n = 1", "n = 2", "n = 15"],
    ref: "total = 0\nfor i in range(2, n + 1, 2):\n    print(i)\n    total += i\nprint(total)",
    hint: "`range(2, n + 1, 2)` از ۲ شروع می‌کند و دو تا دو تا جلو می‌رود. یک متغیر `total = 0` بساز و در هر دور به آن اضافه کن.",
    explain: "گام ۲ در `range` فقط عددهای زوج را می‌دهد و `n + 1` باعث می‌شود خود `n` هم بررسی شود."
  },
  {
    id: 19, section: "code", kind: "code", topic: "break, continue statements • range function", points: 8,
    q: "متغیر `limit` از قبل ساخته شده. با `for i in range(1, 31):` عددها را بررسی کن:\n• اگر `i` از `limit` **بزرگ‌تر** شد، حلقه را با `break` تمام کن.\n• اگر `i` مضرب ۳ بود، با `continue` از آن بگذر.\n• در غیر این صورت `i` را چاپ کن.",
    tests: ["limit = 10", "limit = 4", "limit = 25", "limit = 40", "limit = 7"],
    ref: "for i in range(1, 31):\n    if i > limit:\n        break\n    if i % 3 == 0:\n        continue\n    print(i)",
    hint: "مضرب ۳ بودن یعنی `i % 3 == 0`. اول شرط `break` و بعد شرط `continue` را بنویس و آخر حلقه `print(i)` بگذار.",
    explain: "`break` کل حلقه را قطع می‌کند و `continue` فقط همین دور را رد می‌کند."
  },
  {
    id: 20, section: "code", kind: "code", topic: "while Loops", points: 8,
    q: "متغیر `start` (عدد صحیح مثبت) از قبل ساخته شده. با یک حلقه‌ی `while` شمارش معکوس از `start` تا `1` را چاپ کن (هر عدد در یک خط) و در آخر کلمه‌ی `Go!` را چاپ کن.",
    tests: ["start = 5", "start = 3", "start = 1", "start = 8"],
    ref: 'while start >= 1:\n    print(start)\n    start -= 1\nprint("Go!")',
    hint: "شرط حلقه را `start >= 1` بگذار و داخل حلقه بعد از چاپ، `start` را یکی کم کن (`start -= 1`) تا حلقه تمام شود. بعد از حلقه `Go!` را چاپ کن.",
    explain: "اگر `start` را داخل حلقه کم نکنی، حلقه هرگز تمام نمی‌شود (حلقه‌ی بی‌پایان!)."
  }
];
