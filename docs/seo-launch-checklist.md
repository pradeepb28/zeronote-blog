# The SEO launch checklist

By Ilias Ism. 71 checks, each with a test and a pass condition. Live version: https://il.ly/growth/checklist

To audit a site with an AI agent, paste this file and say: "Audit https://yoursite.com against this checklist. For each item, run the check, report pass or fail with the evidence, then fix what you can in this repo."

## Pick the searches you want to win

Most sites skip this and write pages nobody searches for. Decide which searches each page should win before you build it.

- [ ] **List the searches your buyer makes**
  - Check: Write the problems your buyer would type before they know your product exists. Use their words, not your feature names.
  - Pass: At least 20 queries, each tagged as problem, category, comparison or brand.
- [ ] **Match the page type to what already ranks**
  - Check: Search each query in a private window and read the top five results.
  - Pass: For every query you know whether Google wants a tool, a list, a guide or a product page, and your page is that type.
- [ ] **Give each page exactly one primary query**
  - Check: Keep a sheet with one row per query and the URL that targets it.
  - Pass: No URL has two primary queries and no query points at two URLs.
- [ ] **Start with queries you can win this quarter**
  - Check: Look at who ranks in the top 10. A keyword difficulty score helps, but the names on page one tell you more.
  - Pass: At least half of your first pages target queries where small sites already rank on page one.
- [ ] **Plan comparison and alternative pages**
  - Check: Search "[competitor] alternatives" and "[competitor] vs" for each competitor.
  - Pass: A planned page for every competitor that buyers search for by name.
- [ ] **Write down what each page should convert**
  - Check: Add a column for the action each page should drive.
  - Pass: Every planned page has one next step: signup, demo, tool use or purchase.

## Let search engines crawl and index you

If Google can't fetch, render and trust a URL, it won't rank. These break without any error you would notice, so check them on purpose.

- [ ] **Serve the site from one host**
  - Check: Run curl -sI on http://, http://www., https:// and https://www. versions of your homepage and follow each redirect.
  - Pass: Every variant returns one 301 to the same HTTPS host.
- [ ] **Make sure robots.txt blocks only what you mean to block**
  - Check: Open /robots.txt and the robots.txt report in Search Console.
  - Pass: Nothing you want ranked is disallowed, including CSS and JavaScript, and the file lists your sitemap URL.
- [ ] **Remove stray noindex tags**
  - Check: Run curl -s on each page template and search for "noindex". Check the X-Robots-Tag response header too.
  - Pass: Only pages you deliberately hide carry noindex. The staging tag is gone.
- [ ] **Add a self-referencing canonical to every page**
  - Check: View source and find <link rel="canonical"> on every template.
  - Pass: It is absolute and matches the live URL: same protocol, host and trailing slash.
- [ ] **List only indexable pages in the XML sitemap**
  - Check: Open /sitemap.xml and request ten of its URLs.
  - Pass: Every URL returns 200 and is canonical and indexable. No redirects, 404s or noindex pages.
- [ ] **Return a real 404 for missing pages**
  - Check: Run curl -sI https://yoursite.com/this-page-does-not-exist.
  - Pass: The status is 404. Not a 200 with "not found" text, and not a redirect to the homepage.
- [ ] **Keep every redirect to one hop**
  - Check: Crawl the site with Screaming Frog (free up to 500 URLs) or run curl -sIL on internal links.
  - Pass: No redirect chains or loops, and internal links point at final URLs.
- [ ] **Put the main content in the server HTML**
  - Check: Run curl -s on a page and search for a sentence from its body.
  - Pass: Headings, body text and links are in the raw HTML, not only after JavaScript runs.
- [ ] **Use clean, stable URLs**
  - Check: Scan your URLs in the crawl or sitemap.
  - Pass: Lowercase, hyphenated, no session IDs. Filter and sort parameters are canonicalized to the clean URL.

## Get the basics right on every page

These decide whether a page ranks for the query you picked and whether anyone clicks it.

