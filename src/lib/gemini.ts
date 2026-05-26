import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini AI client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
} else {
  console.warn('[gemini] GEMINI_API_KEY is not defined. Falling back to age-appropriate mock generation.');
}

export interface GameQuestion {
  persona: string;
  facts: string[];
  lieIndex: number;
}

// 1. Kids mock questions (for ages under 12)
const KIDS_MOCK_QUESTIONS: Record<string, GameQuestion[]> = {
  sports: [
    {
      persona: "Lionel Messi",
      facts: [
        "He has won the World Cup and is considered one of the greatest soccer players ever.",
        "He had a growth hormone condition when he was little and Barcelona paid for his medical treatment.",
        "He plays professional basketball for the Chicago Bulls when soccer season is over."
      ],
      lieIndex: 2 // He only plays soccer, not professional basketball!
    },
    {
      persona: "LeBron James",
      facts: [
        "He is one of the most famous basketball players in the world and has won four NBA championships.",
        "He starred in the animated movie 'Space Jam: A New Legacy' alongside Bugs Bunny.",
        "He stands at over eight feet tall, making him the tallest human in history."
      ],
      lieIndex: 2 // He is about 6 feet 9 inches tall, not 8 feet tall!
    }
  ],
  movies: [
    {
      persona: "Elsa (from Frozen)",
      facts: [
        "She is the Queen of Arendelle and has magical powers that let her control ice and snow.",
        "She has a younger sister named Anna who goes on an adventure to find her.",
        "Her best friend is a fire-breathing dragon named Mushu who guards the castle."
      ],
      lieIndex: 2 // Mushu is from Mulan, Elsa's snowman friend is Olaf!
    },
    {
      persona: "Harry Potter",
      facts: [
        "He is a young wizard who attends Hogwarts School of Witchcraft and Wizardry.",
        "He has a scar on his forehead shaped like a lightning bolt.",
        "He flies around Hogwarts on a magical flying carpet instead of a broomstick."
      ],
      lieIndex: 2 // Harry flies on a broomstick, not a flying carpet!
    }
  ],
  science: [
    {
      persona: "Neil Armstrong",
      facts: [
        "He was an American astronaut who was the first person to ever walk on the moon in 1969.",
        "When he stepped onto the moon, he famously said: 'That's one small step for man, one giant leap for mankind.'",
        "He brought his pet dog on the rocket ship to run around on the moon with him."
      ],
      lieIndex: 2 // No pets have ever been brought to the moon!
    },
    {
      persona: "Albert Einstein",
      facts: [
        "He was a famous scientist who came up with the world-famous formula E=mc².",
        "He was known for having wild, messy white hair and not wearing socks.",
        "He invented the first handheld smartphone and the mobile internet."
      ],
      lieIndex: 2 // Smartphones were invented long after Einstein's lifetime!
    }
  ],
  history: [
    {
      persona: "King Tut (Tutankhamun)",
      facts: [
        "He became a pharaoh (king) of Ancient Egypt when he was only nine years old.",
        "His tomb was discovered almost completely untouched, filled with golden treasures and a famous golden mask.",
        "He wore a modern digital wristwatch made of solid gold that kept perfect time."
      ],
      lieIndex: 2 // Ancient Egyptians did not have digital wristwatches!
    },
    {
      persona: "Amelia Earhart",
      facts: [
        "She was a brave female pilot who was the first woman to fly alone across the Atlantic Ocean.",
        "She loved writing and wrote best-selling books about her flying experiences.",
        "She successfully flew her airplane all the way into outer space to visit the space station."
      ],
      lieIndex: 2 // Airplanes cannot fly into outer space!
    }
  ],
  music: [
    {
      persona: "Taylor Swift",
      facts: [
        "She is a super popular singer-songwriter who is known for writing songs about her own life.",
        "She has won many Grammy Awards and has huge concerts called the Eras Tour.",
        "She is also a professional soccer player who won an Olympic gold medal."
      ],
      lieIndex: 2 // She is not a soccer player!
    },
    {
      persona: "Mario (Video Game Star)",
      facts: [
        "He is a heroic plumber who wears a red cap and jumps on Goombas to save Princess Peach.",
        "He has a brother named Luigi who wears green and helps him on adventures.",
        "He won a real-life Grammy Award for his hit pop song 'Peaches' on the radio."
      ],
      lieIndex: 2 // Mario is a fictional video game character, he cannot win real-life Grammy awards!
    }
  ]
};

