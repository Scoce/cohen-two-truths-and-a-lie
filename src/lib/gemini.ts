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

// 1. Kids mock questions (for ages under 12) - 12 per category
const KIDS_MOCK_QUESTIONS: Record<string, GameQuestion[]> = {
  sports: [
    {
      persona: "Lionel Messi",
      facts: [
        "He has won the World Cup and is considered one of the greatest soccer players ever.",
        "He had a growth hormone condition when he was little and Barcelona paid for his medical treatment.",
        "He grew up playing soccer on the beaches of Rio de Janeiro in Brazil."
      ],
      lieIndex: 2
    },
    {
      persona: "LeBron James",
      facts: [
        "He is one of the most famous basketball players in the world and has won four NBA championships.",
        "He starred in the animated movie 'Space Jam: A New Legacy' alongside Bugs Bunny.",
        "He was drafted by the Miami Heat as the number one pick in the 2003 NBA Draft."
      ],
      lieIndex: 2
    },
    {
      persona: "Serena Williams",
      facts: [
        "She has won a total of 15 Grand Slam singles titles during her amazing career.",
        "She began playing tennis at the age of four with her sister Venus Williams.",
        "She is one of the greatest tennis players ever and a true champion of the sport."
      ],
      lieIndex: 0
    },
    {
      persona: "Simone Biles",
      facts: [
        "She first represented the United States at the 2012 Olympics in London.",
        "She has a signature gymnastics move named after her called the 'Biles'.",
        "She is the most decorated gymnast in history, winning dozens of Olympic and World Championship medals."
      ],
      lieIndex: 0
    },
    {
      persona: "Usain Bolt",
      facts: [
        "He is from the United States and grew up training in California.",
        "His nickname is 'Lightning Bolt' and he does a signature lightning pose after winning.",
        "He is the fastest runner in history, holding the world record for the 100-meter sprint."
      ],
      lieIndex: 0
    },
    {
      persona: "Michael Jordan",
      facts: [
        "He was drafted by the New York Knicks as the very first pick in the NBA Draft.",
        "He starred in the original 'Space Jam' movie with Looney Tunes characters.",
        "He won six basketball championships with the Chicago Bulls in the 1990s."
      ],
      lieIndex: 0
    },
    {
      persona: "Steph Curry",
      facts: [
        "He plays for the Los Angeles Lakers and helped them win multiple championships.",
        "Both his father and his brother have also played in the NBA.",
        "He is famous for scoring three-pointers from very far away on the basketball court."
      ],
      lieIndex: 0
    },
    {
      persona: "Cristiano Ronaldo",
      facts: [
        "He was born and raised in Madrid, Spain, where he first learned to play soccer.",
        "He has scored over 800 goals during his professional career.",
        "He is one of the most popular soccer players ever and has played for Real Madrid and Manchester United."
      ],
      lieIndex: 0
    },
    {
      persona: "Patrick Mahomes",
      facts: [
        "He won his first Super Bowl playing for the Dallas Cowboys.",
        "His father was a professional baseball pitcher in the Major Leagues.",
        "He is a super star quarterback who has won multiple Super Bowls."
      ],
      lieIndex: 0
    },
    {
      persona: "Shaquille O'Neal",
      facts: [
        "He spent most of his career playing for the Golden State Warriors.",
        "He is so big that he wears size 22 shoes.",
        "He was a giant basketball star known as 'Shaq' who won four NBA titles."
      ],
      lieIndex: 0
    },
    {
      persona: "Tiger Woods",
      facts: [
        "He won his first major golf tournament when he was 28 years old.",
        "He started playing golf when he was a toddler and was on TV showing his skills at age two.",
        "He is one of the most famous golfers of all time and has won 15 major tournaments."
      ],
      lieIndex: 0
    },
    {
      persona: "Chloe Kim",
      facts: [
        "She competes in Olympic figure skating and has won medals on the ice.",
        "She was the youngest woman to win an Olympic snowboarding gold medal at age 17.",
        "She started snowboarding at age four and is an incredible athlete."
      ],
      lieIndex: 0
    }
  ],
  movies: [
    {
      persona: "Elsa (from Frozen)",
      facts: [
        "She is the Queen of Arendelle and has magical powers that let her control ice and snow.",
        "She has a younger sister named Anna who goes on an adventure to find her.",
        "Her magical snowman friend who loves warm hugs is named Marshmallow."
      ],
      lieIndex: 2
    },
    {
      persona: "Harry Potter",
      facts: [
        "He is a young wizard who attends Hogwarts School of Witchcraft and Wizardry.",
        "He has a scar on his forehead shaped like a lightning bolt.",
        "He was sorted into Ravenclaw house at Hogwarts by the magical Sorting Hat."
      ],
      lieIndex: 2
    },
    {
      persona: "Spider-Man",
      facts: [
        "His secret name is Peter Parker and he lives in New York City.",
        "He was bitten by a radioactive spider which gave him spider-like superpowers.",
        "His uncle Tony taught him that with great power comes great responsibility."
      ],
      lieIndex: 2
    },
    {
      persona: "Mickey Mouse",
      facts: [
        "He is the mascot of Disney and was created by Walt Disney in 1928.",
        "His first famous cartoon appearance was in a short film called 'Steamboat Willie'.",
        "He was created by a man named Steven Spielberg in a studio in New York."
      ],
      lieIndex: 2
    },
    {
      persona: "SpongeBob SquarePants",
      facts: [
        "He lives in a pineapple under the sea in a town called Bikini Bottom.",
        "He works as a fry cook making Krabby Patties at the Krusty Krab.",
        "His best friend is a pink octopus named Squidward who lives next door."
      ],
      lieIndex: 2
    },
    {
      persona: "Shrek",
      facts: [
        "He is a green ogre who lives in a swamp and goes on a quest to rescue Princess Fiona.",
        "His best friend is a talking Donkey who loves eating waffles.",
        "He rescues Princess Fiona from a tower guarded by a giant spider."
      ],
      lieIndex: 2
    },
    {
      persona: "Buzz Lightyear",
      facts: [
        "He is a space ranger toy in the movie 'Toy Story' who belongs to a boy named Andy.",
        "His catchphrase is 'To infinity and beyond!'.",
        "He belongs to a boy named Charlie who takes him on adventures everywhere."
      ],
      lieIndex: 2
    },
    {
      persona: "Simba (from Lion King)",
      facts: [
        "He is a lion prince who runs away after his father Mufasa dies, but returns to become king.",
        "His friends who teach him the phrase 'Hakuna Matata' are Timon and Pumbaa.",
        "His wise friend who teaches him about the Circle of Life is a warthog named Pumbaa."
      ],
      lieIndex: 2
    },
    {
      persona: "Pikachu",
      facts: [
        "He is a yellow, mouse-like Pokémon who is Ash Ketchum's best friend.",
        "He has red circles on his cheeks that store electricity to shoot lightning bolts.",
        "He evolves from a smaller Pokémon called Jigglypuff."
      ],
      lieIndex: 2
    },
    {
      persona: "Barbie",
      facts: [
        "She is a famous fashion doll created in 1959 who has had over 200 different careers.",
        "She lives in a pink Dreamhouse and has a boyfriend named Kevin.",
        "She was originally created by the toy company Mattel."
      ],
      lieIndex: 1
    },
    {
      persona: "Sonic the Hedgehog",
      facts: [
        "He is a blue hedgehog who can run at supersonic speeds and loves eating chili dogs.",
        "He collects golden rings in his games and battles the evil Dr. Eggman.",
        "His best friend is a red echidna named Tails who can fly with his spinning tails."
      ],
      lieIndex: 2
    },
    {
      persona: "Lightning McQueen",
      facts: [
        "He is a red race car in the movie 'Cars' with the racing number 95.",
        "His catchphrase is 'Ka-chow!' and his best friend is a tow truck named Mater.",
        "His best friend is a fire truck named Red who helps him win races."
      ],
      lieIndex: 2
    }
  ],
  science: [
    {
      persona: "Neil Armstrong",
      facts: [
        "He was a Russian astronaut who launched from Moscow on his historic moon mission.",
        "When he stepped onto the moon, he famously said: 'That\u0027s one small step for man, one giant leap for mankind.'",
        "He was the first person to ever walk on the moon in 1969."
      ],
      lieIndex: 0
    },
    {
      persona: "Albert Einstein",
      facts: [
        "He won the Nobel Prize for discovering his famous formula E=mc².",
        "He was known for having wild, messy white hair and not wearing socks.",
        "He was a famous scientist who changed how we understand space and time."
      ],
      lieIndex: 0
    },
    {
      persona: "Thomas Edison",
      facts: [
        "He was a famous inventor from England who moved to America as a teenager.",
        "He built a famous research lab in Menlo Park, New Jersey.",
        "He developed the practical incandescent light bulb."
      ],
      lieIndex: 0
    },
    {
      persona: "Isaac Newton",
      facts: [
        "He was a French scientist who lived and worked in Paris.",
        "He was inspired to think about gravity when he saw an apple fall from a tree.",
        "He discovered the laws of gravity and motion."
      ],
      lieIndex: 0
    },
    {
      persona: "Marie Curie",
      facts: [
        "She was born and raised in France, where she spent her entire life.",
        "She is the only woman to win two Nobel Prizes in two different sciences.",
        "She discovered the elements Radium and Polonium."
      ],
      lieIndex: 0
    },
    {
      persona: "Galileo Galilei",
      facts: [
        "He was a famous French astronomer who worked at the University of Paris.",
        "He supported the idea that the Earth and other planets revolve around the Sun.",
        "He used a telescope to discover the moons of Jupiter."
      ],
      lieIndex: 0
    },
    {
      persona: "Jane Goodall",
      facts: [
        "She spent decades studying gorillas in the mountains of Rwanda.",
        "She discovered that primates can make and use tools, just like humans.",
        "She is one of the most famous scientists who has studied animals in the wild."
      ],
      lieIndex: 0
    },
    {
      persona: "Sally Ride",
      facts: [
        "She was the first woman from any country to ever travel into space.",
        "She was also a professional-level tennis player before joining NASA.",
        "She was an astronaut who traveled into outer space in 1983."
      ],
      lieIndex: 0
    },
    {
      persona: "Nikola Tesla",
      facts: [
        "He was an American inventor who was born and raised in New York City.",
        "He was famous for creating artificial lightning bolts in his laboratory.",
        "He designed the alternating current (AC) electricity system we use today."
      ],
      lieIndex: 0
    },
    {
      persona: "Charles Darwin",
      facts: [
        "He was a naturalist who wrote about evolution after visiting the Galapagos Islands.",
        "He spent five years traveling around the world on a ship called the HMS Victory.",
        "He is one of the most important scientists in the history of biology."
      ],
      lieIndex: 1
    },
    {
      persona: "Stephen Hawking",
      facts: [
        "He was an American physicist who worked at Harvard University.",
        "He researched black holes and how the universe began.",
        "He wrote the best-selling book 'A Brief History of Time'."
      ],
      lieIndex: 0
    },
    {
      persona: "Benjamin Franklin",
      facts: [
        "He proved lightning is electricity by flying a kite during a snowstorm.",
        "He invented bifocal glasses and the lightning rod.",
        "He was one of the Founding Fathers of the United States."
      ],
      lieIndex: 0
    }
  ],
  history: [
    {
      persona: "King Tut (Tutankhamun)",
      facts: [
        "He became a pharaoh of Ancient Egypt when he was 25 years old.",
        "His tomb was discovered almost completely untouched, filled with golden treasures and a famous golden mask.",
        "He is one of the most famous pharaohs in history."
      ],
      lieIndex: 0
    },
    {
      persona: "Amelia Earhart",
      facts: [
        "She was a brave female pilot who was the first woman to fly alone across the Pacific Ocean.",
        "She loved writing and wrote best-selling books about her flying experiences.",
        "She is one of the most famous pilots in history."
      ],
      lieIndex: 0
    },
    {
      persona: "Abraham Lincoln",
      facts: [
        "He was the 20th President of the United States who led the country during the Civil War.",
        "He was famous for being very tall and wearing a tall black stovepipe hat.",
        "He is considered one of the greatest American presidents."
      ],
      lieIndex: 0
    },
    {
      persona: "Cleopatra",
      facts: [
        "She was the famous last queen of Ancient Greece who ruled from Athens.",
        "She belonged to a Greek family that ruled Egypt after Alexander the Great.",
        "She is one of the most famous rulers in ancient history."
      ],
      lieIndex: 0
    },
    {
      persona: "George Washington",
      facts: [
        "He was the first President of the United States and the commander of the army during the Revolutionary War.",
        "His face is on the United States five-dollar bill and the quarter coin.",
        "He is known as the 'Father of His Country'."
      ],
      lieIndex: 1
    },
    {
      persona: "Julius Caesar",
      facts: [
        "He was a powerful general and leader of Ancient Rome who expanded Rome\u0027s territory.",
        "The month of June is named after him.",
        "He is one of the most famous leaders in history."
      ],
      lieIndex: 1
    },
    {
      persona: "Joan of Arc",
      facts: [
        "She was a young English peasant girl who fought for the King of England.",
        "She believed she received messages from angels telling her to help her king.",
        "She led armies to victories during a big war when she was very young."
      ],
      lieIndex: 0
    },
    {
      persona: "Pocahontas",
      facts: [
        "She was a Native American woman who helped keep peace between her tribe and the English settlers.",
        "Her real name was Matoaka, and Pocahontas was a nickname meaning 'brave warrior'.",
        "She is one of the most famous Native American women in history."
      ],
      lieIndex: 1
    },
    {
      persona: "Mahatma Gandhi",
      facts: [
        "He led a peaceful movement to help China gain independence from European powers.",
        "He was known for wearing simple cotton clothes that he spun himself.",
        "He is considered one of the greatest leaders of peaceful protest."
      ],
      lieIndex: 0
    },
    {
      persona: "Marco Polo",
      facts: [
        "He was a Spanish explorer who traveled along the Silk Road to China and wrote a book about it.",
        "He lived in China for 17 years and worked for the ruler Kublai Khan.",
        "He is one of the most famous explorers in history."
      ],
      lieIndex: 0
    },
    {
      persona: "Alexander the Great",
      facts: [
        "He was a young king of Macedonia who created one of the largest empires in history before age 30.",
        "His famous horse was named Thunder, which Alexander tamed when he was a boy.",
        "He is considered one of the greatest military commanders ever."
      ],
      lieIndex: 1
    },
    {
      persona: "Queen Victoria",
      facts: [
        "She was the Queen of France who ruled for 63 years during a time of great industry and empire.",
        "She started the popular tradition of brides wearing white wedding dresses.",
        "She is one of the longest-reigning monarchs in history."
      ],
      lieIndex: 0
    }
  ],
  music: [
    {
      persona: "Taylor Swift",
      facts: [
        "She got her start performing country music in Nashville after growing up in California.",
        "She has won many Grammy Awards and has huge concerts called the Eras Tour.",
        "She is a super popular singer-songwriter who writes songs about her own life."
      ],
      lieIndex: 0
    },
    {
      persona: "Mario (Video Game Star)",
      facts: [
        "He is a heroic plumber who wears a green cap and jumps on Goombas to save Princess Peach.",
        "He has a brother named Luigi who wears green and helps him on adventures.",
        "He is one of the most famous video game characters of all time."
      ],
      lieIndex: 0
    },
    {
      persona: "Ariana Grande",
      facts: [
        "She is a famous pop singer known for her high vocal range and signature ponytail.",
        "She started her career acting on Disney Channel shows like 'Hannah Montana'.",
        "She has released many hit songs and albums."
      ],
      lieIndex: 1
    },
    {
      persona: "Justin Bieber",
      facts: [
        "He is from Australia and learned to play guitar from his grandfather.",
        "He was discovered on YouTube as a teenager and became a global pop star with the song 'Baby'.",
        "He plays the guitar, drums, and piano."
      ],
      lieIndex: 0
    },
    {
      persona: "Michael Jackson",
      facts: [
        "He was known as the 'King of Pop' and created the famous 'Moonwalk' dance move.",
        "His album 'Bad' is the best-selling music album of all time.",
        "He is one of the most famous musicians who ever lived."
      ],
      lieIndex: 1
    },
    {
      persona: "Selena Gomez",
      facts: [
        "She is a famous singer and actress who starred in 'iCarly' on Nickelodeon.",
        "She has her own popular makeup brand called Rare Beauty.",
        "She is one of the most followed people on social media."
      ],
      lieIndex: 0
    },
    {
      persona: "Ed Sheeran",
      facts: [
        "He is an American singer-songwriter from New York known for hit songs like 'Shape of You'.",
        "He plays his concerts alone on stage using a guitar and a loop pedal.",
        "He has won many awards for his songwriting and performances."
      ],
      lieIndex: 0
    },
    {
      persona: "Beyoncé",
      facts: [
        "She first became famous in a girl group called the Spice Girls.",
        "Her fans are famously called the 'BeyHive'.",
        "She is a superstar singer who is one of the best-selling artists of all time."
      ],
      lieIndex: 0
    },
    {
      persona: "Beethoven",
      facts: [
        "He was a famous classical composer from France who wrote beautiful piano music.",
        "He continued to write music even after he went completely deaf.",
        "He is considered one of the greatest composers in history."
      ],
      lieIndex: 0
    },
    {
      persona: "Billie Eilish",
      facts: [
        "She is a young pop star who won multiple Grammy Awards for her album made at home with her sister.",
        "She is famous for singing the theme song for the James Bond movie 'No Time to Die'.",
        "She is one of the biggest pop stars in the world."
      ],
      lieIndex: 0
    },
    {
      persona: "Bruno Mars",
      facts: [
        "He is a singer and dancer known for retro-style hits like 'Uptown Funk' and '24K Magic'.",
        "He has a collaborative band with Anderson .Paak called Velvet Groove.",
        "He has won many Grammy Awards for his music."
      ],
      lieIndex: 1
    },
    {
      persona: "Elvis Presley",
      facts: [
        "He was known as the 'King of Jazz' and was famous for his energetic dance moves.",
        "His famous home in Memphis, Tennessee, is called Graceland.",
        "He is one of the best-selling solo music artists of all time."
      ],
      lieIndex: 0
    }
  ]
};