- [ ] **Write a unique title with the query up front**
  - Check: Export every title from a crawl.
  - Pass: Each title is unique, about 50 to 60 characters, puts the query near the front and the brand at the end.
- [ ] **Write a description that earns the click**
  - Check: Export every meta description from the same crawl.
  - Pass: Each is unique, under 160 characters, and says what the reader gets from the page.
- [ ] **Use one H1 that matches the title**
  - Check: Count the <h1> tags on each template.
  - Pass: One H1 per page, on the same topic as the title.
- [ ] **Answer the query in the first two sentences**
  - Check: Read only the first paragraph of each page.
  - Pass: A searcher gets the answer in the first two sentences without scrolling.
- [ ] **Set Open Graph and X card tags**
  - Check: Paste a URL into an X or Slack message, or into opengraph.xyz.
  - Pass: The preview shows a real title, description and a 1200 × 630 image.
- [ ] **Describe images and set their size**
  - Check: Inspect the images on your top templates.
  - Pass: Every meaningful image has alt text that describes it, plus width and height attributes.
- [ ] **Add a favicon search results can show**
  - Check: Look for <link rel="icon"> on the homepage and open the file.
  - Pass: A square favicon, at least 48 × 48 pixels, that Googlebot can fetch. It shows next to your result.
- [ ] **Declare the page language**
  - Check: Check the <html> tag.
  - Pass: It has a lang attribute that matches the page language.

## Make pages fast on real devices

Slow pages lose visitors before they read a word. Google's thresholds are public, so measure against them.

- [ ] **Pass Core Web Vitals on real-user data**
  - Check: Open PageSpeed Insights for your top pages, or the Core Web Vitals report in Search Console.
  - Pass: Field data at the 75th percentile: LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less.
- [ ] **Load the largest image first**
  - Check: Find the largest element in the PageSpeed report and inspect it.
  - Pass: The hero image is not lazy-loaded, has fetchpriority="high", and is served as WebP or AVIF at its display size.
- [ ] **Stop content from jumping while it loads**
  - Check: Load each template with a throttled connection and watch the layout.
  - Pass: Images, embeds and ads have reserved space, and web fonts swap without moving the text.
- [ ] **Load third-party scripts after the content**
  - Check: List every third-party script in the network tab.
  - Pass: Chat widgets, heatmaps and tag managers load after the content. Unused ones are gone.
- [ ] **Make every page work on a phone**
  - Check: Open the site on a real phone.
  - Pass: No sideways scroll, body text at least 16 px, tap targets apart, and no popup covering the content on arrival.
- [ ] **Serve everything over HTTPS**
  - Check: Open the browser console on your top pages.
  - Pass: HTTPS everywhere, with no mixed-content warnings.

## Add structured data

Structured data tells Google and AI assistants what your pages are. Add what's true and skip markup Google no longer rewards.

- [ ] **Describe your company on the homepage**
  - Check: View source on the homepage and search for "application/ld+json".
  - Pass: Organization (or Person) markup with name, URL, logo and sameAs links to your real profiles.
- [ ] **Mark up articles with a real author**
  - Check: Check a blog post for Article markup.
  - Pass: Article markup with an author that links to a real author page, plus datePublished and dateModified.
- [ ] **Keep product markup in sync with pricing**
  - Check: Compare your Product or SoftwareApplication markup with the pricing page.
  - Pass: Prices and plan names in the markup match what the pricing page says today.
- [ ] **Add breadcrumbs to nested pages**
  - Check: Check a nested page, such as a blog post or docs page.
  - Pass: BreadcrumbList markup that matches the visible breadcrumb.
- [ ] **Validate it and drop markup that cannot pay off**
  - Check: Run your templates through the Rich Results Test and validator.schema.org.
  - Pass: No errors. No star ratings for reviews you collected about yourself, and no FAQ markup added for stars (Google limited FAQ rich results to government and health sites in August 2023).

## Write pages that deserve to rank

Google ranks the page that best answers the search. You win when your page has something the top five do not.

