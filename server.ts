import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Readable } from "stream";
import { spawn } from "child_process";
import { XMLParser } from "fast-xml-parser";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}

// In-memory cache for podcast feed
interface CachedFeed {
  timestamp: number;
  meta: any;
  episodes: any[];
  bonus: any[];
}

let cachedFeed: CachedFeed | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Forum database file
const DATA_DIR = path.join(process.cwd(), "data");
const FORUM_FILE = path.join(DATA_DIR, "forum.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_CATEGORIES = [
  {
    id: "episodes",
    name: "Episode Discussions",
    description: "Breakdowns, timestamps, and commentary on recent & classic episodes.",
    icon: "Mic",
    color: "rose"
  },
  {
    id: "stories",
    name: "Crazy Stories & Nonsense",
    description: "Your own ridiculous life adventures, weird encounters, and embarrassing moments.",
    icon: "MessageSquare",
    color: "amber"
  },
  {
    id: "food-and-drinks",
    name: "Food, Drinks & Taste Tests",
    description: "Questionable snacks, strange beverages, and wild taste-test reviews.",
    icon: "UtensilsCrossed",
    color: "emerald"
  },
  {
    id: "advice",
    name: "Listener Q&A & Advice",
    description: "Advice questions, listener dilemmas, and theoretical debates.",
    icon: "Mail",
    color: "blue"
  },
  {
    id: "fan-creations",
    name: "Fan Art & BRAP Memes",
    description: "Artwork, photoshops, video edits, and inside jokes from the Comedy Button universe.",
    icon: "Sparkles",
    color: "purple"
  }
];

const SEED_POSTS = [
  {
    id: "post-1",
    title: "The Grand Finale reflections: 11.5 years of pure nonsense!",
    author: "ButtonVeteran_99",
    authorBadge: "OG Listener",
    category: "episodes",
    content: "Can we talk about Episode 550? Hearing everyone gather one last time with all the significant others dropping by was both hilarious and weirdly emotional. The horse in the living room bit, Ryan's dad sagas, and Scott's fast food adventures defined my 20s. Who else cried when Brian thanked the fans at the end? BRAP BRAP forever!",
    episodeRefId: "ep-550",
    episodeRefTitle: "The Comedy Button: Episode 550 -- THE GRAND FINALE!",
    createdAt: "2024-02-15T18:24:00Z",
    repliesCount: 4,
    reactions: { brap: 42, lol: 19, beer: 28, fire: 33 },
    comments: [
      {
        id: "c-1",
        postId: "post-1",
        author: "MaxsLizardFan",
        authorBadge: "Superfan",
        content: "Honestly, the callback to the hobo wine tasting was perfection. Couldn't have asked for a better three-hour sendoff.",
        createdAt: "2024-02-15T19:02:00Z",
        reactions: { brap: 14, lol: 3, beer: 8, fire: 5 }
      },
      {
        id: "c-2",
        postId: "post-1",
        author: "BromleyBurgers",
        authorBadge: "Moderator",
        content: "Still can't believe they did 550 regular episodes plus the specials. Re-listening to Episode 1 right now and the audio quality difference is wild.",
        createdAt: "2024-02-16T08:15:00Z",
        reactions: { brap: 9, lol: 6, beer: 12, fire: 4 }
      }
    ]
  },
  {
    id: "post-2",
    title: "Ranking the Movie Commentaries: Street Fighter vs Home Alone 2 vs The Lost Boys",
    author: "CinephileRyan",
    authorBadge: "Commentary Club",
    category: "episodes",
    content: "The exclusive commentary audio tracks are goldmines. Scott losing his mind during Raul Julia's performance in Street Fighter had me gasping for breath on my commute. Which commentary track is everyone's absolute favorite?",
    episodeRefId: "commentary-sf",
    episodeRefTitle: "The Comedy Button: Street Fighter Commentary",
    createdAt: "2024-03-01T14:10:00Z",
    repliesCount: 3,
    reactions: { brap: 23, lol: 15, beer: 11, fire: 19 },
    comments: [
      {
        id: "c-3",
        postId: "post-2",
        author: "AltanoAppreciator",
        authorBadge: "Member",
        content: "Home Alone 2 commentary when they start dissecting Kevin McCallister as a psychopathic supervillain is peak podcasting.",
        createdAt: "2024-03-01T16:30:00Z",
        reactions: { brap: 8, lol: 11, beer: 4, fire: 7 }
      }
    ]
  },
  {
    id: "post-3",
    title: "Official Snack & Beverage Taste-Test Thread",
    author: "SnackSommelier",
    authorBadge: "Reviewer",
    category: "food-and-drinks",
    content: "In tribute to Scott and Ryan testing bizarre budget drinks and snacks, I found a 99-cent 'Electric Blue Cotton Candy' soda at a desert gas station. Tastes like melted blue freeze pops and instant regret. Post your weirdest drink and snack discoveries here!",
    createdAt: "2024-03-10T22:45:00Z",
    repliesCount: 2,
    reactions: { brap: 17, lol: 31, beer: 25, fire: 8 },
    comments: [
      {
        id: "c-4",
        postId: "post-3",
        author: "KristinFanClub",
        authorBadge: "Member",
        content: "Reminds me of when they tried four loko recipes on the live show. True gastrointestinal courage.",
        createdAt: "2024-03-11T01:10:00Z",
        reactions: { brap: 6, lol: 14, beer: 9, fire: 2 }
      }
    ]
  },
  {
    id: "post-4",
    title: "What is the single most unhinged advice given on the show?",
    author: "QuestionMaster",
    authorBadge: "Curious Listener",
    category: "advice",
    content: "Looking back across all the years, what advice question reply made you pull your car over from laughing? For me, it's definitely when someone asked how to break up with a roommate and the advice was essentially to pretend to be a foreign exchange student.",
    createdAt: "2024-04-05T11:20:00Z",
    repliesCount: 1,
    reactions: { brap: 35, lol: 24, beer: 10, fire: 16 },
    comments: []
  }
];

