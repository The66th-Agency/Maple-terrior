// Bakes the shared blocks of the Canada city pages into every page that carries
// their markers. One script, so a block changes in one place and every page
// that shows it changes on the next run (it replaced build-family.mjs on
// 2026-10-02).
//
// Markers, each an empty pair the page places where the block should sit:
//   <!-- LOGOS:START baked by scripts/build-blocks.mjs -->     <!-- LOGOS:END -->
//     A thin strip under the hero: the average customer rating, then the
//     retailer logos in one slow marquee. Liam, 2026-10-02: "a marquee sleek
//     with the logos of where we are located but one strip and subtle".
//   <!-- REVIEWS:START set="syrup" -->                          <!-- REVIEWS:END -->
//     Three real customer reviews right after the product grid, so the proof
//     sits in the top half (visual.md). set="syrup" or set="gifts".
//   <!-- FAMILY:START baked by scripts/build-blocks.mjs -->    <!-- FAMILY:END -->
//     The family section: who started the company and who packs the orders.
//   <!-- CTA:START title="..." text="..." href="..." label="..." href2="..." label2="..." -->  <!-- CTA:END -->
//     The closing section, last before the footer: the homepage's amber panel
//     (Liam, October 3, 2026: one component reused across all pages, after the
//     site had grown photo, dark, grey and amber closers). Every attribute is
//     optional. A page sets one only when its reader needs a different heading
//     or button, as a city page or the press page does; left out, the page gets
//     the homepage's copy. href2 and label2 add a quieter second button. Inside
//     an attribute, write < > and " as &lt; &gt; and &quot;, so a link in the
//     text survives.
//
//   <!-- ANATOMY:START key="organic" -->   <!-- ANATOMY:END -->
//     The product photo with numbered points around it. On a product page, leave out the key.
//
//   <!-- PROOF:START baked by scripts/build-blocks.mjs -->     <!-- PROOF:END -->
//     The store-wide ratings under Add to Cart on every product page: Google and
//     our own customer reviews, each with its total (Liam, October 12, 2026: "for
//     all product pages we should have general conversion social proofs like
//     google reviews logo with how many in total and loox").
//
// Usage: node scripts/build-blocks.mjs [page.html ...]   (no files: every page)
//
// Facts:
// - RATINGS below is the one place the numbers live; the LOGOS strip and the
//   PROOF block both read it. Google: 4.9 from 42 reviews on the Maple Terroir
//   profile at 9291 Shaughnessy St (Google Maps via DataForSEO, 2026-10-12).
//   Loox: 93 reviews averaging 5.0 (Loox admin, 2026-10-02). Update both when
//   either moves, then re-run.
// - The logos are the nine on the homepage's "Where to Find Us" strip, the set
//   Shawn reviewed in June 2026. They stay unlinked: trust, never a route away
//   from the store (site CLAUDE.md, 2026-06-29).
// - Reviews are read from the product pages, which build-reviews.mjs bakes from
//   the Loox export, so a quote here is always word for word what the customer
//   wrote and still published on the product page.
// - Family: Wayne Lytton, born in Nanaimo, founded the company with his wife
//   Kaori in 1978, and the brand calls itself three generations (old Shopify
//   About page, maple-terroir.myshopify.com/pages/about). Shawn Lytton is President
//   (he prefers it to CEO, October 23, 2026). Who packs is said in Shawn's words
//   (his Cansumer answers, October 23, 2026): "our online orders are packed by family
//   members at our facility", with no Vancouver packing line and no name (Liam,
//   October 27, 2026: "Yes, change the line to Shawn's wording on every page: our
//   online orders are packed by family members at our facility."). The photo is Shawn, from the old
//   About page, cropped to keep another company's packaging out of frame. When the
//   family group photo arrives, replace PHOTO and ALT below and re-run.
//
// Run: node scripts/build-blocks.mjs   (idempotent; rewrites only the marked blocks)

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true" class="w-4 h-4 fill-current"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
const STARS = `<span class="inline-flex gap-0.5 text-amber-warm" role="img" aria-label="5 out of 5 stars">${STAR.repeat(5)}</span>`;

// ------------------------------------------------------------ RATINGS
const RATINGS = {
  google: { value: '4.9', count: 42 },
  loox: { value: '5.0', count: 93 },
};
const GOOGLE_G = '<svg viewBox="0 0 48 48" aria-hidden="true" class="w-4 h-4 flex-shrink-0"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
const smallStars = (label) => `<span class="inline-flex gap-px text-amber-warm" role="img" aria-label="${label}">${STAR.replace('w-4 h-4', 'w-3.5 h-3.5').repeat(5)}</span>`;
const googleLine = () => `<span class="inline-flex items-center gap-2">${GOOGLE_G}<b class="font-semibold text-charcoal">${RATINGS.google.value}</b>${smallStars(`${RATINGS.google.value} out of 5 stars on Google`)}<span class="text-warm-gray-500">${RATINGS.google.count} Google reviews</span></span>`;
const looxLine = () => `<span class="inline-flex items-center gap-2"><b class="font-semibold text-charcoal">${RATINGS.loox.value}</b>${smallStars(`${RATINGS.loox.value} out of 5 stars from our customers`)}<span class="text-warm-gray-500">${RATINGS.loox.count} customer reviews</span></span>`;

