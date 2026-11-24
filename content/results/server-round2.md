# Server test, round 2 ("a real project")

Namecheap Stellar Plus (shared, CloudLinux, LiteSpeed, PHP 8.3.36), 10 Nov 2026.
Both sites on the same account, no page cache. Requests from the server itself
to each site's public HTTPS address (curl), unique query strings so nothing
is cached. The server's load average was 14–16 (other accounts), so small
differences are noise.

## Server time, one visitor at a time (median of 12, alternating sites)

| Page | Elite Blocks | Elementor Pro |
|---|---|---|
| Home | 242 ms | 216 ms |
| Pricing | 206 ms | 216 ms |
| Blog post | 172 ms | 386 ms |
| Blog page | 190 ms | 463 ms |

Elementor's pages built from its element cache (home, pricing) are as quick as
Elite's; its Theme Builder templates with Loop Grids (post, blog) take about
twice as long.

## Load: visitors at the same time (all responses 200, no throttling)

| Test | Elite Blocks | Elementor Pro |
|---|---|---|
| Home, 4 at once (60 requests) | 7.1 req/s, p50 513 ms | 4.6 req/s, p50 821 ms |
| Home, 8 at once (120) | 6.4 req/s, p50 1.18 s | 4.2 req/s, p50 1.82 s |
| Home, 16 at once (160) | 6.2 req/s, p50 2.40 s, p95 3.41 s | 4.1 req/s, p50 3.80 s, p95 4.63 s |
| Blog post, 8 at once (120) | 7.2 req/s, p50 0.88 s | 4.6 req/s, p50 1.63 s |

The account's CPU limit is reached from about 4 at once: the rate stays flat
and waits grow. At that limit Elite serves about 50% more pages per second.

## Database (current content, revisions left out)

| | Elite Blocks | Elementor Pro |
|---|---|---|
| Posts, pages, templates | 66 rows, 175 KB | 69 rows, 193 KB |
| Post meta | 170 rows, 26 KB | 290 rows, 689 KB (Elementor's: 662 KB) |
| Autoloaded options | 118 KB | 138 KB |
| Tables | 21 | 27 |
| Whole database (with revisions from rebuilds) | 4.1 MB | 12.1 MB |

Elementor keeps each page as JSON (`_elementor_data`), a rendered cache
(`_elementor_element_cache`) and settings, beside the post content.
