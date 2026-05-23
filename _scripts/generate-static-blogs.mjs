#!/usr/bin/env node
/**
 * Fetches all Shopify Storefront API articles and generates static HTML
 * files at /blog/[handle].html. This solves the Ahrefs "non-canonical
 * page in sitemap" warning: the dynamic /blog/post.html sets canonical
 * via JS, which non-JS crawlers (Ahrefs, Bing) ignore. Static files have
 * proper canonical baked in.
 *
 * Usage:
 *   node _scripts/generate-static-blogs.mjs
 *
 * Outputs:
 *   blog/[handle].html for each article
 *   _build/static-blog-urls.txt with the list (for sitemap update)
 *
 * Re-running is idempotent: overwrites existing files.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const STOREFRONT_URL = "https://maple-terroir.myshopify.com/api/2026-01/graphql.json";
const STOREFRONT_TOKEN = "59618e3b6f5e626df6c5f527b4972d3d";
const BLOGS = ["blogs-maple-terroir", "news"];

const LINK_MAP = [
  { re: /\borganic maple syrup\b/i, url: "../organic-maple-syrup" },
  { re: /\bcanadian maple syrup\b/i, url: "../canadian-maple-syrup" },
  { re: /\bmaple syrup wholesale\b/i, url: "../maple-syrup-wholesale" },
  { re: /\bpure maple syrup\b/i, url: "../collections/premium-maple-syrup" },
  { re: /\bmaple stroopwafels?\b/i, url: "../collections/maple-stroopwafels" },
  { re: /\bstroopwafels?\b/i, url: "../collections/maple-stroopwafels" },
  { re: /\bmaple sugar\b/i, url: "../product?handle=organic-pure-maple-sugar" },
  { re: /\bcorporate gifts?\b/i, url: "../maple-syrup-corporate-gift" },
  { re: /\bmaple syrup\b/i, url: "../collections/premium-maple-syrup" },
];

// Cross-link rules per article handle (mirrors BLOG_CROSS_LINKS from blog/post.html,
// but adapted for static rendering: each rule looks for a matching paragraph, then
// inserts a related-reading sentence after it. Links use new static blog URLs (no
// query strings).
const BLOG_CROSS_LINKS = {
  "from-sap-to-sweetness-a-complete-pure-maple-syrup-journey": [
    { after: /sap|tap|tree|sugar maple|collection/i, sentence: 'The economics behind this process are surprisingly complex, and <a href="the-hidden-truth-behind-real-maple-syrup-sap-values-2025-guide">a deep dive into sap values</a> shows just how much weather, yield, and pricing pressure shape every bottle.' },
    { after: /grade|colour|color|amber|dark|golden/i, sentence: 'For a full breakdown of what to look for when buying, the <a href="the-complete-guide-to-canadian-maple-syrup">complete guide to Canadian maple syrup</a> covers grades, regions, and how to read the label.' },
    { after: /bottle|finish|product|taste|flavor|flavour/i, sentence: 'Anyone curious about how that finished product tastes can try our <a href="../product?handle=organic-pure-maple-syrup-250ml">organic single-origin maple syrup</a>, drawn from the same kind of Quebec sugar bush this article describes.' },
  ],
  "5-surprising-maple-syrup-benefits-you-need-to-know": [
    { after: /antioxidant|compound|polyphenol|nutrient|zinc|manganese/i, sentence: 'These properties come through most clearly in pure, minimally processed syrup, the kind explored in detail in our <a href="from-sap-to-sweetness-a-complete-pure-maple-syrup-journey">guide to how maple syrup is made</a>.' },
    { after: /recipe|cook|bak|use|substitut/i, sentence: 'If you want to put these benefits to work in the kitchen, <a href="15-unexpected-maple-syrup-uses-that-go-beyond-pancakes-2025-guide">15 unexpected maple syrup uses</a> goes well beyond the breakfast table.' },
    { after: /pure|organic|process|natural/i, sentence: 'Buyers who want minimally processed, certified-organic syrup can browse our <a href="../organic-maple-syrup">organic Canadian maple syrup line</a>, which carries Ecocert, Canada Organic, and USDA Organic certifications.' },
  ],
  "canadian-maple-syrup-heist-a-30-million-theft-unveiled": [
    { after: /Quebec|federation|reserve|FPAQ|strategic/i, sentence: 'That reserve exists because Canadian maple syrup production is one of the most tightly regulated agricultural industries in the world, something the <a href="canadian-maple-syrup-production-report-2025">2025 production report</a> puts into sharp perspective.' },
    { after: /heritage|tradition|generation|history|artisan/i, sentence: 'The story of how that heritage was built, and what makes Quebec syrup distinct from anything else, is worth understanding on its own terms: <a href="the-rich-story-of-maple-syrup-canada-discover-vancouvers-maple-terroir">The Rich Story of Maple Syrup Canada</a>.' },
    { after: /Canada|producer|farm|sugar bush|catalog/i, sentence: 'Anyone who wants the real product behind that production system can browse our <a href="../canadian-maple-syrup">Canadian maple syrup catalog</a>, drawn straight from the Appalachian Quebec sugar bush.' },
  ],
  "the-rich-story-of-maple-syrup-canada-discover-vancouvers-maple-terroir": [
    { after: /reserve|stockpile|supply|control|Federation/i, sentence: 'That reserve became notorious for another reason entirely. If you have not heard the story, the <a href="canadian-maple-syrup-heist-a-30-million-theft-unveiled">$30 million maple syrup heist</a> is one of the stranger chapters in Canadian agricultural history.' },
    { after: /Quebec|terroir|region|climate|soil|Appalachian|flavour/i, sentence: 'The science behind why Quebec produces such distinct syrup goes deeper than geography, and <a href="the-hidden-truth-behind-real-maple-syrup-sap-values-2025-guide">the hidden truth behind sap values</a> explains what actually varies from season to season.' },
    { after: /family|generation|heritage|founder/i, sentence: 'Our family has documented three generations of sugaring on the <a href="../story">heritage page</a>, the full story behind every bottle.' },
  ],
  "is-organic-maple-syrup-better": [
    { after: /certif|Ecocert|USDA|Canada Organic|organic/i, sentence: 'Shoppers looking for certified-organic syrup can compare options in our <a href="../organic-maple-syrup">organic maple syrup collection</a>, where every bottle carries Ecocert, Canada Organic, and USDA Organic certifications.' },
    { after: /buy|purchas|choose|select|bottle/i, sentence: 'For anyone ready to skip the comparison and start with a known producer, our <a href="../product?handle=organic-pure-maple-syrup-250ml">organic pure maple syrup 250ml</a> is the bottle we ship most often.' },
    { after: /compar|conventional|difference|vs/i, sentence: 'For a deeper comparison of the four real differences, read our <a href="organic-vs-conventional-maple-syrup">organic vs conventional maple syrup breakdown</a>.' },
  ],
  "maple-terroir-partners-with-ted2024-fueling-innovators-with-iconic-stroopwafels": [
    { after: /event|brand|company|partner|corporate|gift/i, sentence: 'Companies planning iconic gifting along the same lines can explore our <a href="../maple-syrup-corporate-gift">corporate gift program</a>, which has served event partners from TED to global brand activations.' },
    { after: /stroopwafel|waffle|cookie|treat/i, sentence: 'The product that anchors those activations is our <a href="../collections/maple-stroopwafels">maple stroopwafel range</a>, made with real Quebec maple syrup in the caramel filling.' },
  ],
  "authentic-dutch-stroopwafel-recipe-a-bakers-guide-to-making-these-caramel-filled-treats": [
    { after: /store.bought|commercial|packaged|shelf|supermarket/i, sentence: 'Before committing to the full process, it is worth reading the <a href="homemade-vs-store-bought-waffle-snacks-which-tastes-better-2025">homemade vs store-bought taste test</a>. The gap is real, but not always where people expect it.' },
    { after: /caramel|filling|fill|sandwich/i, sentence: 'Anyone intimidated by the caramel filling step can pick up the ready-made versions in our <a href="../collections/maple-stroopwafels">maple stroopwafel collection</a>, which use the same real Quebec maple syrup the recipe calls for.' },
  ],
  "homemade-vs-store-bought-waffle-snacks-which-tastes-better-2025": [
    { after: /recipe|flour|dough|bak|caramel|filling|waffle iron/i, sentence: 'For anyone ready to take on the scratch version, the <a href="authentic-dutch-stroopwafel-recipe-a-bakers-guide-to-making-these-caramel-filled-treats">complete Dutch stroopwafel recipe</a> covers every step from dough to caramel fill.' },
    { after: /supermarket|grocery|brand|aisle|shelf|cheap/i, sentence: 'Shoppers who want the store-bought option done properly can browse our <a href="../collections/maple-stroopwafels">premium maple stroopwafels</a>, which use real Quebec maple syrup instead of corn-syrup flavoring.' },
  ],
  "the-complete-guide-to-canadian-maple-syrup": [
    { after: /Quebec|province|region|production|output|supply/i, sentence: 'The numbers behind that dominance are striking, and the <a href="canadian-maple-syrup-production-report-2025">2025 Canadian maple syrup production report</a> tracks exactly how the market has shifted and where it is heading.' },
    { after: /history|heritage|tradition|Indigenous|century/i, sentence: 'For the human side of that story, <a href="the-rich-story-of-maple-syrup-canada-discover-vancouvers-maple-terroir">The Rich Story of Maple Syrup Canada</a> goes deep on the generational craft behind the category.' },
    { after: /buy|shop|purchase|tasting|sample/i, sentence: 'Anyone ready to taste the difference can browse our <a href="../collections/premium-maple-syrup">premium maple syrup collection</a>, sourced single-origin from the Appalachian Mountains of Quebec.' },
    { after: /grade|amber|golden|dark/i, sentence: 'For a clear breakdown of grade A vs the retired grade B classification, read <a href="grade-a-vs-grade-b-maple-syrup">grade A vs grade B maple syrup explained</a>.' },
  ],
  "canadian-maple-syrup-production-report-2025": [
    { after: /reserve|stockpile|heist|theft|stolen/i, sentence: 'That strategic reserve made headlines for more than its scale. The <a href="canadian-maple-syrup-heist-a-30-million-theft-unveiled">$30 million maple syrup heist</a> remains one of the most bizarre stories in food industry history.' },
    { after: /market|valuation|billion|growth|consumer|demand/i, sentence: 'For a ground-level look at what drives that demand, the <a href="the-complete-guide-to-canadian-maple-syrup">complete guide to Canadian maple syrup</a> covers what distinguishes premium product from commodity.' },
    { after: /consumer|retail|buy|shop|grocery/i, sentence: 'For shoppers who want a piece of that production, our <a href="../canadian-maple-syrup">Canadian maple syrup catalog</a> includes the same single-origin Quebec syrup the report tracks.' },
  ],
  "canadian-maple-syrup-production-report-2025-hidden-market-opportunities-revealed": [
    { after: /reserve|stockpile|heist|theft|stolen/i, sentence: 'That strategic reserve made headlines for more than its scale. The <a href="canadian-maple-syrup-heist-a-30-million-theft-unveiled">$30 million maple syrup heist</a> remains one of the most bizarre stories in food industry history.' },
    { after: /market|valuation|billion|growth|consumer|demand/i, sentence: 'For a ground-level look at what drives that demand, the <a href="the-complete-guide-to-canadian-maple-syrup">complete guide to Canadian maple syrup</a> covers what distinguishes premium product from commodity.' },
    { after: /wholesale|business|retail|distribut|opportunity/i, sentence: 'Businesses looking to capture some of that market can explore our <a href="../maple-syrup-wholesale">wholesale maple syrup program</a>, which serves retailers, restaurants, and corporate gift clients.' },
  ],
  "15-unexpected-maple-syrup-uses-that-go-beyond-pancakes-2025-guide": [
    { after: /health|benefit|nutrient|antioxidant|zinc|manganese/i, sentence: 'The nutritional case for making that swap goes deeper than sweetness. <a href="5-surprising-maple-syrup-benefits-you-need-to-know">5 surprising maple syrup benefits</a> breaks down what the research actually shows.' },
    { after: /grade|table|real|pure|authentic|quality/i, sentence: 'Anyone working through this list will want real maple syrup rather than table syrup. We stock the full grade range from golden to very dark in our <a href="../collections/premium-maple-syrup">premium maple syrup collection</a>. See also <a href="pure-maple-syrup-vs-table-syrup">pure maple syrup vs table syrup explained</a>.' },
  ],
  "the-truth-about-maple-syrup-hidden-uses-most-people-dont-know": [
    { after: /recipe|cook|glaze|marinade|savory|sweet|kitchen/i, sentence: 'For a longer list with step-by-step applications, <a href="15-unexpected-maple-syrup-uses-that-go-beyond-pancakes-2025-guide">15 unexpected maple syrup uses</a> covers everything from cocktail syrups to salad dressings.' },
    { after: /savory|marinade|glaze|salad|dressing|drizzle/i, sentence: 'Anyone planning to put those uses into practice can start with a real bottle from our <a href="../collections/premium-maple-syrup">premium maple syrup collection</a>, which holds up well in both sweet and savory applications.' },
  ],
  "the-hidden-truth-behind-real-maple-syrup-sap-values-2025-guide": [
    { after: /sap|tap|tree|season|spring|winter|harvest/i, sentence: 'The hands-on side of that process, what actually happens from tap to bottle, is covered thoroughly in <a href="from-sap-to-sweetness-a-complete-pure-maple-syrup-journey">From Sap to Sweetness</a>.' },
    { after: /Quebec|Canada|supply|production|industry|market/i, sentence: 'For the broader market picture, the <a href="canadian-maple-syrup-production-report-2025">2025 Canadian maple syrup production report</a> tracks where the industry stands and where it is heading.' },
    { after: /price|cost|value|premium|consumer|bottle/i, sentence: 'Buyers who want a finished bottle from a producer with full traceability can find that in our <a href="../product?handle=organic-pure-maple-syrup-250ml">organic pure maple syrup</a>, drawn from the same Quebec sugar bush season after season.' },
  ],
  "can-you-tap-any-maple-tree-the-truth-about-backyard-syrup-making": [
    { after: /sap|boil|evaporat|reduc|40|ratio|gallon/i, sentence: 'If you want to understand what actually happens to that sap after collection, <a href="from-sap-to-sweetness-a-complete-pure-maple-syrup-journey">From Sap to Sweetness</a> follows the full journey from tree to bottle.' },
    { after: /buy|store|easier|finished|bottle|grocer|skip/i, sentence: 'Readers who decide the DIY route is more work than expected can skip ahead and try our <a href="../canadian-maple-syrup">authentic Canadian maple syrup</a>, drawn from a third-generation Quebec sugar bush.' },
  ],
  "the-ultimate-guide-to-maple-sugar-why-chefs-and-foodies-love-this-secret-ingredient": [
    { after: /health|benefit|mineral|zinc|manganese|glycemic/i, sentence: 'The nutritional story behind maple-derived sweeteners is broader than most people realise. <a href="5-surprising-maple-syrup-benefits-you-need-to-know">5 surprising maple syrup benefits</a> covers what the research actually shows.' },
    { after: /bak|recipe|cook|substitut|replac/i, sentence: 'For inspiration on where to use it, <a href="15-easy-gluten-free-maple-cake-recipes-your-family-will-love-in-2025">15 gluten-free maple cake recipes</a> shows how maple sugar performs as a primary sweetener across a range of bakes.' },
    { after: /try|kitchen|home|chef|cook|pantry/i, sentence: 'Home cooks ready to try it can pick up our <a href="../product?handle=organic-pure-maple-sugar">organic pure maple sugar</a>, the same one we use in our own kitchen.' },
  ],
  "15-easy-gluten-free-maple-cake-recipes-your-family-will-love-in-2025": [
    { after: /sugar|sweetener|granulat|substitut|replac/i, sentence: 'Maple sugar is worth understanding as a standalone ingredient before you start baking. <a href="the-ultimate-guide-to-maple-sugar-why-chefs-and-foodies-love-this-secret-ingredient">The Ultimate Guide to Maple Sugar</a> covers flavour profile, storage, and why chefs are making the switch.' },
    { after: /flour|crumb|moisture|bake|texture|frosting/i, sentence: 'Bakers can use our <a href="../product?handle=organic-pure-maple-sugar">organic pure maple sugar</a> in the recipes that call for granulated maple, the same one we use in our own kitchen.' },
  ],
  "1123": [
    { after: /sap|tap|yield|vacuum|production|extract/i, sentence: 'The experience of that process at the farm level, what it looks like season to season, comes through clearly in <a href="from-sap-to-sweetness-a-complete-pure-maple-syrup-journey">From Sap to Sweetness</a>.' },
  ],
};

async function gql(query, variables = {}) {
  const res = await fetch(STOREFRONT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return (await res.json()).data;
}

async function fetchAllArticles() {
  const articles = [];
  for (const blogHandle of BLOGS) {
    const q = `{ blog(handle: "${blogHandle}") { handle articles(first: 50) { edges { node {
      handle title contentHtml excerpt
      image { url altText width height }
      publishedAt
      authorV2 { name }
      seo { title description }
    } } } } }`;
    const data = await gql(q);
    if (!data.blog) continue;
    for (const edge of data.blog.articles.edges) {
      articles.push({ ...edge.node, blogHandle });
    }
  }
  return articles;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// U+2014 is the long horizontal punctuation rule banned in user-facing copy by
// the project writing rules. Strip it from any Shopify content we ingest.
const EM = String.fromCharCode(0x2014);
function stripEmDashes(s) {
  return String(s).split(" " + EM + " ").join(", ").split(EM).join(",");
}

function truncateAtWord(s, max) {
  if (s.length <= max) return s;
  const sliced = s.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > max * 0.6) return sliced.slice(0, lastSpace).replace(/[\s.,:;\-]+$/, "");
  return sliced.replace(/[\s.,:;\-]+$/, "");
}

function injectKeywordLinks(html) {
  // server-side equivalent of injectInternalLinks from blog/post.html
  // For each rule, find first match in any non-anchor text and wrap it once.
  let result = html;
  for (const rule of LINK_MAP) {
    // Skip text that is already inside an <a>
    const parts = result.split(/(<a\b[^>]*>.*?<\/a>)/gi);
    let injected = false;
    const newParts = parts.map((part) => {
      if (injected) return part;
      if (part.startsWith("<a")) return part;
      const m = rule.re.exec(part);
      if (!m) return part;
      injected = true;
      return part.slice(0, m.index) + `<a href="${rule.url}">${m[0]}</a>` + part.slice(m.index + m[0].length);
    });
    result = newParts.join("");
  }
  return result;
}

function injectCrossLinks(html, handle) {
  const rules = BLOG_CROSS_LINKS[handle];
  if (!rules) return html;
  // Split content into paragraphs by finding </p> boundaries.
  // For each rule, find a <p> whose text matches the rule.after regex and insert
  // the cross-link <p> after it. Track used paragraphs to avoid stacking.
  const paraPattern = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const matches = [];
  let m;
  while ((m = paraPattern.exec(html)) !== null) {
    matches.push({ index: m.index, length: m[0].length, text: m[1].replace(/<[^>]+>/g, ""), full: m[0] });
  }
  if (!matches.length) return html;
  const used = new Set();
  const insertions = []; // { afterIndex, sentence }
  for (const rule of rules) {
    let target = null;
    for (const p of matches) {
      if (used.has(p.index)) continue;
      if (rule.after.test(p.text)) { target = p; break; }
    }
    if (!target) {
      for (const p of matches) { if (!used.has(p.index)) { target = p; break; } }
    }
    if (!target) continue;
    used.add(target.index);
    insertions.push({ afterIndex: target.index + target.length, sentence: rule.sentence });
  }
  // Apply insertions in reverse order so earlier indexes remain valid
  insertions.sort((a, b) => b.afterIndex - a.afterIndex);
  for (const ins of insertions) {
    html = html.slice(0, ins.afterIndex) + `\n<p>${ins.sentence}</p>` + html.slice(ins.afterIndex);
  }
  return html;
}

function template(article) {
  const handle = article.handle;
  const title = stripEmDashes(article.title || handle);
  const seoTitle = stripEmDashes((article.seo && article.seo.title) || title);
  const description = stripEmDashes((article.seo && article.seo.description) || article.excerpt || `Read ${title} on the Maple Terroir blog.`);
  const image = (article.image && article.image.url) || "https://cdn.shopify.com/s/files/1/0636/0763/6217/products/maple-syrup-maple-leaf-250ml.jpg?v=1749671463";
  const imageAlt = (article.image && article.image.altText) || title;
  const publishedAt = article.publishedAt || new Date().toISOString();
  const dateOnly = publishedAt.slice(0, 10);
  const dateReadable = new Date(publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const author = (article.authorV2 && article.authorV2.name) || "Maple Terroir";
  const canonical = `https://mapleterroir.com/blog/${handle}`;
  const breadcrumbName = title.length > 60 ? title.slice(0, 57) + "..." : title;

  // Process the article body HTML
  let body = article.contentHtml || "";
  // Some Shopify articles ship with empty contentHtml but a populated excerpt.
  // Fall back to the excerpt as paragraphs so the static page is not a
  // content-thin shell.
  if (body.replace(/<[^>]+>/g, "").trim().length < 100 && article.excerpt) {
    const paras = article.excerpt.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    body = paras.map(p => "<p>" + escapeHtml(p) + "</p>").join("\n");
  }
  body = stripEmDashes(body);
  body = injectKeywordLinks(body);
  body = injectCrossLinks(body, handle);

  // Truncate <title> to fit Google (under 60). Append brand if room.
  const brandSuffix = " | Maple Terroir";
  let pageTitle = seoTitle;
  const budget = 60 - brandSuffix.length;
  if (pageTitle.length > budget) pageTitle = truncateAtWord(pageTitle, budget);
  pageTitle = pageTitle + brandSuffix;

  const wordCount = (body.replace(/<[^>]+>/g, " ").match(/\b\w+\b/g) || []).length;
  const readMinutes = Math.max(2, Math.round(wordCount / 220));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" sizes="32x32" href="../assets/favicon-32.png">
  <link rel="icon" type="image/png" sizes="512x512" href="../assets/favicon.png">
  <link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    image: image,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: { "@type": "Organization", name: "Maple Terroir", url: "https://mapleterroir.com/" },
    publisher: { "@type": "Organization", name: "Maple Terroir", logo: { "@type": "ImageObject", url: "https://mapleterroir.com/assets/images/mt-logo.webp" } },
    mainEntityOfPage: canonical,
  })}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://mapleterroir.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://mapleterroir.com/blog/" },
      { "@type": "ListItem", position: 3, name: breadcrumbName, item: canonical },
    ],
  })}
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { theme: { extend: {
      colors: { cream: '#FDFBF7', 'cream-dark': '#F5F0E8', amber: { warm: '#C4841D', deep: '#8B5E14', light: '#E8A84C', glow: '#F4C77D' }, charcoal: '#1A1714', 'warm-gray': { 100: '#F7F4EF', 200: '#EDE8DF', 300: '#D9D1C4', 400: '#B8AD9E', 500: '#8C8175', 600: '#5A5249', 700: '#4A4239', 800: '#2E2822' } },
      fontFamily: { display: ['"Fraunces"', 'Georgia', 'serif'], body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] }
    }}}
  </script>

  <style>
    html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background-color: #FDFBF7; color: #2E2822; overflow-x: hidden; }
    body::after { content: ''; position: fixed; inset: 0; z-index: 50; pointer-events: none; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #FDFBF7; } ::-webkit-scrollbar-thumb { background: #D9D1C4; border-radius: 3px; }
    .nav-glass { backdrop-filter: blur(20px) saturate(1.8); -webkit-backdrop-filter: blur(20px) saturate(1.8); transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1); }
    .nav-scrolled { background: rgba(253, 251, 247, 0.85); box-shadow: 0 4px 30px rgba(0,0,0,0.04); }
    .btn-premium { transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1); }
    .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 20px 40px -15px rgba(196,132,29,0.3); }
    .link-underline { position: relative; } .link-underline::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: currentColor; transition: width 0.5s cubic-bezier(0.32, 0.72, 0, 1); } .link-underline:hover::after { width: 100%; }
    .eyebrow { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; }
    .article-body { max-width: 720px; margin: 0 auto; }
    .article-body h1, .article-body h2, .article-body h3, .article-body h4 { font-family: 'Fraunces', Georgia, serif; color: #1A1714; margin-top: 2rem; margin-bottom: 0.75rem; font-weight: 600; line-height: 1.25; }
    .article-body h2 { font-size: 1.5rem; }
    .article-body h3 { font-size: 1.25rem; }
    .article-body p { margin-bottom: 1.25rem; line-height: 1.8; color: #4A4239; font-size: 0.95rem; }
    .article-body ul, .article-body ol { margin-bottom: 1.25rem; padding-left: 1.5rem; color: #4A4239; font-size: 0.95rem; line-height: 1.8; }
    .article-body li { margin-bottom: 0.5rem; }
    .article-body img { border-radius: 1rem; margin: 2rem 0; max-width: 100%; height: auto; }
    .article-body a { color: #C4841D; text-decoration: underline; text-underline-offset: 2px; }
    .article-body a:hover { color: #8B5E14; }
    .article-body blockquote { border-left: 3px solid #C4841D; padding-left: 1.25rem; margin: 1.5rem 0; font-style: italic; color: #6B6158; }
    .article-body strong { color: #1A1714; font-weight: 600; }
    @media (prefers-reduced-motion: reduce) { .btn-premium { transition: none; } .btn-premium:hover { transform: none; box-shadow: none; } * { scroll-behavior: auto !important; } }
  </style>
</head>

<body>

  <nav id="navbar" class="fixed top-0 left-0 right-0 z-40 pt-5 px-4 md:px-8">
    <div class="nav-glass max-w-6xl mx-auto rounded-full px-5 py-3 md:px-8 md:py-4 flex items-center justify-between border border-warm-gray-200/50">
      <a href="../index.html" class="flex items-center group" aria-label="Maple Terroir - home"><img src="../assets/images/mt-logo.webp" alt="Maple Terroir" class="h-9 md:h-11 w-auto" width="1280" height="500"></a>
      <div class="hidden md:flex items-center gap-8">
        <a href="../story.html" class="link-underline text-[15px] font-medium text-charcoal/80 hover:text-charcoal transition-colors duration-500">Our Story</a>
        <a href="../products.html" class="link-underline text-[15px] font-medium text-charcoal/80 hover:text-charcoal transition-colors duration-500">Products</a>
        <a href="../terroir.html" class="link-underline text-[15px] font-medium text-charcoal/80 hover:text-charcoal transition-colors duration-500">Terroir</a>
        <a href="./" class="link-underline text-[15px] font-medium text-charcoal/80 hover:text-charcoal transition-colors duration-500">Blog</a>
        <a href="../maple-syrup-wholesale.html" class="link-underline text-sm font-medium text-charcoal transition-colors duration-500">Wholesale</a>
        <a href="../products.html" class="btn-premium inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-5 py-2.5 text-sm font-medium group">
          <span>Shop Now</span>
          <span class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><svg class="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </a>
      </div>
      <button id="menu-toggle" class="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-warm-gray-100 transition-colors duration-300" aria-label="Toggle menu">
        <div class="relative w-5 h-4 flex flex-col justify-between">
          <span id="bar1" class="block w-full h-[1.5px] bg-charcoal rounded-full transition-all duration-500 origin-center"></span>
          <span id="bar2" class="block w-full h-[1.5px] bg-charcoal rounded-full transition-all duration-500"></span>
          <span id="bar3" class="block w-full h-[1.5px] bg-charcoal rounded-full transition-all duration-500 origin-center"></span>
        </div>
      </button>
    </div>
  </nav>

  <div id="mobile-menu" class="fixed inset-0 z-30 pointer-events-none opacity-0 transition-opacity duration-500">
    <div class="absolute inset-0 bg-cream/95 backdrop-blur-3xl"></div>
    <div class="relative h-full flex flex-col items-center justify-center gap-8 px-8">
      <a href="../story.html" class="mobile-link text-3xl font-display font-semibold text-charcoal translate-y-12 opacity-0 transition-all duration-700" style="transition-delay:100ms">Our Story</a>
      <a href="../products.html" class="mobile-link text-3xl font-display font-semibold text-charcoal translate-y-12 opacity-0 transition-all duration-700" style="transition-delay:200ms">Products</a>
      <a href="../terroir.html" class="mobile-link text-3xl font-display font-semibold text-charcoal translate-y-12 opacity-0 transition-all duration-700" style="transition-delay:300ms">Terroir</a>
      <a href="./" class="mobile-link text-3xl font-display font-semibold text-charcoal translate-y-12 opacity-0 transition-all duration-700" style="transition-delay:350ms">Blog</a>
      <a href="../maple-syrup-wholesale.html" class="mobile-link text-3xl font-display font-semibold text-charcoal translate-y-12 opacity-0 transition-all duration-700" style="transition-delay:400ms">Wholesale</a>
      <a href="../products.html" class="mobile-link btn-premium mt-4 inline-flex items-center gap-3 bg-charcoal text-cream rounded-full px-8 py-4 text-lg font-medium translate-y-12 opacity-0 transition-all duration-700" style="transition-delay:500ms">Shop Now</a>
    </div>
  </div>


  <section class="pt-32 md:pt-40 pb-12 md:pb-16 px-4 md:px-8">
    <div class="max-w-[900px] mx-auto">
      <a href="./" class="eyebrow inline-flex items-center gap-2 text-amber-warm mb-6 hover:text-amber-deep transition-colors">
        <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2L2 6l6 4"/></svg>
        Back to the Maple Terroir Blog
      </a>
      <h1 class="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-charcoal tracking-tight leading-[1.1] mb-6">${escapeHtml(title)}</h1>
      <div class="flex items-center gap-3 text-sm text-warm-gray-500">
        <span>By ${escapeHtml(author)}</span>
        <span class="w-1 h-1 rounded-full bg-warm-gray-400"></span>
        <time datetime="${dateOnly}">${dateReadable}</time>
        <span class="w-1 h-1 rounded-full bg-warm-gray-400"></span>
        <span>${readMinutes} min read</span>
      </div>
    </div>
  </section>

  <section class="px-4 md:px-8 mb-8 md:mb-16">
    <div class="max-w-[1200px] mx-auto">
      <div class="rounded-[2rem] overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-cream-dark">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}" class="w-full h-full object-cover">
      </div>
    </div>
  </section>

  <article class="py-8 md:py-12 px-4 md:px-8">
    <div class="article-body">
      ${body}
    </div>
  </article>

  <section class="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden border-t border-warm-gray-200/30">
    <div class="absolute inset-0">
      <img src="../assets/images/story/sap-in-bucket.png" alt="Canadian maple syrup sap dripping into a collection bucket in a Quebec sugar bush" class="w-full h-full object-cover">
    </div>
    <div class="absolute inset-0 bg-charcoal/65"></div>
    <div class="relative max-w-[1100px] mx-auto text-center">
      <h2 class="font-display text-3xl md:text-4xl font-semibold text-cream tracking-tight leading-tight mb-4 max-w-2xl mx-auto">Single-Origin Quebec Maple Syrup, Family-Owned Since 1978.</h2>
      <p class="text-warm-gray-300 leading-relaxed max-w-[48ch] mx-auto mb-8">Triple-certified organic, shipped from Vancouver across Canada and to five international markets.</p>
      <div class="flex flex-wrap gap-4 justify-center">
        <a href="../products.html" class="btn-premium inline-flex items-center gap-3 bg-amber-warm text-white rounded-full px-7 py-4 text-sm font-semibold group"><span>Shop Maple Terroir</span><span class="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110"><svg class="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>
        <a href="./" class="btn-premium inline-flex items-center gap-3 bg-white/10 border border-white/20 text-cream rounded-full px-7 py-4 text-sm font-medium hover:bg-white/15">More from the Blog</a>
      </div>
    </div>
  </section>

  <footer class="py-16 md:py-24 px-4 md:px-8 border-t border-warm-gray-200/50">
    <div class="max-w-[1400px] mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16 md:mb-20">
        <div class="md:col-span-5">
          <a href="../index.html" class="flex items-center gap-2.5 mb-6">
            <svg class="w-8 h-8 text-amber-warm" viewBox="0 0 40 40" fill="none"><path d="M20 4C20 4 14 10 10 16C6 22 8 30 14 34C16 35.5 18 36 20 36C22 36 24 35.5 26 34C32 30 34 22 30 16C26 10 20 4 20 4Z" fill="currentColor" opacity="0.15"/><path d="M20 4C20 4 14 10 10 16C6 22 8 30 14 34C16 35.5 18 36 20 36C22 36 24 35.5 26 34C32 30 34 22 30 16C26 10 20 4 20 4Z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
            <span class="font-display text-xl font-semibold text-charcoal tracking-tight">Maple Terroir</span>
          </a>
          <p class="text-sm text-warm-gray-500 leading-relaxed max-w-[40ch]">Pure maple from Canada, delivered to your table. Family-owned since 1978, certified organic, proudly Canadian.</p>
        </div>
        <div class="md:col-span-2 md:col-start-7">
          <h4 class="eyebrow text-warm-gray-400 mb-4">Explore</h4>
          <ul class="space-y-3">
            <li><a href="../story.html" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Our Story</a></li>
            <li><a href="../terroir.html" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Terroir</a></li>
            <li><a href="../certifications.html" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Certifications</a></li>
            <li><a href="../canadian-maple-syrup.html" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Canadian Maple Syrup</a></li>
            <li><a href="../locations-we-serve/" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Locations We Serve</a></li>
          </ul>
        </div>
        <div class="md:col-span-2">
          <h4 class="eyebrow text-warm-gray-400 mb-4">Shop</h4>
          <ul class="space-y-3">
            <li><a href="../products.html" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">All Products</a></li>
            <li><a href="../collections/premium-maple-syrup" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Maple Syrup</a></li>
            <li><a href="../collections/maple-syrup-gift-set" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Gift Sets</a></li>
            <li><a href="../maple-syrup-wholesale.html" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Wholesale</a></li>
          </ul>
        </div>
        <div class="md:col-span-2">
          <h4 class="eyebrow text-warm-gray-400 mb-4">Connect</h4>
          <ul class="space-y-3">
            <li><a href="mailto:info@mapleterroir.com" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Contact Us</a></li>
            <li><a href="./" class="text-sm text-warm-gray-600 hover:text-charcoal transition-colors">Blog</a></li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-warm-gray-200/50">
        <p class="text-xs text-warm-gray-400">&copy; 2026 Maple Terroir Products Ltd. All rights reserved.</p>
        <div class="flex items-center gap-6">
          <span class="text-xs text-warm-gray-300">Ecocert</span>
          <span class="text-xs text-warm-gray-300">Canada Organic</span>
          <span class="text-xs text-warm-gray-300">USDA Organic</span>
        </div>
      </div>
    </div>
  </footer>

  <script>
    var nb = document.getElementById('navbar'), ni = nb.querySelector('.nav-glass');
    window.addEventListener('scroll', function () { ni.classList.toggle('nav-scrolled', window.pageYOffset > 80); }, { passive: true });
    var mt = document.getElementById('menu-toggle'), mm = document.getElementById('mobile-menu'), ml = document.querySelectorAll('.mobile-link');
    var b1 = document.getElementById('bar1'), b2 = document.getElementById('bar2'), b3 = document.getElementById('bar3'), mo = false;
    mt.addEventListener('click', function () {
      mo = !mo; mm.style.opacity = mo ? '1' : '0'; mm.style.pointerEvents = mo ? 'auto' : 'none';
      b1.style.transform = mo ? 'translateY(5px) rotate(45deg)' : ''; b2.style.opacity = mo ? '0' : '1'; b3.style.transform = mo ? 'translateY(-5px) rotate(-45deg)' : '';
      ml.forEach(function (l) { l.style.opacity = mo ? '1' : '0'; l.style.transform = mo ? 'translateY(0)' : 'translateY(3rem)'; });
      document.body.style.overflow = mo ? 'hidden' : '';
    });
    ml.forEach(function (l) { l.addEventListener('click', function () { mo = false; mm.style.opacity = '0'; mm.style.pointerEvents = 'none'; b1.style.transform = ''; b2.style.opacity = '1'; b3.style.transform = ''; document.body.style.overflow = ''; }); });
  </script>

  <script src="../assets/shared.js" defer></script>
</body>
</html>`;
}

async function main() {
  console.log("Fetching all articles from Shopify...");
  const articles = await fetchAllArticles();
  console.log(`Got ${articles.length} articles\n`);

  const blogDir = path.join(REPO_ROOT, "blog");
  const written = [];
  for (const a of articles) {
    const html = template(a);
    const filename = path.join(blogDir, `${a.handle}.html`);
    fs.writeFileSync(filename, html);
    written.push({ handle: a.handle, blog: a.blogHandle, title: a.title, publishedAt: a.publishedAt });
    console.log(`  WROTE ${a.handle}.html (${(html.length / 1024).toFixed(0)} kb)`);
  }

  // Write a manifest for sitemap and redirect updates
  const manifestPath = path.join(REPO_ROOT, "_scripts", "static-blogs-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(written, null, 2));
  console.log(`\nManifest: ${manifestPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
