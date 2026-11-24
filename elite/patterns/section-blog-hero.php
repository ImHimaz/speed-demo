<?php
/**
 * Title: Blog intro
 * Slug: wp-elite/section-blog-hero
 * Categories: wp-elite
 * Inserter: no
 * Description: The blog page's intro: a Page Hero section (eyebrow, title, line). Used by the home (posts page) template.
 *
 * @package WpElite
 */

?>
<!-- wp:elite/section {"label":"Blog intro","className":"elite-section--page-hero"} -->
<section class="elite-section alignfull elite-section--page-hero"><div class="section-inner"><div class="container"><!-- wp:elite/paragraph {"textStyle":"eyebrow","className":"elite-paragraph--eyebrow"} -->
<p class="elite-paragraph elite-paragraph--eyebrow" style="font-family:var(--text-eyebrow-font-family);font-size:var(--text-eyebrow-font-size);font-weight:var(--text-eyebrow-font-weight);line-height:var(--text-eyebrow-line-height);letter-spacing:var(--text-eyebrow-letter-spacing);text-transform:var(--text-eyebrow-text-transform)"><?php esc_html_e( 'Blog', 'wp-elite' ); ?></p>
<!-- /wp:elite/paragraph -->

<!-- wp:elite/heading {"level":1} -->
<h1 class="elite-heading"><?php esc_html_e( 'Ideas for teams that listen', 'wp-elite' ); ?></h1>
<!-- /wp:elite/heading -->

<!-- wp:elite/paragraph {"textStyle":"lead","className":"elite-paragraph--section-lead"} -->
<p class="elite-paragraph elite-paragraph--section-lead" style="font-family:var(--text-lead-font-family);font-size:var(--text-lead-font-size);font-weight:var(--text-lead-font-weight);line-height:var(--text-lead-line-height);letter-spacing:var(--text-lead-letter-spacing);text-transform:var(--text-lead-text-transform)"><?php esc_html_e( 'Guides, research and product news on turning customer feedback into decisions.', 'wp-elite' ); ?></p>
<!-- /wp:elite/paragraph --></div></div></section>
<!-- /wp:elite/section -->