function loadForumData(): { posts: any[] } {
  try {
    if (fs.existsSync(FORUM_FILE)) {
      const raw = fs.readFileSync(FORUM_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading forum file:", err);
  }
  const initial = { posts: SEED_POSTS };
  saveForumData(initial);
  return initial;
}

function saveForumData(data: { posts: any[] }) {
  try {
    fs.writeFileSync(FORUM_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing forum file:", err);
  }
}

// Fetch and parse the live Libsyn RSS feed
async function fetchComedyButtonFeed() {
  const now = Date.now();
  if (cachedFeed && (now - cachedFeed.timestamp < CACHE_TTL_MS)) {
    return cachedFeed;
  }

  // Primary RSS specified by user; fallback to comedybutton.libsyn.com/rss
  const PRIMARY_RSS_URL = "https://rss.libsyn.com/shows/34195/destinations/79079.xml";
  const FALLBACK_RSS_URL = "https://comedybutton.libsyn.com/rss";

  let xmlText = "";
  try {
    const res = await fetch(PRIMARY_RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml"
      }
    });
    if (res.ok) {
      xmlText = await res.text();
    } else {
      throw new Error(`Primary RSS returned HTTP ${res.status}`);
    }
  } catch (primaryErr) {
    console.warn("Primary RSS feed failed, falling back to secondary:", primaryErr);
    const fallbackRes = await fetch(FALLBACK_RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml"
      }
    });
    if (!fallbackRes.ok) {
      throw new Error(`Failed to fetch RSS from both primary and fallback: HTTP ${fallbackRes.status}`);
    }
    xmlText = await fallbackRes.text();
  }
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata"
  });

  const parsed = parser.parse(xmlText);
  const channel = parsed.rss?.channel || {};

  const rawItems = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);

  const episodes = rawItems.map((item: any, index: number) => {
    const rawTitle = typeof item.title === "object" ? item.title.__cdata || item.title["#text"] || "" : String(item.title || "");
    const title = rawTitle.trim();

    // Extract episode number if present
    const epNumMatch = title.match(/Episode\s*:?\s*(\d+)/i) || title.match(/Episdoe\s*:?\s*(\d+)/i);
    const episodeNumber = epNumMatch ? parseInt(epNumMatch[1], 10) : undefined;

    // Detect bonus / special content
    const lowerTitle = title.toLowerCase();
    const isSpecial = lowerTitle.includes("special") || lowerTitle.includes("anniversary") || lowerTitle.includes("message");
    const isCommentary = lowerTitle.includes("commentary");
    const isBonus = isSpecial || isCommentary || lowerTitle.includes("bonus") || lowerTitle.includes("patreon") || lowerTitle.includes("sneak preview") || lowerTitle.includes("minisode") || !episodeNumber;

    let category = "Full Episode";
    if (isCommentary) category = "Audio Commentary";
    else if (isSpecial) category = "Special Event";
    else if (lowerTitle.includes("patreon") || lowerTitle.includes("preview")) category = "Patreon Exclusive";
    else if (lowerTitle.includes("best of")) category = "Best Of Collection";

    // Audio URL
    let audioUrl = "";
    if (item.enclosure && item.enclosure["@_url"]) {
      audioUrl = item.enclosure["@_url"];
    }

    // Guid / Id
    const guid = typeof item.guid === "object" ? item.guid["#text"] || item.guid.__cdata || "" : String(item.guid || `ep-${index}`);
    const id = `ep-${rawItems.length - index}`;

    // Duration
    const duration = String(item["itunes:duration"] || "01:00:00");

    // Clean description
    let rawDesc = item["content:encoded"] || item.description || "";
    if (typeof rawDesc === "object") {
      rawDesc = rawDesc.__cdata || rawDesc["#text"] || "";
    }
    const descriptionHtml = String(rawDesc);
    const description = descriptionHtml.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

    // Episode image
    let imageUrl = "https://static.libsyn.com/p/assets/4/b/9/9/4b995a114aac0a5b/ComedyButton-2015-iTunes-icon-1400x1400.jpg";
    if (item["itunes:image"] && item["itunes:image"]["@_href"]) {
      imageUrl = item["itunes:image"]["@_href"];
    }

    // Host era detection
    const fullText = `${title} ${description}`.toLowerCase();
    const isAnthonyEra = (episodeNumber !== undefined && episodeNumber >= 1 && episodeNumber <= 127) ||
      fullText.includes("anthony gallegos") || fullText.includes("anthony returns") || fullText.includes("anthony is back");
    const isKristinEra = (episodeNumber !== undefined && episodeNumber >= 312 && episodeNumber <= 550) ||
      fullText.includes("kristin") || fullText.includes("kirsten") || fullText.includes("van de yar");

    let hostEra: 'anthony' | 'transition' | 'kristin' | 'finale' | 'special' = 'transition';
    if (isBonus || isSpecial) hostEra = 'special';
    else if (episodeNumber !== undefined && episodeNumber >= 500 && episodeNumber <= 550) hostEra = 'finale';
    else if (isKristinEra) hostEra = 'kristin';
    else if (isAnthonyEra) hostEra = 'anthony';

    // Guest detection
    const KNOWN_GUEST_NAMES = [
      "Jared Petty", "Jack DeVries", "Marty Sliva", "Mike Drucker", "Zach Ryan",
      "Mitch Dyer", "Anthony Carboni", "Brandon Hunt", "Andrew Goldfarb", "Bill Zoeker",
      "Dan Ryckert", "Adam Sessler", "Danny Tamberelli", "Colin Moriarty", "Greg Miller",
      "Alanah Pearce", "Seth Macy", "Nick Robinson"
    ];
    const detectedGuests: string[] = [];
    for (const g of KNOWN_GUEST_NAMES) {
      if (new RegExp(`\\b${g}\\b`, "i").test(fullText)) {
        detectedGuests.push(g);
      }
    }
    if (episodeNumber && episodeNumber > 130 && (fullText.includes("anthony gallegos") || fullText.includes("anthony returns"))) {
      if (!detectedGuests.includes("Anthony Gallegos (Guest Return)")) {
        detectedGuests.push("Anthony Gallegos (Guest Return)");
      }
    }

    return {
      id,
      guid,
      title,
      episodeNumber,
      pubDate: item.pubDate || "",
      audioUrl,
      duration,
      description,
      descriptionHtml,
      link: item.link || "https://comedybutton.libsyn.com/",
      imageUrl,
      isBonus,
      isSpecial,
      category,
      hostEra,
      detectedGuests
    };
  });

  const meta = {
    title: "The Comedy Button",
    description: "Prepare for some of the most insane rambling about everything from life, to sex, to what passes for 21st-century Internet culture. Your aural canals are ours, and we're filling them with nonsense -- courtesy of hosts Brian Altano, Scott Bromley, Ryan Scott, Max Scoville, and Kristin Van De Yar.",
    link: "https://comedybutton.libsyn.com/",
    imageUrl: "https://static.libsyn.com/p/assets/4/b/9/9/4b995a114aac0a5b/ComedyButton-2015-iTunes-icon-1400x1400.jpg",
    author: "Brian Altano, Scott Bromley, Anthony Gallegos, Ryan Scott, Max Scoville, Kristin Van De Yar",
    totalEpisodes: episodes.length,
    lastBuildDate: channel.lastBuildDate || new Date().toISOString(),
    hosts: [
      "Brian Altano",
      "Scott Bromley",
      "Anthony Gallegos",
      "Ryan Scott",
      "Max Scoville",
      "Kristin Van De Yar"
    ]
  };

  const bonus = episodes.filter((ep: any) => ep.isBonus);

  cachedFeed = {
    timestamp: now,
    meta,
    episodes,
    bonus
  };

  return cachedFeed;
}

