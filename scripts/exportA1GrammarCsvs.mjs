import fs from "fs";
import path from "path";

function word(thai, english, tone, grammar = false) {
  return grammar ? { thai, english, tone, grammar: true } : { thai, english, tone };
}

function row(thai, romanization, english, breakdown, difficulty = "easy") {
  return { thai, romanization, english, breakdown, difficulty };
}

const A1_GRAMMAR_ROWS = {
  "name-chue": [
    row("ฉันชื่อมิน", "chan chue Min", "My name is Min.", [
      word("ฉัน", "I", "rising"),
      word("ชื่อ", "name", "falling", true),
      word("มิน", "Min", "mid"),
    ]),
    row("เขาชื่อดาว", "khao chue Dao", "Her name is Dao.", [
      word("เขา", "he / she", "rising"),
      word("ชื่อ", "name", "falling", true),
      word("ดาว", "Dao", "mid"),
    ]),
    row("คุณชื่ออะไร", "khun chue arai", "What is your name?", [
      word("คุณ", "you", "mid"),
      word("ชื่อ", "name", "falling", true),
      word("อะไร", "what", "mid", true),
    ]),
  ],
  "natural-address-pronouns": [
    row("ผมชื่อโต้งครับ", "phom chue Tong khrap", "My name is Tong. (male speaker)", [
      word("ผม", "I (male)", "rising", true),
      word("ชื่อ", "name", "falling", true),
      word("โต้ง", "Tong", "falling"),
      word("ครับ", "polite particle", "high", true),
    ]),
    row("พี่ไปก่อนนะ", "phi pai kon na", "I'll go first, okay.", [
      word("พี่", "I / older person", "falling", true),
      word("ไป", "go", "mid"),
      word("ก่อน", "first / before", "mid"),
      word("นะ", "softening particle", "high", true),
    ]),
    row("ไปก่อนนะ", "pai kon na", "I'm heading off first, okay.", [
      word("ไป", "go", "mid"),
      word("ก่อน", "first / before", "mid"),
      word("นะ", "softening particle", "high", true),
    ]),
    row("หนูไม่กินเผ็ดค่ะ", "nu mai kin phet kha", "I don't eat spicy food. (younger/female speaker)", [
      word("หนู", "I (younger speaker)", "rising", true),
      word("ไม่", "not", "low", true),
      word("กิน", "eat", "mid"),
      word("เผ็ด", "spicy", "low"),
      word("ค่ะ", "polite particle", "falling", true),
    ]),
  ],
  "question-mai": [
    row("คุณว่างไหม", "khun wang mai", "Are you free?", [
      word("คุณ", "you", "mid"),
      word("ว่าง", "free", "falling"),
      word("ไหม", "question marker", "rising", true),
    ]),
    row("เขาอยู่บ้านไหม", "khao yu ban mai", "Is he at home?", [
      word("เขา", "he / she", "rising"),
      word("อยู่", "be located", "low", true),
      word("บ้าน", "home", "falling"),
      word("ไหม", "question marker", "rising", true),
    ]),
    row("วันนี้ร้อนไหม", "wanni ron mai", "Is it hot today?", [
      word("วันนี้", "today", "high"),
      word("ร้อน", "hot", "high"),
      word("ไหม", "question marker", "rising", true),
    ]),
  ],
  "question-words": [
    row("ห้องน้ำอยู่ที่ไหน", "hongnam yu thinai", "Where is the bathroom?", [
      word("ห้องน้ำ", "bathroom", "falling"),
      word("อยู่", "be located", "low", true),
      word("ที่ไหน", "where", "falling", true),
    ]),
    row("นี่อะไร", "ni arai", "What is this?", [
      word("นี่", "this", "high"),
      word("อะไร", "what", "mid", true),
    ]),
    row("ใครอยู่บ้าน", "khrai yu ban", "Who is at home?", [
      word("ใคร", "who", "mid", true),
      word("อยู่", "be located", "low", true),
      word("บ้าน", "home", "falling"),
    ]),
  ],
  "polite-particles": [
    row("ขอบคุณครับ", "khopkhun khrap", "Thank you. (male speaker)", [
      word("ขอบคุณ", "thank you", "low"),
      word("ครับ", "polite particle", "high", true),
    ]),
    row("สวัสดีค่ะ", "sawatdi kha", "Hello. (female speaker)", [
      word("สวัสดี", "hello", "mid"),
      word("ค่ะ", "polite particle", "falling", true),
    ]),
    row("ไม่เป็นไรค่ะ", "maipenrai kha", "It's okay. (female speaker)", [
      word("ไม่เป็นไร", "it's okay", "mid"),
      word("ค่ะ", "polite particle", "falling", true),
    ]),
  ],
  adjectives: [
    row("อาหารอร่อย", "ahan aroi", "The food is delicious.", [
      word("อาหาร", "food", "rising"),
      word("อร่อย", "delicious", "low"),
    ]),
    row("ห้องใหญ่", "hong yai", "The room is big.", [
      word("ห้อง", "room", "falling"),
      word("ใหญ่", "big", "low"),
    ]),
    row("กาแฟร้อน", "kafae ron", "The coffee is hot.", [
      word("กาแฟ", "coffee", "mid"),
      word("ร้อน", "hot", "high"),
    ]),
  ],
  "identity-pen": [
    row("เขาเป็นครู", "khao pen khru", "He is a teacher.", [
      word("เขา", "he / she", "rising"),
      word("เป็น", "to be", "mid", true),
      word("ครู", "teacher", "mid"),
    ]),
    row("ฉันเป็นนักเรียน", "chan pen nakrian", "I am a student.", [
      word("ฉัน", "I", "rising"),
      word("เป็น", "to be", "mid", true),
      word("นักเรียน", "student", "mid"),
    ]),
    row("นี่เป็นร้านกาแฟ", "ni pen rankafae", "This is a coffee shop.", [
      word("นี่", "this", "high"),
      word("เป็น", "to be", "mid", true),
      word("ร้านกาแฟ", "coffee shop", "mid"),
    ]),
  ],
  "not-identity-mai-chai": [
    row("เขาไม่ใช่หมอ", "khao maichai mo", "He is not a doctor.", [
      word("เขา", "he / she", "rising"),
      word("ไม่ใช่", "is not / not be", "falling", true),
      word("หมอ", "doctor", "rising"),
    ]),
    row("นี่ไม่ใช่น้ำ", "ni maichai nam", "This is not water.", [
      word("นี่", "this", "high"),
      word("ไม่ใช่", "is not / not be", "falling", true),
      word("น้ำ", "water", "high"),
    ]),
    row("ฉันไม่ใช่ครู", "chan maichai khru", "I am not a teacher.", [
      word("ฉัน", "I", "rising"),
      word("ไม่ใช่", "is not / not be", "falling", true),
      word("ครู", "teacher", "mid"),
    ]),
  ],
  "origin-maa-jaak": [
    row("ฉันมาจากไทย", "chan machak Thai", "I am from Thailand.", [
      word("ฉัน", "I", "rising"),
      word("มาจาก", "come from", "mid", true),
      word("ไทย", "Thailand", "mid"),
    ]),
    row("เขามาจากญี่ปุ่น", "khao machak Yipun", "He is from Japan.", [
      word("เขา", "he / she", "rising"),
      word("มาจาก", "come from", "mid", true),
      word("ญี่ปุ่น", "Japan", "high"),
    ]),
    row("คุณมาจากไหน", "khun machak nai", "Where are you from?", [
      word("คุณ", "you", "mid"),
      word("มาจาก", "come from", "mid", true),
      word("ไหน", "where", "rising", true),
    ]),
  ],
  "location-yuu": [
    row("แม่อยู่บ้าน", "mae yu ban", "Mom is at home.", [
      word("แม่", "mom", "falling"),
      word("อยู่", "be located", "low", true),
      word("บ้าน", "home", "falling"),
    ]),
    row("พ่ออยู่โรงเรียน", "pho yu rongrian", "Dad is at school.", [
      word("พ่อ", "dad", "falling"),
      word("อยู่", "be located", "low", true),
      word("โรงเรียน", "school", "mid"),
    ]),
    row("เขาอยู่กรุงเทพฯ", "khao yu Krungthep", "He is in Bangkok.", [
      word("เขา", "he / she", "rising"),
      word("อยู่", "be located", "low", true),
      word("กรุงเทพฯ", "Bangkok", "mid"),
    ]),
  ],
  "place-words": [
    row("แมวอยู่ใต้โต๊ะ", "maeo yu tai to", "The cat is under the table.", [
      word("แมว", "cat", "mid"),
      word("อยู่", "be located", "low", true),
      word("ใต้", "under", "falling", true),
      word("โต๊ะ", "table", "falling"),
    ]),
    row("โทรศัพท์อยู่บนเตียง", "thorasap yu bon tiang", "The phone is on the bed.", [
      word("โทรศัพท์", "phone", "high"),
      word("อยู่", "be located", "low", true),
      word("บน", "on", "mid", true),
      word("เตียง", "bed", "mid"),
    ]),
    row("กระเป๋าอยู่ในรถ", "krapao yu nai rot", "The bag is in the car.", [
      word("กระเป๋า", "bag", "mid"),
      word("อยู่", "be located", "low", true),
      word("ใน", "in", "mid", true),
      word("รถ", "car", "high"),
    ]),
  ],
  "have-mii": [
    row("ฉันมีแมว", "chan mi maeo", "I have a cat.", [
      word("ฉัน", "I", "rising"),
      word("มี", "have", "mid", true),
      word("แมว", "cat", "mid"),
    ]),
    row("ที่นี่มีกาแฟ", "thini mi kafae", "There is coffee here.", [
      word("ที่นี่", "here", "high"),
      word("มี", "there is / have", "mid", true),
      word("กาแฟ", "coffee", "mid"),
    ]),
    row("บ้านนี้มีสวน", "ban ni mi suan", "This house has a garden.", [
      word("บ้าน", "house", "falling"),
      word("นี้", "this", "high", true),
      word("มี", "have", "mid", true),
      word("สวน", "garden", "rising"),
    ]),
  ],
  "no-have-mai-mii": [
    row("ฉันไม่มีรถ", "chan maimi rot", "I do not have a car.", [
      word("ฉัน", "I", "rising"),
      word("ไม่มี", "do not have / there is not", "mid", true),
      word("รถ", "car", "high"),
    ]),
    row("วันนี้ไม่มีเวลา", "wanni maimi wela", "There is no time today.", [
      word("วันนี้", "today", "high"),
      word("ไม่มี", "there is not / do not have", "mid", true),
      word("เวลา", "time", "mid"),
    ]),
    row("ที่นี่ไม่มีชา", "thini maimi cha", "There is no tea here.", [
      word("ที่นี่", "here", "high"),
      word("ไม่มี", "there is not", "mid", true),
      word("ชา", "tea", "mid"),
    ]),
  ],
  "this-that": [
    row("หนังสือนี้ดี", "nangsue ni di", "This book is good.", [
      word("หนังสือ", "book", "rising"),
      word("นี้", "this", "high", true),
      word("ดี", "good", "mid"),
    ]),
    row("ร้านนั้นปิด", "ran nan pit", "That shop is closed.", [
      word("ร้าน", "shop", "high"),
      word("นั้น", "that", "falling", true),
      word("ปิด", "closed", "low"),
    ]),
    row("คนโน้นสูง", "khon non sung", "That person over there is tall.", [
      word("คน", "person", "mid"),
      word("โน้น", "that over there", "high", true),
      word("สูง", "tall", "rising"),
    ]),
  ],
  "possession-khong": [
    row("กระเป๋านี้เป็นของฉัน", "krapao ni pen khong chan", "This bag is mine.", [
      word("กระเป๋า", "bag", "mid"),
      word("นี้", "this", "high", true),
      word("เป็น", "be", "mid", true),
      word("ของ", "of / belonging to", "rising", true),
      word("ฉัน", "me / my", "rising"),
    ]),
    row("นี่คือรถของเขา", "ni khue rot khong khao", "This is his car.", [
      word("นี่", "this", "high"),
      word("คือ", "is", "mid", true),
      word("รถ", "car", "high"),
      word("ของ", "of", "rising", true),
      word("เขา", "him / his", "rising"),
    ]),
    row("หนังสือของครูอยู่ที่นี่", "nangsue khong khru yu thini", "The teacher's book is here.", [
      word("หนังสือ", "book", "rising"),
      word("ของ", "of", "rising", true),
      word("ครู", "teacher", "mid"),
      word("อยู่", "be located", "low", true),
      word("ที่นี่", "here", "high"),
    ]),
  ],
  "want-yaak": [
    row("ฉันอยากกินข้าว", "chan yak kin khao", "I want to eat rice.", [
      word("ฉัน", "I", "rising"),
      word("อยาก", "want to", "low", true),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
    ]),
    row("เขาอยากไปตลาด", "khao yak pai talat", "He wants to go to the market.", [
      word("เขา", "he / she", "rising"),
      word("อยาก", "want to", "low", true),
      word("ไป", "go", "mid"),
      word("ตลาด", "market", "low"),
    ]),
    row("เราอยากพัก", "rao yak phak", "We want to rest.", [
      word("เรา", "we", "mid"),
      word("อยาก", "want to", "low", true),
      word("พัก", "rest", "high"),
    ]),
  ],
  "request-khor": [
    row("ขอน้ำหน่อย", "kho nam noi", "Could I have some water, please?", [
      word("ขอ", "request", "rising", true),
      word("น้ำ", "water", "high"),
      word("หน่อย", "please / a little", "low", true),
    ]),
    row("ขอใบเสร็จหน่อย", "kho baiset noi", "Could I have the receipt, please?", [
      word("ขอ", "request", "rising", true),
      word("ใบเสร็จ", "receipt", "falling"),
      word("หน่อย", "please / a little", "low", true),
    ]),
    row("ขอถามหน่อย", "kho tham noi", "May I ask something?", [
      word("ขอ", "request", "rising", true),
      word("ถาม", "ask", "rising"),
      word("หน่อย", "please / a little", "low", true),
    ]),
  ],
  classifiers: [
    row("ฉันมีหนังสือสองเล่ม", "chan mi nangsue song lem", "I have two books.", [
      word("ฉัน", "I", "rising"),
      word("มี", "have", "mid", true),
      word("หนังสือ", "book", "rising"),
      word("สอง", "two", "rising"),
      word("เล่ม", "classifier", "falling", true),
    ]),
    row("ขอชาหนึ่งแก้ว", "kho cha nueng kaeo", "One tea, please.", [
      word("ขอ", "request", "rising", true),
      word("ชา", "tea", "mid"),
      word("หนึ่ง", "one", "low"),
      word("แก้ว", "classifier", "falling", true),
    ]),
    row("บ้านนี้มีหมาสามตัว", "ban ni mi ma sam tua", "This house has three dogs.", [
      word("บ้าน", "house", "falling"),
      word("นี้", "this", "high", true),
      word("มี", "have", "mid", true),
      word("หมา", "dog", "rising"),
      word("สาม", "three", "rising"),
      word("ตัว", "classifier", "mid", true),
    ]),
  ],
  "price-thaorai": [
    row("อันนี้เท่าไร", "anni thaorai", "How much is this?", [
      word("อันนี้", "this one", "high"),
      word("เท่าไร", "how much", "falling", true),
    ]),
    row("กาแฟแก้วนี้เท่าไร", "kafae kaeo ni thaorai", "How much is this cup of coffee?", [
      word("กาแฟ", "coffee", "mid"),
      word("แก้ว", "cup / classifier", "falling", true),
      word("นี้", "this", "high", true),
      word("เท่าไร", "how much", "falling", true),
    ]),
    row("ข้าวจานนี้เท่าไร", "khao chan ni thaorai", "How much is this plate of rice?", [
      word("ข้าว", "rice / meal", "falling"),
      word("จาน", "plate / classifier", "mid", true),
      word("นี้", "this", "high", true),
      word("เท่าไร", "how much", "falling", true),
    ]),
  ],
  "time-expressions": [
    row("ฉันไปตลาดวันนี้", "chan pai talat wanni", "I go to the market today.", [
      word("ฉัน", "I", "rising"),
      word("ไป", "go", "mid"),
      word("ตลาด", "market", "low"),
      word("วันนี้", "today", "high", true),
    ]),
    row("ตอนนี้เขาอยู่บ้าน", "tonni khao yu ban", "He is at home now.", [
      word("ตอนนี้", "now", "falling", true),
      word("เขา", "he / she", "rising"),
      word("อยู่", "be located", "low", true),
      word("บ้าน", "home", "falling"),
    ]),
    row("พรุ่งนี้เราจะไปโรงเรียน", "phrungni rao cha pai rongrian", "Tomorrow we will go to school.", [
      word("พรุ่งนี้", "tomorrow", "falling", true),
      word("เรา", "we", "mid"),
      word("จะ", "will", "low", true),
      word("ไป", "go", "mid"),
      word("โรงเรียน", "school", "mid"),
    ]),
  ],
  imperatives: [
    row("กินเลย", "kin loei", "Go ahead and eat.", [
      word("กิน", "eat", "mid"),
      word("เลย", "go ahead / right away", "mid", true),
    ]),
    row("ไปกันเถอะ", "pai kan thoe", "Let's go.", [
      word("ไป", "go", "mid"),
      word("กัน", "together / let's", "mid", true),
      word("เถอะ", "suggestion particle", "mid", true),
    ]),
    row("นั่งก่อน", "nang kon", "Sit first.", [
      word("นั่ง", "sit", "falling"),
      word("ก่อน", "first", "low", true),
    ]),
  ],
  "negative-imperative-ya": [
    row("อย่าลืมกระเป๋า", "ya luem krapao", "Don't forget your bag.", [
      word("อย่า", "don't", "low", true),
      word("ลืม", "forget", "mid"),
      word("กระเป๋า", "bag", "mid"),
    ]),
    row("อย่าพูดดัง", "ya phut dang", "Don't speak loudly.", [
      word("อย่า", "don't", "low", true),
      word("พูด", "speak", "falling"),
      word("ดัง", "loudly / loud", "mid"),
    ]),
    row("อย่าไปสาย", "ya pai sai", "Don't be late.", [
      word("อย่า", "don't", "low", true),
      word("ไป", "go / become", "mid"),
      word("สาย", "late", "rising"),
    ]),
  ],
  "future-ja": [
    row("ฉันจะไปตลาด", "chan cha pai talat", "I will go to the market.", [
      word("ฉัน", "I", "rising"),
      word("จะ", "will", "low", true),
      word("ไป", "go", "mid"),
      word("ตลาด", "market", "low"),
    ]),
    row("เขาจะมาพรุ่งนี้", "khao cha ma phrungni", "He will come tomorrow.", [
      word("เขา", "he / she", "rising"),
      word("จะ", "will", "low", true),
      word("มา", "come", "mid"),
      word("พรุ่งนี้", "tomorrow", "falling"),
    ]),
    row("เราจะกินข้าวที่บ้าน", "rao cha kin khao thi ban", "We will eat at home.", [
      word("เรา", "we", "mid"),
      word("จะ", "will", "low", true),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
      word("ที่บ้าน", "at home", "falling"),
    ]),
  ],
  "can-dai": [
    row("ฉันพูดไทยได้", "chan phut thai dai", "I can speak Thai.", [
      word("ฉัน", "I", "rising"),
      word("พูด", "speak", "falling"),
      word("ไทย", "Thai", "mid"),
      word("ได้", "can", "falling", true),
    ]),
    row("เขาว่ายน้ำได้", "khao wai nam dai", "He can swim.", [
      word("เขา", "he / she", "rising"),
      word("ว่ายน้ำ", "swim", "falling"),
      word("ได้", "can", "falling", true),
    ]),
    row("คุณอ่านไทยได้ไหม", "khun an thai dai mai", "Can you read Thai?", [
      word("คุณ", "you", "mid"),
      word("อ่าน", "read", "low"),
      word("ไทย", "Thai", "mid"),
      word("ได้", "can", "falling", true),
      word("ไหม", "question marker", "rising", true),
    ]),
  ],
  "very-maak": [
    row("วันนี้ร้อนมาก", "wanni ron mak", "It is very hot today.", [
      word("วันนี้", "today", "high"),
      word("ร้อน", "hot", "high"),
      word("มาก", "very", "falling", true),
    ]),
    row("กาแฟหวานมาก", "kafae wan mak", "The coffee is very sweet.", [
      word("กาแฟ", "coffee", "mid"),
      word("หวาน", "sweet", "rising"),
      word("มาก", "very", "falling", true),
    ]),
    row("ชานี้หวานน้อย", "cha ni wan noi", "This tea is not very sweet.", [
      word("ชา", "tea", "mid"),
      word("นี้", "this", "high", true),
      word("หวาน", "sweet", "rising"),
      word("น้อย", "a little / not much", "high", true),
    ]),
  ],
  "go-come-pai-maa": [
    row("ฉันไปโรงเรียน", "chan pai rongrian", "I go to school.", [
      word("ฉัน", "I", "rising"),
      word("ไป", "go", "mid", true),
      word("โรงเรียน", "school", "mid"),
    ]),
    row("เขามาที่นี่", "khao ma thini", "He comes here.", [
      word("เขา", "he / she", "rising"),
      word("มา", "come", "mid", true),
      word("ที่นี่", "here", "high"),
    ]),
    row("เราไปตลาด", "rao pai talat", "We go to the market.", [
      word("เรา", "we", "mid"),
      word("ไป", "go", "mid", true),
      word("ตลาด", "market", "low"),
    ]),
  ],
  "progressive-kamlang": [
    row("ฉันกำลังกินข้าว", "chan kamlang kin khao", "I am eating.", [
      word("ฉัน", "I", "rising"),
      word("กำลัง", "currently", "mid", true),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
    ]),
    row("เขากำลังอ่านหนังสือ", "khao kamlang an nangsue", "He is reading a book.", [
      word("เขา", "he / she", "rising"),
      word("กำลัง", "currently", "mid", true),
      word("อ่าน", "read", "low"),
      word("หนังสือ", "book", "rising"),
    ]),
    row("เรากำลังรอรถ", "rao kamlang ro rot", "We are waiting for the bus.", [
      word("เรา", "we", "mid"),
      word("กำลัง", "currently", "mid", true),
      word("รอ", "wait", "mid"),
      word("รถ", "bus / vehicle", "high"),
    ]),
  ],
  "experience-koey": [
    row("ฉันเคยไปเชียงใหม่", "chan koei pai Chiang Mai", "I have been to Chiang Mai.", [
      word("ฉัน", "I", "rising"),
      word("เคย", "have ever", "mid", true),
      word("ไป", "go", "mid"),
      word("เชียงใหม่", "Chiang Mai", "mid"),
    ]),
    row("เขาเคยกินทุเรียน", "khao koei kin thurian", "He has eaten durian before.", [
      word("เขา", "he / she", "rising"),
      word("เคย", "have ever", "mid", true),
      word("กิน", "eat", "mid"),
      word("ทุเรียน", "durian", "mid"),
    ]),
    row("คุณเคยมาที่นี่ไหม", "khun koei ma thini mai", "Have you been here before?", [
      word("คุณ", "you", "mid"),
      word("เคย", "have ever", "mid", true),
      word("มา", "come", "mid"),
      word("ที่นี่", "here", "high"),
      word("ไหม", "question marker", "rising", true),
    ]),
  ],
  "conjunction-and-but": [
    row("ฉันกินข้าวและดื่มน้ำ", "chan kin khao lae duem nam", "I eat rice and drink water.", [
      word("ฉัน", "I", "rising"),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
      word("และ", "and", "mid", true),
      word("ดื่ม", "drink", "low"),
      word("น้ำ", "water", "high"),
    ]),
    row("คุณจะเอาชาหรือกาแฟ", "khun cha ao cha rue kafae", "Will you take tea or coffee?", [
      word("คุณ", "you", "mid"),
      word("จะ", "will", "low", true),
      word("เอา", "take / want", "mid"),
      word("ชา", "tea", "mid"),
      word("หรือ", "or", "rising", true),
      word("กาแฟ", "coffee", "mid"),
    ]),
    row("ฉันอยากไปแต่ไม่มีเวลา", "chan yak pai tae maimi wela", "I want to go, but I do not have time.", [
      word("ฉัน", "I", "rising"),
      word("อยาก", "want to", "low"),
      word("ไป", "go", "mid"),
      word("แต่", "but", "low", true),
      word("ไม่มี", "do not have", "mid"),
      word("เวลา", "time", "mid"),
    ]),
  ],
  "because-phraw": [
    row("ฉันไม่ไปเพราะฝนตก", "chan mai pai phro fon tok", "I am not going because it is raining.", [
      word("ฉัน", "I", "rising"),
      word("ไม่", "not", "low", true),
      word("ไป", "go", "mid"),
      word("เพราะ", "because", "high", true),
      word("ฝน", "rain", "rising"),
      word("ตก", "fall / rain", "low"),
    ]),
    row("เขายิ้มเพราะดีใจ", "khao yim phro dichai", "He smiles because he is happy.", [
      word("เขา", "he / she", "rising"),
      word("ยิ้ม", "smile", "high"),
      word("เพราะ", "because", "high", true),
      word("ดีใจ", "happy / glad", "mid"),
    ]),
    row("ร้านปิดเพราะดึกแล้ว", "ran pit phro duek laeo", "The shop is closed because it is late.", [
      word("ร้าน", "shop", "high"),
      word("ปิด", "closed", "low"),
      word("เพราะ", "because", "high", true),
      word("ดึก", "late at night", "low"),
      word("แล้ว", "already", "high", true),
    ]),
  ],
};