// ------------------------------------------------------------ PROOF
const proof = () => `          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 text-sm" aria-label="Store ratings">
            ${googleLine()}
            <span class="hidden sm:block w-px h-4 bg-warm-gray-200" aria-hidden="true"></span>
            ${looxLine()}
          </div>`;

// ------------------------------------------------------------ LOGOS
const LOGOS = [
  ['costco.webp', 'Costco'], ['amazon.webp', 'Amazon'], ['walmart.webp', 'Walmart'],
  ['save-on-foods.png', 'Save-On-Foods'], ['shoppers.webp', 'Shoppers Drug Mart'], ['homesense.webp', 'HomeSense'],
  ['urban-fare.webp', 'Urban Fare'], ['nesters.png', 'Nesters Market'], ['canex.png', 'CANEX'],
];
const logoRow = (hidden) => LOGOS.map(([f, a]) =>
  `<img src="/assets/images/logos/${f}" alt="${hidden ? '' : a}" class="mt-strip-logo h-6 md:h-7 w-auto object-contain flex-shrink-0" loading="lazy">`).join('');
const logos = () => `  <section aria-label="Customer rating and retailers" class="px-4 md:px-8">
    <style>
      @keyframes mt-strip { to { transform: translateX(-50%); } }
      .mt-strip-track { animation: mt-strip 50s linear infinite; }
      .mt-strip-mask { -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
      .mt-strip-logo { filter: grayscale(1); opacity: .5; }
      .mt-strip-logo[alt="CANEX"] { filter: brightness(0); opacity: .4; }
      @media (prefers-reduced-motion: reduce) { .mt-strip-track { animation: none; } }
    </style>
    <div class="max-w-[1400px] mx-auto border-b border-warm-gray-200/40 py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
      <p class="flex flex-wrap items-center gap-x-5 gap-y-2 flex-shrink-0 text-sm">${googleLine()}${looxLine()}</p>
      <span class="hidden md:block w-px h-6 bg-warm-gray-200 flex-shrink-0" aria-hidden="true"></span>
      <p class="text-sm text-warm-gray-500 flex-shrink-0 hidden md:block">Also stocked by</p>
      <div class="mt-strip-mask relative flex-1 overflow-hidden">
        <div class="mt-strip-track flex items-center" style="width:max-content">
          <div class="flex items-center gap-12 md:gap-16 pr-12 md:pr-16">${logoRow(false)}</div>
          <div class="flex items-center gap-12 md:gap-16 pr-12 md:pr-16" aria-hidden="true">${logoRow(true)}</div>
        </div>
      </div>
    </div>
  </section>`;

