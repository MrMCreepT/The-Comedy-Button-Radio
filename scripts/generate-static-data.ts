import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

const PRIMARY_RSS_URL = "https://rss.libsyn.com/shows/34195/destinations/79079.xml";
const FALLBACK_RSS_URL = "https://comedybutton.libsyn.com/rss";

function parseDurationSeconds(durationStr: string): number {
  if (!durationStr) return 3600;
  const parts = String(durationStr).split(":").map(Number);
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  } else if (parts.length === 2) {
    return (parts[0] * 60) + (parts[1] || 0);
  }
  const parsed = parseInt(durationStr, 10);
  return isNaN(parsed) ? 3600 : parsed;
}

async function generateStaticData() {
  console.log("Fetching live Libsyn RSS feed...");
  let xmlText = "";
  try {
    const res = await fetch(PRIMARY_RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/rss+xml, application/xml, text/xml"
      }
    });
    if (res.ok) {
      xmlText = await res.text();
    } else {
      throw new Error(`Primary returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn("Primary failed, attempting fallback:", err);
    const fb = await fetch(FALLBACK_RSS_URL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    xmlText = await fb.text();
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata"
  });

  const parsed = parser.parse(xmlText);
  const channel = parsed.rss?.channel || {};
  const rawItems = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);

  console.log(`Parsed ${rawItems.length} episodes from feed.`);

  const episodes = rawItems.map((item: any, index: number) => {
    const rawTitle = typeof item.title === "object" ? item.title.__cdata || item.title["#text"] || "" : String(item.title || "");
    const title = rawTitle.trim();

    const epNumMatch = title.match(/Episode\s*:?\s*(\d+)/i) || title.match(/Episdoe\s*:?\s*(\d+)/i);
    const episodeNumber = epNumMatch ? parseInt(epNumMatch[1], 10) : undefined;

    const lowerTitle = title.toLowerCase();
    const isSpecial = lowerTitle.includes("special") || lowerTitle.includes("anniversary") || lowerTitle.includes("message");
    const isCommentary = lowerTitle.includes("commentary");
    const isBonus = isSpecial || isCommentary || lowerTitle.includes("bonus") || lowerTitle.includes("patreon") || lowerTitle.includes("sneak preview") || lowerTitle.includes("minisode") || !episodeNumber;

    let category = "Full Episode";
    if (isCommentary) category = "Audio Commentary";
    else if (isSpecial) category = "Special Event";
    else if (lowerTitle.includes("patreon") || lowerTitle.includes("preview")) category = "Patreon Exclusive";
    else if (lowerTitle.includes("best of")) category = "Best Of Collection";

    let audioUrl = "";
    if (item.enclosure && item.enclosure["@_url"]) {
      audioUrl = item.enclosure["@_url"];
    }

    const guid = typeof item.guid === "object" ? item.guid["#text"] || item.guid.__cdata || "" : String(item.guid || `ep-${index}`);
    const id = `ep-${rawItems.length - index}`;
    const duration = String(item["itunes:duration"] || "01:00:00");

    let rawDesc = item["content:encoded"] || item.description || "";
    if (typeof rawDesc === "object") {
      rawDesc = rawDesc.__cdata || rawDesc["#text"] || "";
    }
    const descriptionHtml = String(rawDesc);
    const description = descriptionHtml.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

    let imageUrl = "https://static.libsyn.com/p/assets/4/b/9/9/4b995a114aac0a5b/ComedyButton-2015-iTunes-icon-1400x1400.jpg";
    if (item["itunes:image"] && item["itunes:image"]["@_href"]) {
      imageUrl = item["itunes:image"]["@_href"];
    }

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

  const outputDir = path.join(process.cwd(), "public", "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const metaPath = path.join(outputDir, "info.json");
  const episodesPath = path.join(outputDir, "episodes.json");

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  fs.writeFileSync(episodesPath, JSON.stringify({ total: episodes.length, episodes }, null, 2));

  console.log(`Generated static dataset successfully: ${metaPath} and ${episodesPath}`);
}

generateStaticData().catch((err) => {
  console.error("Static data generation failed:", err);
  process.exit(1);
});