- [ ] **Give the page something the top five lack**
  - Check: For your target query, list what each of the top five results covers.
  - Pass: You can name what your page has that none of them do: data, screenshots, a tool, a test you ran.
- [ ] **Use what only you know**
  - Check: Read the draft and mark every part that only you could have written.
  - Pass: Real screenshots, numbers from your product, or questions your customers asked. Not a rewrite of what ranks.
- [ ] **Show who wrote it**
  - Check: Open a post and click the byline.
  - Pass: It goes to an author page with real experience and links to the author’s profiles.
- [ ] **Date pages honestly**
  - Check: Compare the "updated" dates with the edit history.
  - Pass: The updated date only changes when the content changes.
- [ ] **Answer the next question too**
  - Check: Collect People Also Ask questions, related searches, and what sales and support get asked.
  - Pass: The questions a reader asks next are answered on the page or linked from it.
- [ ] **Merge thin and duplicate pages**
  - Check: Search your own site for pages that target the same thing.
  - Pass: Near-duplicates are merged into one page, with 301s from the rest.
- [ ] **Refresh what is slipping before you publish more**
  - Check: In Search Console, compare clicks per page for the last three months with the three months before.
  - Pass: Your biggest decliners are updated before you write anything new.
- [ ] **Source every number**
  - Check: Highlight every price, statistic and claim about a competitor.
  - Pass: Each one has a source and an "as of" date. Anything you cannot source is cut.

## Link your own pages together

Internal links are the only links you fully control. They tell Google which pages matter.

- [ ] **Link to every new page from three others**
  - Check: Before publishing, find three existing pages on the same topic.
  - Pass: Every new page gets at least three links from related pages on the day it ships.
- [ ] **Use descriptive anchor text**
  - Check: Read the anchor text of your internal links.
  - Pass: Anchors describe the target page, usually its query. No "click here" or "read more".
- [ ] **Leave no orphan pages**
  - Check: Compare the URLs in your sitemap with the URLs a crawler finds from the homepage.
  - Pass: Every sitemap URL is linked from at least one other page.
- [ ] **Keep money pages close to the homepage**
  - Check: Count clicks from the homepage to pricing, signup and your best-converting pages.
  - Pass: Each one is three clicks or fewer from the homepage.
- [ ] **Fix broken internal links**
  - Check: Filter your crawl for internal links that return 3xx or 4xx.
  - Pass: Zero internal links to broken or redirected URLs.

## Show up in AI answers

ChatGPT, Perplexity, Claude and Google AI Overviews answer buying questions now. They can only cite pages they can fetch and understand.

- [ ] **Let AI search crawlers in**
  - Check: Read robots.txt for OAI-SearchBot (ChatGPT search), PerplexityBot, Claude-SearchBot, Googlebot and Bingbot.
  - Pass: All are allowed. Blocking GPTBot or Google-Extended only opts out of model training; AI Overviews use Googlebot.
- [ ] **Check your CDN is not blocking them**
  - Check: Check your CDN or firewall bot settings and your server logs for those user agents.
  - Pass: They get 200 responses. Cloudflare and other CDNs can block AI crawlers by default.
- [ ] **State your facts in plain text**
  - Check: Find where your site states what you do, who it is for, the price and the limits.
  - Pass: Each fact is plain text on the page that owns it, not only in an image or behind a JavaScript toggle.
- [ ] **Ask the assistants about your category**
  - Check: Ask ChatGPT, Perplexity and Google AI Mode ten questions a buyer would ask.
  - Pass: You know whether you appear, what each assistant says about you, and which pages it cites.
- [ ] **Get onto the pages AI cites**
  - Check: Collect the sources the assistants cited in the last step.
  - Pass: Those pages, usually listicles, comparisons and Reddit threads, are on your outreach list.
- [ ] **Verify the site with Bing too**
  - Check: Sign in to Bing Webmaster Tools.
  - Pass: The site is imported from Search Console and the sitemap is submitted. Bing’s index feeds Copilot and other assistants.

## Launch day

Do these the day the site goes live, then check back a week later.

