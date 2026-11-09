# WP Elite

A pure block theme. Tokens live in its SCSS abstracts and `theme.json`; styles and scripts live in feature folders that load only where they're used (see [Theme structure](#theme-structure)).

It works without [Elite Blocks](../elite-blocks), and feeds the plugin through filters when it's active (`inc/integrations/elite-blocks.php`): Block Classes presets (`elite_blocks_class_presets`), the type scale as Text Styles (`elite_blocks_text_styles`) and `assets/icons/` (`elite_blocks_icons`).

## Requirements

- Node 22+ (`.nvmrc` pins 24)
- Docker (for `wp-env`)
- PHP 8.2+ and Composer (only for the PHP lint and static-analysis tools)

## Getting started

Clone the plugin next to the theme and build it once (the dev site runs it from there):

```
Projects/
├─ elite-blocks/      the plugin repo (npm install && npm run build)
└─ wp-elite-theme/    this repo
```

```bash
npm install
composer install
npm run build
npm run env:start
```

- Site: http://localhost:8890 (wp-env's default local test login)
- Test site: http://localhost:8891, its own database (`.wp-env.test.json`)

The repo is mounted as `wp-content/themes/wp-elite` (WordPress names a theme by its folder, and that's the folder the release zip uses). `npm run env:start` / `env:stop` / `env:clean` act on both sites. `npm start` rebuilds on every change.

## Environments

The code a site runs depends on where it is:

| Environment | `WP_ENVIRONMENT_TYPE` | Theme code on the server |
|---|---|---|
| Local (wp-env) | `local` | The whole repo: `assets/` sources, `scripts/`, tests, plus `build/` from `npm start` |
| Staging | `staging` | Built package only (`npm run release`) |
| Production | `production` | Built package only |

Set the type in each server's `wp-config.php` (`define( 'WP_ENVIRONMENT_TYPE', 'staging' );`); WordPress treats a site without one as `production`.

On staging and production the **Theme File Editor** is off (`inc/environment.php`): theme code changes in this repo and is deployed, never edited on the server. Elite Blocks, when active, also turns off the Plugin File Editor and leaves itself out of the Plugins screen there. Override with `add_filter( 'wp_elite_locked', '__return_false' );`.

## Deployment

```bash
npm run release   # build, then wp-elite.zip: build/, inc/, parts/, patterns/, templates/, fonts, icons, images, json, theme files
```

`.github/workflows/deploy.yml` ships that package to the server over SSH (rsync into `wp-content/themes/wp-elite/`):

- a push to `main` deploys to **staging**;
- a tag `v*` (or running the workflow by hand and picking `production`) deploys to **production**.

Each is a GitHub environment (Settings → Environments: `staging`, `production`; add required reviewers to `production` to gate it) with these secrets:

| Secret | Example |
|---|---|
| `SSH_HOST` | `server.example.com` |
| `SSH_PORT` | `22` (Namecheap shared hosting uses `21098`) |
| `SSH_USER` | `cpaneluser` |
| `SSH_KEY` | a private key whose public key is in the server's `~/.ssh/authorized_keys` (cPanel → SSH Access) |
| `THEME_PATH` | `/home/cpaneluser/public_html/wp-content/themes/wp-elite` |
| `SSH_KNOWN_HOSTS` | optional: the server's line from `ssh-keyscan -p 21098 server.example.com`; without it the host key is trusted on each run |

rsync runs with `--delete`, so files removed from the theme are removed from the server.

## Header menu: Max Mega Menu

The header's menu is **Max Mega Menu** (location **Header menu**, `primary`); without the plugin, WordPress's Navigation block shows instead (`patterns/header-menu.php`).

- **Pre-installed** in the dev site: the free plugin from wordpress.org (`.wp-env.json`), **Pro** from `third-party/megamenu-pro/` through `.wp-env.override.json`. Both are git-ignored: Pro is paid, so each developer copies it in once (from a licensed install) and keeps the override file:

  ```json
  { "plugins": [ "../elite-blocks", "https://downloads.wordpress.org/plugin/megamenu.zip", "./third-party/megamenu-pro" ] }
  ```

  Without them, the dev site runs with the free plugin only.
- **Lean settings, kept in code** (`inc/integrations/megamenu.php`, over Mega Menu → General Settings, so every environment matches): no icon fonts (Pro would load Font Awesome 4, 5, 6 and Genericons on every page), CSS in a cached file, scripts in the footer. Visitors get no Dashicons (the theme draws the arrows). The menu's scripts load **deferred** in the footer. **jQuery stays as WordPress loads it** (in `<head>`): code that plugins, widgets or a Custom HTML block print straight into the page (`<script>jQuery(…)</script>`) runs as it's read and needs jQuery there already.
- **Filters:** `wp_elite_megamenu_settings` (e.g. bring an icon font back), `wp_elite_megamenu_dashicons` (keep Dashicons), `wp_elite_megamenu_defer_jquery` (opt in: also defer jQuery to the footer, for a site where nothing prints inline jQuery code; `add_filter( 'wp_elite_megamenu_defer_jquery', '__return_true' );`).
- **Styles** for the menu: `assets/vendor/megamenu/` (loaded only with the plugin), so brand styles live in the theme's code rather than a menu theme saved in the database.
- **Patterns:** the dev and test sites run in theme development mode (`WP_DEVELOPMENT_MODE`), so new pattern files show at once. On live sites WordPress caches the theme's pattern list until the theme's version changes: bump `WP_ELITE_VERSION` when releasing new patterns.

## Theme structure

One feature = one folder, holding its styles and (optionally) its script. Each folder loads **only where it's used**, so a page carries the CSS and JS of what's on it, not of every design on the site (b3rg bundles everything into one file).

```
wp-elite/
├─ functions.php        loads inc/
├─ inc/
│  ├─ setup.php         theme supports, editor styles, pattern category, colour palette
│  ├─ manifest.php      reads the generated assets/json/ files
│  ├─ assets.php        global CSS; loads each feature folder where it's used
│  ├─ fonts.php         preloads the body font
│  └─ integrations/     elite-blocks.php (classes, text styles, icons for the plugin), megamenu.php
├─ parts/  templates/   layout only: header part, a pattern, footer part (`site-header` / `site-footer`)
├─ patterns/            named by group: header-*, footer-*, section-*, page-*, template-*
├─ screenshot.png       Appearance → Themes thumbnail (1200 × 900)
├─ tests/php/           theme PHP checks (npm run test:php)
└─ assets/
   ├─ styles/           global CSS (build/theme.css, every page)
   │  ├─ abstracts/     no CSS output: data files + _functions.scss (every function and mixin)
   │  ├─ base/          plain elements: typography, links, lists, forms…
   │  └─ main.scss  editor.scss
   ├─ blocks/<block-class>/   modifier classes for one block
   ├─ layout/<part>/          a template part's styles (header, footer)
   ├─ sections/<name>/        one section design: its root class + its parts
   ├─ pages/<body-class>/     a page type (single-post, search, error404…)
   ├─ vendor/<plugin>/        styles for a plugin's own markup
   ├─ utils/                  helpers for scripts
   ├─ json/                   generated by `npm run classes`; don't edit, do commit
   ├─ fonts/<family>/         self-hosted fonts (woff2 + licence), registered in theme.json
   ├─ images/                 theme images for patterns and CSS
   └─ icons/                  the icon set for Elite blocks
```

| Folder | Built to | Loads | In the editor |
|---|---|---|---|
| `blocks/<block-class>/` | `build/blocks/<block-class>.css` | With that block (a folder that isn't a block, e.g. `elite-span`, with its class) | Always |
| `layout/<part>/` | `build/layout/<part>.css` | With that template part (slug `header` → `layout/header/`) | Always |
| `sections/<name>/` | `build/sections/<name>.css` | On pages using its root class `elite-section--<name>` (the whole class: not `…--<name>-large`) | Always |
| `pages/<body-class>/` | `build/pages/<body-class>.css` | On pages with that body class: `single-post`, `single-case-study`, `page-template-landing`, `post-type-archive-resource`, `search`, `error404`… | Always (body-class selectors don't match there) |
| `vendor/<plugin>/` | `build/vendor/<plugin>.css` | While the plugin is active: `// Active when: NAME` in its SCSS (a constant, class or function, e.g. `MEGAMENU_VERSION`), after the plugin's own CSS | No |

**Text in templates goes in patterns.** `.html` templates and parts can't be translated, so they hold only structure: a template is the header part, a hidden `template-*` pattern with its main content, and the footer part; the footer part is the `footer-default` pattern. Patterns are PHP, so their text goes through `esc_html_e( '…', 'wp-elite' )` and shows up for translators (`wp i18n make-pot`). The index, archive and search templates share one posts grid (`template-query-grid`). Core blocks with their own translated defaults are left without text: the Search block shows WordPress's "Search" when it has no label or button text.

**Samples** (keep, change or delete them; each shows a convention):

| Folder | Shows |
|---|---|
| `sections/hero/` | A CSS-only section (nothing to delay the top of the page): root class, parts `elite-paragraph--hero-eyebrow` and `elite-div--hero-media`, padding on `.section-inner`, Bootstrap's `media-breakpoint-down()`. Used by the **Hero** pattern. |
| `sections/cta/` | A section with a script: the content fades up when scrolled into view (`whenVisible`), shown at once if already on screen at load or with reduced motion; part `elite-div--cta-actions` (full-width buttons on phones). Used by the **Call to action** pattern. |
| `pages/single-post/` | Blog posts: heading rhythm, quotes, captions, tag pills, previous/next; part `elite-div--post-callout` (a box for a post's content, styled by its class so the editor shows it). |
| `pages/search/`, `pages/error404/` | Search results and Page not found. |

- **In a folder:** every `.scss` not starting with `_` is compiled into the folder's one stylesheet; `view.js` (if any) into its one script.
- **Styles in `<head>`:** block themes render the page before printing `<head>`, so styles found while rendering still land there; small files are inlined (below).
- **Scripts** load with their styles, **deferred, in the footer**; dependencies come from the build's `.asset.php`.
- **Few requests** (`inc/performance.php`): a page's small files are printed in it instead of loaded one by one (each folder's CSS and script is a few KB, and each would be a request).
  - **Styles, shared:** the CSS every page uses stays in files, downloaded once and cached for every later page: the global `theme.css`, the header and footer layout folders, Elite Blocks' grid, WordPress's `common.css` and Navigation. Filter `wp_elite_cached_styles` (the handles).
  - **Styles, per page:** the rest (the page's sections and blocks: sliders, tabs, accordions, post cards…) WordPress inlines, smallest first, up to **50 KB** a page (WordPress's default is 20 KB; filter `wp_elite_styles_inline_size_limit`). Larger ones stay files, cached for the next page that uses them. A busy test page (Slider, Accordion, Counter) inlined 31 KB; a plain page 4 KB.
  - **Scripts:** a theme or plugin script of up to **4 KB** is printed as an inline module, which runs after the page is parsed and in order, as a deferred file does. Not one with code set to run after it, one that looks for its own `<script>` (`document.currentScript`, e.g. Elite Slider finding the Swiper files it loads) or uses `document.write`, or a script module. Filter `wp_elite_script_inline_size_limit` (`$limit, $handle`; 0 turns it off).
  - WordPress's own scripts, larger plugin scripts and the Interactivity API stay files, cached between pages.
  - **A one-page site** (nothing to share between pages) can inline all its CSS: return an empty list from `wp_elite_cached_styles` and raise the limit, as Arcnest does in its `inc/site.php` (150 KB; its home page went from 41 requests to 12). Keep such settings in a site file like that, not in `inc/performance.php`, so the base theme's fixes still merge in.
- **Editor:** all layout, section and page styles come as one file (`build/editor-features.css`), since the editor can't know what a post will use. Scripts don't run in the editor, which shows the static layout.
- **By hand**, e.g. in a custom template: `\WpElite\enqueue_feature( 'sections', 'hero' );`. The `wp_elite_load_feature` filter (`$load, $kind, $name`) can stop any folder loading.
- **SCSS abstracts:** every folder sits two levels down, so `@use "../../styles/abstracts" as *;` gives everything. Data lives in its own files; **every function and mixin is in `_functions.scss`**:

  | File | Holds |
  |---|---|
  | `_colors.scss` | `$colors` (the editor palette) |
  | `_text-styles.scss` | `$text-styles` (the type scale), `$text-props` |
  | `_breakpoints.scss` | `$grid-breakpoints` (Bootstrap 5), `$devices` |
  | `_variables.scss` | `$radius-*`, `$border-color`, `$duration-*`, `$ease`, `$z-layers` |
  | `_functions.scss` | `media-breakpoint-up/down/between/only()`, `breakpoint-min/max/next()`, `text-style()`, `text-value()`, `button-look()`, `z()` |

- **Mobile first:** write the phone styles plainly, then add to them for larger screens with `media-breakpoint-up()`. Don't style desktop first and undo it with `media-breakpoint-down()`: phones then download and override rules they never use. The theme's own CSS (type scale, sample sections and pages) follows this.
- **Breakpoints** are **Bootstrap 5's** (`xs` 0, `sm` 576, `md` 768, `lg` 992, `xl` 1200, `xxl` 1400), the same as the Elite Blocks grid, with Bootstrap's mixins under the same names and results, so b3rg/Bootstrap SCSS ports as is:

  ```scss
  @include media-breakpoint-up(md) { … }          // 768px and up (tablet and larger)
  @include media-breakpoint-up(lg) { … }          // 992px and up (laptop and desktop)
  @include media-breakpoint-down(lg) { … }        // under 992px (only when a rule must not reach larger screens)
  @include media-breakpoint-between(md, xl) { … } // 768px to 1199.98px
  @include media-breakpoint-only(md) { … }        // 768px to 991.98px
  ```

  Elite Blocks' **devices** are Bootstrap breakpoints too (`$devices`: laptop below `xl`, tablet below `lg`, mobile below `md`), so CSS that matches a block's per-device settings uses the same mixins: mobile is the base, `media-breakpoint-up(md)` tablet and larger, `up(lg)` laptop and desktop, `up(xl)` desktop. There are no other breakpoint mixins. Both maps feed `assets/json/breakpoints.json` for scripts.

### Scripts

A folder's `view.js` is plain modern JavaScript (no jQuery), bundled on its own. Set up **each copy** on the page by itself, so two copies of a section don't clash:

```js
import { onReady, whenVisible, isDevice, prefersReducedMotion } from '../../utils';

function setUp( section ) {
	whenVisible( section, () => {
		// Start something only when it's near the screen.
	} );
}

onReady( () => {
	document.querySelectorAll( '.elite-section--hero' ).forEach( setUp );
} );
```

- `onReady( fn )`: runs once the HTML is ready (at once for deferred scripts).
- `whenVisible( element, fn, rootMargin = '200px' )`: runs once the element is near the screen; returns a function to stop watching.
- `isDevice( 'tablet' )`: that device or smaller, as the SCSS `media-breakpoint-down()` of its breakpoint (`'desktop'` is above laptop). `deviceQuery()` gives the media query.
- `mediaBreakpointUp( 'md' )`, `mediaBreakpointDown( 'lg' )`: Bootstrap's media queries, for `window.matchMedia( … )`.
- `prefersReducedMotion()`: skip autoplay and animations when true.
- **Use the plugin first:** accordion, tabs, slider, popup, counters, forms and TOC are Elite Blocks; a section's script is only glue. The theme never imports plugin code: it can listen to the plugin's events (`elite-form:submitted`, `elite-video:play`…) and use `window.EliteBlocks` after checking it's there.

## Adding classes and folders: `npm run add`

This replaces b3rg's `npm run ng`. Every Elite block has a default class (Section: `elite-section`). A theme file named `<default-class>--<modifier>.scss` becomes that modifier class in the block's **Block Classes** multi-select (Styles tab), just like b3rg's `e-stn/e-stn--dlt.scss`.

```bash
npm run add -- section dark                    # blocks/elite-section/elite-section--dark.scss → class elite-section--dark, label "Dark"
npm run add -- section primary-small --label "Primary (small)"
npm run add -- core/button pill                # any block: blocks/core-button/core-button--pill.scss
npm run add -- section outline --style         # native block style instead (core Styles panel, one at a time)

npm run add -- sections/hero --js              # a section design: sections/hero/elite-section--hero.scss + view.js
npm run add -- sections/hero div hero-media    # a part: sections/hero/elite-div--hero-media.scss ("Hero › Hero Media" on Elite Div)
npm run add -- pages/single-post               # page-type styles: pages/single-post/single-post.scss
npm run add -- pages/single-post div author    # a part for blog posts' content
npm run add -- layout/header --js              # the header's styles and script
npm run add -- vendor/gravity-forms --when GFForms   # a plugin's styles, while class GFForms exists

npm run classes                                # regenerate after editing/deleting files
```

Things to know:
- **Labels:** taken from the file name (`primary-small` → "Primary Small"), or from a `// Label: …` comment at the top of the file. Parts of a section, page or layout are labelled under it: "Hero › Hero Media".
- **Section folders:** the root class file is named after the folder (`sections/hero/elite-section--hero.scss`); its class is what loads the folder, so style the parts under it (`.elite-section--hero .elite-div--hero-media`). Any other block can be the root: rename the file (`elite-div--hero.scss`).
- **One class, one place:** `npm run classes` stops if two folders define the same class (it would show twice in Block Classes): prefix parts with the section's name, as b3rg does (`elite-div--hero-media`).
- **Generated files:** `npm run classes` writes `assets/json/` (`manifest.json`, plus `colors.json`, `text-styles.json`, `breakpoints.json` from the abstracts). It runs automatically before `build` and `start`. Commit them, because the theme reads them at runtime.
- **Other files:** any other `.scss` file in a folder (for example `base.scss`) is compiled without adding an editor option. Files starting with `_` are partials.
- **Restarting the watcher:** after creating a new folder, restart `npm start`.
- **Spacing in Section modifiers:** values set in the CMS (Spacing - Top/Bottom) always win. Anything not set there comes from the modifier. Padding is plain CSS on `.section-inner`. Margin uses `--section-margin-top` and `--section-margin-bottom`, because WordPress's layout CSS overrides plain `margin-*` on sections. See `elite-section--spacious.scss`.
- **Clearing classes:** the dropdown can be emptied completely. Unlike b3rg, removing the last class is allowed.
- **Where classes are saved:** Block Classes saves into the block's `className` attribute, and the block adds it to its markup. Elite blocks have no "Additional CSS class(es)" field. Their Advanced tab only has WordPress's **Additional CSS**, which is custom CSS for that one block.

## Fonts, images and variables

**Fonts** are self-hosted: one folder per family in `assets/fonts/` (the `.woff2` files and their licence), registered in `theme.json` under `settings.typography.fontFamilies[].fontFace`. WordPress then writes the `@font-face` rules on the site and in the editor, and the family shows in the editor's font picker.

- **Sample:** Manrope (variable, weights 200–800, SIL Open Font License, `assets/fonts/manrope/OFL.txt`) as the **Body** family, used by the whole site through the Body text style. Swap it by replacing the folder and the `fontFace` entry; keep the slug `body`.
- **Loading:** `font-display: swap` (text shows at once in a fallback font). The body font's files are **preloaded** first thing in `<head>` (`inc/fonts.php`); the `wp_elite_preload_fonts` filter picks which families (slugs) to preload: only what the top of every page uses, since each preload competes with the page's first image.
- **Heading** is a second family preset, pointing to the Body family until a project sets its own (`"fontFamily": "var(--wp--preset--font-family--body)"`). Titles 1–6 use it (`font-family: $-heading` in `_text-styles.scss`), so a different heading font is one change: add its folder (woff2 files and licence) and set the Heading preset's `fontFamily` and `fontFace` in theme.json. Add its slug to `wp_elite_preload_fonts` if the top of every page uses it. Give any other style the Heading font the same way (e.g. big display numbers).

**Images** for the theme's own design live in `assets/images/`.

- **In a pattern:** `<?php echo esc_url( get_theme_file_uri( 'assets/images/sample-hero.svg' ) ); ?>` (see the Hero pattern). Content images belong in the Media Library, not here.
- **In SCSS:** point at the file from the feature folder: `background-image: url("../../images/shape.svg");`. The build inlines SVGs into the CSS and copies other images (png, jpg, webp) to `build/images/` with a hash, so caches refresh when they change.
- **Sample:** `sample-hero.svg`, the Hero pattern's illustration.

**Variables** (`styles/abstracts/_variables.scss`): shared values that aren't editor tokens: corners (`$radius-sm|md|lg|xl|xxl|pill`: 4, 8, 12, 16, 24px, round), lines (`$border-color`: the text colour at 12%, visible on any light background), motion (`$duration-fast|medium|slow`: 0.2, 0.4, 0.6s, `$ease`) and one z-index scale (`$z-layers`, read with `z(header)`), so layers never fight. Everything else already has a home: colours in `_colors.scss`, the type scale in `_text-styles.scss`, breakpoints in `_breakpoints.scss`, and spacing, shadows and fonts as theme.json presets (`var(--wp--preset--shadow--lg)`), which editors can pick too. Unlike b3rg's `_variables.scss`, there are no image-path, border or one-off shadow lists: write the value where it's used, and move it here once it repeats.

## Colours

Theme colours live in one place: the `$colors` map in `assets/styles/abstracts/_colors.scss`, as in b3rg's `_color-palette.scss`.

- **What the map feeds:** `npm run classes` (which also runs before `build` and `start`) writes `assets/json/colors.json`, and the theme registers it as the editor palette. It drives every colour picker (Elite's background and border pickers included), the `has-*-color` classes and the `--wp--preset--color--*` variables.
- **In theme SCSS:** `@use "../../styles/abstracts" as *;` gives you `$colors`.
- **Adding a colour:** add it to the map and run `npm run classes`. Keys are slugs, so `"primary"` shows as "Primary".

## Typography

- **Type scale:** every text look on the site is a style in `assets/styles/abstracts/_text-styles.scss` (`$text-styles`), with its family, size, weight, line height, letter spacing and case. It sets `h1`–`h6` and `body` site-wide and defines the `--text-<style>-<prop>` variables. Use it in theme SCSS with `@use "../../styles/abstracts" as *; @include text-style("title-5");`, then set only what's the part's own (colour, margins; the weight or line height if they differ, e.g. a bold caption or a single-line pill).
  - **Any property can change per device**, not only the size: give it a map, `(desktop: …, laptop: …, tablet: …, mobile: …)`; a device without a value takes the next larger one's. Title 1 is the example: size 36/44/56px, line height 1.2 on phones and tablets and 1.1 from laptops, letter spacing −0.01em on phones, −0.015em on tablets and −0.025em from laptops (big type reads best set tighter). The CSS is mobile first: the phone values, then only what changes at each larger device.
  - **Editor styles** (the Text Style dropdown and Font size picker): Title 1–6, Lead, Body, Small, Eyebrow.
  - **Component styles** (`editor: false`: kept in the scale, not offered in the editor): `button` and `button-small`. Elite Buttons use them through `button-look()` and the Small look, core Buttons through theme.json's button typography (`var(--text-button-…)`), so both kinds of button share one look.
  - **Enforced:** Stylelint (`.stylelintrc.json`) rejects `font`, `font-family`, `font-size`, `letter-spacing` and `text-transform` anywhere in `assets/` except `assets/styles/` (and `assets/vendor/`, which resets third-party plugins' fonts), so a new look is added to the scale, not written into a part.
- **One scale for every block:** the type scale is also theme.json's font sizes (`inc/setup.php`, like the palette): core blocks' **Font size** picker (core Paragraph, Heading, Post Title, Site Title…) lists the same Title 1–6, Lead, Body, Small, Eyebrow, and each size is the scale's own per-device value (`--wp--preset--font-size--title-1: var(--text-title-1-font-size)`), so 56px on desktop is 36px on a phone wherever it's used. WordPress's default and fluid sizes are off; templates and patterns use the same names (`"fontSize":"title-5"`). The picker sets the size only; a Text Style (Elite blocks) sets the whole style. Change a size in `_text-styles.scss` and both follow.
- **Text blocks** (Elite Heading, Elite Paragraph, Text Style, Tag) are the plugin's; see its README. Text Styles come from this scale through `elite_blocks_text_styles`.
- **Span inside text:** select words, open More (⌄) in the text toolbar → **Span**, and tick classes from `assets/blocks/elite-span/elite-span--*.scss` (the theme loads that CSS on pages that use it). The result is `<span class="elite-span elite-span--highlight">`. For a whole block as a `<span>`, set Elite Paragraph's tag to SPAN.

## Icons

- **Where they live:** every `assets/icons/<slug>.svg` (78 to start: arrows, chevrons, UI, contact, media, commerce, business, social) is offered in the Button and Icon pickers, labelled from its file name (`arrow-right.svg` → "Arrow Right"). Add an icon by dropping an SVG in that folder.
- **How to draw them:** use `currentColor` (`stroke="currentColor"` or `fill="currentColor"`) so icons follow the button's text colour and hover state. They render at `1em`.
- **How they're stored:** blocks save only the slug and print the SVG when the page renders, so editing a file updates every button that uses it. SVGs are sanitised (scripts, event handlers and non-drawing elements removed; definitions such as `<defs>`, `<clipPath>`, `<mask>` and gradients removed with what's inside them, and fills that used them take the text colour) and hidden from screen readers.
- **Buttons:** looks are theme modifiers in `assets/blocks/elite-button/`, built with the `button-look()` mixin from `styles/abstracts/_functions.scss` (colours plus hover and focus states, as b3rg's `common-button`). Add one with `npm run add -- button <name>`.

## Quality checks

```bash
npm run lint         # ESLint (scripts and view.js), Stylelint
npm run test:unit    # Vitest
npm run test:php     # PHP checks inside WordPress: tests/php/*.check.php
composer run phpcs   # WordPress coding standards
composer run phpstan # static analysis, level 6
```

CI (`.github/workflows/ci.yml`) runs all of these on every push and pull request. The block e2e tests live in the plugin repo and run against this theme.