const A2_GRAMMAR_ROWS = {
  "past-laew": [
    row("ฉันกินข้าวแล้ว", "chan kin khao laeo", "I have already eaten.", [
      word("ฉัน", "I", "rising"),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
      word("แล้ว", "already", "high", true),
    ]),
    row("เขากลับบ้านแล้ว", "khao klap ban laeo", "He has already gone home.", [
      word("เขา", "he / she", "rising"),
      word("กลับ", "return", "low"),
      word("บ้าน", "home", "falling"),
      word("แล้ว", "already", "high", true),
    ]),
  ],
  "recent-past-phoeng": [
    row("ฉันเพิ่งกินข้าว", "chan phoeng kin khao", "I just ate.", [
      word("ฉัน", "I", "rising"),
      word("เพิ่ง", "just recently", "falling", true),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
    ]),
    row("เขาเพิ่งมาถึง", "khao phoeng ma thueng", "He just arrived.", [
      word("เขา", "he / she", "rising"),
      word("เพิ่ง", "just recently", "falling", true),
      word("มา", "come", "mid"),
      word("ถึง", "arrive", "rising"),
    ]),
  ],
  "duration-penwela-manan": [
    row("เขาอยู่ที่นี่มานานแล้ว", "khao yu thini ma nan laeo", "He has been here for a long time.", [
      word("เขา", "he / she", "rising"),
      word("อยู่", "stay / be located", "low"),
      word("ที่นี่", "here", "high"),
      word("มานาน", "for a long time", "mid", true),
      word("แล้ว", "already", "high", true),
    ]),
    row("ฉันเรียนไทยเป็นเวลาหนึ่งปี", "chan rian thai pen wela nueng pi", "I studied Thai for one year.", [
      word("ฉัน", "I", "rising"),
      word("เรียน", "study", "mid"),
      word("ไทย", "Thai", "mid"),
      word("เป็นเวลา", "for a period of", "mid", true),
      word("หนึ่งปี", "one year", "low"),
    ]),
  ],
  "knowledge-ruu-ruujak": [
    row("ฉันรู้คำนี้", "chan ru kham ni", "I know this word.", [
      word("ฉัน", "I", "rising"),
      word("รู้", "know", "high", true),
      word("คำ", "word", "mid"),
      word("นี้", "this", "high"),
    ]),
    row("ฉันรู้จักเชียงใหม่ดี", "chan rujak Chiang Mai di", "I know Chiang Mai well.", [
      word("ฉัน", "I", "rising"),
      word("รู้จัก", "be familiar with", "high", true),
      word("เชียงใหม่", "Chiang Mai", "mid"),
      word("ดี", "well", "mid"),
    ]),
  ],
  "female-particles-kha-kha": [
    row("วันนี้ว่างไหมคะ", "wanni wang mai kha", "Are you free today? (female speaker)", [
      word("วันนี้", "today", "high"),
      word("ว่าง", "free", "falling"),
      word("ไหม", "question marker", "rising", true),
      word("คะ", "female question particle", "high", true),
    ]),
    row("ขอบคุณค่ะ", "khopkhun kha", "Thank you. (female speaker)", [
      word("ขอบคุณ", "thank you", "low"),
      word("ค่ะ", "female statement particle", "falling", true),
    ]),
  ],
  "frequency-adverbs": [
    row("ฉันไปยิมบ่อย", "chan pai yim boi", "I go to the gym often.", [
      word("ฉัน", "I", "rising"),
      word("ไป", "go", "mid"),
      word("ยิม", "gym", "mid"),
      word("บ่อย", "often", "low", true),
    ]),
    row("เขามาสายบางครั้ง", "khao ma sai bangkhrang", "He is late sometimes.", [
      word("เขา", "he / she", "rising"),
      word("มา", "come", "mid"),
      word("สาย", "late", "rising"),
      word("บางครั้ง", "sometimes", "mid", true),
    ]),
  ],
  "like-chorp": [
    row("น้องชอบกาแฟ", "nong chop kafae", "My younger sibling likes coffee.", [
      word("น้อง", "younger sibling", "high"),
      word("ชอบ", "like", "falling", true),
      word("กาแฟ", "coffee", "mid"),
    ]),
    row("ฉันชอบอ่านหนังสือ", "chan chop an nangsue", "I like reading books.", [
      word("ฉัน", "I", "rising"),
      word("ชอบ", "like", "falling", true),
      word("อ่าน", "read", "low"),
      word("หนังสือ", "book", "rising"),
    ]),
  ],
  "skill-pen": [
    row("พี่ว่ายน้ำเป็น", "phi wai nam pen", "I know how to swim.", [
      word("พี่", "I / older person", "falling"),
      word("ว่ายน้ำ", "swim", "falling"),
      word("เป็น", "know how to", "mid", true),
    ]),
    row("เขาขับรถเป็น", "khao khap rot pen", "He knows how to drive.", [
      word("เขา", "he / she", "rising"),
      word("ขับรถ", "drive", "low"),
      word("เป็น", "know how to", "mid", true),
    ]),
  ],
  "endurance-wai": [
    row("ฉันเดินไม่ไหวแล้ว", "chan doen mai wai laeo", "I cannot keep walking anymore.", [
      word("ฉัน", "I", "rising"),
      word("เดิน", "walk", "mid"),
      word("ไม่", "not", "low", true),
      word("ไหว", "be able to endure", "rising", true),
      word("แล้ว", "already / anymore", "high", true),
    ]),
    row("ยกกล่องนี้ไหวไหม", "yok klong ni wai mai", "Can you lift this box?", [
      word("ยก", "lift", "high"),
      word("กล่อง", "box", "low"),
      word("นี้", "this", "high"),
      word("ไหว", "manage", "rising", true),
      word("ไหม", "question marker", "rising", true),
    ]),
  ],
  "permission-dai": [
    row("ที่นี่ถ่ายรูปได้", "thini thai rup dai", "You can take photos here.", [
      word("ที่นี่", "here", "high"),
      word("ถ่ายรูป", "take photos", "low"),
      word("ได้", "allowed / possible", "falling", true),
    ]),
    row("ห้องนี้เข้าได้ไหม", "hong ni khao dai mai", "Can we enter this room?", [
      word("ห้อง", "room", "falling"),
      word("นี้", "this", "high"),
      word("เข้า", "enter", "falling"),
      word("ได้", "allowed / possible", "falling", true),
      word("ไหม", "question marker", "rising", true),
    ]),
  ],
  "comparison-kwaa": [
    row("ห้องนี้ใหญ่กว่าห้องนั้น", "hong ni yai kwa hong nan", "This room is bigger than that room.", [
      word("ห้อง", "room", "falling"),
      word("นี้", "this", "high"),
      word("ใหญ่", "big", "low"),
      word("กว่า", "more than", "low", true),
      word("ห้อง", "room", "falling"),
      word("นั้น", "that", "high"),
    ]),
    row("ร้านนี้แพงกว่าร้านนั้น", "ran ni phaeng kwa ran nan", "This shop is more expensive than that shop.", [
      word("ร้าน", "shop", "high"),
      word("นี้", "this", "high"),
      word("แพง", "expensive", "mid"),
      word("กว่า", "more than", "low", true),
      word("ร้าน", "shop", "high"),
      word("นั้น", "that", "high"),
    ]),
  ],
  superlative: [
    row("ร้านนี้ถูกที่สุด", "ran ni thuk thi sut", "This shop is the cheapest.", [
      word("ร้าน", "shop", "high"),
      word("นี้", "this", "high"),
      word("ถูก", "cheap", "low"),
      word("ที่สุด", "the most", "low", true),
    ]),
    row("พี่สาววิ่งเร็วที่สุด", "phi sao wing reo thi sut", "My older sister runs the fastest.", [
      word("พี่สาว", "older sister", "falling"),
      word("วิ่ง", "run", "falling"),
      word("เร็ว", "fast", "mid"),
      word("ที่สุด", "the most", "low", true),
    ]),
  ],
  "quantifiers-thuk-bang-lai": [
    row("นักเรียนหลายคนมาแล้ว", "nakrian lai khon ma laeo", "Many students have arrived.", [
      word("นักเรียน", "student", "mid"),
      word("หลาย", "many", "rising", true),
      word("คน", "classifier for people", "mid", true),
      word("มา", "come", "mid"),
      word("แล้ว", "already", "high", true),
    ]),
    row("บางคนไม่กินเผ็ด", "bang khon mai kin phet", "Some people do not eat spicy food.", [
      word("บาง", "some", "mid", true),
      word("คน", "person / classifier", "mid"),
      word("ไม่", "not", "low", true),
      word("กิน", "eat", "mid"),
      word("เผ็ด", "spicy", "low"),
    ]),
  ],
  "sequence-conjunctions": [
    row("กินข้าวแล้วหลังจากนั้นเราไปตลาด", "kin khao laeo langchak nan rao pai talat", "We ate, and after that we went to the market.", [
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
      word("แล้ว", "already", "high", true),
      word("หลังจากนั้น", "after that", "falling", true),
      word("เรา", "we", "mid"),
      word("ไป", "go", "mid"),
      word("ตลาด", "market", "low"),
    ]),
    row("ต่อมาเราไปกินกาแฟ", "toma rao pai kin kafae", "Later on we went for coffee.", [
      word("ต่อมา", "later on", "mid", true),
      word("เรา", "we", "mid"),
      word("ไป", "go", "mid"),
      word("กิน", "eat / have", "mid"),
      word("กาแฟ", "coffee", "mid"),
    ]),
  ],
  "must-tong": [
    row("เราต้องตื่นเช้า", "rao tong tuen chao", "We have to wake up early.", [
      word("เรา", "we", "mid"),
      word("ต้อง", "must", "falling", true),
      word("ตื่น", "wake up", "low"),
      word("เช้า", "early", "falling"),
    ]),
    row("ฉันต้องไปทำงาน", "chan tong pai tham ngan", "I have to go to work.", [
      word("ฉัน", "I", "rising"),
      word("ต้อง", "must", "falling", true),
      word("ไป", "go", "mid"),
      word("ทำงาน", "work", "mid"),
    ]),
  ],
  "should-khuan": [
    row("คุณควรพักก่อน", "khun khuan phak kon", "You should rest first.", [
      word("คุณ", "you", "mid"),
      word("ควร", "should", "mid", true),
      word("พัก", "rest", "high"),
      word("ก่อน", "first", "low"),
    ]),
    row("เขาน่าจะมาถึงแล้ว", "khao na cha ma thueng laeo", "He should probably have arrived already.", [
      word("เขา", "he / she", "rising"),
      word("น่าจะ", "should probably / likely", "falling", true),
      word("มา", "come", "mid"),
      word("ถึง", "arrive", "rising"),
      word("แล้ว", "already", "high", true),
    ]),
  ],
  "prefix-naa-adjective": [
    row("หนังเรื่องนี้น่าสนใจ", "nang rueang ni na sonchai", "This movie is interesting.", [
      word("หนัง", "movie", "rising"),
      word("เรื่อง", "classifier / story", "falling"),
      word("นี้", "this", "high"),
      word("น่าสนใจ", "interesting", "falling", true),
    ]),
    row("เด็กคนนี้น่ารัก", "dek khon ni na rak", "This child is cute.", [
      word("เด็ก", "child", "low"),
      word("คน", "person / classifier", "mid"),
      word("นี้", "this", "high"),
      word("น่ารัก", "cute / lovely", "high", true),
    ]),
  ],
  "feelings-rusuek": [
    row("ฉันรู้สึกเหนื่อย", "chan rusuek nueai", "I feel tired.", [
      word("ฉัน", "I", "rising"),
      word("รู้สึก", "feel", "high", true),
      word("เหนื่อย", "tired", "low"),
    ]),
    row("เขารู้สึกกังวล", "khao rusuek kangwon", "He feels worried.", [
      word("เขา", "he / she", "rising"),
      word("รู้สึก", "feel", "high", true),
      word("กังวล", "worried", "mid"),
    ]),
  ],
  "try-lawng": [
    row("ลองชิมดู", "long chim du", "Try tasting it.", [
      word("ลอง", "try", "mid", true),
      word("ชิม", "taste", "mid"),
      word("ดู", "see / try", "mid", true),
    ]),
    row("ลองอ่านดู", "long an du", "Try reading it.", [
      word("ลอง", "try", "mid", true),
      word("อ่าน", "read", "low"),
      word("ดู", "see / try", "mid", true),
    ]),
  ],
  "resultative-ok-samret": [
    row("เขาทำงานสำเร็จแล้ว", "khao tham ngan samret laeo", "He completed the task successfully.", [
      word("เขา", "he / she", "rising"),
      word("ทำงาน", "do work", "mid"),
      word("สำเร็จ", "succeed", "low", true),
      word("แล้ว", "already", "high", true),
    ]),
    row("ฉันเปิดขวดไม่ออก", "chan poet kuat mai ok", "I cannot open the bottle.", [
      word("ฉัน", "I", "rising"),
      word("เปิด", "open", "low"),
      word("ขวด", "bottle", "low"),
      word("ไม่", "not", "low", true),
      word("ออก", "out / successfully", "low", true),
    ]),
  ],
  "relative-thi": [
    row("หนังสือที่ฉันซื้อแพง", "nangsue thi chan sue phaeng", "The book that I bought is expensive.", [
      word("หนังสือ", "book", "rising"),
      word("ที่", "that / which", "falling", true),
      word("ฉัน", "I", "rising"),
      word("ซื้อ", "buy", "high"),
      word("แพง", "expensive", "mid"),
    ]),
    row("ร้านที่เราไปอร่อย", "ran thi rao pai aroi", "The restaurant that we went to is delicious.", [
      word("ร้าน", "shop / restaurant", "high"),
      word("ที่", "that / which", "falling", true),
      word("เรา", "we", "mid"),
      word("ไป", "go", "mid"),
      word("อร่อย", "delicious", "low"),
    ]),
  ],
  "passive-tuuk": [
    row("เขาโดนครูเรียก", "khao don khru riak", "He got called by the teacher.", [
      word("เขา", "he / she", "rising"),
      word("โดน", "be affected by", "mid", true),
      word("ครู", "teacher", "mid"),
      word("เรียก", "call", "falling"),
    ]),
    row("ฉันถูกถามเรื่องงาน", "chan thuk tham rueang ngan", "I was asked about work.", [
      word("ฉัน", "I", "rising"),
      word("ถูก", "be subjected to", "low", true),
      word("ถาม", "ask", "rising"),
      word("เรื่องงาน", "about work", "falling"),
    ]),
  ],
  "reported-speech": [
    row("เขาบอกว่าจะมา", "khao bok wa cha ma", "He said that he would come.", [
      word("เขา", "he / she", "rising"),
      word("บอก", "say / tell", "low"),
      word("ว่า", "that", "falling", true),
      word("จะ", "will", "low", true),
      word("มา", "come", "mid"),
    ]),
    row("ฉันคิดว่าฝนจะตก", "chan khit wa fon cha tok", "I think it will rain.", [
      word("ฉัน", "I", "rising"),
      word("คิด", "think", "high"),
      word("ว่า", "that", "falling", true),
      word("ฝน", "rain", "rising"),
      word("จะ", "will", "low", true),
      word("ตก", "fall / rain", "low"),
    ]),
  ],
  "conditionals": [
    row("ถ้าฝนตกฉันจะอยู่บ้าน", "tha fon tok chan cha yu ban", "If it rains, I will stay home.", [
      word("ถ้า", "if", "falling", true),
      word("ฝน", "rain", "rising"),
      word("ตก", "fall / rain", "low"),
      word("ฉัน", "I", "rising"),
      word("จะ", "will", "low", true),
      word("อยู่", "stay", "low"),
      word("บ้าน", "home", "falling"),
    ]),
    row("ถ้ามีเวลาฉันจะไป", "tha mi wela chan cha pai", "If I have time, I will go.", [
      word("ถ้า", "if", "falling", true),
      word("มี", "have", "mid"),
      word("เวลา", "time", "mid"),
      word("ฉัน", "I", "rising"),
      word("จะ", "will", "low", true),
      word("ไป", "go", "mid"),
    ]),
  ],
  "change-state-khuen-long": [
    row("อากาศเย็นลงแล้ว", "akat yen long laeo", "The weather has become cooler.", [
      word("อากาศ", "weather", "low"),
      word("เย็น", "cool", "mid"),
      word("ลง", "down / become less", "mid", true),
      word("แล้ว", "already", "high", true),
    ]),
    row("ราคาสูงขึ้นมาก", "rakha sung khuen mak", "The price has gone up a lot.", [
      word("ราคา", "price", "mid"),
      word("สูง", "high", "rising"),
      word("ขึ้น", "up / become more", "falling", true),
      word("มาก", "a lot", "falling", true),
    ]),
  ],
  "in-order-to-phuea": [
    row("ฉันพูดช้าๆเพื่อให้ทุกคนเข้าใจ", "chan phut cha cha phuea hai thuk khon khaochai", "I speak slowly so that everyone can understand.", [
      word("ฉัน", "I", "rising"),
      word("พูด", "speak", "falling"),
      word("ช้าๆ", "slowly", "high"),
      word("เพื่อให้", "so that", "falling", true),
      word("ทุกคน", "everyone", "high"),
      word("เข้าใจ", "understand", "mid"),
    ]),
    row("เขาออกกำลังกายเพื่อสุขภาพ", "khao ok kamlangkai phuea sukkhaphap", "He exercises for his health.", [
      word("เขา", "he / she", "rising"),
      word("ออกกำลังกาย", "exercise", "mid"),
      word("เพื่อ", "for / in order to", "falling", true),
      word("สุขภาพ", "health", "low"),
    ]),
  ],
};