- [ ] **Verify a Domain property in Search Console**
  - Check: Add a Domain property in Search Console and verify it with a DNS record.
  - Pass: Search Console shows data for every subdomain and protocol.
- [ ] **Submit your sitemap**
  - Check: Submit the sitemap in Search Console and Bing Webmaster Tools.
  - Pass: Both report the sitemap as read successfully.
- [ ] **Inspect your top ten URLs**
  - Check: Run URL Inspection on your ten most important URLs and request indexing.
  - Pass: Each shows "URL is on Google" within a week, or you know the reason it is not.
- [ ] **Set up IndexNow**
  - Check: Add an IndexNow key file and ping it when you publish or update a page.
  - Pass: Bing and other IndexNow engines pick up new pages within days.
- [ ] **Track the conversion, not just the visit**
  - Check: Make a test signup or purchase.
  - Pass: It shows up in analytics as a conversion, attributed to its source.
- [ ] **Compare indexed pages with your sitemap**
  - Check: A week after launch, open the Page indexing report.
  - Pass: Indexed pages roughly match your sitemap, and every "not indexed" reason has a fix in progress.

## Earn links and mentions

On competitive queries, the page with more trusted mentions usually wins. Earn them where your buyers already read. If you would rather pay for it, that is what LinkDR does.

- [ ] **Claim your profiles**
  - Check: Claim your company on LinkedIn, X, GitHub, Crunchbase and the directories in your category.
  - Pass: Each profile links to your site and is listed in your Organization sameAs markup.
- [ ] **Get listed where buyers browse**
  - Check: Search "[your category] directory" and look at where competitors are listed.
  - Pass: You are listed in the active directories for your category, starting with the highest-DR ones.
- [ ] **Get into the lists that rank for your category**
  - Check: Search "best [category]" and "[competitor] alternatives" and list the articles on page one.
  - Pass: You have emailed each author with a specific reason to include you.
- [ ] **Get listed by your integration partners**
  - Check: List every tool you integrate with and check whether it has a marketplace or partner page.
  - Pass: You are listed on each one that exists.
- [ ] **Publish one thing people want to cite**
  - Check: Ask what you could publish that a journalist or blogger would cite.
  - Pass: At least one original dataset, free tool or benchmark is live and pitched.
- [ ] **Only get links from real sites**
  - Check: Review every site that links to you.
  - Pass: Each one is a real site with organic traffic on your topic. No private blog networks or link farms.
- [ ] **Track referring domains monthly**
  - Check: Open the links report in Search Console or your SEO tool.
  - Pass: You record referring domains monthly. The count of linking sites matters more than the count of links.

## Run it every week

After launch, thirty minutes a week in Search Console catches what slipped and shows you what to write next.

- [ ] **Push page-two queries onto page one**
  - Check: Filter the Performance report to queries at average position 8 to 20 with real impressions.
  - Pass: You improved the page behind the top few: a better answer, the missing section, more internal links.
- [ ] **Rewrite titles that get seen but not clicked**
  - Check: Sort pages by impressions and look for a click-through rate well below its neighbours.
  - Pass: The weakest titles and descriptions are rewritten, and you note the date to compare later.
- [ ] **Find out why pages lost clicks**
  - Check: Compare clicks per page with the previous period.
  - Pass: You know why each big decliner dropped: a new competitor, changed intent or a technical issue.
- [ ] **Fix new indexing problems**
  - Check: Open the Page indexing report.
  - Pass: Every new "not indexed" reason has a fix.
- [ ] **Judge pages by conversions**
  - Check: Look at signups or sales from organic search, not traffic alone.
  - Pass: You know which pages bring buyers, and the next page you build follows that pattern.

## Run it every day with an agent

The seo-autopilot skill works through this kind of list daily and ships fixes to your site: `npx skills add Illyism/seo-skills --skill seo-autopilot` for the SEO launch checklist 71 checks in the order I run them on a new site. Each one has a test you can do in a few minutes and a pass condition, so you know when it’s done.
