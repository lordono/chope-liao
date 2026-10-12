/**
 * Chope Liao question bank (~145 items; each session draws 36).
 *
 * How loadings work
 * -----------------
 * Each option carries `loads`: a value in [-1, 1] per dimension it tells us
 * about. Positive pushes toward the dimension's right pole (see
 * engine/dimensions.ts), negative toward the left pole (that is what makes an
 * option reverse-keyed). A question "targets" every dimension that appears in
 * any of its options; an option that omits a targeted dimension counts as 0
 * (the middle) for it. Try to make every targeted dimension show up at both
 * poles across the options so any pick is informative.
 *
 * Rules of thumb
 * - 2–3 dimensions per question, 4 options for scenarios (one of them funny,
 *   but the funny one should still mean something).
 * - Use 1 for a clear signal, 0.5 for a hint.
 * - No questions or jokes about race, religion, NS rank, school prestige,
 *   income or looks.
 *
 * Section counts per session are in engine/sampler.ts (SESSION_MIX).
 */
import type {
  ChoiceOption,
  ChoiceQuestion,
  DealbreakerQuestion,
  FlavourQuestion,
  IdealQuestion,
  Loads,
  PriorityQuestion,
  Question,
} from "../engine/types";

const o = (label: string, loads: Loads): ChoiceOption => ({ label, loads });

// ---------------------------------------------------------------------------
// Light lifestyle (quick taps)
// ---------------------------------------------------------------------------

