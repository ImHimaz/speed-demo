<?php
/**
 * Title: Page not found
 * Slug: wp-elite/template-404
 * Inserter: no
 * Description: The main content of the 404 template: a title, a short explanation and a search box.
 *
 * @package WpElite
 */

?>
<!-- wp:group {"tagName":"main","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<main class="wp-block-group" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading"><?php esc_html_e( 'Page not found', 'wp-elite' ); ?></h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'The page you are looking for does not exist. Try a search instead.', 'wp-elite' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:search {"showLabel":false} /--></main>
<!-- /wp:group -->