const B1_GRAMMAR_ROWS = {
  "cause-result-connectors": [
    row("ฝนตกก็เลยไม่ไป", "fon tok ko loei mai pai", "It rained, so I did not go.", [
      word("ฝน", "rain", "rising"),
      word("ตก", "fall / rain", "low"),
      word("ก็เลย", "so / therefore", "falling", true),
      word("ไม่", "not", "low", true),
      word("ไป", "go", "mid"),
    ]),
    row("เขาไม่สบายเพราะว่าทำงานหนัก", "khao mai sabai phro wa tham ngan nak", "He is unwell because he worked hard.", [
      word("เขา", "he / she", "rising"),
      word("ไม่สบาย", "unwell", "mid"),
      word("เพราะว่า", "because", "falling", true),
      word("ทำงาน", "work", "mid"),
      word("หนัก", "hard / heavily", "low"),
    ]),
  ],
  "contrast-concession": [
    row("ถึงแม้ว่าเหนื่อยแต่เขาก็มา", "thuengmae wa nueai tae khao ko ma", "Even though he was tired, he still came.", [
      word("ถึงแม้ว่า", "even though", "falling", true),
      word("เหนื่อย", "tired", "low"),
      word("แต่", "but", "low", true),
      word("เขา", "he / she", "rising"),
      word("ก็", "still / then", "falling", true),
      word("มา", "come", "mid"),
    ]),
    row("อย่างน้อยวันนี้ก็ไม่ฝนตก", "yangnoi wanni ko mai fon tok", "At least it is not raining today.", [
      word("อย่างน้อย", "at least", "low", true),
      word("วันนี้", "today", "high"),
      word("ก็", "at least / then", "falling", true),
      word("ไม่", "not", "low", true),
      word("ฝน", "rain", "rising"),
      word("ตก", "fall / rain", "low"),
    ]),
  ],
  "sequence-narrative-connectors": [
    row("หลังจากที่กินข้าวแล้วเราไปเดินเล่น", "langchak thi kin khao laeo rao pai doen len", "After eating, we went for a walk.", [
      word("หลังจากที่", "after", "falling", true),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
      word("แล้ว", "already", "high", true),
      word("เรา", "we", "mid"),
      word("ไป", "go", "mid"),
      word("เดินเล่น", "go for a walk", "mid"),
    ]),
    row("ระหว่างที่รอรถฉันอ่านข่าว", "rawang thi ro rot chan an khao", "While waiting for the bus, I read the news.", [
      word("ระหว่างที่", "while", "mid", true),
      word("รอ", "wait", "mid"),
      word("รถ", "bus / vehicle", "high"),
      word("ฉัน", "I", "rising"),
      word("อ่าน", "read", "low"),
      word("ข่าว", "news", "low"),
    ]),
  ],
  "opinion-perspective": [
    row("ฉันคิดว่าเขาน่าจะมา", "chan khit wa khao na cha ma", "I think he will probably come.", [
      word("ฉัน", "I", "rising"),
      word("คิดว่า", "think that", "high", true),
      word("เขา", "he / she", "rising"),
      word("น่าจะ", "probably", "falling", true),
      word("มา", "come", "mid"),
    ]),
    row("ดูเหมือนว่าฝนจะตก", "du muean wa fon cha tok", "It seems that it will rain.", [
      word("ดูเหมือนว่า", "it seems that", "mid", true),
      word("ฝน", "rain", "rising"),
      word("จะ", "will", "low", true),
      word("ตก", "fall / rain", "low"),
    ]),
  ],
  "continuation-aspect": [
    row("เขาพูดไปเรื่อยๆ", "khao phut pai rueai rueai", "He kept talking on and on.", [
      word("เขา", "he / she", "rising"),
      word("พูด", "speak", "falling"),
      word("ไปเรื่อยๆ", "continuously", "mid", true),
    ]),
    row("เรายังทำงานต่อไป", "rao yang tham ngan to pai", "We are still continuing to work.", [
      word("เรา", "we", "mid"),
      word("ยัง", "still", "mid", true),
      word("ทำงาน", "work", "mid"),
      word("ต่อไป", "continue / next", "low", true),
    ]),
  ],
  "result-complements-b1": [
    row("ฉันทำงานเสร็จแล้ว", "chan tham ngan set laeo", "I have finished the work.", [
      word("ฉัน", "I", "rising"),
      word("ทำงาน", "work", "mid"),
      word("เสร็จ", "finished", "low", true),
      word("แล้ว", "already", "high", true),
    ]),
    row("เราไปไม่ทันรถไฟ", "rao pai mai than rotfai", "We did not make it in time for the train.", [
      word("เรา", "we", "mid"),
      word("ไป", "go", "mid"),
      word("ไม่ทัน", "not in time", "mid", true),
      word("รถไฟ", "train", "mid"),
    ]),
  ],
  "expanded-relative-structures": [
    row("คนที่ยืนอยู่หน้าร้านเป็นครู", "khon thi yuen yu na ran pen khru", "The person standing in front of the shop is a teacher.", [
      word("คน", "person", "mid"),
      word("ที่", "who / that", "falling", true),
      word("ยืน", "stand", "mid"),
      word("อยู่", "be in an ongoing state", "low", true),
      word("หน้าร้าน", "in front of the shop", "falling"),
      word("เป็น", "be", "mid"),
      word("ครู", "teacher", "mid"),
    ]),
    row("สิ่งที่ฉันหาอยู่หายไปแล้ว", "sing thi chan ha yu hai pai laeo", "The thing I was looking for has disappeared.", [
      word("สิ่ง", "thing", "falling"),
      word("ที่", "that / which", "falling", true),
      word("ฉัน", "I", "rising"),
      word("หา", "search for", "rising"),
      word("อยู่", "be in an ongoing state", "low", true),
      word("หายไป", "disappear", "rising"),
      word("แล้ว", "already", "high", true),
    ]),
  ],
  "intermediate-negation": [
    row("ฉันไม่ได้ไปเพราะฝนตก", "chan mai dai pai phro fon tok", "I did not go because it rained.", [
      word("ฉัน", "I", "rising"),
      word("ไม่ได้", "did not", "falling", true),
      word("ไป", "go", "mid"),
      word("เพราะ", "because", "high", true),
      word("ฝน", "rain", "rising"),
      word("ตก", "fall / rain", "low"),
    ]),
    row("ช่วงนี้ฉันไม่ค่อยออกไปไหน", "chuang ni chan mai khoi ok pai nai", "These days I do not go out much.", [
      word("ช่วงนี้", "these days", "falling"),
      word("ฉัน", "I", "rising"),
      word("ไม่ค่อย", "not very / rarely", "falling", true),
      word("ออกไป", "go out", "low"),
      word("ไหน", "where", "rising"),
    ]),
  ],
  "also-kor": [
    row("ฉันก็ชอบเหมือนกัน", "chan ko chop muean kan", "I like it too.", [
      word("ฉัน", "I", "rising"),
      word("ก็", "also", "falling", true),
      word("ชอบ", "like", "falling"),
      word("เหมือนกัน", "as well", "rising"),
    ]),
    row("ถ้าอยากไปเราก็ไปได้", "tha yak pai rao ko pai dai", "If you want to go, then we can go.", [
      word("ถ้า", "if", "falling"),
      word("อยาก", "want to", "low"),
      word("ไป", "go", "mid"),
      word("เรา", "we", "mid"),
      word("ก็", "then", "falling", true),
      word("ไป", "go", "mid"),
      word("ได้", "can", "falling", true),
    ]),
  ],
  "not-yet-yang": [
    row("ฉันยังไม่พร้อม", "chan yang mai phrom", "I am not ready yet.", [
      word("ฉัน", "I", "rising"),
      word("ยัง", "yet / still", "mid", true),
      word("ไม่", "not", "low", true),
      word("พร้อม", "ready", "high"),
    ]),
    row("เขากินข้าวหรือยัง", "khao kin khao rue yang", "Has he eaten yet?", [
      word("เขา", "he / she", "rising"),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
      word("หรือยัง", "yet?", "mid", true),
    ]),
  ],
};