// 2. Adult/Teens mock questions (for ages 12 and up)
const ADULT_MOCK_QUESTIONS: Record<string, GameQuestion[]> = {
  sports: [
    {
      persona: "Michael Jordan",
      facts: [
        "He won six NBA championships with the Chicago Bulls, winning Finals MVP in all of them.",
        "He scored a career-high 69 points in a single game against the Cleveland Cavaliers in 1990.",
        "He played professional baseball for the Chicago White Sox major league team after his first retirement."
      ],
      lieIndex: 2 // He played in the minor leagues (Birmingham Barons), not the major league White Sox.
    },
    {
      persona: "Serena Williams",
      facts: [
        "She has won 23 Grand Slam singles titles, the most by any player in the Open Era.",
        "She won the 2017 Australian Open while she was eight weeks pregnant.",
        "She won her first professional singles title at the age of 14 in her home state of California."
      ],
      lieIndex: 2 // She won her first pro singles title at the 1999 Open Gaz de France in Paris at age 17.
    }
  ],
  movies: [
    {
      persona: "Leonardo DiCaprio",
      facts: [
        "He won his first Academy Award for Best Actor for his role in the 2015 film 'The Revenant'.",
        "He was cast as the lead character in 'Titanic' because he was already an Oscar-nominated actor.",
        "He played the character of Peter Parker in the original 2002 'Spider-Man' film directed by Sam Raimi."
      ],
      lieIndex: 2 // Tobey Maguire played Peter Parker.
    },
    {
      persona: "Meryl Streep",
      facts: [
        "She holds the record for the most Academy Award nominations of any actor, with 21 nominations.",
        "She won her first Oscar for Best Supporting Actress for her role in 'Kramer vs. Kramer'.",
        "She won an Oscar for her performance as Miranda Priestly in 'The Devil Wears Prada'."
      ],
      lieIndex: 2 // She was only nominated for Devil Wears Prada, she did not win.
    }
  ],
  science: [
    {
      persona: "Albert Einstein",
      facts: [
        "He was awarded the 1921 Nobel Prize in Physics for his explanation of the photoelectric effect.",
        "He was offered the presidency of the State of Israel in 1952 but declined the offer.",
        "He failed his high school mathematics exams and was considered a poor student in math."
      ],
      lieIndex: 2 // He did not fail math; he had mastered calculus by age 15.
    },
    {
      persona: "Marie Curie",
      facts: [
        "She is the only person to win Nobel Prizes in two different scientific fields: Physics and Chemistry.",
        "She coined the term 'radioactivity' and discovered the chemical elements polonium and radium.",
        "She was the first woman to be admitted to the French Academy of Sciences."
      ],
      lieIndex: 2 // The French Academy of Sciences rejected her membership in 1911.
    }
  ],
  history: [
    {
      persona: "Julius Caesar",
      facts: [
        "He was kidnapped by Cilician pirates in his youth and insisted they raise his ransom amount.",
        "He was assassinated in the Roman Senate on the Ides of March (March 15) in 44 BC.",
        "He was the first official Emperor of the Roman Empire, ruling for over a decade."
      ],
      lieIndex: 2 // His adopted son Augustus was the first official Emperor.
    },
    {
      persona: "Cleopatra",
      facts: [
        "She was not ethnically Egyptian, but rather belonged to the Greek Macedonian Ptolemaic dynasty.",
        "She was highly educated and was the first of her dynasty to learn the Egyptian language.",
        "She married Roman general Mark Antony in a traditional Roman ceremony in the city of Rome."
      ],
      lieIndex: 2 // Their marriage was in Antioch and was not recognized under Roman law.
    }
  ],
  music: [
    {
      persona: "Freddie Mercury",
      facts: [
        "He was born in Zanzibar (now part of Tanzania) and grew up there and in India before moving to England.",
        "He designed the Queen crest logo himself, having graduated with a degree in art and graphic design.",
        "His birth name was Freddie Bulsara, and he legally changed it to Mercury after Queen formed."
      ],
      lieIndex: 2 // His birth name was Farrokh Bulsara, not Freddie.
    },
    {
      persona: "Taylor Swift",
      facts: [
        "She is the first artist to win the Grammy Award for Album of the Year four times.",
        "She moved to Nashville, Tennessee, at the age of 14 to pursue a career in country music.",
        "She won her first Grammy Award for her self-titled debut album."
      ],
      lieIndex: 2 // She was only nominated for Best New Artist for her first album, she didn't win a Grammy.
    }
  ]
};

