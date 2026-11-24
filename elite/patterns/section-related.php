<?php
/**
 * Title: Related posts
 * Slug: wp-elite/section-related
 * Categories: wp-elite
 * Inserter: no
 * Description: "Keep reading": three related posts (Elite Posts, related source: the same category first) as the home page's blog cards (elite-section--blog). Used by the single post template.
 *
 * @package WpElite
 */

?>
<!-- wp:elite/section {"label":"Related posts","className":"elite-section--blog"} -->
<section class="elite-section alignfull elite-section--blog"><div class="section-inner"><div class="container"><!-- wp:elite/div {"className":"elite-div--blog-head"} -->
<div class="elite-div elite-div--blog-head"><div class="div-inner"><!-- wp:elite/heading {"textStyle":"title-2"} -->
<h2 class="elite-heading" style="font-family:var(--text-title-2-font-family);font-size:var(--text-title-2-font-size);font-weight:var(--text-title-2-font-weight);line-height:var(--text-title-2-line-height);letter-spacing:var(--text-title-2-letter-spacing);text-transform:var(--text-title-2-text-transform)"><?php esc_html_e( 'Keep reading', 'wp-elite' ); ?></h2>
<!-- /wp:elite/heading -->

<!-- wp:elite/button {"text":"<?php esc_attr_e( 'All posts', 'wp-elite' ); ?>","link":{"url":"<?php echo esc_url( home_url( '/blog/' ) ); ?>"},"iconEnd":"arrow-right","className":"elite-button--link"} /--></div></div>
<!-- /wp:elite/div -->

<!-- wp:elite/posts {"query":{"source":"related","perPage":3,"postType":"","taxonomies":[],"fill":true,"exclude":[],"order":"date-desc","terms":{},"termsMatch":"any","posts":[],"featured":"any"},"className":"elite-posts--blog"} -->
<!-- wp:elite/post-template {"lock":{"remove":true,"move":false}} -->
<!-- wp:elite/post -->
<!-- wp:post-featured-image {"aspectRatio":"16/10"} /-->

<!-- wp:elite/post-field {"taxonomy":"category","termLinks":false} /-->

<!-- wp:post-title {"level":3} /-->

<!-- wp:elite/div {"className":"elite-post__meta"} -->
<div class="elite-div elite-post__meta"><div class="div-inner"><!-- wp:post-date /-->

<!-- wp:elite/post-reading-time /--></div></div>
<!-- /wp:elite/div -->
<!-- /wp:elite/post -->
<!-- /wp:elite/post-template -->
<!-- /wp:elite/posts --></div></div></section>
<!-- /wp:elite/section -->
