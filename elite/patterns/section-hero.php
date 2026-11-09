<?php
/**
 * Title: Hero
 * Slug: wp-elite/section-hero
 * Categories: wp-elite, banner
 * Keywords: hero, banner, intro
 * Description: Full-width intro with an eyebrow, heading, text and a call to action, and a sample image (section class elite-section--hero).
 *
 * @package WpElite
 */

?>
<!-- wp:group {"align":"full","className":"elite-section--hero","backgroundColor":"surface","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull elite-section--hero has-surface-background-color has-background" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--70)"><!-- wp:paragraph {"align":"center","className":"elite-paragraph--hero-eyebrow"} -->
<p class="has-text-align-center elite-paragraph--hero-eyebrow"><?php esc_html_e( 'Welcome', 'wp-elite' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center","level":1} -->
<h1 class="wp-block-heading has-text-align-center"><?php esc_html_e( 'Build pages that perform', 'wp-elite' ); ?></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","fontSize":"lead"} -->
<p class="has-text-align-center has-lead-font-size"><?php esc_html_e( 'A short supporting line that explains the value in one sentence.', 'wp-elite' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Get started', 'wp-elite' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:group {"className":"elite-div--hero-media","layout":{"type":"default"}} -->
<div class="wp-block-group elite-div--hero-media"><!-- wp:image {"aspectRatio":"16/9","scale":"cover","sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/sample-hero.svg' ) ); ?>" alt="" style="aspect-ratio:16/9;object-fit:cover"/></figure>
<!-- /wp:image --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