// ------------------------------------------------------------ ANATOMY
// The product photo with numbered points around it, taken from /story (Liam,
// November 4, 2026, on that section: "u should add stuff liek this on relevant
// apges"). A dot's left and top are percentages of the photo. A note with no dot
// sits unnumbered. A product page gets its block by handle and carries no buy row,
// because Add to Cart is already on that page; any other page names a key.
const G = '/assets/images/cards/';
const ORGANIC_NOTES = [
  { t: 'From one farm', p: 'Single origin, from one farm, and made from sap collected early in the season.', at: [40, 43] },
  { t: 'Nothing added', p: 'No additives, chemicals, preservatives or coloring, so maple syrup is all you pour.', at: [44, 84] },
  { t: 'Three organic certifications', p: 'Ecocert, Canada Organic and USDA Organic certify this syrup, and our <a href="/certifications">certifications page</a> explains what each one checks. Our maple leaf bottles are not organic.', at: [65.5, 72.5] },
  { t: 'Grade A Golden, Delicate Taste', p: 'A light syrup for drizzling and desserts. For cooking and baking, the <a href="/products/pure-maple-syrup-maple-leaf-bottle-250ml">maple leaf bottle</a> holds our Dark, Robust syrup.', at: [35.5, 67.5] },
];
const LEAF_GRADE = 'From the late harvest, when the syrup turns darker and the maple flavor stronger. Our <a href="/blog/grade-a-vs-grade-b-maple-syrup">guide to maple syrup grades</a> compares Dark with the lighter grades.';
const LEAF_PURE = 'Pure maple syrup with no additives, chemicals, preservatives or coloring.';
const LEAF_FARM = 'The syrup comes from one farm in Quebec, and the Lytton family has run Maple Terroir since 1978.';
const LEAF_GLASS = 'Clear glass shows the color of the syrup through the leaf. All three sizes hold the same syrup, so a 50 mL bottle tastes like the 250 mL one.';
const ANATOMY = {
  organic: { handle: 'organic-pure-maple-syrup-250ml', variant: '45815550673145', size: '250 mL', title: 'What Is in Our Organic Syrup', pdpTitle: 'What Is in This Bottle', intro: 'Our Organic Pure Maple Syrup in the 250 mL bottle is the one we suggest if you are trying us for the first time. Here is what is in it.', alt: 'A 250 mL bottle of Maple Terroir Organic Pure Maple Syrup, Canada Grade A Golden, Delicate Taste, with the Ecocert and Canada Organic marks on its label', more: 'Packs of 12 to 48 save 10 to 25 percent', notes: ORGANIC_NOTES },
  'first-tap': { handle: 'organic-first-tap-nouveau-limited-edition-pure-maple-syrup-limited-edition', title: 'What Is in This Bottle', alt: 'Maple Terroir Organic First Tap Nouveau in its red gift box, with the bottle number and Canada Grade A Golden, Delicate Taste showing through the window', notes: [
    { t: 'Made on the first day', p: 'The sap comes from the first tap of the season, and the syrup is boiled, bottled and labeled that same day.', at: [40.5, 28] },
    { t: 'Three organic certifications', p: 'Ecocert, Canada Organic and USDA Organic certify this syrup, and our <a href="/certifications">certifications page</a> explains what each one checks.', at: [55.5, 43.5] },
    { t: 'Its own number', p: 'Each bottle carries a serial number from the limited amount collected that day, and comes in a gift box.', at: [59, 67.6] },
    { t: 'Grade A Golden, Delicate Taste', p: 'A light syrup with a delicate maple flavor, for ice cream, fruit and cheese.', at: [38.5, 70.5] },
  ] },
  'leaf-250': { handle: 'pure-maple-syrup-maple-leaf-bottle-250ml', variant: '45815541301497', size: '250 mL', title: 'What Is in the Bottle', pdpTitle: 'What Is in This Bottle', intro: 'The label on our 250 mL leaf bottle says what you are buying. Here is what it means.', alt: 'A 250 mL maple leaf bottle of Maple Terroir Pure Maple Syrup, Canada Grade A Dark, Robust Taste, with the ingredients and grade on its label', more: 'Packs of 12 to 48 save 10 to 25 percent', notes: [
    { t: 'Grade A Dark, Robust Taste', p: LEAF_GRADE, at: [62, 63] },
    { t: 'Nothing added', p: LEAF_PURE, at: [38.5, 66.8] },
    { t: 'From one farm', p: LEAF_FARM, at: [62, 55] },
    { t: 'A clear glass leaf', p: LEAF_GLASS, at: [27, 58] },
  ] },
  'leaf-100': { handle: 'pure-maple-syrup-maple-leaf-bottle-100ml', title: 'What Is in This Bottle', alt: 'A 100 mL maple leaf bottle of Maple Terroir Pure Maple Syrup with a tag that reads Canada Grade A, Dark, Robust Taste', notes: [
    { t: 'Grade A Dark, Robust Taste', p: LEAF_GRADE, at: [32.5, 62] },
    { t: 'Nothing added', p: LEAF_PURE, at: [66, 58] },
    { t: 'From one farm', p: LEAF_FARM, at: [62.5, 68] },
    { t: 'A clear glass leaf', p: LEAF_GLASS, at: [49, 30] },
  ] },
  'leaf-50': { handle: 'pure-maple-syrup-maple-leaf-bottle-50ml', title: 'What Is in This Bottle', alt: 'A 50 mL maple leaf bottle of Maple Terroir Pure Maple Syrup with a tag that reads Canada Grade A, Dark, Robust Taste', notes: [
    { t: 'Grade A Dark, Robust Taste', p: LEAF_GRADE, at: [35, 54.5] },
    { t: 'Nothing added', p: LEAF_PURE, at: [41, 73] },
    { t: 'From one farm', p: LEAF_FARM, at: [59, 61] },
    { t: 'A clear glass leaf', p: LEAF_GLASS, at: [25.5, 66] },
  ] },
  cream: { handle: 'organic-maple-cream-butter-jar', title: 'What Is in This Jar', alt: 'A 160 g glass jar of Maple Terroir Organic Maple Cream Butter, with the pale cream showing above the label', notes: [
    { t: 'Maple syrup and nothing else', p: 'Made only from pure organic maple syrup, with nothing added.', at: [40.5, 79] },
    { t: 'No butter in it', p: 'The name comes from how it spreads. There is no butter in the jar, and it is fat free.', at: [66, 45.5] },
    { t: 'Boiled, then whipped', p: 'The syrup is boiled to 112 degrees Celsius, then whipped into a smooth cream.', at: [31, 35] },
    { t: 'A 160 g jar', p: 'Spread it on toast, pancakes or waffles.', at: [56.5, 83] },
  ] },
  sugar: { handle: 'organic-pure-maple-sugar', variant: '45815552213241', size: '100 g', title: 'What Is in Our Maple Sugar', pdpTitle: 'What Is in This Box', zoom: 126, intro: 'Maple sugar is maple syrup cooked until it dries into granules. Here is what is in each box.', alt: 'Two 100 g boxes of Maple Terroir Organic Maple Sugar, with the golden granules showing through a window in the front box', more: 'Save by the case', notes: [
    { t: 'One ingredient', p: 'Organic maple syrup is the only ingredient.', at: [70.5, 82] },
    { t: 'Golden granules', p: 'The window in the box shows the granules inside.', at: [53.5, 71] },
    { t: 'Swap it cup for cup', p: 'One cup of maple sugar replaces one cup of white sugar in a recipe.', at: [84, 44] },
    { t: 'A 100 g box', p: 'Stir it into coffee or tea, or sprinkle it over crepes, yogurt and ice cream.', at: [55.5, 87.5] },
  ] },
  'canadian-label': { handle: 'pure-maple-syrup-maple-leaf-bottle-250ml', id: 'real', title: 'How to Tell Real Canadian Maple Syrup', intro: 'Three checks on the label separate pure maple syrup from a table syrup that only looks the part, and the price is a fourth. Our <a href="/blog/pure-maple-syrup-vs-table-syrup">guide to pure maple syrup and table syrup</a> goes through each label in detail.', alt: 'The label on a 250 mL Maple Terroir maple leaf bottle, showing the ingredients, Canada Grade A Dark, Robust Taste and Product of Canada', notes: [
    { t: 'Read the ingredients', p: 'Pure maple syrup lists one ingredient: maple syrup. A table syrup lists glucose or corn syrup and flavoring.', at: [38.5, 66.8] },
    { t: 'Look for the grade', p: 'Retail maple syrup in Canada carries Canada Grade A and a color class such as Golden, Delicate Taste. Our <a href="/blog/grade-a-vs-grade-b-maple-syrup">maple syrup grades guide</a> explains each one.', at: [62, 62.5] },
    { t: 'Find the country', p: 'A Canadian bottle says so. Ours reads Product of Canada, in English and French.', at: [62.5, 70] },
    { t: 'Check the price', p: 'In our price index, pure maple syrup had a median of $2.76 per 100 mL against $0.54 for table syrup. Even the cheapest pure syrup, at $1.57, cost 2.8 times the pricier table syrup.' },
  ] },
  // Maple Ceylon Tea (November 6, 2026). Facts: the box front (15 pyramid tea bags,
  // premium mountain grown), the Shopify description (Sri Lanka leaves, maple syrup
  // and maple extract, the tasting note), the Sri Lanka Tea Board on Ceylon tea.
  tea: { handle: 'maple-ceylon-tea', variant: '45815601922297', size: '30 g', title: 'What Is in Our Maple Tea', pdpTitle: 'What Is in This Box', intro: 'Maple tea is black tea blended with maple. Here is what is in each box of ours.', alt: 'A box of Maple Terroir Maple Ceylon Tea, premium mountain grown, with falling maple leaves on a green box and 15 pyramid tea bags printed at the bottom', more: 'Save by the case', notes: [
    { t: 'Ceylon black tea', p: 'Ceylon tea is tea grown in Sri Lanka, and the box calls ours premium mountain grown.', at: [66.8, 55.4] },
    { t: 'Real maple in the blend', p: 'The leaves are blended with pure maple syrup and pure maple extract in Canada.', at: [52, 40] },
    { t: 'A sweet maple aroma', p: 'Our tasting note: a sweet, smoky maple aroma, a caramel taste and a bright copper color in the cup.', at: [44, 69.5] },
    { t: '15 pyramid tea bags', p: '30 g of tea in 15 pyramid bags, one bag to a cup.', at: [61.5, 85.2] },
  ] },
  // Dark chocolate covered cherries and blueberries (November 6, 2026). Facts: the
  // box fronts (English and French names, 100 g), the Shopify descriptions (Canadian
  // fruit, pure maple syrup, semi-sweet dark chocolate) and tags (dried fruit), the
  // nutrition panels on the product listings. The -pdp keys add an unnumbered note
  // linking the product page to its /shop/ page; the /shop/ pages use the plain keys.
  ...chocFruit('cherries', 'dark-chocolate-covered-cherry-pure-maple-syrup', '45815594451193', 'Cherries', 'cherries', 'Cerises', '440', '7', [36, 61.7],
    { t: 'Cherries or cherry cordials', p: 'These are dried cherries in dark chocolate, not a cordial with a liquid centre. Our <a href="/shop/chocolate-covered-cherries">chocolate covered cherries</a> page compares the two and lists the case prices.' }),
  ...chocFruit('blueberries', 'dark-chocolate-covered-blueberry-pure-maple-syrup', '45815592911097', 'Blueberries', 'blueberries', 'Myrtilles', '450', '8', [35.5, 60.6],
    { t: 'Real blueberries inside', p: 'Cut a piece open and the dried berry fills the centre. Our <a href="/shop/chocolate-covered-blueberries">chocolate covered blueberries</a> page shows the inside and lists the case prices.' }),
};
function chocFruit(key, handle, variant, Name, name, french, kcal, fibre, frenchAt, pdpNote) {
  const notes = [
    { t: 'Family owned since 1978', p: 'Maple Terroir is a family business, and family members pack every online order at our facility.', at: [50, 27.6] },
    { t: `Canadian ${name}`, p: `The fruit is Canadian ${name}, dried and sweetened with pure maple syrup. The French line on the box says it too: ${french.toLowerCase()} au sirop d'érable, ${name} in maple syrup.`, at: frenchAt },
    { t: 'Semi-sweet dark chocolate', p: `A shell of semi-sweet dark chocolate around each piece. The centre is the dried fruit itself, with no liquid filling.`, at: [41.5, 77] },
    { t: 'A 100 g box', p: `The whole box is ${kcal} calories, with ${fibre} g of fibre, by the nutrition panel on the box.`, at: [45, 85.4] },
  ];
  const base = { handle, variant, size: '100 g', title: `What Is in Our Chocolate Covered ${Name}`, pdpTitle: 'What Is in This Box', intro: `Here is what the box of Dark Chocolate Maple ${Name} holds, point by point.`, alt: `A 100 g box of Maple Terroir Dark Chocolate Maple ${Name}, with falling maple leaves and the French name, ${french} au sirop d'érable enrobées de chocolat noir, on the front`, more: 'Save by the case', notes };
  return { [key]: base, [`${key}-pdp`]: { ...base, notes: [...notes, pdpNote] } };
}
const ANATOMY_BY_HANDLE = { 'organic-pure-maple-syrup-250ml': 'organic', 'organic-first-tap-nouveau-limited-edition-pure-maple-syrup-limited-edition': 'first-tap', 'pure-maple-syrup-maple-leaf-bottle-250ml': 'leaf-250', 'pure-maple-syrup-maple-leaf-bottle-100ml': 'leaf-100', 'pure-maple-syrup-maple-leaf-bottle-50ml': 'leaf-50', 'organic-maple-cream-butter-jar': 'cream', 'organic-pure-maple-sugar': 'sugar', 'maple-ceylon-tea': 'tea', 'dark-chocolate-covered-cherry-pure-maple-syrup': 'cherries-pdp', 'dark-chocolate-covered-blueberry-pure-maple-syrup': 'blueberries-pdp' };
const ANATOMY_CSS = `<style>
    .st-copy a { color: #9A6514; font-weight: 600; text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 3px; transition: color .3s; }
    .st-copy a:hover { color: #1A1714; }
    .st-anat { display: grid; grid-template-columns: 1fr minmax(0, 460px) 1fr; gap: 40px; align-items: center; }
    .st-anat-col { display: grid; gap: 40px; }
    .st-anat-col:first-child { text-align: right; }
    .st-note { display: grid; gap: 6px; padding: 4px 0; transition: transform .5s cubic-bezier(.32,.72,0,1); }
    .st-note h3 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 22px; line-height: 1.2; color: #1A1714; display: flex; align-items: center; gap: 12px; }
    .st-anat-col:first-child .st-note h3 { justify-content: flex-end; }
    .st-note p { color: #5A5249; line-height: 1.65; font-size: 15px; }
    .st-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 999px; background: #1A1714; color: #FDFBF7; font: 600 13px/28px 'Plus Jakarta Sans', system-ui, sans-serif; text-align: center; }
    .st-anat-col:first-child .st-num { order: 2; }
    .st-bottle { position: relative; aspect-ratio: 4 / 5; border-radius: 2rem; overflow: hidden; background: #F3EADF; box-shadow: 0 40px 80px -40px rgba(26,23,20,.35); }
    .st-zoom { position: absolute; width: 142%; left: 50%; top: 50%; transform: translate(-50%, -50.5%); }
    .st-zoom img { display: block; width: 100%; height: auto; }
    .st-dot { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 999px; background: #1A1714; color: #FDFBF7; font: 600 13px/30px 'Plus Jakarta Sans', system-ui, sans-serif; text-align: center; box-shadow: 0 0 0 4px rgba(253,251,247,.9); transition: background .3s, transform .4s cubic-bezier(.32,.72,0,1); }
    .st-dot::after { content: ''; position: absolute; inset: -4px; border-radius: 999px; border: 2px solid #C4841D; opacity: 0; transform: scale(.8); transition: opacity .3s, transform .4s; }
    .st-dot.is-on { background: #C4841D; transform: scale(1.12); }
    .st-dot.is-on::after { opacity: 1; transform: scale(1.35); }
    .st-note.is-on { transform: translateY(-2px); }
    .st-note.is-on .st-num { background: #C4841D; }
    @media (max-width: 1023px) {
      .st-anat { grid-template-columns: 1fr 1fr; gap: 28px 24px; }
      .st-bottle { grid-column: 1 / -1; grid-row: 1; max-width: 440px; width: 100%; margin: 0 auto; }
      .st-anat-col, .st-anat-col:first-child { text-align: left; gap: 28px; }
      .st-anat-col:first-child .st-note h3 { justify-content: flex-start; }
      .st-anat-col:first-child .st-num { order: 0; }
    }
    @media (max-width: 639px) { .st-anat { grid-template-columns: 1fr; } }
    @media (prefers-reduced-motion: reduce) { .st-note, .st-dot { transition: none; } }
  </style>`;