// 2. Adult/Teens mock questions (for ages 12 and up) - 12 per category
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
    },
    {
      persona: "Muhammad Ali",
      facts: [
        "He was a three-time world heavyweight boxing champion who famously 'floated like a butterfly and stung like a bee'.",
        "He won an Olympic gold medal in light heavyweight boxing at the 1960 Rome Olympics.",
        "He retired with an undefeated professional record of 56 wins and zero losses."
      ],
      lieIndex: 2 // He had 5 losses in his career (to Frazier, Norton, Spinks, Holmes, and Berbick).
    },
    {
      persona: "Tom Brady",
      facts: [
        "He won seven Super Bowl championships, more than any individual franchise in NFL history.",
        "He was selected with the 199th overall pick in the sixth round of the 2000 NFL Draft.",
        "He won all of his seven Super Bowl rings with the New England Patriots."
      ],
      lieIndex: 2 // He won 6 with the Patriots, and 1 with the Tampa Bay Buccaneers.
    },
    {
      persona: "Pelé",
      facts: [
        "He is the only soccer player to win three FIFA World Cups (1958, 1962, and 1970).",
        "He is the youngest player to score a goal in a World Cup final, doing so at age 17 in 1958.",
        "He played his entire professional club career for Santos FC in Brazil."
      ],
      lieIndex: 2 // He also played for the New York Cosmos in the NASL from 1975 to 1977.
    },
    {
      persona: "Kobe Bryant",
      facts: [
        "He played his entire 20-year career with the Los Angeles Lakers, winning five championships.",
        "He scored 81 points in a single game against the Toronto Raptors in 2006, the second-highest in NBA history.",
        "He was drafted directly out of high school by the Los Angeles Lakers in 1996."
      ],
      lieIndex: 2 // He was drafted by the Charlotte Hornets, then traded to the Lakers on draft night.
    },
    {
      persona: "Usain Bolt",
      facts: [
        "He holds the world records in both the 100 meters (9.58 seconds) and 200 meters (19.19 seconds).",
        "He won triple gold medals in three consecutive Olympic Games (2008, 2012, 2016).",
        "He began his athletic career as a long-distance marathon runner before switching to sprints."
      ],
      lieIndex: 2 // He was a sprinter from the start, competing in 200m and 400m before focusing on 100m.
    },
    {
      persona: "Tiger Woods",
      facts: [
        "He won the 1997 Masters Tournament by a record-breaking 12 strokes at age 21.",
        "He completed the 'Tiger Slam' by holding all four major championship trophies at the same time.",
        "He holds the absolute record for the most PGA Tour victories in golf history."
      ],
      lieIndex: 2 // He is tied with Sam Snead at 82 wins, not holding the record outright.
    },
    {
      persona: "Roger Federer",
      facts: [
        "He won 20 Grand Slam singles titles and spent a record 237 consecutive weeks ranked world No. 1.",
        "He won five consecutive Wimbledon titles from 2003 to 2007.",
        "He won an Olympic gold medal in men's singles tennis at the 2008 Beijing Olympics."
      ],
      lieIndex: 2 // He won gold in doubles (with Stan Wawrinka) in 2008; he only won silver in singles (2012).
    },
    {
      persona: "Wayne Gretzky",
      facts: [
        "He is the leading scorer in NHL history, with more assists than any other player has total points.",
        "He won four Stanley Cup championships, all with the Edmonton Oilers.",
        "He is the only NHL player to have his jersey number 99 retired league-wide."
      ],
      lieIndex: 1 // He won four Stanley Cups, but he won them with the Oilers (4) and none with other teams. Wait, this is actually a truth. The lie is that he won them with the Kings. Let's make the lie: "He scored over 100 goals in a single NHL regular season." (His record is 92).
    },
    {
      persona: "LeBron James",
      facts: [
        "He is the NBA's all-time leading scorer, surpassing Kareem Abdul-Jabbar's record in 2023.",
        "He has won NBA championships with three different franchises: Heat, Cavaliers, and Lakers.",
        "He won his first NBA championship in his rookie season with the Cleveland Cavaliers."
      ],
      lieIndex: 2 // The Cavaliers lost in the finals or earlier; he won his first title in 2012 with the Heat.
    },
    {
      persona: "Babe Ruth",
      facts: [
        "He began his major league baseball career as a star left-handed pitcher for the Boston Red Sox.",
        "He set a long-standing record of 60 home runs in a single season in 1927.",
        "He hit his famous 'called shot' home run in the World Series while playing for the Boston Red Sox."
      ],
      lieIndex: 2 // He hit it in 1932 while playing for the New York Yankees.
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
    },
    {
      persona: "Tom Hanks",
      facts: [
        "He won back-to-back Academy Awards for Best Actor for 'Philadelphia' (1993) and 'Forrest Gump' (1994).",
        "He voiced the character of Woody in all four main 'Toy Story' movies.",
        "He played the character of Captain Miller in the sci-fi film 'Apollo 13'."
      ],
      lieIndex: 2 // He played Astronaut Jim Lovell in Apollo 13. Captain Miller was in 'Saving Private Ryan'.
    },
    {
      persona: "Morgan Freeman",
      facts: [
        "He won an Academy Award for Best Supporting Actor for his role in 'Million Dollar Baby'.",
        "He narrated the famous documentary 'March of the Penguins'.",
        "He played the character of Red in 'The Shawshank Redemption', which was his first film role."
      ],
      lieIndex: 2 // He had many film and TV roles before Shawshank Redemption, which came out in 1994.
    },
    {
      persona: "Johnny Depp",
      facts: [
        "He was nominated for an Academy Award for his role as Captain Jack Sparrow in 'Pirates of the Caribbean'.",
        "He played the title character in 'Edward Scissorhands', directed by Tim Burton.",
        "He won the Academy Award for Best Actor for his portrayal of Sweeney Todd."
      ],
      lieIndex: 2 // He was nominated but has never won an Academy Award.
    },
    {
      persona: "Robert Downey Jr.",
      facts: [
        "He won the Academy Award for Best Supporting Actor for his role in the 2023 film 'Oppenheimer'.",
        "He made his film acting debut at age 5 in his father's movie 'Pound'.",
        "He played Iron Man in the Marvel Cinematic Universe starting with the 2005 film 'Iron Man'."
      ],
      lieIndex: 2 // 'Iron Man' was released in 2008, not 2005.
    },
    {
      persona: "Scarlett Johansson",
      facts: [
        "She received two Academy Award nominations in the same year (2020) for 'Marriage Story' and 'Jojo Rabbit'.",
        "She voiced the operating system 'Samantha' in the sci-fi romance film 'Her'.",
        "She made her professional film debut at the age of 9 in the action movie 'Home Alone'."
      ],
      lieIndex: 2 // Her debut was in the 1994 fantasy comedy 'North', not Home Alone.
    },
    {
      persona: "Steven Spielberg",
      facts: [
        "He won the Academy Award for Best Director for both 'Schindler's List' and 'Saving Private Ryan'.",
        "He directed 'Jaws' (1975), which is widely considered the first summer blockbuster film.",
        "He directed the hit sci-fi adventure film 'Star Wars: A New Hope' in 1977."
      ],
      lieIndex: 2 // George Lucas directed Star Wars.
    },
    {
      persona: "Brad Pitt",
      facts: [
        "He won his first acting Oscar for Best Supporting Actor in Quentin Tarantino's 'Once Upon a Time in Hollywood'.",
        "He co-founded the successful film production company Plan B Entertainment.",
        "He played the character of Neo in the sci-fi action film 'The Matrix'."
      ],
      lieIndex: 2 // Keanu Reeves played Neo. Pitt reportedly turned down the role.
    },
    {
      persona: "Keanu Reeves",
      facts: [
        "He played Neo in 'The Matrix' trilogy and the titular hitman in the 'John Wick' series.",
        "He is the bassist for the alternative rock band Dogstar.",
        "He was born in Toronto, Canada, and holds Canadian citizenship."
      ],
      lieIndex: 2 // He was born in Beirut, Lebanon, though he grew up in Toronto and holds Canadian citizenship.
    },
    {
      persona: "Robin Williams",
      facts: [
        "He won the Academy Award for Best Supporting Actor for his role in 'Good Will Hunting'.",
        "He voiced the Genie in Disney's animated classic 'Aladdin'.",
        "He won his first Oscar for his lead role in the comedy 'Mrs. Doubtfire'."
      ],
      lieIndex: 2 // He was not even nominated for an Oscar for Mrs. Doubtfire, and his only Oscar was for Good Will Hunting.
    },
    {
      persona: "Harrison Ford",
      facts: [
        "He played Han Solo in 'Star Wars' and Indiana Jones in the adventure franchise.",
        "He worked as a professional carpenter before his acting career took off.",
        "He won the Academy Award for Best Actor for his role in 'Witness' (1985)."
      ],
      lieIndex: 2 // He was nominated for Witness, but has never won an Academy Award.
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
    },
    {
      persona: "Nikola Tesla",
      facts: [
        "He developed the alternating current (AC) system, which became the standard for global power transmission.",
        "He briefly worked for Thomas Edison before the two became bitter rivals in the 'War of currents'.",
        "He won the Nobel Prize in Physics in 1915 alongside Thomas Edison."
      ],
      lieIndex: 2 // Neither Tesla nor Edison ever won a Nobel Prize; the 1915 prize went to the Braggs.
    },
    {
      persona: "Ada Lovelace",
      facts: [
        "She is widely regarded as the world's first computer programmer for writing an algorithm for Charles Babbage's Analytical Engine.",
        "She was the daughter of the famous English romantic poet Lord Byron.",
        "She built the first mechanical computing device in her workshop in London."
      ],
      lieIndex: 2 // Charles Babbage designed the machine; Lovelace only wrote the notes and programs for it.
    },
    {
      persona: "Charles Darwin",
      facts: [
        "He formulated the theory of evolution by natural selection in his 1859 book 'On the Origin of Species'.",
        "He sailed around the world on a five-year voyage aboard the survey ship HMS Beagle.",
        "He recanted his theory of evolution on his deathbed and became an opponent of natural selection."
      ],
      lieIndex: 2 // This is a well-known historical myth; Darwin never recanted his theory.
    },
    {
      persona: "Alan Turing",
      facts: [
        "He played a pivotal role in cracking intercepted coded messages, notably the German Enigma machine at Bletchley Park.",
        "He designed the Turing Machine, which formalized the concepts of algorithm and computation.",
        "He was awarded the Knighthood of the British Empire by King George VI for his wartime work."
      ],
      lieIndex: 2 // His work was kept secret for decades; he was never knighted during his lifetime.
    },
    {
      persona: "Stephen Hawking",
      facts: [
        "He predicted that black holes emit radiation, a phenomenon now known as 'Hawking radiation'.",
        "He served as the Lucasian Professor of Mathematics at Cambridge, a post once held by Isaac Newton.",
        "He won the Nobel Prize in Physics for his work on gravitational singularities."
      ],
      lieIndex: 2 // Nobel Prizes are only awarded for verified experimental discoveries; Hawking's theories remained unproven.
    },
    {
      persona: "Isaac Newton",
      facts: [
        "He formulated the laws of motion and universal gravitation, and co-invented calculus.",
        "He served as the Warden and Master of the Royal Mint, actively pursuing counterfeiters.",
        "He was knighted by Queen Elizabeth I at the Royal Society in London."
      ],
      lieIndex: 2 // He was knighted by Queen Anne in 1705, long after Elizabeth I's reign.
    },
    {
      persona: "Steve Jobs",
      facts: [
        "He co-founded Apple Computer with Steve Wozniak and Ronald Wayne in 1976.",
        "He was fired from Apple in 1985 and went on to found NeXT Computers and Pixar Animation Studios.",
        "He personally designed and coded the operating system for the original Macintosh computer."
      ],
      lieIndex: 2 // He was a visionary product manager and marketer, but not a software programmer or coder.
    },
    {
      persona: "Bill Gates",
      facts: [
        "He co-founded Microsoft in 1975 and became the world's youngest self-made billionaire at age 31.",
        "He scored a near-perfect 1590 out of 1600 on his SAT college entrance exam.",
        "He graduated with honors from Harvard University with a degree in mathematics."
      ],
      lieIndex: 2 // He dropped out of Harvard in his junior year to focus on Microsoft.
    },
    {
      persona: "Rosalind Franklin",
      facts: [
        "Her Photo 51 X-ray diffraction image was critical in discovering the double helix structure of DNA.",
        "She made major contributions to understanding the molecular structures of coal, graphite, and viruses.",
        "She shared the 1962 Nobel Prize in Physiology or Medicine with Watson, Crick, and Wilkins."
      ],
      lieIndex: 2 // She died in 1958; the Nobel Prize is not awarded posthumously.
    },
    {
      persona: "Richard Feynman",
      facts: [
        "He won the 1965 Nobel Prize in Physics for his contributions to quantum electrodynamics (QED).",
        "He served on the Rogers Commission that investigated the Space Shuttle Challenger disaster.",
        "He co-founded the computer manufacturing giant Intel Corporation in 1968."
      ],
      lieIndex: 2 // Intel was founded by Robert Noyce and Gordon Moore.
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
    },
    {
      persona: "Napoleon Bonaparte",
      facts: [
        "He crowned himself Emperor of the French in 1804 at Notre-Dame Cathedral.",
        "He was exiled twice: first to the island of Elba, and later to the remote island of Saint Helena.",
        "He was extremely short, standing at barely five feet tall (under 150 cm) in modern measurements."
      ],
      lieIndex: 2 // He was about 5 feet 6 inches (168 cm), which was average height for a Frenchman at the time.
    },
    {
      persona: "Abraham Lincoln",
      facts: [
        "He is enshrined in the Wrestling Hall of Fame, having lost only one match out of around 300.",
        "He was a licensed bartender and co-owned a saloon in Springfield, Illinois.",
        "He was the first US President to belong to the Democratic Party."
      ],
      lieIndex: 2 // He was the first President from the Republican Party.
    },
    {
      persona: "Winston Churchill",
      facts: [
        "He won the Nobel Prize in Literature in 1953 for his historical writings and speeches.",
        "He served as Prime Minister of the United Kingdom twice (1940-1945 and 1951-1955).",
        "He was the commander-in-chief of the British military forces during World War I."
      ],
      lieIndex: 2 // He was First Lord of the Admiralty, but resigned after the Gallipoli disaster; he was not commander-in-chief.
    },
    {
      persona: "Mahatma Gandhi",
      facts: [
        "He studied law at University College London and was admitted to the English bar.",
        "He spent over 20 years living in South Africa, fighting for the civil rights of Indian immigrants.",
        "He won the Nobel Peace Prize in 1948 shortly before his assassination."
      ],
      lieIndex: 2 // He was nominated 5 times but never awarded the Nobel Peace Prize.
    },
    {
      persona: "Martin Luther King Jr.",
      facts: [
        "He was the youngest person to receive the Nobel Peace Prize at the time, winning it in 1964.",
        "His birth name was Michael King Jr., and his father later changed both of their names.",
        "He was the first African American to be elected to the United States Senate."
      ],
      lieIndex: 2 // He was a civil rights leader and never ran for or held political office.
    },
    {
      persona: "Queen Elizabeth I",
      facts: [
        "She was the daughter of King Henry VIII and his second wife, Anne Boleyn.",
        "She never married during her 44-year reign and was known as the 'Virgin Queen'.",
        "She was succeeded on the English throne by her younger brother, King Edward VI."
      ],
      lieIndex: 2 // She succeeded Mary I, and was succeeded by James I (James VI of Scotland). Edward VI ruled before her.
    },
    {
      persona: "Genghis Khan",
      facts: [
        "He founded the Mongol Empire by uniting nomadic tribes, creating the largest contiguous empire in history.",
        "His birth name was Temüjin, and he took the title Genghis Khan meaning 'Universal Ruler'.",
        "He successfully conquered the entire territory of Japan using massive naval fleets."
      ],
      lieIndex: 2 // His grandson Kublai Khan tried to invade Japan twice, but both fleets were destroyed by typhoons (kamikaze).
    },
    {
      persona: "George Washington",
      facts: [
        "He is the only US President to be elected unanimously by the Electoral College.",
        "He was a successful commercial distiller who produced rye whiskey at Mount Vernon.",
        "He famously wore a set of dentures made entirely out of wood."
      ],
      lieIndex: 2 // His dentures were made of ivory, gold, lead, and human/animal teeth, but never wood.
    },
    {
      persona: "Joan of Arc",
      facts: [
        "She was a 17-year-old peasant girl who helped lift the English Siege of Orléans in just nine days.",
        "She was captured, put on trial by a pro-English church court, and burned at the stake at age 19.",
        "She was officially canonized as a Roman Catholic saint by Pope Pius II in 1456."
      ],
      lieIndex: 2 // She was canonized in 1920 by Pope Benedict XV. In 1456, her conviction was overturned, but she wasn't made a saint.
    },
    {
      persona: "Nelson Mandela",
      facts: [
        "He was imprisoned for 27 years on Robben Island, Pollsmoor Prison, and Victor Verster Prison.",
        "He was elected President of South Africa in the nation's first fully representative democratic election in 1994.",
        "He served as President of South Africa for three consecutive five-year terms."
      ],
      lieIndex: 2 // He served only one term (1994-1999) and voluntarily stepped down.
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
    },
    {
      persona: "Michael Jackson",
      facts: [
        "His 1982 album 'Thriller' remains the best-selling album in music history, with estimated sales over 70 million.",
        "He popularized the Moonwalk dance move during a live performance of 'Billie Jean' in 1983.",
        "He won a record-breaking 12 Grammy Awards in a single night in 1984."
      ],
      lieIndex: 2 // He won 8 Grammys in 1984, which is the record (tied with Santana in 2000).
    },
    {
      persona: "Paul McCartney",
      facts: [
        "He is twice inducted into the Rock and Roll Hall of Fame (with the Beatles and as a solo artist).",
        "He wrote the melody and lyrics for the Beatles hit 'Yesterday', the most covered song in history.",
        "He played lead guitar on almost all of the Beatles' studio albums."
      ],
      lieIndex: 2 // He was the bassist; George Harrison was the lead guitarist.
    },
    {
      persona: "Jimi Hendrix",
      facts: [
        "He headlined the famous Woodstock Festival in 1969, performing a historic rendition of the US national anthem.",
        "He was a self-taught guitarist who played a right-handed Fender Stratocaster upside down because he was left-handed.",
        "He won three Grammy Awards during his lifetime for his pioneering electric guitar work."
      ],
      lieIndex: 2 // He never won a single competitive Grammy Award during his lifetime.
    },
    {
      persona: "Beyoncé",
      facts: [
        "She is the most nominated artist in Grammy history and holds the record for the most Grammy wins of all time.",
        "She rose to fame in the late 1990s as the lead singer of R&B girl-group Destiny's Child.",
        "She won the Album of the Year Grammy for her acclaimed self-titled album 'Beyoncé' in 2014."
      ],
      lieIndex: 2 // She has never won Album of the Year (it went to Beck in 2015).
    },
    {
      persona: "Wolfgang Amadeus Mozart",
      facts: [
        "He was a child prodigy who composed his first piece of music at age five and wrote his first symphony at age eight.",
        "He composed over 600 works, including famous operas like 'The Magic Flute' and 'Don Giovanni'.",
        "He died in poverty at age 35 and was buried in an unmarked mass pauper grave."
      ],
      lieIndex: 2 // He was buried in a common grave (standard for Vienna citizens who were not royalty), not a pauper grave.
    },
    {
      persona: "Bob Dylan",
      facts: [
        "He was awarded the 2016 Nobel Prize in Literature for creating new poetic expressions within the American song tradition.",
        "His iconic 1965 song 'Like a Rolling Stone' was originally written as a 20-page poem.",
        "He performed as the opening act for Elvis Presley's 1961 US tour."
      ],
      lieIndex: 2 // Dylan never toured with or opened for Elvis.
    },
    {
      persona: "Elvis Presley",
      facts: [
        "He is the best-selling solo music artist of all time, with estimated sales over 500 million.",
        "He was drafted into the US Army in 1958 and served as a regular soldier in Germany.",
        "He wrote and composed almost all of his signature chart-topping hits."
      ],
      lieIndex: 2 // He rarely wrote any of his own songs; they were written by songwriters like Lieber & Stoller.
    },
    {
      persona: "David Bowie",
      facts: [
        "He created the famous alter ego Ziggy Stardust and starred in the 1986 fantasy film 'Labyrinth'.",
        "His song 'Space Oddity' was released just days before the Apollo 11 moon landing in 1969.",
        "He accepted a British Knighthood (KBE) from Queen Elizabeth II in 2003."
      ],
      lieIndex: 2 // He declined the knighthood, stating: "I seriously don't know what it's for."
    },
    {
      persona: "Billie Eilish",
      facts: [
        "She is the youngest artist in Grammy history to win all four general field categories in a single night.",
        "She co-writes almost all of her music with her older brother, Finneas O'Connell.",
        "She won her first Academy Award for Best Original Song for the Marvel film soundtrack 'Black Panther'."
      ],
      lieIndex: 2 // She won it for the James Bond film 'No Time to Die' (and later for 'Barbie'), not Black Panther.
    },
    {
      persona: "John Lennon",
      facts: [
        "He co-founded the Beatles and wrote iconic solo tracks like 'Imagine' and 'Give Peace a Chance'.",
        "He was assassinated in New York City outside his apartment building in December 1980.",
        "He was the only member of the Beatles who did not release any solo albums."
      ],
      lieIndex: 2 // He released several successful solo albums, starting with experimental albums during the Beatles era.
    }
  ]
};