export async function generateTwoTruthsAndALie(
  category: string, 
  age: number = 10,
  excludePersonas: string[] = []
): Promise<GameQuestion> {
  const normCategory = category.toLowerCase().trim();
  const mockDatabase = age < 12 ? KIDS_MOCK_QUESTIONS : ADULT_MOCK_QUESTIONS;
  const categoryKey = mockDatabase[normCategory] ? normCategory : 'sports';
  
  if (!aiClient) {
    const questions = mockDatabase[categoryKey];
    // Filter questions to exclude recently played personas
    let filteredQuestions = questions.filter(
      q => !excludePersonas.some(ep => ep.toLowerCase().trim() === q.persona.toLowerCase().trim())
    );
    // If all are filtered (e.g. mock list is exhausted), fall back to original set
    if (filteredQuestions.length === 0) {
      filteredQuestions = questions;
    }
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    return filteredQuestions[randomIndex];
  }

  try {
    // Customize guidelines based on age groups
    let ageGuidelines = '';
    if (age < 12) {
      ageGuidelines = `Target Audience: Children (under 12). Use simple, exciting, and easy-to-read language. Choose extremely famous figures or fictional characters (like Elsa, Mario, Harry Potter, Spider-Man, Messi, Taylor Swift) that a child of this age group would know. CRITICAL: Do NOT make the lie a silly giveaway or a fantasy/absurd mismatch (e.g., do NOT say Lionel Messi plays professional basketball, or Elsa has a pet dragon, or Harry Potter flies on a flying carpet). Instead, make the lie a highly plausible statement that sounds like a real fact, but contains a subtle, incorrect detail that requires careful thinking (e.g., saying Harry Potter's owl is named 'Snowy' instead of 'Hedwig', or that Mario's cap has a star on it instead of an 'M', or that Elsa's magical castle is made of glowing blue glass instead of ice).`;
    } else if (age < 18) {
      ageGuidelines = `Target Audience: Pre-teens and teens (12-17). Choose popular icons, YouTubers, gaming stars, sports champions, or basic historical/scientific figures (like Albert Einstein, Steve Jobs, Ariana Grande, LeBron James). Facts should be interesting, engaging, and readable. CRITICAL: Make the lie highly plausible and tricky, avoiding obvious giveaways. Use minor detail swaps or incorrect numbers/dates (e.g., saying LeBron James won his first championship with the Lakers instead of the Heat, or that Steve Jobs co-founded Apple in 1980 instead of 1976).`;
    } else {
      ageGuidelines = `Target Audience: Adults (18+). Choose famous historical figures, scientists, actors, musicians, and sports champions. Make the statements tricky, challenging, and detailed. CRITICAL: The lie must be an extremely subtle, factually incorrect detail embedded in a completely authentic-sounding sentence (e.g., swapping a release year by 1-2 years, substituting a runner-up award for a win, or attributing a minor achievement to the wrong team or person).`;
    }

    const excludePrompt = excludePersonas.length > 0
      ? `\nCRITICAL: Do NOT choose any of the following people or characters: ${excludePersonas.join(', ')}. You MUST choose a different person or character.`
      : '';

    const prompt = `You are an expert trivia assistant. Generate a "Two Truths and a Lie" round about a famous person or fictional character in the "${normCategory}" category.

${ageGuidelines}${excludePrompt}

Return the result as a raw JSON object with the following structure:
{
  "persona": "Name of the famous person or character",
  "facts": [
    "First statement in age-appropriate language",
    "Second statement in age-appropriate language",
    "Third statement (the lie) in age-appropriate language"
  ],
  "lieIndex": 2
}
Note: The "facts" array MUST contain exactly 3 items. The "lieIndex" MUST correspond to the 0-indexed position of the lie in the "facts" array (so if the lie is the third item, lieIndex is 2). Ensure all strings are correctly escaped and valid JSON.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned empty response');
    }

    const data = JSON.parse(responseText.trim());
    
    // Validate response structure
    if (!data.persona || !Array.isArray(data.facts) || data.facts.length !== 3 || typeof data.lieIndex !== 'number') {
      throw new Error('Invalid JSON structure returned from Gemini');
    }

    return {
      persona: data.persona,
      facts: data.facts,
      lieIndex: data.lieIndex
    };
  } catch (error) {
    console.error(`[gemini] Error calling Gemini API (age: ${age}), falling back to mock:`, error);
    const questions = mockDatabase[categoryKey];
    let filteredQuestions = questions.filter(
      q => !excludePersonas.some(ep => ep.toLowerCase().trim() === q.persona.toLowerCase().trim())
    );
    if (filteredQuestions.length === 0) {
      filteredQuestions = questions;
    }
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    return filteredQuestions[randomIndex];
  }
}