// API Routes
app.get("/api/podcast/info", async (req, res) => {
  try {
    const feed = await fetchComedyButtonFeed();
    res.json(feed.meta);
  } catch (err: any) {
    console.error("Feed error:", err);
    res.status(500).json({ error: "Failed to fetch podcast info", details: err.message });
  }
});

app.get("/api/podcast/episodes", async (req, res) => {
  try {
    const feed = await fetchComedyButtonFeed();
    const { search, filter } = req.query;
    let list = feed.episodes;

    if (filter === "bonus") {
      list = list.filter((e: any) => e.isBonus);
    } else if (filter === "numbered") {
      list = list.filter((e: any) => !e.isBonus && e.episodeNumber);
    }

    if (typeof search === "string" && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((e: any) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }

    res.json({
      total: list.length,
      episodes: list
    });
  } catch (err: any) {
    console.error("Episodes error:", err);
    res.status(500).json({ error: "Failed to load episodes", details: err.message });
  }
});

app.get("/api/podcast/bonus", async (req, res) => {
  try {
    const feed = await fetchComedyButtonFeed();
    res.json({
      total: feed.bonus.length,
      episodes: feed.bonus
    });
  } catch (err: any) {
    console.error("Bonus error:", err);
    res.status(500).json({ error: "Failed to load bonus content", details: err.message });
  }
});

// Cryptographically secure true random utilities for server using Node crypto
function serverTrueRandomFloat(): number {
  // 0x100000000 ensures float is strictly in [0, 1) and never equals 1.0
  return crypto.randomBytes(4).readUInt32LE(0) / 0x100000000;
}

function serverTrueRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  return Math.floor(serverTrueRandomFloat() * range) + min;
}

function serverTrueRandomShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(serverTrueRandomFloat() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Fixed epoch for synchronized broadcast: Jan 1, 2024 00:00:00 UTC
const SYNC_EPOCH_SECONDS = 1704067200;

interface MasterScheduleItem {
  episode: any;
  durationSeconds: number;
  startOffset: number;
  endOffset: number;
}

// Stable deterministic pseudo-random shuffle for synchronized global broadcast
// Uses Mulberry32 PRNG so that:
// 1. All episodes across all eras (classic 2011 to present) are thoroughly and non-sequentially shuffled.
// 2. All listeners worldwide remain 100% synchronized to the exact same broadcast position.
// 3. Allows re-rolling with a new random seed on demand.
function seededBroadcastShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let s = seed >>> 0;
  const rng = () => {
    let t = (s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

let currentScheduleSeed = 20111027; // Default seed (Oct 27, 2011 - show inception)

let cachedMasterSchedule: {
  items: MasterScheduleItem[];
  totalDurationSeconds: number;
  builtAt: number;
} | null = null;

function buildMasterSchedule(episodes: any[]) {
  const now = Date.now();
  if (cachedMasterSchedule && (now - cachedMasterSchedule.builtAt < 3600000)) {
    return cachedMasterSchedule;
  }

  // Filter episodes with valid audio
  const validEpisodes = episodes.filter((e: any) => e.audioUrl);

  // Permanently shuffled broadcast cycle across all 560+ episodes
  const shuffled = seededBroadcastShuffle(validEpisodes, currentScheduleSeed);

  const items: MasterScheduleItem[] = [];
  let currentOffset = 0;

  for (const ep of shuffled) {
    const durSec = Math.max(600, parseDurationSeconds(ep.duration));
    items.push({
      episode: ep,
      durationSeconds: durSec,
      startOffset: currentOffset,
      endOffset: currentOffset + durSec
    });
    currentOffset += durSec;
  }

  cachedMasterSchedule = {
    items,
    totalDurationSeconds: currentOffset,
    builtAt: now
  };

  return cachedMasterSchedule;
}

// 24/7 Synchronized Global Live Broadcast Timeline (Single Unified Timing for All Listeners)
app.get("/api/stream/timeline", async (req, res) => {
  try {
    const feed = await fetchComedyButtonFeed();
    const schedule = buildMasterSchedule(feed.episodes);
    const totalCycle = schedule.totalDurationSeconds;
    if (totalCycle <= 0 || schedule.items.length === 0) {
      return res.status(500).json({ error: "No episodes in schedule" });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const cycleSec = ((nowSec - SYNC_EPOCH_SECONDS) % totalCycle + totalCycle) % totalCycle;

    // Binary search or linear scan to find onAir item
    let currentIndex = 0;
    for (let i = 0; i < schedule.items.length; i++) {
      if (cycleSec >= schedule.items[i].startOffset && cycleSec < schedule.items[i].endOffset) {
        currentIndex = i;
        break;
      }
    }

    const currentItem = schedule.items[currentIndex];
    const currentOffsetSeconds = cycleSec - currentItem.startOffset;
    const remainingSeconds = currentItem.endOffset - cycleSec;
    const progressPercent = Math.min(100, Math.max(0, (currentOffsetSeconds / currentItem.durationSeconds) * 100));

    // Upcoming scheduled episodes (next 12)
    const upNext: any[] = [];
    let cumulativeStartSec = nowSec + remainingSeconds;
    for (let step = 1; step <= 12; step++) {
      const nextIdx = (currentIndex + step) % schedule.items.length;
      const nextItem = schedule.items[nextIdx];
      const startMs = cumulativeStartSec * 1000;
      const endMs = startMs + nextItem.durationSeconds * 1000;

      const dateObj = new Date(startMs);
      const formattedAirTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      upNext.push({
        episode: nextItem.episode,
        durationSeconds: nextItem.durationSeconds,
        scheduledStart: startMs,
        scheduledEnd: endMs,
        startsInSeconds: cumulativeStartSec - nowSec,
        formattedAirTime
      });

      cumulativeStartSec += nextItem.durationSeconds;
    }

    // Just played episodes (previous 4)
    const justPlayed: any[] = [];
    let pastSec = nowSec - currentOffsetSeconds;
    for (let step = 1; step <= 4; step++) {
      const prevIdx = (currentIndex - step + schedule.items.length) % schedule.items.length;
      const prevItem = schedule.items[prevIdx];
      pastSec -= prevItem.durationSeconds;
      const dateObj = new Date(pastSec * 1000);
      const formattedAirTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      justPlayed.push({
        episode: prevItem.episode,
        durationSeconds: prevItem.durationSeconds,
        scheduledStart: pastSec * 1000,
        scheduledEnd: (pastSec + prevItem.durationSeconds) * 1000,
        formattedAirTime
      });
    }

    res.json({
      serverTime: Date.now(),
      syncEpoch: SYNC_EPOCH_SECONDS,
      totalCycleSeconds: totalCycle,
      totalEpisodesInBroadcast: schedule.items.length,
      onAir: {
        episode: currentItem.episode,
        currentOffsetSeconds,
        durationSeconds: currentItem.durationSeconds,
        remainingSeconds,
        progressPercent,
        formattedCurrentTime: formatSecondsToTimeString(currentOffsetSeconds),
        formattedDuration: formatSecondsToTimeString(currentItem.durationSeconds),
        formattedRemaining: formatSecondsToTimeString(remainingSeconds),
        startedAt: (nowSec - currentOffsetSeconds) * 1000,
        endsAt: (nowSec + remainingSeconds) * 1000
      },
      upNext,
      justPlayed
    });
  } catch (err: any) {
    console.error("Timeline error:", err);
    res.status(500).json({ error: "Failed to generate live timeline", details: err.message });
  }
});

// 24/7 Random Episode Stream & Random Bits Stream (Powered by Cryptographic True Random)
app.get("/api/stream/random-episodes", async (req, res) => {
  try {
    const feed = await fetchComedyButtonFeed();
    const count = Math.min(50, Math.max(5, parseInt(String(req.query.count || 24), 10)));
    const all = [...feed.episodes].filter((e: any) => e.audioUrl);

    // Cryptographic true random Fisher-Yates shuffle
    const shuffled = serverTrueRandomShuffle(all);
    const selected = shuffled.slice(0, count);

    res.json({
      streamName: "24/7 True Random Episodes Shuffle Stream",
      channel: "random-episodes",
      total: selected.length,
      episodes: selected
    });
  } catch (err: any) {
    console.error("Random episodes stream error:", err);
    res.status(500).json({ error: "Failed to load stream episodes", details: err.message });
  }
});



// Forum APIs
app.get("/api/forum/categories", (req, res) => {
  const data = loadForumData();
  const counts: Record<string, number> = {};
  data.posts.forEach((p: any) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  const categories = DEFAULT_CATEGORIES.map(c => ({
    ...c,
    postCount: counts[c.id] || 0
  }));

  res.json(categories);
});

app.get("/api/forum/posts", (req, res) => {
  const data = loadForumData();
  const { category, search } = req.query;
  let posts = data.posts;

  if (category && category !== "all") {
    posts = posts.filter(p => p.category === category);
  }

  if (typeof search === "string" && search.trim()) {
    const q = search.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q)
    );
  }

  res.json(posts);
});

app.get("/api/forum/posts/:id", (req, res) => {
  const data = loadForumData();
  const post = data.posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  res.json(post);
});

app.post("/api/forum/posts", (req, res) => {
  const { title, author, category, content, episodeRefId, episodeRefTitle, authorBadge } = req.body;
  if (!title || !content || !author) {
    return res.status(400).json({ error: "Title, author, and content are required" });
  }

  const data = loadForumData();
  const newPost = {
    id: `post-${Date.now()}`,
    title: String(title).trim(),
    author: String(author).trim() || "Anonymous Listener",
    authorBadge: authorBadge || "Listener",
    category: category || "stories",
    content: String(content).trim(),
    episodeRefId: episodeRefId || undefined,
    episodeRefTitle: episodeRefTitle || undefined,
    createdAt: new Date().toISOString(),
    repliesCount: 0,
    reactions: { brap: 1, lol: 0, beer: 0, fire: 0 },
    comments: []
  };

  data.posts.unshift(newPost);
  saveForumData(data);
  res.status(201).json(newPost);
});

app.post("/api/forum/posts/:id/comments", (req, res) => {
  const { author, content, authorBadge } = req.body;
  if (!content || !author) {
    return res.status(400).json({ error: "Author and content are required" });
  }

  const data = loadForumData();
  const postIndex = data.posts.findIndex(p => p.id === req.params.id);
  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const newComment = {
    id: `comment-${Date.now()}`,
    postId: req.params.id,
    author: String(author).trim(),
    authorBadge: authorBadge || "Member",
    content: String(content).trim(),
    createdAt: new Date().toISOString(),
    reactions: { brap: 0, lol: 0, beer: 0, fire: 0 }
  };

  if (!data.posts[postIndex].comments) {
    data.posts[postIndex].comments = [];
  }
  data.posts[postIndex].comments.push(newComment);
  data.posts[postIndex].repliesCount = data.posts[postIndex].comments.length;

  saveForumData(data);
  res.status(201).json(newComment);
});

app.post("/api/forum/posts/:id/react", (req, res) => {
  const { reactionType } = req.body;
  const allowed = ["brap", "lol", "beer", "fire"];
  if (!allowed.includes(reactionType)) {
    return res.status(400).json({ error: "Invalid reaction type" });
  }

  const data = loadForumData();
  const post = data.posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (!post.reactions) {
    post.reactions = { brap: 0, lol: 0, beer: 0, fire: 0 };
  }
  post.reactions[reactionType] = (post.reactions[reactionType] || 0) + 1;

  saveForumData(data);
  res.json({ reactions: post.reactions });
});

// Helper: Parse duration string to total seconds
function parseDurationSeconds(durationStr?: string): number {
  if (!durationStr) return 3600;
  const parts = String(durationStr).trim().split(":").map(p => parseInt(p, 10));
  if (parts.length === 3 && !parts.some(isNaN)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2 && !parts.some(isNaN)) {
    return parts[0] * 60 + parts[1];
  }
  const numeric = parseInt(durationStr, 10);
  return isNaN(numeric) || numeric <= 0 ? 3600 : numeric;
}

// Helper: Format seconds into MM:SS or HH:MM:SS
function formatSecondsToTimeString(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Resilient Gemini caller with automatic model fallback and retries on 503 / 429
async function callGeminiWithResilience(params: {
  contents: any;
  config?: any;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = getGemini();
  const models = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Calling model ${model} (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config
        });

        if (response.text) {
          console.log(`[Gemini] Successfully received response from ${model}`);
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err.message || err);
        console.warn(`[Gemini] ${model} attempt ${attempt} error:`, msg);

        const isHighDemandOrRateLimit =
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED");

        if (isHighDemandOrRateLimit && attempt === 1) {
          // Brief pause before second attempt with same model
          await new Promise(r => setTimeout(r, 1000));
        } else {
          // If second attempt failed or not transient, advance to next model
          break;
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models are temporarily unavailable");
}

// Gemini AI: Detect discussions and segments from real show notes
app.post("/api/gemini/detect-bits", async (req, res) => {
  const { episodeTitle, episodeDescription, duration } = req.body;
  if (!episodeTitle) {
    return res.status(400).json({ error: "episodeTitle is required" });
  }

  try {
    const prompt = `You are analyzing an episode of "The Comedy Button" podcast.
Episode Title: "${episodeTitle}"
Duration: "${duration || "01:00:00"}"
Official Show Notes:
"${(episodeDescription || "").trim() || "Episode discussion archive."}"

Task:
Extract the distinct discussion topics and segments mentioned or referenced in the official show notes.
For each segment:
- Title: Clear, concise title of the topic discussed.
- Estimate realistic start and end timestamps in seconds based on the duration (${duration || "01:00:00"}).
- Bit type: "Discussion" | "Rant" | "Story" | "Commentary" | "Review" | "Gag".
- Hosts: Likely participating hosts from Brian Altano, Scott Bromley, Ryan Scott, Max Scoville, Kristin Van De Yar, or Anthony Gallegos.
- Summary: Accurate summary strictly reflecting what is described in the show notes.
IMPORTANT: Do NOT invent fictional spoken dialogue or fabricated quotes.

Respond with ONLY a valid JSON object matching this schema:
{
  "episodeTitle": string,
  "bits": [
    {
      "id": string,
      "title": string,
      "startTime": number,
      "endTime": number,
      "startTimeFormatted": string,
      "endTimeFormatted": string,
      "durationFormatted": string,
      "bitType": string,
      "hosts": string[],
      "summary": string
    }
  ]
}`;

    const { text: responseText, modelUsed } = await callGeminiWithResilience({
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(responseText || "{}");
    } catch (parseErr) {
      console.warn("Failed to parse Gemini JSON directly, attempting cleanup:", parseErr);
      const jsonMatch = (responseText || "").match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    if (parsedData.bits && Array.isArray(parsedData.bits) && parsedData.bits.length > 0) {
      return res.json({
        episodeTitle,
        bits: parsedData.bits,
        modelUsed,
        source: "gemini-ai"
      });
    }

    return res.status(503).json({
      error: "Could not extract topics from the show notes for this episode. You can use the precision trimmer to clip any segment manually."
    });
  } catch (err: any) {
    console.error("Gemini detect-bits error:", err.message);
    res.status(503).json({
      error: "Gemini AI topic detection is temporarily unavailable. You can use the precision trimmer to clip any segment manually."
    });
  }
});

// Helper to slice audio cleanly and safely using FFmpeg without memory leaks
function sliceAudioWithFfmpeg(
  audioUrl: string,
  startSec: number,
  durationSec: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const safeStart = Math.max(0, startSec);
    const safeDuration = Math.max(1, Math.min(durationSec, 300)); // Cap single clip to 5 mins

    const args = [
      "-y",
      "-user_agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "-ss", String(safeStart),
      "-i", audioUrl,
      "-t", String(safeDuration),
      "-vn",
      "-c:a", "libmp3lame",
      "-b:a", "128k",
      "-f", "mp3",
      "pipe:1"
    ];

    const proc = spawn("ffmpeg", args);
    const chunks: Buffer[] = [];
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on("data", (d: any) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`FFmpeg slicing failed (code ${code}): ${stderr.slice(-150)}`));
      }
    });

    proc.on("error", (err) => reject(err));
  });
}

// Gemini AI: Transcribe verbatim from real audio when available, or show notes synopsis
app.post("/api/gemini/transcribe-bit", async (req, res) => {
  const {
    episodeTitle,
    bitTitle,
    startTimeFormatted,
    endTimeFormatted,
    summary,
    snippet,
    audioUrl,
    startTime,
    endTime
  } = req.body;

  if (!bitTitle) {
    return res.status(400).json({ error: "bitTitle is required" });
  }

  // Verbatim audio transcription from real audio
  if (audioUrl && typeof startTime === "number" && typeof endTime === "number" && endTime > startTime) {
    try {
      const clipDuration = Math.min(endTime - startTime, 180); // Transcribe up to 3 minutes of real audio
      console.log(`Extracting real audio clip for transcription: ${startTime}s to ${startTime + clipDuration}s from ${audioUrl}`);

      const audioBuffer = await sliceAudioWithFfmpeg(audioUrl, startTime, clipDuration);
      const base64Audio = audioBuffer.toString("base64");

      const prompt = `You are transcribing a real audio clip from "The Comedy Button" podcast.
Episode: "${episodeTitle || "The Comedy Button"}"
Discussion Bit: "${bitTitle}"
Timestamp: ${startTimeFormatted || "00:00"} to ${endTimeFormatted || "03:00"}

Task:
Carefully transcribe the EXACT spoken words verbatim from this audio recording.
- Identify the host speaking (Brian Altano, Scott Bromley, Ryan Scott, Max Scoville, or guest) for each line.
- Include comedic interjections, wheezing laughter, side-tangents, and sound effects (e.g., [BRAP sound], [Ryan laughing in disbelief]).
- Format as clean Markdown with speaker labels (e.g., **Brian:**, **Scott:**, **Ryan:**, **Max:**).
- Provide ONLY the verbatim transcription of what was actually said in this recording. Do not invent or hallucinate lines not in the audio.`;

      const { text: realTranscript, modelUsed } = await callGeminiWithResilience({
        contents: [
          {
            inlineData: {
              mimeType: "audio/mp3",
              data: base64Audio
            }
          },
          { text: prompt }
        ]
      });

      if (realTranscript && realTranscript.trim().length > 20) {
        return res.json({
          bitTitle,
          transcript: realTranscript,
          source: "verbatim-audio",
          modelUsed,
          notice: "Transcribed verbatim from the actual podcast audio recording."
        });
      }
    } catch (audioErr: any) {
      console.warn("Real audio transcription attempt failed:", audioErr.message);
      return res.status(503).json({
        error: "Audio transcription is currently unavailable. Please try again or download the audio clip directly."
      });
    }
  }

  return res.status(400).json({
    error: "Verbatim transcription requires a valid audio recording. Please select an episode with an active audio stream."
  });
});

// Real FFmpeg server-side audio slicer: Returns pristine sliced MP3 stream without client browser memory overload
app.get("/api/audio/slice", async (req, res) => {
  const { url, start, end, title } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  const startSec = Math.max(0, parseFloat(String(start || 0)));
  const endSec = parseFloat(String(end || startSec + 60));
  const durationSec = Math.max(1, Math.min(endSec - startSec, 600)); // Cap to 10 minutes max

  try {
    console.log(`Slicing audio: ${url} [${startSec}s to ${startSec + durationSec}s]`);
    const slicedBuffer = await sliceAudioWithFfmpeg(url, startSec, durationSec);

    const safeTitle = (String(title || "comedy_button_clip")).replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", String(slicedBuffer.length));
    res.setHeader("Content-Disposition", `inline; filename="${safeTitle}.mp3"`);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");

    res.send(slicedBuffer);
  } catch (err: any) {
    console.error("Audio slice endpoint error:", err);
    res.status(500).json({ error: "Failed to slice audio", details: err.message });
  }
});

// Audio proxy endpoint to stream audio without buffering 100MB into memory
app.get("/api/audio-proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    if (req.headers.range) {
      headers["range"] = req.headers.range;
    }

    const fetchRes = await fetch(targetUrl, { headers });
    res.status(fetchRes.status);
    fetchRes.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== "content-security-policy" && lowerKey !== "set-cookie") {
        res.setHeader(key, value);
      }
    });
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (fetchRes.body) {
      // Stream directly to client to prevent Node.js heap overflow
      const nodeStream = Readable.fromWeb(fetchRes.body as any);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("Audio proxy error:", err);
    res.status(500).json({ error: "Failed to proxy audio", details: err.message });
  }
});

async function start() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Comedy Button server running at http://localhost:${PORT}`);
  });
}

start();
