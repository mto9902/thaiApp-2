export type LessonBlocks = {
  summary: string;
  build: string;
  use: string;
};

export const A1_LESSON_BLOCKS: Record<string, LessonBlocks> = {
  "svo": {
    summary:
      "This is the default Thai sentence shape for simple statements. Once you can place a subject, an action, and an object in order, you can already say many useful beginner sentences.",
    build:
      "Start with the person or thing doing the action, then add the verb, then the object. In basic Thai statements, you usually do not need extra helper words between those three parts.",
    use:
      "You will hear this pattern in daily routines, food, work, and simple descriptions of what people do. When you are unsure how to begin a new Thai sentence, this is the safest place to start.",
  },
  "negative-mai": {
    summary:
      "Use ไม่ to make a verb or adjective negative. It gives you the everyday beginner meanings of not, do not, does not, and is not.",
    build:
      "Keep the subject first, then put ไม่ directly before the verb or adjective you want to negate. Do not move the rest of the sentence around just because the sentence becomes negative.",
    use:
      "You will use ไม่ constantly for preferences, abilities, plans, and descriptions. It appears in some of the most common beginner answers, such as 'I do not know', 'I am not free', or 'I do not eat that'.",
  },
  "identity-pen": {
    summary:
      "Use เป็น when the sentence identifies someone or something as a person, role, job, type, or category. It helps you say who someone is, not just describe them.",
    build:
      "The usual pattern is subject plus เป็น plus noun. Use it with words like teacher, student, doctor, Thai person, friend, or any other label or classification.",
    use:
      "You will hear เป็น in introductions, jobs, family roles, and basic classification sentences. It is especially useful when meeting people and talking about what someone is or does.",
  },
  "polite-particles": {
    summary:
      "Sentence-final polite particles make Thai sound natural, respectful, and socially smooth. They do not change the core meaning of the sentence, but they do change the tone of the interaction.",
    build:
      "Say the full sentence first, then add ครับ, ค่ะ, or คะ at the end. The particle comes after the main message, not in the middle of the sentence.",
    use:
      "You will hear these particles in greetings, answers, service encounters, and polite daily conversation. Learners sound more natural very quickly once they stop treating them as optional decoration.",
  },
  "name-chue": {
    summary:
      "Use ชื่อ to say or ask a person's name. This is one of the first personal-detail patterns you need in real conversation.",
    build:
      "Put the subject first, then ชื่อ, then the name itself. In questions, keep the same structure and replace the name with a question word such as อะไร.",
    use:
      "You will use this in introductions, classrooms, registrations, and small talk. It is one of the fastest ways to start speaking Thai in a real interaction.",
  },
  "question-mai": {
    summary:
      "Use ไหม at the end of a sentence to turn it into a yes or no question. Thai keeps the main statement shape and changes the sentence with a final question marker.",
    build:
      "Say the statement first, then add ไหม at the end. Do not move the verb to the front or add a helping verb the way English often does.",
    use:
      "You will hear ไหม in invitations, availability questions, and basic checks such as 'Do you want...?' or 'Are you free?'. It is one of the most useful beginner patterns in spoken Thai.",
  },
  "question-words": {
    summary:
      "Question words let you ask for missing information such as what, who, where, and how much. They turn short Thai sentences into useful real-life questions.",
    build:
      "Build the sentence around the information you want, then place the question word where that information belongs in Thai. Some question words come at the end of the sentence, while others sit inside the normal sentence frame.",
    use:
      "You will use these forms for directions, prices, names, places, and personal details. They are essential in shops, travel, school, and daily conversation.",
  },
  "have-mii": {
    summary:
      "Use มี to say that something exists, is available, or is present. It covers the beginner meanings of have, there is, and there are in many common situations.",
    build:
      "In simple possession sentences, put the person first and มี before the thing. In existence sentences, Thai often starts with the thing or the location, then uses มี to show presence or availability.",
    use:
      "You will hear มี when talking about family, belongings, stock, menu items, and what a place has. It is one of the most frequent high-value beginner verbs.",
  },
  "no-have-mai-mii": {
    summary:
      "Use ไม่มี to say that something is absent, unavailable, or not possessed. It is the standard negative form for มี.",
    build:
      "Keep the same sentence pattern you would use with มี, but replace it with ไม่มี. Thai treats this as one unit, so learners should hear and use it as a complete phrase.",
    use:
      "You will use ไม่มี for prices, stock, family, belongings, and location questions such as asking whether a place has something. It also appears constantly in everyday service Thai.",
  },
  "location-yuu": {
    summary:
      "Use อยู่ to talk about where someone or something is located. It is the core beginner verb for physical location.",
    build:
      "Start with the thing or person you are locating, then use อยู่, then add the place phrase. Thai normally keeps that order instead of starting with the location.",
    use:
      "You will hear อยู่ in directions, classroom questions, finding objects, and telling people where places are. It is one of the first verbs learners need for practical daily Thai.",
  },
  "adjectives": {
    summary:
      "Thai adjectives can act like the main predicate of the sentence, so you can often describe something without adding a separate word for 'to be'. This is a major beginner shortcut.",
    build:
      "Put the noun or subject first, then the adjective. Do not automatically insert เป็น just because English would use 'is' before the description.",
    use:
      "You will hear this pattern in descriptions of people, food, weather, objects, and feelings. It helps beginners speak sooner because one adjective can already complete a sentence.",
  },
  "this-that": {
    summary:
      "Thai demonstratives show which thing you mean: this, that, or that one over there. They help beginners point, compare, and clarify objects in real conversation.",
    build:
      "Unlike English, Thai usually puts the noun first and the demonstrative after it. Think 'book this' rather than 'this book'.",
    use:
      "You will hear these words when ordering, shopping, pointing things out, and distinguishing between similar objects. They are especially common in face-to-face conversation.",
  },
  "go-come-pai-maa": {
    summary:
      "ไป and มา show movement away from or toward the speaker's point of view. They are basic verbs for talking about plans, travel, and simple movement.",
    build:
      "Use ไป for going away and มา for coming toward the speaker or the reference point. In Thai, these verbs can also appear in serial-style patterns that make movement feel very natural.",
    use:
      "You will hear them in errands, invitations, directions, and daily routines. They appear constantly in beginner speech because movement and destination are such common topics.",
  },
  "origin-maa-jaak": {
    summary:
      "Use มาจาก to say where someone or something comes from. It gives you a clear beginner pattern for origin, hometown, and country.",
    build:
      "Put the person or thing first, then มาจาก, then the place name. Thai keeps the place after the origin phrase, so learners can use the same order again and again.",
    use:
      "You will hear this pattern in introductions, travel, hometown questions, and nationality conversations. It is one of the easiest ways to start a real exchange with someone new.",
  },
  "not-identity-mai-chai": {
    summary:
      "Use ไม่ใช่ to say that something is not a person, role, type, or category. It is the natural negative partner of noun identity sentences.",
    build:
      "The common pattern is subject plus ไม่ใช่ plus noun. Do not replace เป็น with plain ไม่ here, because noun negation uses its own set phrase.",
    use:
      "You will hear ไม่ใช่ in corrections, clarifications, and everyday identity statements such as 'I am not a teacher' or 'That is not my bag'. It is a very common spoken chunk.",
  },
  "natural-address-pronouns": {
    summary:
      "Thai often uses relationship words, names, or no pronoun at all instead of a single fixed 'I' or 'you'. This makes real Thai sound more personal and more context-based than textbook Thai.",
    build:
      "Choose the address word that fits the relationship, age, or tone of the conversation, or leave the pronoun out when it is already clear. The rest of the sentence usually stays the same.",
    use:
      "You will hear this in almost every real conversation, especially with family, friends, service staff, and colleagues. Learning it early helps you understand natural Thai much faster.",
  },
  "place-words": {
    summary:
      "Place words tell you where something is in relation to something else, such as in, on, under, or next to. They are essential for directions and object location.",
    build:
      "Thai usually says the thing first, then the place relationship, then the reference object. Learn the whole place phrase as one chunk instead of translating word by word from English.",
    use:
      "You will hear these forms in houses, shops, classrooms, and travel directions. They help you ask where something is and understand the answer without needing long sentences.",
  },
  "possession-khong": {
    summary:
      "Use ของ to show possession and relationship, like of or belonging to. It helps you talk about whose item, room, bag, or family member something is.",
    build:
      "Put the possessed thing first, then ของ, then the owner. Thai often keeps this order instead of placing the owner before the noun the way English does.",
    use:
      "You will hear ของ in everyday talk about personal items, ownership, rooms, food, and belongings. It is especially useful when labeling, asking, or clarifying who something belongs to.",
  },
  "want-yaak": {
    summary:
      "Use อยาก before a verb to say that you want to do something. It is one of the most useful beginner patterns for needs, wishes, and immediate plans.",
    build:
      "Start with the subject, then อยาก, then the verb or action. If you want an object too, add it after the verb in the normal Thai order.",
    use:
      "You will hear อยาก in food, rest, travel, shopping, and daily preference talk. It lets beginners speak about what they want without needing long explanations.",
  },
  "request-khor": {
    summary:
      "Use ขอ to ask for something, ask permission, or make a polite request. It is a very high-value beginner word for service situations and daily needs.",
    build:
      "ขอ normally comes before the thing you want or before the action you are requesting. In friendlier spoken Thai, it often works together with softeners like หน่อย.",
    use:
      "You will hear ขอ in shops, cafes, taxis, classrooms, and everyday interactions where people ask for help, water, menus, receipts, or permission.",
  },
  "classifiers": {
    summary:
      "Classifiers are count words used with many Thai nouns when you say how many there are. They are a core part of natural counting and quantity phrases.",
    build:
      "The usual pattern is noun plus number plus classifier, although some common short phrases are learned as fixed chunks. Focus on the everyday counting shape first rather than memorizing every rare classifier at once.",
    use:
      "You will hear classifiers in shopping, ordering, prices, quantities, and casual counting. Even at beginner level, they show up often enough that learners need them early.",
  },
  "price-thaorai": {
    summary:
      "Use เท่าไร to ask how much something costs or how much of something there is. It is one of the most practical question patterns for beginners.",
    build:
      "Build the sentence around the item first, then add เท่าไร where the amount belongs. In real speech, you will often hear this as a short shopping question rather than a full formal sentence.",
    use:
      "You will hear it in markets, restaurants, shops, transport, and everyday buying situations. It is a high-frequency survival pattern for real-world Thai.",
  },
  "time-expressions": {
    summary:
      "Basic time expressions help you place an action in time, such as now, today, tonight, or tomorrow. They make even short beginner sentences feel much more useful.",
    build:
      "Most of these forms work as ready-made chunks that you can place after or before the main clause depending on the sentence. Learn them as complete expressions rather than trying to build them from scratch every time.",
    use:
      "You will hear these words constantly in scheduling, invitations, routines, and daily planning. They are some of the fastest ways to make a simple sentence more specific.",
  },
  "imperatives": {
    summary:
      "Imperatives tell someone to do something, invite them to do it, or guide the flow of interaction. Thai often softens commands so they do not sound harsher than necessary.",
    build:
      "Start with the verb or action, then add any object or softening word that belongs with it. The exact force of the sentence depends a lot on the ending and the social context.",
    use:
      "You will hear imperatives in directions, service interactions, invitations, reminders, and everyday quick instructions. Learning the softer versions is especially important for natural Thai.",
  },
  "negative-imperative-ya": {
    summary:
      "Use อย่า before a verb to tell someone not to do something. It is the core beginner form for warnings, reminders, and negative commands.",
    build:
      "Put อย่า directly before the verb you want to stop. The rest of the sentence stays simple, so learners can use it quickly without changing the whole word order.",
    use:
      "You will hear this in family talk, classrooms, signs, and everyday spoken warnings such as 'Do not go', 'Do not touch', or 'Do not forget'.",
  },
  "can-dai": {
    summary:
      "Use ได้ to say that something is possible, allowed, or doable. It is a flexible beginner word that often covers can in everyday Thai.",
    build:
      "The common beginner pattern is subject plus verb plus ได้. Thai can also use ได้ in other ways, so focus first on the clear ability or possibility meaning in simple sentences.",
    use:
      "You will hear this pattern in permission, ability, scheduling, and practical problem-solving. It appears very often in short daily exchanges.",
  },
  "future-ja": {
    summary:
      "Use จะ before a verb for future actions, plans, or intentions. It helps learners speak about what is going to happen next.",
    build:
      "Put จะ directly before the main verb. The subject stays at the front, and the rest of the sentence usually keeps the same order as a present-time statement.",
    use:
      "You will hear จะ in planning, invitations, promises, and near-future actions. It is one of the easiest ways to talk about tomorrow, later, or the next step.",
  },
  "very-maak": {
    summary:
      "Degree words like มาก help you say how strong, big, or intense something is. They make your Thai more expressive without adding much grammar complexity.",
    build:
      "Thai usually places มาก after the adjective or verb it strengthens. Learn the whole phrase together, such as 'tasty very' or 'like very much', instead of forcing English order onto it.",
    use:
      "You will hear มาก in opinions, feelings, preferences, and descriptions all the time. It is one of the quickest ways to make beginner Thai sound more natural and specific.",
  },
  "progressive-kamlang": {
    summary:
      "Use กำลัง before a verb when something is happening right now. It gives you the Thai pattern for actions in progress.",
    build:
      "Keep the subject first, place กำลัง before the main verb, then continue with the rest of the sentence. Thai marks the ongoing action before the verb rather than changing the verb itself.",
    use:
      "You will hear this when people describe what they are doing now, what someone is doing at the moment, or what is currently happening around them.",
  },
  "experience-koey": {
    summary:
      "Use เคย to talk about past experience: something you have done before or have ever done. It lets beginners speak about life experience without needing a complex tense system.",
    build:
      "Place เคย before the verb. The sentence usually keeps normal Thai order, and the time idea comes from เคย plus the rest of the context.",
    use:
      "You will hear it when people compare experiences, ask whether someone has ever tried something, or talk about places, food, and activities they know from before.",
  },
  "conjunction-and-but": {
    summary:
      "Basic conjunctions let you connect two short ideas into one smoother sentence. They are the first step from isolated beginner statements to real conversational flow.",
    build:
      "Say the first clause, then add the conjunction, then the second clause. Keep each clause simple at first so the connector itself becomes easy to hear and use.",
    use:
      "You will hear these words in stories, choices, opinions, and daily explanation. They are essential once learners want to say more than one idea at a time.",
  },
  "because-phraw": {
    summary:
      "Use เพราะ to give a reason. It helps learners explain why something is true, happened, or is being done.",
    build:
      "Because-clauses can come after the main idea or introduce the reason before it, depending on the sentence. Start with the most common beginner use: statement first, reason after เพราะ.",
    use:
      "You will hear เพราะ in excuses, preferences, explanations, and everyday decisions. It is one of the key words that turns simple Thai into connected Thai.",
  },
};

export const A1_LESSON_IDS = Object.keys(A1_LESSON_BLOCKS);