const B2_GRAMMAR_ROWS = {
  "discourse-markers-b2": [
    row("อย่างไรก็ตามปัญหายังไม่จบ", "yangraikodtam panha yang mai chop", "However, the problem is still not over.", [
      word("อย่างไรก็ตาม", "however", "mid", true),
      word("ปัญหา", "problem", "mid"),
      word("ยัง", "still", "mid", true),
      word("ไม่", "not", "low", true),
      word("จบ", "end", "low"),
    ]),
    row("ในขณะเดียวกันเราก็ต้องรอ", "nai khana diao kan rao ko tong ro", "Meanwhile, we also have to wait.", [
      word("ในขณะเดียวกัน", "meanwhile", "falling", true),
      word("เรา", "we", "mid"),
      word("ก็", "also / then", "falling", true),
      word("ต้อง", "must", "falling"),
      word("รอ", "wait", "mid"),
    ]),
  ],
  "formal-connectors-b2": [
    row("นอกจากนี้โครงการนี้ช่วยนักเรียนมาก", "noktai khroangkan ni chuai nakrian mak", "Furthermore, this project helps students a lot.", [
      word("นอกจากนี้", "furthermore", "falling", true),
      word("โครงการ", "project", "mid"),
      word("นี้", "this", "high"),
      word("ช่วย", "help", "falling"),
      word("นักเรียน", "student", "mid"),
      word("มาก", "a lot", "falling"),
    ]),
    row("โดยเฉพาะเด็กเล็กต้องดูแลดีๆ", "doi chapho dek lek tong dulae di di", "Young children especially need careful care.", [
      word("โดยเฉพาะ", "especially", "falling", true),
      word("เด็กเล็ก", "young child", "low"),
      word("ต้อง", "must", "falling"),
      word("ดูแล", "take care of", "mid"),
      word("ดีๆ", "well", "mid"),
    ]),
  ],
  "advanced-modality-b2": [
    row("เขาคงจะมาสาย", "khao khong cha ma sai", "He will probably be late.", [
      word("เขา", "he / she", "rising"),
      word("คงจะ", "probably", "mid", true),
      word("มา", "come", "mid"),
      word("สาย", "late", "rising"),
    ]),
    row("ดูท่าว่าฝนจะไม่หยุด", "du thao wa fon cha mai yut", "It looks like the rain will not stop.", [
      word("ดูท่าว่า", "it looks like", "mid", true),
      word("ฝน", "rain", "rising"),
      word("จะ", "will", "low", true),
      word("ไม่", "not", "low", true),
      word("หยุด", "stop", "low"),
    ]),
  ],
  "emphasis-tone-particles-b2": [
    row("ดีเลย", "di loei", "That is great.", [
      word("ดี", "good", "mid"),
      word("เลย", "emphatic / very", "mid", true),
    ]),
    row("อันนี้แหละที่ต้องการ", "an ni lae thi tongkan", "This is exactly the one I want.", [
      word("อันนี้", "this one", "high"),
      word("แหละ", "exactly this", "mid", true),
      word("ที่", "that / which", "falling"),
      word("ต้องการ", "want / need", "mid"),
    ]),
  ],
  "nuanced-comparison-b2": [
    row("ยิ่งเรียนยิ่งสนุก", "ying rian ying sanuk", "The more I study, the more fun it becomes.", [
      word("ยิ่ง", "the more", "falling", true),
      word("เรียน", "study", "mid"),
      word("ยิ่ง", "the more", "falling", true),
      word("สนุก", "fun", "low"),
    ]),
    row("สองร้านนี้พอๆ กัน", "song ran ni pho pho kan", "These two shops are about the same.", [
      word("สอง", "two", "rising"),
      word("ร้าน", "shop", "high"),
      word("นี้", "these", "high"),
      word("พอๆ กัน", "about equal", "mid", true),
    ]),
  ],
  "causative-passive-nuance-b2": [
    row("ข่าวนี้ทำให้คนกังวล", "khao ni tham hai khon kangwon", "This news makes people worried.", [
      word("ข่าว", "news", "low"),
      word("นี้", "this", "high"),
      word("ทำให้", "make / cause", "mid", true),
      word("คน", "people", "mid"),
      word("กังวล", "worried", "mid"),
    ]),
    row("แม่ให้ฉันล้างจาน", "mae hai chan lang chan", "Mom made / told me to wash the dishes.", [
      word("แม่", "mom", "falling"),
      word("ให้", "let / make", "falling", true),
      word("ฉัน", "me", "rising"),
      word("ล้าง", "wash", "high"),
      word("จาน", "dish", "mid"),
    ]),
  ],
  "limitation-focus-b2": [
    row("แค่ถามเฉยๆ", "khae tham choei choei", "I was just asking.", [
      word("แค่", "just / only", "falling", true),
      word("ถาม", "ask", "rising"),
      word("เฉยๆ", "just / casually", "rising", true),
    ]),
    row("มีเท่านั้นเอง", "mi thao nan eng", "That is all there is.", [
      word("มี", "have / there is", "mid"),
      word("เท่านั้นเอง", "only that / nothing more", "mid", true),
    ]),
  ],
  "confirmation-rhetorical-particles-b2": [
    row("สวยใช่ไหมล่ะ", "suai chai mai la", "It is beautiful, right?", [
      word("สวย", "beautiful", "rising"),
      word("ใช่ไหมล่ะ", "right? / see?", "falling", true),
    ]),
    row("อ๋อนี่เอง", "o ni eng", "Oh, so this is it.", [
      word("อ๋อ", "oh", "rising"),
      word("นี่เอง", "this exactly / so this is it", "mid", true),
    ]),
  ],
  "advanced-clause-patterns-b2": [
    row("ถ้ามีเวลาก็มาได้", "tha mi wela ko ma dai", "If you have time, then you can come.", [
      word("ถ้า", "if", "falling", true),
      word("มี", "have", "mid"),
      word("เวลา", "time", "mid"),
      word("ก็", "then", "falling", true),
      word("มา", "come", "mid"),
      word("ได้", "can", "falling", true),
    ]),
    row("แม้กระทั่งเด็กก็เข้าใจ", "mae krathang dek ko khaochai", "Even children understand.", [
      word("แม้กระทั่ง", "even", "falling", true),
      word("เด็ก", "child", "low"),
      word("ก็", "also / even", "falling", true),
      word("เข้าใจ", "understand", "mid"),
    ]),
  ],
  "serial-verbs": [
    row("เขาไปซื้อข้าว", "khao pai sue khao", "He went to buy food.", [
      word("เขา", "he / she", "rising"),
      word("ไป", "go", "mid"),
      word("ซื้อ", "buy", "high"),
      word("ข้าว", "food", "falling"),
    ]),
    row("ฉันนั่งอ่านหนังสือ", "chan nang an nangsue", "I sat and read a book.", [
      word("ฉัน", "I", "rising"),
      word("นั่ง", "sit", "falling"),
      word("อ่าน", "read", "low"),
      word("หนังสือ", "book", "rising"),
    ]),
  ],
  "particles-na-si-la": [
    row("รอนี่นะ", "ro ni na", "Wait here, okay?", [
      word("รอ", "wait", "mid"),
      word("นี่", "here", "high"),
      word("นะ", "softening particle", "high", true),
    ]),
    row("ไปสิ", "pai si", "Go on, then.", [
      word("ไป", "go", "mid"),
      word("สิ", "urging particle", "low", true),
    ]),
  ],
  "time-clauses": [
    row("ก่อนนอนฉันอ่านหนังสือ", "kon non chan an nangsue", "Before sleeping, I read a book.", [
      word("ก่อน", "before", "low", true),
      word("นอน", "sleep", "mid"),
      word("ฉัน", "I", "rising"),
      word("อ่าน", "read", "low"),
      word("หนังสือ", "book", "rising"),
    ]),
    row("หลังเลิกงานเราไปกินข้าว", "lang loek ngan rao pai kin khao", "After work, we went to eat.", [
      word("หลัง", "after", "rising", true),
      word("เลิกงาน", "finish work", "falling"),
      word("เรา", "we", "mid"),
      word("ไป", "go", "mid"),
      word("กิน", "eat", "mid"),
      word("ข้าว", "rice / meal", "falling"),
    ]),
  ],
  "about-to-kamlangja": [
    row("ฝนกำลังจะตก", "fon kamlang cha tok", "It is about to rain.", [
      word("ฝน", "rain", "rising"),
      word("กำลังจะ", "about to", "mid", true),
      word("ตก", "fall / rain", "low"),
    ]),
    row("รถกำลังจะมา", "rot kamlang cha ma", "The bus is about to arrive.", [
      word("รถ", "bus / vehicle", "high"),
      word("กำลังจะ", "about to", "mid", true),
      word("มา", "come", "mid"),
    ]),
  ],
};

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function buildCsv(grammarId, rows) {
  const header = [
    "grammar_id",
    "thai",
    "romanization",
    "english",
    "breakdown",
    "difficulty",
  ];

  const lines = [
    header.map(csvEscape).join(","),
    ...rows.map((entry) =>
      [
        grammarId,
        entry.thai,
        entry.romanization,
        entry.english,
        JSON.stringify(entry.breakdown),
        entry.difficulty,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function main() {
  const outputDir = process.argv[2];

  if (!outputDir) {
    console.error("Usage: node scripts/exportA1GrammarCsvs.mjs <output-dir>");
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const grammarRows = {
    ...A1_GRAMMAR_ROWS,
    ...A2_GRAMMAR_ROWS,
    ...B1_GRAMMAR_ROWS,
    ...B2_GRAMMAR_ROWS,
  };

  let written = 0;
  for (const [grammarId, rows] of Object.entries(grammarRows)) {
    const filePath = path.join(outputDir, `${grammarId}.csv`);
    fs.writeFileSync(filePath, buildCsv(grammarId, rows), "utf8");
    written += 1;
  }

  console.log(`Wrote ${written} grammar CSV files to ${outputDir}`);
}

main();
