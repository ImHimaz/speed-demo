<?php
/**
 * Title: Archive intro
 * Slug: wp-elite/section-archive-hero
 * Categories: wp-elite
 * Inserter: no
 * Description: A category or tag archive's intro, in the blog page's look: a Page Hero section (eyebrow "Blog", the archive's name as the title, its description). Used by the archive template.
 *
 * @package WpElite
 */

?>
<!-- wp:elite/section {"label":"Archive intro","className":"elite-section--page-hero"} -->
<section class="elite-section alignfull elite-section--page-hero"><div class="section-inner"><div class="container"><!-- wp:elite/paragraph {"textStyle":"eyebrow","className":"elite-paragraph--eyebrow"} -->
<p class="elite-paragraph elite-paragraph--eyebrow" style="font-family:var(--text-eyebrow-font-family);font-size:var(--text-eyebrow-font-size);font-weight:var(--text-eyebrow-font-weight);line-height:var(--text-eyebrow-line-height);letter-spacing:var(--text-eyebrow-letter-spacing);text-transform:var(--text-eyebrow-text-transform)"><?php esc_html_e( 'Blog', 'wp-elite' ); ?></p>
<!-- /wp:elite/paragraph -->

<!-- wp:query-title {"type":"archive","level":1,"showPrefix":false} /-->

<!-- wp:term-description {"className":"elite-paragraph--section-lead"} /--></div></div></section>
<!-- /wp:elite/section -->
