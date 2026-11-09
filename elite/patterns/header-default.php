<?php
/**
 * Title: Header
 * Slug: wp-elite/header-default
 * Categories: header
 * Block Types: core/template-part/header
 * Description: An Elite Section (elite-section--header) with an Elite Div bar: logo, the menu (Product and Solutions dropdowns, then links), "Sign in" and "Start free" (Elite Buttons); the header template part's content. Below the laptop width the menu opens from a button, with the logo at its top and the two buttons under the links.
 *
 * @package WpElite
 */

/**
 * A menu link block.
 *
 * @param string $label       Link text.
 * @param string $url         Link URL.
 * @param string $description Optional line under the label (dropdowns).
 */
$wp_elite_link = static function ( string $label, string $url, string $description = '' ): void {
	$attributes = array(
		'label' => $label,
		'url'   => $url,
		'kind'  => 'custom',
	);
	if ( '' !== $description ) {
		$attributes['description'] = $description;
	}
	printf(
		'<!-- wp:navigation-link %s /-->' . "\n",
		wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP )
	);
};

/**
 * An Elite Button block.
 *
 * @param array<string, mixed> $attributes Button attributes.
 */
$wp_elite_button = static function ( array $attributes ): void {
	echo '<!-- wp:elite/button ' . wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP ) . ' /-->' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Block attributes, JSON-encoded.
};
?>
<!-- wp:elite/section {"label":"Header","className":"elite-section\u002d\u002dheader"} -->
<section class="elite-section alignfull elite-section--header"><div class="section-inner"><div class="container"><!-- wp:elite/div {"className":"elite-div\u002d\u002dheader-bar"} -->
<div class="elite-div elite-div--header-bar"><div class="div-inner"><!-- wp:site-logo {"width":132,"className":"site-header__logo"} /-->

<!-- wp:navigation {"overlayMenu":"mobile","overlayBackgroundColor":"base","overlayTextColor":"contrast","className":"site-header__nav","layout":{"type":"flex","justifyContent":"left"}} -->
<!-- wp:site-logo {"width":132,"className":"site-header__menu-logo"} /-->

<!-- wp:navigation-submenu {"label":"<?php esc_attr_e( 'Product', 'wp-elite' ); ?>","url":"#","kind":"custom"} -->
<?php
$wp_elite_link( __( 'Feedback inbox', 'wp-elite' ), '#', __( 'Every ticket, survey and review in one place', 'wp-elite' ) );
$wp_elite_link( __( 'AI insights', 'wp-elite' ), '#', __( 'Themes and weekly summaries, found for you', 'wp-elite' ) );
$wp_elite_link( __( 'Roadmaps', 'wp-elite' ), '#', __( 'Link requests to revenue and ship what matters', 'wp-elite' ) );
$wp_elite_link( __( 'Integrations', 'wp-elite' ), '#', __( 'Help desk, chat, CRM, reviews and more', 'wp-elite' ) );
?>
<!-- /wp:navigation-submenu -->

<!-- wp:navigation-submenu {"label":"<?php esc_attr_e( 'Solutions', 'wp-elite' ); ?>","url":"#tabs","kind":"custom"} -->
<?php
$wp_elite_link( __( 'Product teams', 'wp-elite' ), home_url( '/#tabs' ), __( 'Decide what to build next', 'wp-elite' ) );
$wp_elite_link( __( 'Support teams', 'wp-elite' ), home_url( '/#tabs' ), __( 'Tag and route tickets automatically', 'wp-elite' ) );
$wp_elite_link( __( 'Marketing teams', 'wp-elite' ), home_url( '/#tabs' ), __( 'Find promoters and real quotes', 'wp-elite' ) );
?>
<!-- /wp:navigation-submenu -->

<?php
$wp_elite_link( __( 'Pricing', 'wp-elite' ), '#' );
$wp_elite_link( __( 'Blog', 'wp-elite' ), home_url( '/#blog' ) );
$wp_elite_link( __( 'Customers', 'wp-elite' ), home_url( '/#customers' ) );
?>

<!-- wp:buttons {"className":"site-header__menu-cta","layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-buttons site-header__menu-cta"><!-- wp:button {"className":"core-button--secondary"} -->
<div class="wp-block-button core-button--secondary"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Sign in', 'wp-elite' ); ?></a></div>
<!-- /wp:button -->

<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Start free trial', 'wp-elite' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->
<!-- /wp:navigation -->

<!-- wp:elite/div {"className":"elite-div\u002d\u002dheader-actions"} -->
<div class="elite-div elite-div--header-actions"><div class="div-inner">
<?php
$wp_elite_button(
	array(
		'text'      => __( 'Sign in', 'wp-elite' ),
		'link'      => array( 'url' => '#' ),
		'className' => 'elite-button--nav',
	)
);
$wp_elite_button(
	array(
		'text'      => __( 'Start free', 'wp-elite' ),
		'link'      => array( 'url' => '#' ),
		'className' => 'elite-button--primary elite-button--small',
	)
);
?>
</div></div>
<!-- /wp:elite/div --></div></div>
<!-- /wp:elite/div --></div></div></section>
<!-- /wp:elite/section -->