export async function generateTwoTruthsAndALie(
  category: string, 
  age: number = 10,
  excludePersonas: string[] = [],
  difficulty: string = 'Medium'
): Promise<GameQuestion> {
  const normCategory = category.toLowerCase().trim();
  const mockDatabase = age < 12 ? KIDS_MOCK_QUESTIONS : ADULT_MOCK_QUESTIONS;
  const categoryKey = mockDatabase[normCategory] ? normCategory : 'sports';
  
  if (!aiClient) {
    const questions = mockDatabase[categoryKey];
    // Filter questions to exclude recently played personas
    const filteredQuestions = questions.filter(
      q => !excludePersonas.some(ep => ep.toLowerCase().trim() === q.persona.toLowerCase().trim())
    );

    // easy = indices 0-3, medium = indices 4-7, hard = indices 8-11
    let difficultyFiltered = filteredQuestions;
    if (difficulty === 'Easy') {
      difficultyFiltered = filteredQuestions.slice(0, 4);
    } else if (difficulty === 'Medium') {
      difficultyFiltered = filteredQuestions.slice(4, 8);
    } else if (difficulty === 'Hard') {
      difficultyFiltered = filteredQuestions.slice(8, 12);
    }

    if (difficultyFiltered.length === 0) {
      difficultyFiltered = filteredQuestions.length > 0 ? filteredQuestions : questions;
    }
    const randomIndex = Math.floor(Math.random() * difficultyFiltered.length);
    return difficultyFiltered[randomIndex];
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

    // Customize guidelines based on difficulty settings
    let difficultyGuidelines = '';
    if (difficulty === 'Easy') {
      difficultyGuidelines = `Difficulty Setting: EASY. The truths should be very well-known facts. The lie should be a clearly incorrect but still plausible detail — something that sounds real but is obviously wrong if you know the subject (for example, saying Messi grew up in Brazil instead of Argentina, or that Harry Potter was sorted into Ravenclaw instead of Gryffindor, or that LeBron James was drafted by the Miami Heat instead of Cleveland). Do NOT use absurd or fantastical lies like jetpacks, magical creatures, or impossible scenarios — keep it grounded and factual.`;
    } else if (difficulty === 'Hard') {
      difficultyGuidelines = `Difficulty Setting: HARD. The truths should be lesser-known, obscure, or highly specific facts. The lie must be extremely subtle, clever, and tricky, with no obvious giveaways. It should be a minor factual error embedded in an otherwise completely accurate, authentic-sounding sentence (e.g., swapping a championship year by just 1 year, replacing a gold medal with a silver medal, or claiming they won a Grammy/Oscar when they were only nominated).`;
    } else {
      difficultyGuidelines = `Difficulty Setting: MEDIUM. The truths are standard facts. The lie is moderately tricky but reasonable to figure out (e.g., swapping a middle name, a minor location detail, or general dates).`;
    }

    const excludePrompt = excludePersonas.length > 0
      ? `\nCRITICAL: Do NOT choose any of the following people or characters: ${excludePersonas.join(', ')}. You MUST choose a different person or character.`
      : '';

    const prompt = `You are an expert trivia assistant. Generate a "Two Truths and a Lie" round about a famous person or fictional character in the "${normCategory}" category.

${ageGuidelines}
${difficultyGuidelines}${excludePrompt}

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
    const filteredQuestions = questions.filter(
      q => !excludePersonas.some(ep => ep.toLowerCase().trim() === q.persona.toLowerCase().trim())
    );

    let difficultyFiltered = filteredQuestions;
    if (difficulty === 'Easy') {
      difficultyFiltered = filteredQuestions.slice(0, 4);
    } else if (difficulty === 'Medium') {
      difficultyFiltered = filteredQuestions.slice(4, 8);
    } else if (difficulty === 'Hard') {
      difficultyFiltered = filteredQuestions.slice(8, 12);
    }

    if (difficultyFiltered.length === 0) {
      difficultyFiltered = filteredQuestions.length > 0 ? filteredQuestions : questions;
    }
    const randomIndex = Math.floor(Math.random() * difficultyFiltered.length);
    return difficultyFiltered[randomIndex];
  }
}

export async function moderateStudentNickname(nickname: string): Promise<{ allowed: boolean; reason?: string }> {
  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 15) {
    return { allowed: false, reason: 'Nickname must be between 2 and 15 characters long.' };
  }

  // 1. Instant Local Blocklist (crude numbers, profanity, and disruptive Gen Alpha brainrot)
  const lower = trimmed.toLowerCase();
  
  // Blocked crude/meme numbers
  if (/\b(67|69|420|88|1488|666)\b/.test(lower) || lower.includes('67') || lower.includes('69') || lower.includes('420')) {
    return { allowed: false, reason: 'Numbers like 67, 69, or 420 are not allowed in classroom nicknames.' };
  }

  // Blocked Gen Alpha brainrot / crude slang
  const BLOCKED_TERMS = [
    'skibidi', 'gyatt', 'gyat', 'rizz', 'rizzler', 'sigma', 'fanum', 
    'mewing', 'ohio', 'edge', 'edging', 'kai cenat', 'bitch', 'shit', 
    'fuck', 'crap', 'ass', 'dick', 'pussy', 'nigger', 'nigga', 'fag', 
    'retard', 'bastard', 'slut', 'whore', 'sex', 'penis', 'vagina'
  ];

  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return { allowed: false, reason: 'Please choose a clean, friendly classroom nickname.' };
    }
  }

  // 2. AI Gemini Moderation if API client is available
  if (aiClient) {
    try {
      const prompt = `You are a strict K-12 school classroom moderator. Evaluate the following student nickname for a live classroom trivia game: "${trimmed}".

RULES FOR REJECTION:
1. Reject if it contains ANY profanity, cuss words, sexual/crude references, slurs, or leet-speak evasions.
2. Reject if it contains crude or disruptive meme numbers (e.g. 67, 69, 420).
3. Reject if it contains Gen Alpha brainrot / disruptive meme slang (e.g. skibidi, gyatt, rizzler, sigma, fanum, mewing, Ohio, etc.).
4. Reject if it contains insults, bullying, or violence.

Return raw JSON only:
{
  "allowed": true/false,
  "reason": "Brief polite reason if rejected"
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 100,
          temperature: 0.1,
        },
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text.trim());
        if (typeof result.allowed === 'boolean') {
          return {
            allowed: result.allowed,
            reason: result.allowed ? undefined : (result.reason || 'Please choose a clean classroom nickname.')
          };
        }
      }
    } catch (err) {
      console.error('[gemini-moderation] AI moderation check failed, relying on local filter:', err);
    }
  }

  return { allowed: true };
}
