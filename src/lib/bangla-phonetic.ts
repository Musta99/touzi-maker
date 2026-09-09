/**
 * Bangla Phonetic Transliteration Engine
 * Converts Roman/English text to Bengali script using Avro-style phonetic rules.
 * 
 * Examples: "mamun" → "মামুন", "bangladesh" → "বাংলাদেশ", "ami" → "আমি"
 */

// Phonetic rules: ordered from longest match to shortest (greedy matching)
// Each rule: [roman, bangla]
const RULES: [string, string][] = [
  // Special conjuncts (must come before individual chars)
  ["ksh", "ক্ষ"],
  ["NGch", "ঞ্ছ"],
  ["NGchh", "ঞ্ছ"],
  ["NGj", "ঞ্জ"],
  ["njh", "ঞ্ঝ"],
  ["nj", "ঞ্জ"],
  ["NGk", "ঙ্ক"],
  ["NGg", "ঙ্গ"],
  ["NGkh", "ঙ্খ"],
  ["NGgh", "ঙ্ঘ"],
  ["cch", "চ্ছ"],
  ["cchh", "চ্ছ"],
  
  // Common conjuncts
  ["shch", "শ্ছ"],
  ["kkh", "ক্ষ"],
  ["kk", "ক্ক"],
  ["kT", "ক্ট"],
  ["kt", "ক্ত"],
  ["kl", "ক্ল"],
  ["ks", "ক্স"],
  ["gn", "গ্ন"],
  ["gl", "গ্ল"],
  ["gg", "জ্ঞ"],
  ["Gg", "জ্ঞ"],
  ["jj", "জ্জ"],
  ["jjh", "জ্ঝ"],
  ["TT", "ট্ট"],
  ["DD", "ড্ড"],
  ["NN", "ণ্ণ"],
  ["tt", "ত্ত"],
  ["tv", "ত্ব"],
  ["nth", "ন্থ"],
  ["nn", "ন্ন"],
  ["nd", "ন্দ"],
  ["ndh", "ন্ধ"],
  ["ndr", "ন্দ্র"],
  ["nt", "ন্ত"],
  ["nT", "ণ্ট"],
  ["nD", "ণ্ড"],
  ["pp", "প্প"],
  ["pt", "প্ত"],
  ["pl", "প্ল"],
  ["bb", "ব্ব"],
  ["bd", "ব্দ"],
  ["bl", "ব্ল"],
  ["bj", "ব্জ"],
  ["mm", "ম্ম"],
  ["mb", "ম্ব"],
  ["mn", "ম্ন"],
  ["mp", "ম্প"],
  ["ml", "ম্ল"],
  ["ll", "ল্ল"],
  ["lb", "ল্ব"],
  ["lk", "ল্ক"],
  ["lg", "ল্গ"],
  ["lp", "ল্প"],
  ["lD", "ল্ড"],
  ["lm", "ল্ম"],
  ["ss", "স্স"],
  ["sp", "স্প"],
  ["sk", "স্ক"],
  ["sT", "স্ট"],
  ["sn", "স্ন"],
  ["st", "স্ত"],
  ["sw", "স্ব"],
  ["sm", "স্ম"],
  ["shm", "শ্ম"],
  ["shn", "শ্ন"],
  ["shw", "শ্ব"],
  ["shl", "শ্ল"],
  ["Shm", "ষ্ম"],
  ["Shn", "ষ্ন"],
  ["ShT", "ষ্ট"],
  ["ShN", "ষ্ণ"],
  ["ShTh", "ষ্ঠ"],
  ["Shk", "ষ্ক"],
  ["Shp", "ষ্প"],
  ["hN", "হ্ণ"],
  ["hn", "হ্ন"],
  ["hm", "হ্ম"],
  ["hl", "হ্ল"],
  ["hr", "হ্র"],
  ["rr", "র‍্র"],
  ["mr", "ম্র"],
  ["kr", "ক্র"],
  ["gr", "গ্র"],
  ["tr", "ত্র"],
  ["dr", "দ্র"],
  ["pr", "প্র"],
  ["br", "ব্র"],
  ["fr", "ফ্র"],
  ["sr", "স্র"],
  ["shr", "শ্র"],
  ["Shr", "ষ্র"],
  ["nr", "ন্র"],

  // Aspirated consonants (digraphs — must come before single chars)
  ["chh", "ছ"],
  ["ch", "চ"],
  ["kh", "খ"],
  ["gh", "ঘ"],
  ["jh", "ঝ"],
  ["Th", "ঠ"],
  ["Dh", "ঢ"],
  ["th", "থ"],
  ["dh", "ধ"],
  ["ph", "ফ"],
  ["bh", "ভ"],
  ["sh", "শ"],
  ["Sh", "ষ"],

  // Nasals and special
  ["NG", "ঙ"],
  ["ng", "ং"],

  // Consonants
  ["k", "ক"],
  ["g", "গ"],
  ["j", "জ"],
  ["T", "ট"],
  ["D", "ড"],
  ["N", "ণ"],
  ["t", "ত"],
  ["d", "দ"],
  ["n", "ন"],
  ["p", "প"],
  ["f", "ফ"],
  ["b", "ব"],
  ["v", "ভ"],
  ["m", "ম"],
  ["z", "য"],
  ["r", "র"],
  ["l", "ল"],
  ["s", "স"],
  ["h", "হ"],
  ["R", "ড়"],
  ["Rh", "ঢ়"],
  ["y", "য়"],
  ["w", "ও"],
  ["x", "ক্স"],
  ["q", "ক"],

  // Vowels (independent forms — used at the start of a word or after a vowel)
  ["OI", "ঐ"],
  ["OU", "ঔ"],
  ["oi", "ঐ"],
  ["ou", "ঔ"],
  ["oo", "উ"],
  ["ee", "ঈ"],
  ["aa", "আ"],
  ["a", "আ"],  // will be context-dependent
  ["A", "আ"],
  ["i", "ই"],
  ["I", "ঈ"],
  ["u", "উ"],
  ["U", "ঊ"],
  ["e", "এ"],
  ["E", "এ"],
  ["o", "ও"],
  ["O", "ও"],
];

