<?php
/**
 * Fonts: no font preloaded by default; when a site opts in, theme.json's
 * basic Latin file only (inc/fonts.php). Manrope in two files (Latin, Latin
 * Extended) and a size-matched fallback second in the Body family. Run by
 * run.php.
 *
 * @package WpElite
 */

use function WpElite\preload_fonts;

$wp_elite_check( 'No font preloaded by default', array(), preload_fonts() );
$wp_elite_check(
	'The font files are in the theme (Latin, Latin Extended)',
	array( true, true ),
	array(
		is_readable( get_theme_file_path( 'assets/fonts/manrope/Manrope-Latin-VariableFont_wght.woff2' ) ),
		is_readable( get_theme_file_path( 'assets/fonts/manrope/Manrope-LatinExt-VariableFont_wght.woff2' ) ),
	)
);
$wp_elite_body = current( array_filter( (array) wp_get_global_settings( array( 'typography', 'fontFamilies', 'theme' ) ), static fn ( $f ): bool => 'body' === ( $f['slug'] ?? '' ) ) );
$wp_elite_check( 'Body family: Manrope, then the size-matched fallback', 'Manrope, "Manrope Fallback"', implode( ', ', array_slice( array_map( 'trim', explode( ',', (string) ( $wp_elite_body['fontFamily'] ?? '' ) ) ), 0, 2 ) ) );

$wp_elite_body_preload = static fn (): array => array( 'body' );
add_filter( 'wp_elite_preload_fonts', $wp_elite_body_preload );
$wp_elite_check(
	'wp_elite_preload_fonts can preload the body font: its Latin file only',
	array( get_theme_file_uri( 'assets/fonts/manrope/Manrope-Latin-VariableFont_wght.woff2' ) ),
	preload_fonts()
);
remove_filter( 'wp_elite_preload_fonts', $wp_elite_body_preload );
