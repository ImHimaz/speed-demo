<?php
/**
 * Title: Footer
 * Slug: wp-elite/footer-default
 * Categories: footer
 * Block Types: core/template-part/footer
 * Description: Navy footer built with Elite blocks: an Elite Section (elite-section--footer) and Row; the brand column (the light logo, Elite Blocks' secondary logo; a line; social Elite Buttons) and four link columns (Elite Heading and a core List each); then the copyright line. The footer template part's content.
 *
 * @package WpElite
 */

/**
 * An Elite Paragraph block.
 *
 * @param string $html      Its content (already escaped).
 * @param string $modifier  Its Block Class.
 */
$wp_elite_paragraph = static function ( string $html, string $modifier ): void {
	printf(
		"<!-- wp:elite/paragraph {\"className\":\"%1\$s\"} -->\n<p class=\"elite-paragraph %2\$s\">%3\$s</p>\n<!-- /wp:elite/paragraph -->\n\n",
		esc_attr( str_replace( '--', '--', $modifier ) ),
		esc_attr( $modifier ),
		$html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by the caller.
	);
};

/**
 * A link column: an Elite Column with an Elite Heading and a core List.
 *
 * @param string       $title Heading.
 * @param list<string> $links Link labels (demo links).
 */
$wp_elite_column = static function ( string $title, array $links ): void {
	echo "<!-- wp:elite/column {\"size\":{\"mobile\":{\"width\":6},\"tablet\":{\"width\":3}}} -->\n<div class=\"elite-column col-6 col-md-3\"><div class=\"column-inner\">";
	printf(
		"<!-- wp:elite/heading {\"level\":4,\"textStyle\":\"title-6\",\"className\":\"elite-heading\\u002d\\u002dfooter-title\"} -->\n<h4 class=\"elite-heading elite-heading--footer-title\" style=\"font-family:var(--text-title-6-font-family);font-size:var(--text-title-6-font-size);font-weight:var(--text-title-6-font-weight);line-height:var(--text-title-6-line-height);letter-spacing:var(--text-title-6-letter-spacing);text-transform:var(--text-title-6-text-transform)\">%s</h4>\n<!-- /wp:elite/heading -->\n\n",
		esc_html( $title )
	);
	echo "<!-- wp:list {\"className\":\"core-list\\u002d\\u002dfooter-links\"} -->\n<ul class=\"wp-block-list core-list--footer-links\">";
	foreach ( $links as $label ) {
		printf( "<!-- wp:list-item -->\n<li><a href=\"#\">%s</a></li>\n<!-- /wp:list-item -->\n\n", esc_html( $label ) );
	}
	echo "</ul>\n<!-- /wp:list --></div></div>\n<!-- /wp:elite/column -->\n\n";
};

/**
 * A social link: an icon-only Elite Button.
 *
 * @param string $icon  Icon slug (assets/icons).
 * @param string $label Accessible label.
 */
$wp_elite_social = static function ( string $icon, string $label ): void {
	echo '<!-- wp:elite/button ' . wp_json_encode( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Block attributes, JSON-encoded.
		array(
			'link'      => array( 'url' => '#' ),
			'iconStart' => $icon,
			'ariaLabel' => $label,
			'className' => 'elite-button--social',
		),
		JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP
	) . " /-->\n";
};
?>
<!-- wp:elite/section {"label":"Footer","className":"elite-section--footer"} -->
<section class="elite-section alignfull elite-section--footer"><div class="section-inner"><div class="container"><!-- wp:elite/row -->
<div class="elite-row row"><!-- wp:elite/column {"size":{"mobile":{"width":12},"laptop":{"width":4}},"className":"elite-column--footer-brand"} -->
<div class="elite-column col-12 col-lg-4 elite-column--footer-brand"><div class="column-inner"><!-- wp:site-logo {"width":132,"className":"site-footer__logo","eliteLogo":"secondary"} /-->

<?php $wp_elite_paragraph( esc_html__( 'Customer feedback analytics for teams that want to listen better. Signalry is a made-up product for a performance demo.', 'wp-elite' ), 'elite-paragraph--footer-about' ); ?>
<!-- wp:elite/div {"className":"elite-div--footer-social"} -->
<div class="elite-div elite-div--footer-social"><div class="div-inner">
<?php
$wp_elite_social( 'linkedin', __( 'LinkedIn', 'wp-elite' ) );
$wp_elite_social( 'x-twitter', __( 'X', 'wp-elite' ) );
$wp_elite_social( 'youtube', __( 'YouTube', 'wp-elite' ) );
?>
</div></div>
<!-- /wp:elite/div --></div></div>
<!-- /wp:elite/column -->

<!-- wp:elite/column {"size":{"mobile":{"width":12},"laptop":{"width":8}}} -->
<div class="elite-column col-12 col-lg-8"><div class="column-inner"><!-- wp:elite/row -->
<div class="elite-row row">
<?php
$wp_elite_column( __( 'Product', 'wp-elite' ), array( __( 'Feedback inbox', 'wp-elite' ), __( 'AI insights', 'wp-elite' ), __( 'Roadmaps', 'wp-elite' ), __( 'Integrations', 'wp-elite' ), __( 'Pricing', 'wp-elite' ) ) );
$wp_elite_column( __( 'Solutions', 'wp-elite' ), array( __( 'Product teams', 'wp-elite' ), __( 'Support teams', 'wp-elite' ), __( 'Marketing teams', 'wp-elite' ), __( 'Enterprise', 'wp-elite' ) ) );
$wp_elite_column( __( 'Resources', 'wp-elite' ), array( __( 'Blog', 'wp-elite' ), __( 'Guides', 'wp-elite' ), __( 'Help centre', 'wp-elite' ), __( 'API docs', 'wp-elite' ) ) );
$wp_elite_column( __( 'Company', 'wp-elite' ), array( __( 'About', 'wp-elite' ), __( 'Careers', 'wp-elite' ), __( 'Contact', 'wp-elite' ), __( 'Security', 'wp-elite' ) ) );
?>
</div>
<!-- /wp:elite/row --></div></div>
<!-- /wp:elite/column --></div>
<!-- /wp:elite/row -->

<!-- wp:elite/div {"className":"elite-div--footer-bottom"} -->
<div class="elite-div elite-div--footer-bottom"><div class="div-inner">
<?php
/* translators: %s: the current year. */
$wp_elite_paragraph( esc_html( sprintf( __( '© %s Signalry. A demo site.', 'wp-elite' ), gmdate( 'Y' ) ) ), 'elite-paragraph--footer-legal' );
$wp_elite_paragraph( '<a href="#">' . esc_html__( 'Privacy', 'wp-elite' ) . '</a> · <a href="#">' . esc_html__( 'Terms', 'wp-elite' ) . '</a>', 'elite-paragraph--footer-legal' );
?>
</div></div>
<!-- /wp:elite/div --></div></div></section>
<!-- /wp:elite/section -->