// Vowel diacritics (kar forms — used after a consonant)
const VOWEL_SIGNS: Record<string, string> = {
  "আ": "া",
  "ই": "ি",
  "ঈ": "ী",
  "উ": "ু",
  "ঊ": "ূ",
  "এ": "ে",
  "ঐ": "ৈ",
  "ও": "ো",
  "ঔ": "ৌ",
};

// Characters that are vowels in their independent form
const INDEPENDENT_VOWELS = new Set(["আ", "অ", "ই", "ঈ", "উ", "ঊ", "এ", "ঐ", "ও", "ঔ"]);

// Characters that are consonants
const CONSONANTS = new Set([
  "ক", "খ", "গ", "ঘ", "ঙ",
  "চ", "ছ", "জ", "ঝ", "ঞ",
  "ট", "ঠ", "ড", "ঢ", "ণ",
  "ত", "থ", "দ", "ধ", "ন",
  "প", "ফ", "ব", "ভ", "ম",
  "য", "র", "ল", "শ", "ষ", "স", "হ",
  "ড়", "ঢ়", "য়",
]);

// Check if a bangla char is a consonant
function isConsonant(ch: string): boolean {
  return CONSONANTS.has(ch);
}

// Check if a bangla char is an independent vowel
function isVowel(ch: string): boolean {
  return INDEPENDENT_VOWELS.has(ch);
}

// Roman vowel characters
const ROMAN_VOWELS = new Set("aAeEiIoOuU");

function isRomanVowel(ch: string): boolean {
  return ROMAN_VOWELS.has(ch);
}

/**
 * Transliterate a Roman/English string to Bengali script.
 */
export function transliterate(input: string): string {
  let result = "";
  let i = 0;
  let lastWasConsonant = false; // Track if the last output was a consonant

  while (i < input.length) {
    // Skip non-alphabetic characters (numbers, spaces, punctuation)
    if (!/[a-zA-Z]/.test(input[i])) {
      result += input[i];
      lastWasConsonant = false;
      i++;
      continue;
    }

    // Try to match the longest rule first
    let matched = false;
    for (const [roman, bangla] of RULES) {
      if (input.substring(i, i + roman.length) === roman) {
        if (isVowel(bangla)) {
          if (lastWasConsonant) {
            // After a consonant, use the vowel sign (kar) form
            const sign = VOWEL_SIGNS[bangla];
            if (sign) {
              result += sign;
            }
            // "আ" after consonant is inherent 'অ', so no sign needed for short 'a'
          } else {
            // At the start or after another vowel, use independent form
            result += bangla;
          }
          lastWasConsonant = false;
        } else if (isConsonant(bangla) || bangla.includes("্")) {
          // It's a consonant or conjunct
          // If the previous char was a consonant and this is also consonant,
          // we might need hasanta (্) — but conjuncts already handle this
          result += bangla;
          lastWasConsonant = true;

          // Check if the next character is NOT a vowel — if so, the inherent 'অ' is implied
          // But we only add hasanta if followed by another consonant
          // Actually for simplicity, we add the consonant and let subsequent vowels handle kar
        } else {
          result += bangla;
          lastWasConsonant = false;
        }

        i += roman.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // If no rule matched, pass through the character
      result += input[i];
      lastWasConsonant = false;
      i++;
    }
  }

  return result;
}

/**
 * Check if the entire string is Roman/English characters
 */
export function isRomanText(text: string): boolean {
  return /^[a-zA-Z0-9\s.,!?'"()-]*$/.test(text);
}