function anatomy(attrs, where) {
  const handleFromPath = (where.match(/^products\/(.+)\.html$/) || [])[1];
  const key = (attrs.match(/key="([^"]+)"/) || [])[1] || ANATOMY_BY_HANDLE[handleFromPath];
  if (!key) return '';
  const a = ANATOMY[key];
  if (!a) throw new Error(`${where}: no ANATOMY entry "${key}"`);
  const pdp = !!handleFromPath;
  const moreHref = (attrs.match(/more="([^"]+)"/) || [])[1] || `/products/${a.handle}`;
  let n = 0;
  const numbered = a.notes.map((x) => ({ ...x, n: x.at ? ++n : 0 }));
  const note = (x, i) => `          <div class="st-note reveal${i % 2 ? ' reveal-delay-1' : ''}"${x.n ? ` data-n="${x.n}"` : ''}>
            <h3>${x.n ? `<span class="st-num">${x.n}</span>` : ''}${x.t}</h3>
            <p>${x.p}</p>
          </div>`;
  const dots = numbered.filter((x) => x.n).map((x) => `            <span class="st-dot" data-n="${x.n}" style="left:${x.at[0]}%;top:${x.at[1]}%" aria-hidden="true">${x.n}</span>`).join('\n');
  const half = Math.ceil(numbered.length / 2);
  const pageHtml = readFileSync(join(ROOT, 'products', `${a.handle}.html`), 'utf8');
  const price = (pageHtml.match(/"price":\s*"?([\d.]+)/) || [])[1];
  const buy = !pdp && a.variant ? `
      <div class="reveal mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
        <p class="font-display text-2xl font-semibold text-charcoal">$${Number(price).toFixed(2)} <span class="text-sm font-normal text-warm-gray-500" style="font-family:'Plus Jakarta Sans',system-ui,sans-serif">for ${a.size}</span></p>
        <button class="atc-btn" style="padding:.75rem 1.4rem;font-size:.8rem" data-variant-id="gid://shopify/ProductVariant/${a.variant}" onclick="MapleCart.addFromBtn(this)" aria-label="Add ${a.size} to cart">+ Add to cart</button>
        <a href="${moreHref}" class="text-sm text-charcoal underline decoration-warm-gray-300 underline-offset-4 hover:text-amber-warm">${a.more}</a>
      </div>` : '';
  const intro = !pdp && a.intro ? `
        <p class="reveal reveal-delay-2 text-warm-gray-600 leading-relaxed max-w-[54ch] st-copy">${a.intro}</p>` : '';
  return `  ${ANATOMY_CSS}
  <section${a.id ? ` id="${a.id}"` : ''} class="${a.id ? 'scroll-mt-28 ' : ''}py-16 md:py-28 px-4 md:px-8">
    <div class="max-w-[1400px] mx-auto">
      <div class="max-w-3xl mb-12 md:mb-16">
        <h2 class="reveal reveal-delay-1 font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-charcoal tracking-tight leading-tight mb-5">${pdp && a.pdpTitle ? a.pdpTitle : a.title}</h2>${intro}
      </div>
      <div class="st-anat st-copy" data-anat>
        <div class="st-anat-col">
${numbered.slice(0, half).map(note).join('\n')}
        </div>
        <figure class="st-bottle reveal">
          <div class="st-zoom"${a.zoom ? ` style="width:${a.zoom}%"` : ''}>
            <img src="${G}${a.handle}.webp" alt="${a.alt}" width="1000" height="1000" loading="lazy">
${dots}
          </div>
        </figure>
        <div class="st-anat-col">
${numbered.slice(half).map(note).join('\n')}
        </div>
      </div>${buy}
    </div>
    <script>
      (function () {
        var root = document.querySelector('[data-anat]'); if (!root) return;
        function on(n, v) { root.querySelectorAll('[data-n="' + n + '"]').forEach(function (e) { e.classList.toggle('is-on', v); }); }
        root.querySelectorAll('.st-note[data-n]').forEach(function (note) {
          var n = note.getAttribute('data-n');
          note.addEventListener('mouseenter', function () { on(n, true); });
          note.addEventListener('mouseleave', function () { on(n, false); });
        });
      })();
    </script>
  </section>`;
}

// ------------------------------------------------------------ REVIEWS
// [product handle, reviewer name as published]. Chosen to answer what a buyer
// on that page worries about: the taste, the gift, the delivery and packing.
const SETS = {
  syrup: [['organic-pure-maple-syrup-250ml', 'Amrit G.'], ['pure-maple-syrup-maple-leaf-bottle-250ml', 'Gary B.'], ['pure-maple-syrup-maple-leaf-bottle-50ml', 'Fred B.']],
  gifts: [['maple-frenzy-home-set', 'Simon S.'], ['pure-maple-syrup-stroopwafels-caddy', 'Yoshimi S.'], ['maple-syrup-mini-stroopwafel', 'Michelle Buchar']],
  // The collections of things people eat rather than pour or send: cookies,
  // chocolates, snacks, stroopwafels, tea and coffee (October 3, 2026).
  treats: [['maple-leaf-mini-shortbread-cookies', 'Rowena A.'], ['handcrafted-pure-maple-syrup-butter-popcorn', 'Chris'], ['cocoa-chocolate-maple-stroopwafels-caddy', 'Kiko W.']],
  // The stroopwafel collection, so every quote is about a stroopwafel (November 10,
  // 2026: the treats set put cookie and popcorn reviews on that page).
  stroopwafels: [['wild-blueberry-maple-stroopwafels-caddy', 'Sheryl V.'], ['strawberry-cream-maple-stroopwafels-caddy', 'Coby C.'], ['cocoa-chocolate-maple-stroopwafels-caddy', 'Kiko W.']],
};
const HEAD = {
  syrup: 'Rated 5.0 by the People Who Pour It',
  gifts: 'Rated 5.0 by the People Who Send It',
  treats: 'Rated 5.0 by the People Who Snack on It',
  stroopwafels: 'What Our Stroopwafel Buyers Say',
};
function review(handle, name) {
  const f = join(ROOT, 'products', `${handle}.html`);
  if (!existsSync(f)) return null;
  const html = readFileSync(f, 'utf8');
  const product = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
  for (const a of html.match(/<article class="mt-review">[\s\S]*?<\/article>/g) || []) {
    const who = (a.match(/class="mt-review-name">([^<]*)/) || [])[1];
    if (who !== name) continue;
    const text = ((a.match(/class="mt-review-text">([\s\S]*?)<\/p>/) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const date = (a.match(/class="mt-review-date">([^<]*)/) || [])[1] || '';
    // The product photo sits beside the quote (Liam, 2026-10-03: the text-only
    // cards had "no design taste or visuals").
    const img = ((html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || '').replace(/&amp;width=\d+/, '');
    return { name, text, date, product, img, href: `/products/${handle}` };
  }
  return null;
}
// A Shopify image is resized by the CDN; a card image of our own is served as is.
const sizedImg = (url, w) => /cdn\.shopify\.com/.test(url) ? `${url}${url.includes('?') ? '&amp;' : '?'}width=${w}` : url.replace('https://mapleterroir.com', '');
function reviews(set, where) {
  const picks = (SETS[set] || SETS.syrup).map(([h, n]) => review(h, n)).filter(Boolean);
  if (picks.length < 3) console.warn(`  ${where}: only ${picks.length} of the "${set}" reviews still published on their product pages`);
  const h2 = HEAD[set] || HEAD.syrup;
  const caption = (r) => `<figcaption class="mt-5 text-sm"><span class="font-medium text-charcoal">${esc(r.name)}</span><span class="text-warm-gray-500"> &middot; Verified purchase &middot; </span><a href="${r.href}" class="text-warm-gray-600 underline decoration-warm-gray-300 underline-offset-4 hover:text-amber-warm">${esc(r.product)}</a></figcaption>`;
  const [lead, ...rest] = picks;
  const big = lead ? `        <figure class="reveal group lg:col-span-7 lg:row-span-2 rounded-[2rem] overflow-hidden grid grid-cols-1 sm:grid-cols-2" style="background:#F3E6CF">
          <a href="${lead.href}" class="relative flex items-center justify-center p-8 md:p-10 min-h-[260px]" tabindex="-1" aria-hidden="true">
            <span class="absolute inset-6 rounded-full bg-white/50 blur-2xl"></span>
            <img src="${sizedImg(lead.img, 700)}" alt="" width="700" height="700" loading="lazy" class="relative w-full max-w-[320px] aspect-square object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2">
          </a>
          <div class="p-7 md:p-10 flex flex-col justify-center">
            ${STARS}
            <blockquote class="font-display text-2xl md:text-[1.7rem] leading-snug text-charcoal mt-5">&ldquo;${lead.text}&rdquo;</blockquote>
            ${caption(lead)}
          </div>
        </figure>` : '';
  const small = (r, i) => `        <figure class="reveal reveal-delay-${i + 1} group lg:col-span-5 bg-white rounded-[2rem] ring-1 ring-warm-gray-200/40 p-5 md:p-6 flex gap-5 items-center">
          <a href="${r.href}" class="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-[1.25rem] overflow-hidden flex items-center justify-center" style="background:#F5F0E8" tabindex="-1" aria-hidden="true"><img src="${sizedImg(r.img, 300)}" alt="" width="300" height="300" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"></a>
          <div class="flex flex-col">
            ${STARS}
            <blockquote class="text-charcoal leading-relaxed mt-3">&ldquo;${r.text}&rdquo;</blockquote>
            ${caption(r)}
          </div>
        </figure>`;
  return `  <section id="reviews" class="scroll-mt-28 py-16 md:py-24 px-4 md:px-8">
    <div class="max-w-[1400px] mx-auto">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal tracking-tight leading-tight">${h2}</h2>
        </div>
        <a href="/products" class="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-amber-warm transition-colors duration-300">Shop the full range <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
${[big, ...rest.map(small)].filter(Boolean).join('\n')}
      </div>
    </div>
  </section>`;
}

// ------------------------------------------------------------ FAMILY
const PHOTO = { src: '/assets/images/story/shawn-lytton.webp', w: 640, h: 800 };
const ALT = 'Shawn Lytton, President of Maple Terroir, in front of a shelf of maple syrup and Canadian food gifts';
const CAPTION = 'Shawn Lytton, President of Maple Terroir.';
const family = (where) => `  <section id="family" class="scroll-mt-28 px-4 md:px-8">
    <div class="max-w-[1400px] mx-auto border-t border-warm-gray-200/30 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
      <figure class="reveal md:col-span-5 max-w-[420px] w-full mx-auto md:mx-0">
        <img src="${PHOTO.src}" alt="${ALT}" width="${PHOTO.w}" height="${PHOTO.h}" loading="lazy" class="w-full aspect-[4/5] object-cover rounded-[1.5rem]">
        <figcaption class="text-xs text-warm-gray-400 mt-3">${CAPTION}</figcaption>
      </figure>
      <div class="reveal reveal-delay-1 md:col-span-7">
        <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal tracking-tight leading-tight mb-5">Three Generations of One Maple Family.</h2>
        <p class="text-warm-gray-600 leading-relaxed mb-4 max-w-[56ch]">Wayne Lytton, born in Nanaimo, B.C., started Maple Terroir with his wife Kaori in 1978. Their son Shawn runs the company today, and our online orders are packed by family members at our facility.</p>
        <p class="text-warm-gray-600 leading-relaxed mb-8 max-w-[56ch]">When you order from mapleterroir.com, the order goes to that family, and they are the ones who pack it.</p>
${where === 'story.html' ? '' : `        <a href="/story" class="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-amber-warm transition-colors duration-300">Read the family story <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`}
      </div>
    </div>
  </section>`;

// ------------------------------------------------------------ bake
// ------------------------------------------------------------ CTA
const CTA_DEFAULT = {
  title: 'Order straight from our family.',
  text: 'Single-origin maple syrup and maple treats, packed by our family in Vancouver.',
  href: '/products',
  label: 'Shop All Products',
};
const attr = (attrs, k) => {
  const m = attrs.match(new RegExp(`\\b${k}="([^"]*)"`));
  return m ? m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : null;
};
const cta = (attrs) => {
  const c = Object.fromEntries(Object.entries(CTA_DEFAULT).map(([k, v]) => [k, attr(attrs, k) ?? v]));
  const href2 = attr(attrs, 'href2'), label2 = attr(attrs, 'label2');
  const second = href2 && label2 ? `
                <a href="${href2}" class="btn-premium inline-flex items-center gap-3 bg-white/10 border border-white/25 text-cream rounded-full px-8 py-4 text-sm font-medium hover:bg-white/15">${label2}</a>` : '';
  return `  <section class="pb-24 md:pb-40 px-4 md:px-8">
    <div class="max-w-[1400px] mx-auto">
      <div class="reveal">
        <div class="bg-warm-gray-100/50 ring-1 ring-warm-gray-200/30 p-2 md:p-2.5 rounded-[2rem] md:rounded-[2.5rem]">
          <div class="relative overflow-hidden rounded-[calc(2rem-0.5rem)] md:rounded-[calc(2.5rem-0.625rem)] bg-gradient-to-br from-amber-warm via-amber-deep to-charcoal p-10 md:p-16 lg:p-20 text-center text-cream min-h-[320px] flex flex-col items-center justify-center">
            <div class="relative">
              <h2 class="font-display text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 max-w-[20ch] mx-auto">${c.title}</h2>
              <p class="text-base md:text-lg text-cream/75 leading-relaxed max-w-[45ch] mx-auto mb-10 [&_a]:underline [&_a]:underline-offset-4">${c.text}</p>
              <div class="flex flex-wrap gap-3 justify-center">
                <a href="${c.href}" class="btn-premium inline-flex items-center gap-3 bg-cream text-charcoal rounded-full px-8 py-4 text-sm font-semibold group">
                  <span>${c.label}</span>
                  <span class="w-7 h-7 rounded-full bg-charcoal/[0.08] flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110 group-hover:bg-charcoal/15">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                </a>${second}
              </div>
            </div>
            <div class="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] rounded-[inherit] pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
};

const MARK = /<!-- (LOGOS|REVIEWS|FAMILY|CTA|PROOF|ANATOMY):START([^>]*?)-->/;
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules' || name === '_archive') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
const counts = {};
const only = process.argv.slice(2).filter((a) => a.endsWith('.html')).map((a) => resolve(a));
for (const file of only.length ? only : walk(ROOT)) {
  const html = readFileSync(file, 'utf8');
  if (!MARK.test(html)) continue;
  const where = relative(ROOT, file);
  let out = '', pos = 0;
  for (let m; (m = MARK.exec(html.slice(pos))); ) {
    const [, kind, attrs] = m;
    const open = pos + m.index, openEnd = open + m[0].length;
    const end = html.indexOf(`<!-- ${kind}:END -->`, openEnd);
    if (end < 0) throw new Error(`${where}: ${kind}:END missing`);
    const set = (attrs.match(/set="([^"]+)"/) || [])[1] || 'syrup';
    const marker = kind === 'ANATOMY' ? `<!-- ANATOMY:START${attrs.trimEnd() ? attrs.trimEnd() + ' ' : ' '}-->` : kind === 'REVIEWS' ? `<!-- REVIEWS:START set="${set}" -->` : kind === 'CTA' ? `<!-- CTA:START${attrs.trimEnd() ? attrs.trimEnd() + ' ' : ' '}-->` : `<!-- ${kind}:START baked by scripts/build-blocks.mjs -->`;
    const block = kind === 'ANATOMY' ? anatomy(attrs, where) : kind === 'LOGOS' ? logos() : kind === 'REVIEWS' ? reviews(set, where) : kind === 'CTA' ? cta(attrs) : kind === 'PROOF' ? proof() : family(where);
    out += html.slice(pos, open) + marker + '\n' + block + '\n' + (kind === 'PROOF' ? '          ' : '  ');
    pos = end;
    counts[kind] = (counts[kind] || 0) + 1;
  }
  out += html.slice(pos);
  if (out !== html) writeFileSync(file, out);
}
console.log(`blocks baked: ${Object.entries(counts).map(([k, n]) => `${k} on ${n} page${n === 1 ? '' : 's'}`).join(', ') || 'no markers found'}`);