export const LIFESTYLE: ChoiceQuestion[] = [
  {
    id: "L01",
    kind: "lifestyle",
    prompt: "It's 1am on a Friday. You are…",
    options: [
      o("Asleep, dreaming of tomorrow's kaya toast", { chronotype: -1 }),
      o('In bed saying "one more video"', {
        chronotype: 0.5,
        conscientiousness: -0.5,
      }),
      o("At the prata shop. Supper is a lifestyle.", {
        chronotype: 1,
        extraversion: 0.5,
      }),
      o("Just hitting my most productive hours", {
        chronotype: 1,
        ambition: 0.5,
      }),
    ],
  },
  {
    id: "L02",
    kind: "lifestyle",
    prompt: "Ideal Saturday morning?",
    options: [
      o("Park connector run before the sun gets fierce", {
        activity: 1,
        chronotype: -1,
      }),
      o("Long brunch with friends", { extraversion: 0.5, activity: -0.5 }),
      o("Sleeping in. Obviously.", { chronotype: 1, activity: -0.5 }),
      o("Exploring a neighbourhood I've never been to", {
        openness: 1,
        activity: 0.5,
      }),
    ],
  },
  {
    id: "L03",
    kind: "lifestyle",
    prompt: "Your room right now is…",
    options: [
      o("Hotel-level. Everything has its place.", {
        tidiness: 1,
        conscientiousness: 0.5,
      }),
      o('Tidy-ish. The chair holds the "clean but not folded" pile.', {
        tidiness: -0.5,
      }),
      o("Organised chaos. I know where everything is.", { tidiness: -1 }),
      o("Spotless, because I stress-cleaned last night", {
        tidiness: 1,
        steadiness: -0.5,
      }),
    ],
  },
  {
    id: "L04",
    kind: "lifestyle",
    prompt: "A new hawker stall with a crazy queue opens near you. You…",
    options: [
      o("Join the queue. Must try.", { foodAdventure: 1, openness: 0.5 }),
      o("Wait a few weeks for the hype to die down, then try", {
        foodAdventure: 0.5,
        conscientiousness: 0.5,
      }),
      o("Stick with my usual chicken rice uncle. Loyal till the end.", {
        foodAdventure: -1,
        openness: -0.5,
      }),
      o("Ask a friend in the queue to da bao one for me", {
        foodAdventure: 0.5,
        lead: 0.5,
      }),
    ],
  },
  {
    id: "L05",
    kind: "lifestyle",
    prompt: "Your texting style is closest to…",
    options: [
      o("Blue ticks within seconds", { texting: 1 }),
      o("A few replies a day, but long ones", { texting: -1, affection: 0.5 }),
      o("Voice notes. Many voice notes.", {
        texting: 0.5,
        extraversion: 0.5,
        affection: 0.5,
      }),
      o("I reply in my head and forget to send", {
        texting: -1,
        conscientiousness: -0.5,
      }),
    ],
  },
  {
    id: "L06",
    kind: "lifestyle",
    consistency: "extraversion",
    prompt: "After a big week, the best way to recharge is…",
    options: [
      o("Dinner with the whole gang", { extraversion: 1 }),
      o("One close friend, one good kopi", { extraversion: -0.5 }),
      o("Alone time. Phone on silent.", { extraversion: -1 }),
      o("Karaoke till they chase us out", { extraversion: 1, humour: 0.5 }),
    ],
  },
  {
    id: "L07",
    kind: "lifestyle",
    prompt: "Bonus just came in. First move?",
    options: [
      o("Straight into savings or investments", {
        money: -1,
        conscientiousness: 0.5,
      }),
      o("Treat myself to the thing I've been eyeing", { money: 1 }),
      o("Book a trip", { money: 0.5, roam: 0.5, openness: 0.5 }),
      o("Belanja my family and friends", {
        money: 0.5,
        agreeableness: 0.5,
        family: 0.5,
      }),
    ],
  },
  {
    id: "L08",
    kind: "lifestyle",
    prompt: "Pick your ideal date activity",
    options: [
      o("Cycling at East Coast", { activity: 1 }),
      o("Museum or art exhibition", { openness: 1, activity: -0.5 }),
      o("Movie marathon at home", { activity: -1, extraversion: -0.5 }),
      o("Night market food crawl", { foodAdventure: 1, chronotype: 0.5 }),
    ],
  },
  {
    id: "L09",
    kind: "lifestyle",
    consistency: "lead",
    prompt:
      'When the group chat goes "anyone keen?", you\'re usually the one who…',
    options: [
      o("Makes the poll and books the place", {
        lead: 1,
        conscientiousness: 0.5,
      }),
      o('Says "keen!" and waits for details', { lead: -1 }),
      o("Suggests three ideas and lets others pick", {
        lead: 0.5,
        agreeableness: 0.5,
      }),
      o("Reacts with a thumbs up, then appears on the day", {
        lead: -1,
        texting: -0.5,
      }),
    ],
  },
  {
    id: "L10",
    kind: "lifestyle",
    prompt: "Friday 6pm and work isn't done. You…",
    options: [
      o("Stay till it's done. It bugs me otherwise.", {
        ambition: 1,
        conscientiousness: 0.5,
      }),
      o("Log off. Monday problem.", { ambition: -1, steadiness: 0.5 }),
      o("Finish the urgent bits, rest can wait", {
        ambition: 0.5,
        conscientiousness: 0.5,
      }),
      o("Log off, then think about it all weekend", {
        ambition: 0.5,
        steadiness: -1,
      }),
    ],
  },
  {
    id: "L11",
    kind: "lifestyle",
    prompt: "Weekly family dinner is…",
    options: [
      o("Non-negotiable, every week", { family: 1 }),
      o("Often, when schedules line up", { family: 0.5 }),
      o("Mostly for special occasions", { family: -0.5 }),
      o("We have a family group chat. That counts, right?", {
        family: -1,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "L12",
    kind: "lifestyle",
    prompt: "Where do you see yourself in 10 years?",
    options: [
      o("Same neighbourhood, near my favourite hawker centre", {
        roam: -1,
        family: 0.5,
      }),
      o("Singapore, but maybe a new estate", { roam: -0.5 }),
      o("Could be anywhere. Open to working overseas.", {
        roam: 1,
        openness: 0.5,
      }),
      o("Somewhere with four seasons, at least for a few years", { roam: 1 }),
    ],
  },
  {
    id: "L13",
    kind: "lifestyle",
    prompt: "In a relationship, weekends should be…",
    options: [
      o("Mostly together. That's the point.", { togetherness: 1 }),
      o("Half together, half our own plans", { togetherness: 0 }),
      o("Mostly our own plans, then meet for dinner", {
        togetherness: -1,
        attachAvoidance: 0.5,
      }),
      o("Together, but doing separate things on the same sofa", {
        togetherness: 0.5,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "L14",
    kind: "lifestyle",
    prompt: "How do you usually show you care?",
    options: [
      o("Say it, often and out loud", { affection: 1 }),
      o("Do things: fix stuff, fetch them, da bao their favourite", {
        affection: -0.5,
        agreeableness: 0.5,
      }),
      o("Hugs and hand-holding", { affection: 1, togetherness: 0.5 }),
      o("Send memes at 2am", { humour: 1, affection: -0.5 }),
    ],
  },
  {
    id: "L15",
    kind: "lifestyle",
    prompt: "Your humour is mostly…",
    options: [
      o("Sarcastic. I roast my friends with love.", {
        humour: 1,
        agreeableness: -0.5,
      }),
      o("Wordplay and lame puns", { humour: 0.5, openness: 0.5 }),
      o("Quietly funny, catch me in a small group", {
        humour: -0.5,
        extraversion: -0.5,
      }),
      o("Gentle and wholesome", { humour: -1, agreeableness: 0.5 }),
    ],
  },
  {
    id: "L16",
    kind: "lifestyle",
    prompt: "Phone at 5%, no charger, still two hours from home. You…",
    options: [
      o("Fine lah, it'll survive", { steadiness: 1 }),
      o("Slight panic, start asking strangers for a cable", {
        steadiness: -1,
        extraversion: 0.5,
      }),
      o("Low power mode, brightness zero, monk mode", {
        steadiness: 0.5,
        conscientiousness: 0.5,
      }),
      o("I carry a power bank. Obviously.", { conscientiousness: 1 }),
    ],
  },
  {
    id: "L17",
    kind: "lifestyle",
    consistency: "conscientiousness",
    prompt: "Packing for a holiday, you…",
    options: [
      o("Checklist, a week before", { conscientiousness: 1, tidiness: 0.5 }),
      o("Night before, mostly fine", { conscientiousness: -0.5 }),
      o("Two hours before the flight. Adrenaline is my planner.", {
        conscientiousness: -1,
        steadiness: 0.5,
      }),
      o("Buy a toothbrush at Changi every single time", {
        conscientiousness: -1,
        money: 0.5,
      }),
    ],
  },
  {
    id: "L18",
    kind: "lifestyle",
    prompt: "At a zi char dinner, what do you order?",
    options: [
      o("Something I've never tried before", { foodAdventure: 1, openness: 1 }),
      o("The usual dishes. They're good for a reason.", {
        foodAdventure: -1,
        openness: -0.5,
      }),
      o("Let the auntie recommend", { openness: 0.5, lead: -0.5 }),
      o("I order for the whole table. Everybody's having sambal kangkong.", {
        lead: 1,
        foodAdventure: 0.5,
      }),
    ],
  },
  {
    id: "L19",
    kind: "lifestyle",
    prompt: "Best time to reach you?",
    options: [
      o("7am. I'm already caffeinated.", { chronotype: -1 }),
      o("Lunch break", { chronotype: 0 }),
      o("After 10pm, peak chatting hours", { chronotype: 1, texting: 0.5 }),
      o("Whenever, but expect a reply tomorrow", { texting: -1 }),
    ],
  },
  {
    id: "L20",
    kind: "lifestyle",
    prompt: "Dishes after dinner?",
    options: [
      o("Washed immediately. The sink must be empty.", { tidiness: 1 }),
      o("Soak now, wash later", { tidiness: -0.5 }),
      o("Tomorrow-me problem", { tidiness: -1, conscientiousness: -0.5 }),
      o("Whoever didn't cook washes. Fair is fair.", {
        tidiness: 0.5,
        agreeableness: 0.5,
      }),
    ],
  },
  {
    id: "L21",
    kind: "lifestyle",
    prompt: "Your idea of exercise is…",
    options: [
      o("Gym or a run, most days", { activity: 1, conscientiousness: 0.5 }),
      o("Team sports. It's social!", { activity: 1, extraversion: 1 }),
      o("Walking to the MRT counts", { activity: -0.5, humour: 0.5 }),
      o("Exercise? I do intense scrolling.", { activity: -1 }),
    ],
  },
  {
    id: "L22",
    kind: "lifestyle",
    prompt: "Durian?",
    options: [
      o("King of fruits. I'll drive up north for the good ones.", {
        foodAdventure: 1,
        roam: 0.5,
      }),
      o("Sometimes, if someone else opens it", { foodAdventure: 0.5 }),
      o("I respect it from a distance", { foodAdventure: -0.5 }),
      o("Absolutely not in my house", { foodAdventure: -1, tidiness: 0.5 }),
    ],
  },
  {
    id: "L23",
    kind: "lifestyle",
    prompt: "Which sounds most like a good life?",
    options: [
      o("Climbing high and building something big", { ambition: 1 }),
      o("Enough money and lots of free time", { ambition: -1 }),
      o("A comfy home, a good makan spot nearby, people I love close", {
        ambition: -0.5,
        family: 0.5,
        roam: -0.5,
      }),
      o("Travelling the world with one backpack", { roam: 1, openness: 0.5 }),
    ],
  },
  {
    id: "L24",
    kind: "lifestyle",
    prompt: "The family group chat pings. You…",
    options: [
      o("Reply right away", { family: 1, texting: 0.5 }),
      o("Read it, react with a thumbs up", { texting: -0.5 }),
      o("It's on mute. I catch up weekly.", { family: -1, texting: -0.5 }),
      o('Send a "Good morning" flower picture back', {
        family: 0.5,
        humour: 1,
      }),
    ],
  },
  {
    id: "L25",
    kind: "lifestyle",
    prompt: "Midnight 12.12 online sale. You…",
    options: [
      o("Add to cart, then delete everything. Money stays.", { money: -1 }),
      o("Buy what's on my list, nothing more", {
        money: -0.5,
        conscientiousness: 0.5,
      }),
      o("Things I didn't know I needed are now arriving", {
        money: 1,
        conscientiousness: -0.5,
      }),
      o("Sales are cardio for my thumbs", {
        money: 1,
        humour: 0.5,
        chronotype: 0.5,
      }),
    ],
  },
  {
    id: 'L26',
    kind: 'lifestyle',
    prompt: 'Your alarm goes off. You…',
    options: [
      o('Up on the first ring', { chronotype: -1, conscientiousness: 0.5 }),
      o('Snooze, snooze, snooze', { chronotype: 0.5, conscientiousness: -0.5 }),
      o('Woke up before it, as usual', { chronotype: -1 }),
      o('Alarm? I start my day when I wake up', { chronotype: 1, ambition: -0.5 }),
    ],
  },
  {
    id: 'L27',
    kind: 'lifestyle',
    prompt: 'Supper after 11pm is…',
    options: [
      o('A sacred ritual', { chronotype: 1, foodAdventure: 0.5 }),
      o('Once in a while, if friends drag me out', { chronotype: 0, extraversion: 0.5 }),
      o("I'm asleep, sorry", { chronotype: -1 }),
      o("Only if it's prata", { chronotype: 0.5, foodAdventure: -0.5 }),
    ],
  },
  {
    id: 'L28',
    kind: 'lifestyle',
    prompt: 'Clean laundry gets folded…',
    options: [
      o('Same day, straight into the cupboard', { tidiness: 1, conscientiousness: 0.5 }),
      o('Sometime within the week', { tidiness: 0 }),
      o("Never. It lives on the chair now. It's home.", { tidiness: -1 }),
      o('We pick clothes straight off the drying rack', { tidiness: -0.5, conscientiousness: -0.5 }),
    ],
  },
  {
    id: 'L29',
    kind: 'lifestyle',
    prompt: "Open your fridge right now. It's…",
    options: [
      o('Labelled containers, meal prep for the week', { tidiness: 1, conscientiousness: 1 }),
      o('Normal-ish, plus some mystery leftovers', { tidiness: -0.5 }),
      o('Mostly drinks and sauces. I eat out.', { foodAdventure: 0.5, tidiness: -0.5 }),
      o('Full of snacks for whoever drops by', { extraversion: 0.5, agreeableness: 0.5 }),
    ],
  },
  {
    id: 'L30',
    kind: 'lifestyle',
    prompt: 'How often do you check your banking app?',
    options: [
      o('Daily. I track every dollar.', { money: -1, conscientiousness: 0.5 }),
      o('A weekly check-in', { money: -0.5 }),
      o('Around payday', { money: 0.5 }),
      o('Rarely. Ignorance is bliss.', { money: 1, conscientiousness: -0.5 }),
    ],
  },
  {
    id: 'L31',
    kind: 'lifestyle',
    prompt: "Group gift for a friend's birthday. You…",
    options: [
      o('Set up the collection and a tracking sheet', { lead: 1, conscientiousness: 1 }),
      o('Chip in whatever, no fuss', { lead: -0.5, agreeableness: 0.5 }),
      o('Suggest a homemade gift instead', { money: -0.5, openness: 0.5 }),
      o('Already bought my own gift separately', { lead: 0.5, extraversion: -0.5 }),
    ],
  },
  {
    id: 'L32',
    kind: 'lifestyle',
    prompt: 'A weekend with zero obligations. You…',
    options: [
      o('Hike at MacRitchie or Bukit Timah', { activity: 1, openness: 0.5 }),
      o('Go café hopping', { foodAdventure: 0.5, activity: -0.5 }),
      o('Gaming or bingeing a series at home', { activity: -1, extraversion: -0.5 }),
      o('Volunteer or help out somewhere', { agreeableness: 1, extraversion: 0.5 }),
    ],
  },
  {
    id: 'L33',
    kind: 'lifestyle',
    prompt: 'Stairs or escalator at the MRT station?',
    options: [
      o('Stairs, every time', { activity: 1 }),
      o('Escalator, but I walk up it', { activity: 0.5, conscientiousness: 0.5 }),
      o('Escalator. Stand on the left, phone out.', { activity: -1 }),
      o("The lift. I've earned it.", { activity: -1, humour: 0.5 }),
    ],
  },
  {
    id: 'L34',
    kind: 'lifestyle',
    prompt: 'Your holiday style?',
    options: [
      o("Somewhere I've never heard of", { openness: 1, roam: 0.5 }),
      o("My favourite city, I've been five times", { openness: -1 }),
      o('Beach resort, do absolutely nothing', { activity: -1, openness: -0.5 }),
      o('A packed schedule of sights', { activity: 1, conscientiousness: 0.5 }),
    ],
  },
  {
    id: 'L35',
    kind: 'lifestyle',
    prompt: 'A friend recommends a strange new hobby. You…',
    options: [
      o('Sign up immediately', { openness: 1 }),
      o('Try it once, to be nice', { openness: 0.5, agreeableness: 0.5 }),
      o('Nah, I like my usual hobbies', { openness: -1 }),
      o('Ask a hundred questions first', { conscientiousness: 0.5 }),
    ],
  },
  {
    id: 'L36',
    kind: 'lifestyle',
    prompt: 'Someone texts "Can call?" You…',
    options: [
      o('Call back right away', { texting: 1 }),
      o('"Can text instead?"', { texting: 0.5, extraversion: -0.5 }),
      o('Panic. What happened??', { steadiness: -1, attachAnxiety: 0.5 }),
      o('See it three hours later', { texting: -1 }),
    ],
  },
  {
    id: 'L37',
    kind: 'lifestyle',
    prompt: 'Read receipts: on or off?',
    options: [
      o('On. Nothing to hide.', { texting: 0.5, agreeableness: 0.5 }),
      o('Off. I reply when I can.', { texting: -1, attachAvoidance: 0.5 }),
      o("On, and I notice when others don't reply", { texting: 1, attachAnxiety: 0.5 }),
      o('Never thought about it', { texting: -0.5, steadiness: 0.5 }),
    ],
  },
  {
    id: 'L38',
    kind: 'lifestyle',
    prompt: 'Anniversaries are…',
    options: [
      o('Celebrated, every single one, even monthly', { affection: 1, conscientiousness: 0.5 }),
      o('The yearly ones, yes. Monthly? Hmm.', { affection: 0 }),
      o('A nice dinner is enough', { affection: -0.5 }),
      o('Not a big deal to me', { affection: -1 }),
    ],
  },
  {
    id: 'L39',
    kind: 'lifestyle',
    prompt: 'Holding hands in public?',
    options: [
      o('Yes, always', { affection: 1, togetherness: 0.5 }),
      o('Sometimes, depends on the crowd', { affection: 0 }),
      o('Not really my thing', { affection: -1 }),
      o('Only at the traffic light. Safety first.', { affection: -0.5, conscientiousness: 0.5 }),
    ],
  },
  {
    id: 'L40',
    kind: 'lifestyle',
    prompt: 'Your ideal job is one that…',
    options: [
      o('Lets me grow fast and lead big things', { ambition: 1, lead: 0.5 }),
      o('Is steady and ends at 6pm', { ambition: -1 }),
      o('Lets me work from anywhere', { roam: 1, openness: 0.5 }),
      o("Feels meaningful, even if it's slower", { ambition: -0.5, agreeableness: 0.5 }),
    ],
  },
  {
    id: 'L41',
    kind: 'lifestyle',
    prompt: 'Side projects on weekends?',
    options: [
      o('Always have one going', { ambition: 1, conscientiousness: 0.5 }),
      o('Sometimes, when inspiration hits', { ambition: 0.5, openness: 0.5 }),
      o('Weekends are for rest', { ambition: -1, steadiness: 0.5 }),
      o('My side project is finding the best char kway teow', { foodAdventure: 1, ambition: -0.5 }),
    ],
  },
  {
    id: 'L42',
    kind: 'lifestyle',
    prompt: 'Dropping by family for a weeknight dinner is…',
    options: [
      o('Normal. We do it all the time.', { family: 1 }),
      o('Nice now and then', { family: 0.5 }),
      o('Better planned, on weekends', { family: -0.5, conscientiousness: 0.5 }),
      o('Rare. We video call instead.', { family: -1, texting: 0.5 }),
    ],
  },
  {
    id: 'L43',
    kind: 'lifestyle',
    prompt: "Your partner wants to join your regular friends' outing. You…",
    options: [
      o('Of course! The more the merrier.', { togetherness: 1, extraversion: 0.5 }),
      o('Sometimes, but some outings are just for me', { togetherness: -0.5 }),
      o('Already invited them before they asked', { togetherness: 1, affection: 0.5 }),
      o('Hmm, friend time is my me-time', { togetherness: -1, attachAvoidance: 0.5 }),
    ],
  },
  {
    id: 'L44',
    kind: 'lifestyle',
    prompt: 'A long weekend is coming. You…',
    options: [
      o("Book a flight the moment it's announced", { roam: 1, conscientiousness: 0.5 }),
      o('Quick trip across the Causeway', { roam: 0.5, foodAdventure: 0.5 }),
      o("Explore a part of Singapore I don't know", { roam: -0.5, openness: 0.5 }),
      o('Stay home. The island is empty, finally.', { roam: -1, extraversion: -0.5 }),
    ],
  },
  {
    id: 'L45',
    kind: 'lifestyle',
    prompt: 'A friend says something that hurts. You…',
    options: [
      o('Tell them straight away how it felt', { conflict: 1, steadiness: 0.5 }),
      o('Let it cool, bring it up later', { conflict: -0.5, steadiness: 0.5 }),
      o('Let it go. Not worth the drama.', { conflict: -1, agreeableness: 0.5 }),
      o('Make a pointed joke about it in the group chat', { conflict: -0.5, agreeableness: -1, humour: 0.5 }),
    ],
  },
  {
    id: 'L46',
    kind: 'lifestyle',
    prompt: 'Your food order arrives wrong. You…',
    options: [
      o("Eat it anyway. It's fine.", { agreeableness: 1, conflict: -1 }),
      o('Politely ask them to change it', { conflict: 0.5 }),
      o("Complain firmly. It's their job.", { agreeableness: -1, conflict: 1 }),
      o("Try it. Maybe it's better.", { openness: 1, foodAdventure: 0.5 }),
    ],
  },
  {
    id: 'L47',
    kind: 'lifestyle',
    prompt: 'In the lift with a neighbour you half know. You…',
    options: [
      o('Small talk all the way', { extraversion: 1 }),
      o('Smile and nod', { extraversion: -0.5 }),
      o('Suddenly very interested in my phone', { extraversion: -1 }),
      o("I know their cat's name and birthday", { extraversion: 1, agreeableness: 0.5 }),
    ],
  },
  {
    id: 'L48',
    kind: 'lifestyle',
    prompt: 'Plans change at the last minute. You…',
    options: [
      o('No problem, I adapt', { steadiness: 1, openness: 0.5 }),
      o('Bit annoyed, but okay', { steadiness: 0 }),
      o('It throws off my whole day', { steadiness: -1 }),
      o('Secretly relieved. More home time.', { extraversion: -1 }),
    ],
  },
  {
    id: 'L49',
    kind: 'lifestyle',
    prompt: 'Your favourite kind of show?',
    options: [
      o('Sitcoms and comedy specials', { humour: 1 }),
      o('Heartfelt dramas', { humour: -1, affection: 0.5 }),
      o('Documentaries', { openness: 1, humour: -0.5 }),
      o('Reality shows, for the chaos', { extraversion: 0.5, humour: 0.5 }),
    ],
  },
  {
    id: 'L50',
    kind: 'lifestyle',
    prompt: 'Your best ideas come…',
    options: [
      o('Early morning, with kopi', { chronotype: -1 }),
      o('In the shower, any time', { openness: 0.5 }),
      o('Past midnight', { chronotype: 1 }),
      o('On a long walk', { activity: 0.5, steadiness: 0.5 }),
    ],
  },
  {
    id: 'L51',
    kind: 'lifestyle',
    prompt: "Your phone's home screen?",
    options: [
      o('Neat folders, sorted by colour', { tidiness: 1, conscientiousness: 0.5 }),
      o('A few folders, mostly fine', { tidiness: 0 }),
      o('47 notifications and counting', { tidiness: -1, texting: -0.5 }),
      o('Zero unread. Always.', { texting: 1, tidiness: 0.5 }),
    ],
  },
  {
    id: 'L52',
    kind: 'lifestyle',
    prompt: 'A new café with 40 items on the menu. You…',
    options: [
      o("Ask the staff what's most popular", { openness: -0.5, extraversion: 0.5 }),
      o('Order the weirdest thing on it', { foodAdventure: 1, openness: 1 }),
      o("Whatever's closest to my usual", { foodAdventure: -1 }),
      o('Spend ten minutes reading every option', { conscientiousness: 0.5, lead: -0.5 }),
    ],
  },
  {
    id: 'L53',
    kind: 'lifestyle',
    prompt: "Planning a friend's surprise party, you'd rather be…",
    options: [
      o('The mastermind', { lead: 1, conscientiousness: 0.5 }),
      o('The one keeping the birthday person distracted', { extraversion: 1, lead: -0.5 }),
      o('Bringing the cake and following instructions', { lead: -1, agreeableness: 0.5 }),
      o('The one most likely to accidentally spoil it', { conscientiousness: -0.5, humour: 0.5 }),
    ],
  },
];

// ---------------------------------------------------------------------------
// Flavour (always asked, zero scoring weight, used for highlights + card)
// ---------------------------------------------------------------------------

export const FLAVOUR: FlavourQuestion[] = [
  {
    id: "F01",
    kind: "flavour",
    key: "kopi",
    prompt: "How do you order your kopi?",
    hint: "Just for fun. This one doesn't change your match score.",
    options: [
      {
        label: "Kopi-O kosong. Straight up.",
        highlight: "order Kopi-O kosong",
      },
      { label: "Kopi-C siew dai", highlight: "order Kopi-C siew dai" },
      {
        label: "Teh peng. Kopi isn't my thing.",
        highlight: "pick teh over kopi",
      },
      {
        label: "Oat latte from a café",
        highlight: "go for the café oat latte",
      },
    ],
  },
  {
    id: "F02",
    kind: "flavour",
    key: "chope",
    prompt: "Choping a seat with a tissue packet: valid or not?",
    hint: "Just for fun. This one doesn't change your match score.",
    options: [
      {
        label: "Valid. Sacred hawker law.",
        highlight: "treat the tissue-packet chope as sacred law",
      },
      {
        label: "Valid, but only during lunch peak",
        highlight: "say tissue chope only counts at lunch peak",
      },
      {
        label: "Not valid. First come, first served.",
        highlight: "say first come, first served",
      },
      {
        label: "I chope with my umbrella. More legit.",
        highlight: "chope seats with umbrellas",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Scenarios (behaviour-based, 4 options, one funny)
// ---------------------------------------------------------------------------

export const SCENARIOS: ChoiceQuestion[] = [
  {
    id: "S01",
    kind: "scenario",
    prompt: "Your friend cancels makan 30 minutes before. You…",
    options: [
      o('"No worries!" and send three new dates', {
        agreeableness: 1,
        conscientiousness: 0.5,
      }),
      o('"Okay lor", then feel a bit sian all evening', {
        steadiness: -1,
        agreeableness: 0.5,
      }),
      o("Go anyway. A solo hawker run is a vibe.", {
        extraversion: -0.5,
        steadiness: 1,
      }),
      o("Already at the table, so I order their share and da bao it for them", {
        agreeableness: 1,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S02",
    kind: "scenario",
    prompt: "MRT breakdown on the way to a first date. You…",
    options: [
      o("Text right away with an ETA and a sorry", {
        conscientiousness: 1,
        texting: 0.5,
      }),
      o("Book a Grab immediately. Cannot be late.", {
        conscientiousness: 0.5,
        money: 0.5,
        steadiness: -0.5,
      }),
      o("Make friends with the other stranded commuters, arrive with a story", {
        extraversion: 1,
        steadiness: 1,
      }),
      o("Stand on the platform wondering if it's a sign from the universe", {
        steadiness: -1,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S03",
    kind: "scenario",
    heavy: true,
    prompt: "Your partner says \"I'm fine\" but clearly isn't. You…",
    options: [
      o("Ask gently now. I'd rather talk it out.", {
        conflict: 1,
        attachAnxiety: 0.5,
      }),
      o("Give them space and check in later tonight", {
        conflict: -1,
        agreeableness: 0.5,
      }),
      o("Turn up with their favourite bubble tea and wait", {
        affection: 1,
        conflict: -0.5,
      }),
      o('Also say "I\'m fine". Two can play.', {
        agreeableness: -1,
        attachAvoidance: 0.5,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S04",
    kind: "scenario",
    consistency: "lead",
    prompt: "Group trip to JB. Who plans?",
    options: [
      o("Me. There's already a spreadsheet.", {
        lead: 1,
        conscientiousness: 1,
      }),
      o("I'll sort out food, someone else does transport", {
        lead: 0.5,
        foodAdventure: 0.5,
      }),
      o("Whoever. I just turn up at Woodlands on time.", {
        lead: -1,
        agreeableness: 0.5,
      }),
      o('The one who says "anyone keen?" and then disappears', {
        lead: -1,
        conscientiousness: -0.5,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S05",
    kind: "scenario",
    heavy: true,
    prompt: "Your BTO ballot (or dream rental) falls through again. You…",
    options: [
      o("Spreadsheet the next launch, plus three backup plans", {
        conscientiousness: 1,
        steadiness: 0.5,
      }),
      o('Sad for a day, then "next one lah"', { steadiness: 1 }),
      o("Rethink everything: resale, renting, maybe even another city", {
        openness: 1,
        roam: 1,
      }),
      o("Shrug. Home is wherever my people and my snacks are.", {
        steadiness: 0.5,
        ambition: -0.5,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S06",
    kind: "scenario",
    heavy: true,
    prompt:
      "It's been 5 hours since a lovely date and they haven't texted. You…",
    options: [
      o("Send a meme and get on with my day", {
        attachAnxiety: -1,
        attachAvoidance: -0.5,
        humour: 0.5,
      }),
      o("Check if the blue ticks appeared… again… and again…", {
        attachAnxiety: 1,
      }),
      o("Didn't notice. I was busy at badminton.", {
        attachAvoidance: 1,
        activity: 0.5,
      }),
      o("Send a long, warm message about how fun it was", {
        affection: 1,
        attachAnxiety: 0.5,
      }),
    ],
  },
  {
    id: "S07",
    kind: "scenario",
    heavy: true,
    prompt: "Your partner is off on a 5-day trip with friends. You…",
    options: [
      o("Glad they're having fun. I've got my own plans.", {
        attachAnxiety: -1,
        togetherness: -0.5,
      }),
      o("Want daily updates and photos", { togetherness: 1, texting: 0.5 }),
      o("Low-key worry they're having more fun without me", {
        attachAnxiety: 1,
      }),
      o("Finally, the whole bed is mine", { attachAvoidance: 1, humour: 0.5 }),
    ],
  },
  {
    id: "S08",
    kind: "scenario",
    prompt: "Someone takes the seat you were clearly walking towards. You…",
    options: [
      o("Smile. There's another one.", { agreeableness: 1, steadiness: 1 }),
      o("Stand next to them and sigh loudly", {
        agreeableness: -0.5,
        humour: 0.5,
      }),
      o('Politely say, "Sorry, I was about to sit here"', {
        conflict: 1,
        agreeableness: -0.5,
      }),
      o("Mentally draft a strongly worded letter, say nothing", {
        conflict: -1,
        steadiness: -0.5,
      }),
    ],
  },
  {
    id: "S09",
    kind: "scenario",
    consistency: "extraversion",
    prompt: "A party where you only know the host. You…",
    options: [
      o("Introduce myself around. New people are fun.", { extraversion: 1 }),
      o("Find the snacks, then whoever else is hiding by the snacks", {
        extraversion: 0.5,
        humour: 0.5,
      }),
      o("Stick close to the host all night", {
        extraversion: -0.5,
        attachAnxiety: 0.5,
      }),
      o("Quietly slip out early, no goodbyes", { extraversion: -1 }),
    ],
  },
  {
    id: "S10",
    kind: "scenario",
    heavy: true,
    consistency: "conscientiousness",
    prompt: "You have two weeks for a big project. You…",
    options: [
      o("Plan it out day by day and start tonight", { conscientiousness: 1 }),
      o("Start next week. It's fine.", {
        conscientiousness: -0.5,
        steadiness: 0.5,
      }),
      o("All-nighter energy the day before", {
        conscientiousness: -1,
        chronotype: 0.5,
      }),
      o("Start early, then redo everything twice out of worry", {
        conscientiousness: 0.5,
        steadiness: -1,
      }),
    ],
  },
  {
    id: "S11",
    kind: "scenario",
    prompt:
      "You and your partner can't decide where to eat. It's been 20 minutes. You…",
    options: [
      o("Just pick. Decisively.", { lead: 1 }),
      o('Say "anything lah", then veto every option', {
        lead: -0.5,
        agreeableness: -0.5,
        humour: 0.5,
      }),
      o("Go with their choice. Happy either way.", {
        lead: -1,
        agreeableness: 1,
      }),
      o("Spin a wheel app and let fate decide", { openness: 0.5, humour: 0.5 }),
    ],
  },
  {
    id: "S12",
    kind: "scenario",
    heavy: true,
    prompt: "A disagreement gets heated. You would rather…",
    options: [
      o("Sort it out now, even if it's late", { conflict: 1 }),
      o("Take a walk and come back when calm", {
        conflict: -1,
        steadiness: 0.5,
      }),
      o("Text it out. Easier to find the right words.", {
        conflict: -0.5,
        texting: 0.5,
        attachAvoidance: 0.5,
      }),
      o("Crack a joke to break the tension", { humour: 1, conflict: -0.5 }),
    ],
  },
  {
    id: "S13",
    kind: "scenario",
    prompt:
      "Your partner invites you to their friend's birthday. You know no one. You…",
    options: [
      o("Can! I love meeting new people.", {
        extraversion: 1,
        togetherness: 0.5,
      }),
      o("Go, but stick with my partner all night", {
        extraversion: -0.5,
        togetherness: 1,
      }),
      o("Go for an hour, then make a graceful exit", {
        extraversion: -0.5,
        togetherness: -0.5,
      }),
      o('"You go and enjoy. Tell me the gossip after."', {
        togetherness: -1,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S14",
    kind: "scenario",
    prompt:
      "Your partner wants to book a $400 omakase for your anniversary. You…",
    options: [
      o("Yes! Special occasions deserve it.", { money: 1, affection: 0.5 }),
      o("Suggest a cheaper place that's just as good", {
        money: -1,
        conscientiousness: 0.5,
      }),
      o("Counter-offer: hawker crawl, and the savings go to a trip", {
        money: -0.5,
        roam: 0.5,
        foodAdventure: 0.5,
      }),
      o("Ask if the chef gives a loyalty card", { money: -0.5, humour: 1 }),
    ],
  },
  {
    id: "S15",
    kind: "scenario",
    heavy: true,
    prompt:
      "Your partner's family invites you to lunch every single weekend. You…",
    options: [
      o("Love it. More family, more fun.", { family: 1, extraversion: 0.5 }),
      o("Happy to go most weeks, skip now and then", {
        family: 0.5,
        agreeableness: 0.5,
      }),
      o("Once a month feels about right", { family: -0.5 }),
      o("Ask if we can keep some weekends just for us", {
        family: -1,
        togetherness: 1,
      }),
    ],
  },
  {
    id: "S16",
    kind: "scenario",
    heavy: true,
    prompt: "Dream job offer, but it's overseas for two years. You…",
    options: [
      o("Go! Life's an adventure.", { roam: 1, ambition: 1 }),
      o("Only if the people I love can come along", {
        roam: 0.5,
        togetherness: 1,
        family: 0.5,
      }),
      o("Turn it down. Home is here.", { roam: -1, ambition: -0.5 }),
      o("Negotiate remote work so I don't miss chicken rice", {
        ambition: 0.5,
        roam: -0.5,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S17",
    kind: "scenario",
    prompt: "Your beach day gets rained out. You…",
    options: [
      o("Pivot: bouldering gym or a new café. Let's go.", {
        openness: 1,
        steadiness: 0.5,
      }),
      o("Sulk a bit, then Netflix", { steadiness: -0.5, activity: -1 }),
      o("Already had a rainy-day plan B", { conscientiousness: 1 }),
      o("Go anyway. Rain is a free shower.", { activity: 1, humour: 0.5 }),
    ],
  },
  {
    id: "S18",
    kind: "scenario",
    heavy: true,
    prompt: "Your partner's down with a fever. You…",
    options: [
      o("Show up with porridge and medicine", {
        agreeableness: 1,
        affection: 0.5,
        togetherness: 0.5,
      }),
      o("Check in by text every few hours", {
        texting: 1,
        attachAvoidance: 0.5,
      }),
      o("Ask what they need: company or space", {
        agreeableness: 0.5,
        attachAnxiety: -0.5,
        attachAvoidance: -0.5,
      }),
      o('Send a food delivery and a "get well soon" sticker', {
        affection: -0.5,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S19",
    kind: "scenario",
    prompt:
      "It's 11pm and you just realised it's a good friend's birthday. You…",
    options: [
      o("Call right away and sing badly", { extraversion: 0.5, affection: 1 }),
      o("Plan a proper belated treat", {
        conscientiousness: 0.5,
        agreeableness: 0.5,
      }),
      o("Spiral about being a terrible friend", {
        steadiness: -1,
        attachAnxiety: 0.5,
      }),
      o("Send a message at 11:59pm. Technically on time.", {
        humour: 1,
        conscientiousness: -0.5,
      }),
    ],
  },
  {
    id: "S20",
    kind: "scenario",
    heavy: true,
    prompt: "Your boss gives harsh feedback in front of the team. You…",
    options: [
      o("Take notes, fix it, move on", { steadiness: 1, ambition: 0.5 }),
      o("Replay it in my head all night", { steadiness: -1 }),
      o("Ask for a quick chat after to understand it", {
        conflict: 1,
        ambition: 0.5,
      }),
      o("Rant to friends over bubble tea, then feel fine", {
        extraversion: 0.5,
        steadiness: 0.5,
        conflict: -0.5,
      }),
    ],
  },
  {
    id: "S21",
    kind: "scenario",
    prompt: "Your partner signs you both up for a pottery class. You…",
    options: [
      o("Yes! I've always wanted to try.", { openness: 1, togetherness: 0.5 }),
      o("Sure, as long as there's makan after", {
        agreeableness: 0.5,
        foodAdventure: 0.5,
      }),
      o("Hmm, I'd rather we pick activities together", {
        lead: 0.5,
        openness: -0.5,
      }),
      o("Go, make a lopsided bowl, call it modern art", {
        humour: 1,
        openness: 0.5,
      }),
    ],
  },
  {
    id: "S22",
    kind: "scenario",
    prompt: "First overseas trip together. You…",
    options: [
      o("Make a shared itinerary doc with colour coding", {
        lead: 1,
        conscientiousness: 1,
      }),
      o("Book flights and a hotel, figure out the rest there", {
        conscientiousness: -0.5,
        openness: 0.5,
      }),
      o("Happy to follow whatever they plan", { lead: -1, agreeableness: 0.5 }),
      o("The only itinerary is food. Everything else is optional.", {
        foodAdventure: 1,
        humour: 0.5,
      }),
    ],
  },
  {
    id: "S23",
    kind: "scenario",
    heavy: true,
    prompt: "Your partner seems a bit distant this week. You…",
    options: [
      o("Ask them directly if everything is okay", {
        conflict: 0.5,
        attachAnxiety: -0.5,
      }),
      o("Get busy with my own stuff. They'll come around.", {
        attachAvoidance: 1,
        conflict: -0.5,
      }),
      o("Worry that I did something wrong", { attachAnxiety: 1 }),
      o("Plan a cosy date night to reconnect", {
        affection: 1,
        togetherness: 0.5,
      }),
    ],
  },
  {
    id: "S24",
    kind: "scenario",
    heavy: true,
    prompt: "Things are going well and they suggest meeting your family. You…",
    options: [
      o("Excited. Let's set a date!", { attachAvoidance: -1, family: 0.5 }),
      o("Nervous but happy", { attachAnxiety: 0.5 }),
      o("Feels a bit fast. I want to slow down.", { attachAvoidance: 1 }),
      o("Start preparing them for the family interrogation", {
        humour: 1,
        family: 0.5,
      }),
    ],
  },
  {
    id: "S25",
    kind: "scenario",
    prompt: "The neighbour's renovation starts 9am on a Saturday. You…",
    options: [
      o("Head out. Perfect excuse for brunch.", {
        steadiness: 1,
        extraversion: 0.5,
      }),
      o("Earplugs in, quietly suffer", { conflict: -1, agreeableness: 0.5 }),
      o("Knock and politely ask about the schedule", { conflict: 1 }),
      o("Retaliate with a karaoke session", { humour: 1, agreeableness: -0.5 }),
    ],
  },
  {
    id: "S26",
    kind: "scenario",
    prompt:
      "You and a friend are lost in an unfamiliar neighbourhood at night. You…",
    options: [
      o("Take charge with the map app", { lead: 1, steadiness: 0.5 }),
      o("Ask a passer-by. That's half the fun.", {
        extraversion: 1,
        openness: 0.5,
      }),
      o("Let my friend figure it out", { lead: -1 }),
      o("Wander and accidentally find the best supper spot", {
        openness: 1,
        chronotype: 0.5,
      }),
    ],
  },
  {
    id: "S27",
    kind: "scenario",
    prompt: "Moving in together. First thing you sort out?",
    options: [
      o("A cleaning roster. Colour-coded.", {
        tidiness: 1,
        conscientiousness: 0.5,
      }),
      o("The sofa and TV setup", { activity: -0.5, togetherness: 0.5 }),
      o("Which shelves are mine and which are theirs", {
        togetherness: -0.5,
        tidiness: 0.5,
      }),
      o("Nothing. Boxes can stay boxes for a few months.", {
        tidiness: -1,
        conscientiousness: -0.5,
      }),
    ],
  },
  {
    id: 'S28',
    kind: 'scenario',
    prompt: 'Planning a group staycation. You…',
    options: [
      o('Compare five hotels in a spreadsheet', { lead: 1, conscientiousness: 1, money: -0.5 }),
      o('Pick the one with the best pool. Done.', { lead: 0.5, money: 0.5 }),
      o('Pay my share and show up', { lead: -1 }),
      o("Suggest we just chill at someone's place", { money: -1, extraversion: -0.5 }),
    ],
  },
  {
    id: 'S29',
    kind: 'scenario',
    heavy: true,
    prompt: 'Your partner forgets your birthday. You…',
    options: [
      o('Tell them honestly that it hurt', { conflict: 1, attachAnxiety: -0.5 }),
      o("Say it's fine, but it stings for days", { conflict: -1, attachAnxiety: 1 }),
      o("Laugh it off. Birthdays aren't a big deal to me.", { affection: -1, steadiness: 1 }),
      o('Plan my own celebration and invite them', { lead: 1, steadiness: 0.5 }),
    ],
  },
  {
    id: 'S30',
    kind: 'scenario',
    heavy: true,
    prompt: 'Free Saturday. Your partner wants a lazy day in. You…',
    options: [
      o('Happily join. Cosy day it is.', { togetherness: 1, activity: -0.5, agreeableness: 0.5 }),
      o('Suggest a morning hike, then a lazy afternoon', { activity: 1, lead: 0.5 }),
      o('Head out on my own for a bit, then come back', { togetherness: -1, activity: 0.5 }),
      o('Deal, as long as we order from that new place', { foodAdventure: 1, agreeableness: 0.5 }),
    ],
  },
  {
    id: 'S31',
    kind: 'scenario',
    heavy: true,
    prompt: 'Your partner gets a big promotion with longer hours. You…',
    options: [
      o("So proud! I'll support however I can.", { agreeableness: 1, ambition: 0.5 }),
      o("Happy, but worried we'll see each other less", { togetherness: 1, attachAnxiety: 0.5 }),
      o('Great, more time for my own stuff', { togetherness: -1, attachAvoidance: 0.5 }),
      o('Sit down together and plan how to keep some balance', { conflict: 0.5, ambition: -0.5, conscientiousness: 0.5 }),
    ],
  },
  {
    id: 'S32',
    kind: 'scenario',
    heavy: true,
    prompt: 'Money is tight this month and your partner wants a weekend trip. You…',
    options: [
      o('Say no. We stick to the budget.', { money: -1, conscientiousness: 0.5 }),
      o('Find a cheaper version, maybe a staycay', { money: -0.5, agreeableness: 0.5 }),
      o('Go anyway. You only live once.', { money: 1 }),
      o('Suggest a free picnic at the Botanic Gardens instead', { money: -0.5, activity: 0.5, openness: 0.5 }),
    ],
  },
  {
    id: 'S33',
    kind: 'scenario',
    heavy: true,
    prompt: 'You and your partner have different standards for a clean home. You…',
    options: [
      o('Make a chore chart. Everyone knows their job.', { tidiness: 1, conscientiousness: 0.5, lead: 0.5 }),
      o('Quietly do the extra cleaning myself', { tidiness: 1, conflict: -1 }),
      o("Lower my standards a bit. It's not that deep.", { tidiness: -0.5, agreeableness: 0.5 }),
      o('Talk it through and meet halfway', { conflict: 1, agreeableness: 0.5 }),
    ],
  },
  {
    id: 'S34',
    kind: 'scenario',
    prompt: 'A friend invites you on a last-minute midnight durian run. You…',
    options: [
      o('Already in the car', { chronotype: 1, openness: 0.5, foodAdventure: 0.5 }),
      o('Tempting, but I have an early morning', { chronotype: -1, conscientiousness: 0.5 }),
      o('Ask them to bring some back', { extraversion: -0.5, foodAdventure: 0.5 }),
      o('Durian at midnight? Pass.', { foodAdventure: -1 }),
    ],
  },
  {
    id: 'S35',
    kind: 'scenario',
    prompt: "Your phone breaks and you're offline for a whole day. You…",
    options: [
      o('Bliss. Read a book and enjoy it.', { texting: -1, steadiness: 1 }),
      o("Borrow a friend's phone to let people know", { texting: 1, conscientiousness: 0.5 }),
      o('Low-key anxious all day', { steadiness: -1, attachAnxiety: 0.5 }),
      o('Finally tidy my room', { tidiness: 1, conscientiousness: 0.5 }),
    ],
  },
  {
    id: 'S36',
    kind: 'scenario',
    prompt: 'Your neighbour leaves shoes all over the shared corridor. You…',
    options: [
      o('Mind my own business', { conflict: -1, agreeableness: 0.5 }),
      o('Leave a polite note', { conflict: 0.5, tidiness: 0.5 }),
      o('Knock and have a friendly chat about it', { conflict: 1, extraversion: 0.5 }),
      o('Arrange their shoes neatly as a hint', { tidiness: 1, humour: 0.5 }),
    ],
  },
  {
    id: 'S37',
    kind: 'scenario',
    heavy: true,
    prompt: "Your partner is upset and wants to talk now, but you're exhausted. You…",
    options: [
      o("Talk now, even though I'm tired", { conflict: 1, agreeableness: 0.5 }),
      o('Ask to talk tomorrow morning, with a hug', { conflict: -0.5, affection: 0.5 }),
      o('Go quiet and hope it blows over', { conflict: -1, attachAvoidance: 1 }),
      o('Apologise first, figure out the details later', { agreeableness: 1, attachAnxiety: 0.5 }),
    ],
  },
  {
    id: 'S38',
    kind: 'scenario',
    heavy: true,
    prompt: 'Your partner likes to text throughout the workday. You…',
    options: [
      o('Love it. Keep them coming.', { texting: 1, togetherness: 0.5 }),
      o('A few check-ins is nice', { texting: 0 }),
      o("I'd rather catch up properly after work", { texting: -1, ambition: 0.5 }),
      o('Reply with stickers between meetings', { texting: 0.5, humour: 0.5 }),
    ],
  },
  {
    id: 'S39',
    kind: 'scenario',
    heavy: true,
    prompt: "Your friend group and your partner's don't really mix. You…",
    options: [
      o('Make an effort to blend them', { extraversion: 1, togetherness: 1 }),
      o("Keep separate circles. That's healthy.", { togetherness: -1 }),
      o('Join theirs sometimes, they join mine sometimes', { agreeableness: 0.5 }),
      o('Throw one big party and see what happens', { extraversion: 1, openness: 0.5 }),
    ],
  },
  {
    id: 'S40',
    kind: 'scenario',
    prompt: 'A busker is playing your favourite song at the MRT station. You…',
    options: [
      o('Stop, listen, and leave a tip', { openness: 0.5, agreeableness: 0.5 }),
      o('Sing along. Loudly.', { extraversion: 1, humour: 0.5 }),
      o('Film it for the group chat', { texting: 0.5 }),
      o("Keep walking. I'm running late.", { conscientiousness: -0.5, extraversion: -0.5 }),
    ],
  },
  {
    id: 'S41',
    kind: 'scenario',
    heavy: true,
    prompt: "Your partner says they'd like a bit more space this month. You…",
    options: [
      o('Sure, and ask what space looks like for them', { attachAnxiety: -1, conflict: 0.5 }),
      o("Agree, but quietly wonder if something's wrong", { attachAnxiety: 1 }),
      o('Relieved. I wanted some too.', { attachAvoidance: 1, togetherness: -1 }),
      o('Fill my calendar with friends and hobbies', { extraversion: 0.5, attachAnxiety: -0.5 }),
    ],
  },
  {
    id: 'S42',
    kind: 'scenario',
    prompt: "At a family gathering, relatives ask when you'll settle down. You…",
    options: [
      o('Laugh: "Soon lah!"', { humour: 1, steadiness: 0.5 }),
      o('Explain my plans politely', { family: 0.5, agreeableness: 0.5 }),
      o('Steer the topic to the food', { conflict: -1, foodAdventure: 0.5 }),
      o("Kindly say it's on my own timeline", { conflict: 1, family: -0.5 }),
    ],
  },
  {
    id: 'S43',
    kind: 'scenario',
    heavy: true,
    prompt: 'A chance to move to a new city together for two years. Your partner is unsure. You…',
    options: [
      o('Make a pros and cons list together', { conscientiousness: 1, conflict: 0.5 }),
      o("Push for it. It's an adventure!", { roam: 1, lead: 1 }),
      o('Stay. Their comfort matters more.', { roam: -0.5, agreeableness: 1 }),
      o('Suggest a holiday there first to test it out', { openness: 0.5, roam: 0.5, conscientiousness: 0.5 }),
    ],
  },
  {
    id: 'S44',
    kind: 'scenario',
    heavy: true,
    prompt: 'After moving in, your partner suggests combining finances. You…',
    options: [
      o('Yes. One joint account, full transparency.', { togetherness: 1, money: -0.5 }),
      o('Joint for bills, separate for fun money', { togetherness: 0 }),
      o("I'd prefer to keep things separate", { togetherness: -1, attachAvoidance: 0.5 }),
      o('Only after we go through a budget together', { conscientiousness: 1, money: -1 }),
    ],
  },
  {
    id: 'S45',
    kind: 'scenario',
    prompt: 'The group chat is planning a 6am sunrise hike. You…',
    options: [
      o('First to say yes', { chronotype: -1, activity: 1 }),
      o("Yes, but I'll need three alarms", { chronotype: 0.5, activity: 0.5 }),
      o('Counter-propose a sunset hike', { chronotype: 1, activity: 0.5 }),
      o('Thumbs up, then sleep through it', { conscientiousness: -1, chronotype: 1 }),
    ],
  },
  {
    id: 'S46',
    kind: 'scenario',
    prompt: 'A friend asks for honest feedback on a shaky business idea. You…',
    options: [
      o('Be honest, kindly', { conflict: 1, agreeableness: 0.5 }),
      o("Cheer them on. They'll figure it out.", { agreeableness: 1, conflict: -0.5 }),
      o('Ask tough questions about the numbers', { conscientiousness: 1, ambition: 0.5 }),
      o('Offer to be their first customer', { agreeableness: 0.5, money: 0.5 }),
    ],
  },
  {
    id: 'S47',
    kind: 'scenario',
    prompt: 'Your partner tears up during a movie. You…',
    options: [
      o('Hold their hand', { affection: 1 }),
      o('Pass the tissues quietly', { affection: -0.5, agreeableness: 0.5 }),
      o('Cry too, honestly', { affection: 1, steadiness: -0.5 }),
      o('Gently tease them about it later', { humour: 1, affection: -0.5 }),
    ],
  },
  {
    id: 'S48',
    kind: 'scenario',
    heavy: true,
    prompt: 'The relationship is getting serious, fast. You…',
    options: [
      o("Excited. I'm all in.", { attachAvoidance: -1, togetherness: 0.5 }),
      o('Happy, but keeping my own routines', { attachAvoidance: 0.5, togetherness: -0.5 }),
      o('Want to slow down and pull back a bit', { attachAvoidance: 1 }),
      o("Want lots of reassurance that it's real", { attachAnxiety: 1 }),
    ],
  },
  {
    id: 'S49',
    kind: 'scenario',
    heavy: true,
    prompt: "Your partner is overseas and hasn't replied all day. You…",
    options: [
      o("Assume they're busy having fun", { attachAnxiety: -1, steadiness: 0.5 }),
      o('Send a few more messages to check', { attachAnxiety: 1, texting: 1 }),
      o("Didn't notice. Busy with my own stuff.", { attachAvoidance: 1 }),
      o("Check if they've posted any stories", { attachAnxiety: 0.5 }),
    ],
  },
  {
    id: 'S50',
    kind: 'scenario',
    prompt: 'You win $500 in a lucky draw. You…',
    options: [
      o('Save it', { money: -1 }),
      o('Spend it on an experience with someone I love', { money: 0.5, togetherness: 0.5, affection: 0.5 }),
      o('Treat the whole office to bubble tea', { money: 1, agreeableness: 1, extraversion: 0.5 }),
      o('Invest it. Research starts tonight.', { money: -1, ambition: 0.5, conscientiousness: 0.5 }),
    ],
  },
  {
    id: 'S51',
    kind: 'scenario',
    heavy: true,
    prompt: 'You and your partner disagree on how often to see friends versus each other. You…',
    options: [
      o('Schedule it so both of us get what we need', { conscientiousness: 1, conflict: 0.5 }),
      o('Go with whatever they prefer', { agreeableness: 1, lead: -1 }),
      o('Hold my ground. My friends matter.', { togetherness: -1, agreeableness: -0.5 }),
      o('Combine them: couple hangouts with friends', { togetherness: 1, extraversion: 0.5 }),
    ],
  },
  {
    id: 'S52',
    kind: 'scenario',
    prompt: "It's 7pm and you have no dinner plans. You…",
    options: [
      o("Cook something from what's in the fridge", { conscientiousness: 0.5, money: -0.5 }),
      o('Head to my usual hawker stall', { foodAdventure: -1 }),
      o('Try that new place I saw online', { foodAdventure: 1, openness: 0.5 }),
      o("Text friends. Maybe someone's free.", { extraversion: 1 }),
    ],
  },
  {
    id: 'S53',
    kind: 'scenario',
    heavy: true,
    prompt: 'Your partner makes a big purchase without asking you. You…',
    options: [
      o('Bring it up calmly. We decide big things together.', { conflict: 1, togetherness: 0.5 }),
      o('Let it slide. Their money, their call.', { togetherness: -1, agreeableness: 0.5 }),
      o('Feel hurt, but keep quiet', { conflict: -1, attachAnxiety: 0.5 }),
      o('Ask if I can have a go with it too', { humour: 1, money: 0.5 }),
    ],
  },
  {
    id: 'S54',
    kind: 'scenario',
    prompt: "You're 20 minutes early for a meeting. You…",
    options: [
      o("Planned it. I'm always early.", { conscientiousness: 1 }),
      o('Explore the area', { openness: 1, activity: 0.5 }),
      o('Grab a kopi and people-watch', { steadiness: 0.5, extraversion: -0.5 }),
      o('Early? That never happens.', { conscientiousness: -1 }),
    ],
  },
  {
    id: 'S55',
    kind: 'scenario',
    heavy: true,
    prompt: 'A friend says your partner was rude to them. You…',
    options: [
      o('Talk to my partner about it directly', { conflict: 1 }),
      o('Hear both sides before saying anything', { agreeableness: 0.5, steadiness: 0.5 }),
      o('Defend my partner. They must have had a reason.', { togetherness: 1, agreeableness: -0.5 }),
      o('Avoid the topic and hope it fades', { conflict: -1, attachAvoidance: 0.5 }),
    ],
  },
  {
    id: 'S56',
    kind: 'scenario',
    prompt: 'Your partner suggests learning a new language together. You…',
    options: [
      o("Yes! Let's plan a trip to use it.", { openness: 1, roam: 1 }),
      o("Sure, but I'll probably quit by week three", { conscientiousness: -1, humour: 0.5 }),
      o('Download the app and start a daily streak', { conscientiousness: 1, ambition: 0.5 }),
      o("I'd rather we pick something more relaxing", { openness: -1, activity: -0.5 }),
    ],
  },
];

// ---------------------------------------------------------------------------
// Forced trade-offs: what you want in a partner
// ---------------------------------------------------------------------------

export const IDEALS: IdealQuestion[] = [
  {
    id: "T01",
    kind: "ideal",
    dim: "lead",
    prompt: "In a partner, would you rather have someone who…",
    left: "Happily follows your plans",
    right: "Takes charge of the plans",
  },
  {
    id: "T02",
    kind: "ideal",
    dim: "lead",
    prompt: "Dinner tonight. Would you rather your partner…",
    left: "Asks what you feel like eating",
    right: "Just decides where to go",
  },
  {
    id: "T03",
    kind: "ideal",
    dim: "money",
    prompt: "In a partner, would you rather have someone who…",
    left: "Saves hard for the future",
    right: "Enjoys life now",
  },
  {
    id: "T04",
    kind: "ideal",
    dim: "money",
    prompt: "When it comes to money, your ideal partner…",
    left: "Keeps a budget spreadsheet",
    right: "Spends freely and doesn't stress",
  },
  {
    id: "T05",
    kind: "ideal",
    dim: "roam",
    prompt: "Holidays with your partner should mostly be…",
    left: "Staycays, exploring Singapore together",
    right: "Overseas every chance we get",
  },
  {
    id: "T06",
    kind: "ideal",
    dim: "roam",
    prompt: "Long term, you want a partner who is…",
    left: "Happy to stay in Singapore for life",
    right: "Up for moving abroad together",
  },
  {
    id: "T07",
    kind: "ideal",
    dim: "togetherness",
    prompt: "In a partner, would you rather have someone who…",
    left: "Has a full life of their own",
    right: "Spends most of their free time with you",
  },
  {
    id: "T08",
    kind: "ideal",
    dim: "ambition",
    prompt: "In a partner, would you rather have someone who…",
    left: "Clocks out on time and protects weekends",
    right: "Is career-driven and chasing big goals",
  },
  { id: 'T09', kind: 'ideal', dim: 'togetherness', prompt: 'On a free evening, your ideal partner…', left: 'Is happy doing their own thing', right: 'Wants to spend it with you' },
  { id: 'T10', kind: 'ideal', dim: 'togetherness', prompt: 'Your ideal partner\'s social life…', left: 'Has their own circle and plans', right: 'Mostly happens as a couple' },
  { id: 'T11', kind: 'ideal', dim: 'ambition', prompt: 'Your ideal partner\'s career is…', left: 'Steady, with plenty of time for life', right: 'Ambitious, always levelling up' },
  { id: 'T12', kind: 'ideal', dim: 'ambition', prompt: 'On weekends, your ideal partner…', left: 'Switches off from work completely', right: 'Squeezes in a side project' },
  { id: 'T13', kind: 'ideal', dim: 'money', prompt: 'On holiday, your ideal partner…', left: 'Hunts for the best deals', right: 'Splurges on the nice hotel' },
  { id: 'T14', kind: 'ideal', dim: 'lead', prompt: 'When it comes to dates, your ideal partner…', left: 'Lets you take the lead', right: 'Plans the surprises' },
  { id: 'T15', kind: 'ideal', dim: 'roam', prompt: 'Your ideal partner dreams of…', left: 'A cosy home near family and friends', right: 'Living somewhere new for a few years' },
  { id: 'T16', kind: 'ideal', dim: 'money', prompt: 'With big purchases, your ideal partner…', left: 'Saves up and thinks it over', right: 'Buys it if it makes them happy' },
];

// ---------------------------------------------------------------------------
// Which matters more? (category weights)
// ---------------------------------------------------------------------------

export const PRIORITIES: PriorityQuestion[] = [
  {
    id: "P01",
    kind: "priority",
    prompt: "Which matters more to you?",
    leftCat: "communication",
    left: "Laughs at the same memes",
    rightCat: "direction",
    right: "Has the same plan for money",
  },
  {
    id: "P02",
    kind: "priority",
    prompt: "Which matters more to you?",
    leftCat: "rhythm",
    left: "Sleeps and wakes when you do",
    rightCat: "character",
    right: "Has a personality that just clicks",
  },
  {
    id: "P03",
    kind: "priority",
    prompt: "Which matters more to you?",
    leftCat: "direction",
    left: "Wants the same future: home, family, career",
    rightCat: "character",
    right: "Is kind and easy to be around",
  },
  {
    id: "P04",
    kind: "priority",
    prompt: "Which matters more to you?",
    leftCat: "communication",
    left: "Talks things through the way you do",
    rightCat: "rhythm",
    right: "Likes the same weekend plans",
  },
  {
    id: "P05",
    kind: "priority",
    prompt: "Which matters more to you?",
    leftCat: "character",
    left: "Curious and up for anything",
    rightCat: "communication",
    right: "Texts the way you like",
  },
  {
    id: "P06",
    kind: "priority",
    prompt: "Which matters more to you?",
    leftCat: "direction",
    left: "Same views on family and the future",
    rightCat: "rhythm",
    right: "Same tidiness standards at home",
  },
  { id: 'P07', kind: 'priority', prompt: 'Which matters more to you?', leftCat: 'communication', left: 'Shows love the way you like to receive it', rightCat: 'character', right: 'Is curious and fun to explore with' },
  { id: 'P08', kind: 'priority', prompt: 'Which matters more to you?', leftCat: 'rhythm', left: 'Has the same body clock as you', rightCat: 'direction', right: 'Wants to live where you want to live' },
  { id: 'P09', kind: 'priority', prompt: 'Which matters more to you?', leftCat: 'character', left: 'Stays calm in a crisis', rightCat: 'rhythm', right: 'Loves the same weekend activities' },
  { id: 'P10', kind: 'priority', prompt: 'Which matters more to you?', leftCat: 'direction', left: 'Has the same attitude to money', rightCat: 'communication', right: 'Handles arguments the way you do' },
  { id: 'P11', kind: 'priority', prompt: 'Which matters more to you?', leftCat: 'rhythm', left: 'Shares your food adventures', rightCat: 'communication', right: 'Gets your sense of humour' },
  { id: 'P12', kind: 'priority', prompt: 'Which matters more to you?', leftCat: 'character', left: 'Is kind to everyone, even strangers', rightCat: 'direction', right: 'Is as ambitious as you are' },
];

// ---------------------------------------------------------------------------
// Dealbreakers (always asked, near the end)
// ---------------------------------------------------------------------------

export const DEALBREAKERS: DealbreakerQuestion[] = [
  {
    id: "D01",
    kind: "dealbreaker",
    key: "kids",
    prompt: "Kids someday, can or not?",
  },
  {
    id: "D02",
    kind: "dealbreaker",
    key: "smoking",
    prompt: "Smoking or vaping",
  },
  { id: "D03", kind: "dealbreaker", key: "pets", prompt: "Pets at home?" },
  {
    id: "D04",
    kind: "dealbreaker",
    key: "nearFamily",
    prompt: "How important is living near your family?",
  },
  {
    id: "D05",
    kind: "dealbreaker",
    key: "faith",
    prompt: "Does sharing a faith or outlook with a partner matter to you?",
  },
];

/** Option text for the dealbreaker screens. Indices match the Dealbreakers type. */
export const DEALBREAKER_TEXT = {
  kids: {
    options: [
      "Yes, definitely",
      "Maybe, open to it",
      "Probably not",
      "Definitely not",
    ],
    must: "This one needs to match for me",
  },
  smoking: {
    selfPrompt: "Do you smoke or vape?",
    self: ["Never", "Occasionally", "Regularly"],
    partnerPrompt: "A partner who smokes or vapes is…",
    partner: [
      "Fine with me",
      "I'd rather not, but could talk",
      "A dealbreaker for me",
    ],
  },
  pets: {
    options: [
      "Love them, have or want one",
      "Fine either way",
      "I'd prefer no pets",
    ],
    cannot: "I'm allergic or really can't live with pets",
  },
  nearFamily: {
    options: [
      "Very important",
      "Nice to have",
      "Doesn't matter much",
      "I'd prefer a bit of distance",
    ],
  },
  faith: {
    options: ["Yes, a lot", "Somewhat", "Not really"],
    followPrompt: "Which best describes you?",
    followHint:
      'Optional. Your answer is stored in your match code, which anyone with your link could decode. "Prefer not to say" is always okay.',
  },
} as const;

/** Index 0 is "prefer not to say". Max 8 entries (3 bits in the code). */
export const FAITH_OPTIONS = [
  "Prefer not to say",
  "Buddhist",
  "Christian",
  "Muslim",
  "Hindu",
  "Taoist",
  "Free-thinker / no religion",
  "Something else",
] as const;

// ---------------------------------------------------------------------------
// MRT stations (quiz sections)
// ---------------------------------------------------------------------------

export const STATIONS = [
  { id: "kopi", name: "Kopi Junction", code: "KJ1", colour: "#2e9e5b" },
  { id: "makan", name: "Makan Crossing", code: "MC2", colour: "#e1251b" },
  {
    id: "eitheror",
    name: "Either-Or Interchange",
    code: "EO3",
    colour: "#0d59a8",
  },
  { id: "plottwist", name: "Plot Twist Park", code: "PT4", colour: "#8a3ab9" },
  {
    id: "serious",
    name: "Serious Bit Station",
    code: "SB5",
    colour: "#f39c12",
  },
  { id: "supper", name: "Supper Terminal", code: "ST6", colour: "#9e7c1a" },
] as const;
export type StationId = (typeof STATIONS)[number]["id"];

export const QUESTION_BANK: Question[] = [
  ...LIFESTYLE,
  ...FLAVOUR,
  ...SCENARIOS,
  ...IDEALS,
  ...PRIORITIES,
  ...DEALBREAKERS,
];
