<?php
/**
 * Saves the Elementor build (gen.mjs → build/*.json) into the Elementor site
 * the way the editor does: the Manrope custom font (same file as the Elite
 * build), the Kit's site settings, Theme Builder header and footer (shown
 * everywhere), single post (all posts) and archive (blog page and archives)
 * templates, the blog card loop item, and the Home, About, Pricing and
 * Contact pages (Elementor Full Width template). Round 2 runs on Elementor's
 * and Hello's default settings, plus font-display: swap. Then clears
 * Elementor's CSS so it regenerates.
 *
 * Run: wp eval-file /var/www/html/demo-content/elementor/apply.php
 *
 * @package SignalryDemo
 */

use Elementor\Plugin;

wp_set_current_user( 1 );

$signalry_dir   = __DIR__ . '/build';
$signalry_media = (array) get_option( 'signalry_media', array() );

/**
 * Replace "@id:slug", "@url:slug" and "@tpl:name" placeholders, and give
 * every element a fresh ID-safe structure.
 *
 * @param mixed                $data Elementor data.
 * @param array<string, int>   $tpl  Template IDs by name.
 * @return mixed
 */
function signalry_fill( $data, array $tpl ) {
	$signalry_media = (array) get_option( 'signalry_media', array() );
	if ( is_array( $data ) ) {
		foreach ( $data as $k => $v ) {
			$data[ $k ] = signalry_fill( $v, $tpl );
		}
		return $data;
	}
	if ( is_string( $data ) && str_contains( $data, '@cf7:' ) ) {
		$forms = (array) get_option( 'signalry_forms', array() );
		return preg_replace_callback( '/@cf7:(\w+)/', static fn ( array $m ): string => (string) ( $forms[ $m[1] ] ?? 0 ), $data );
	}
	if ( is_string( $data ) && preg_match( '/^@(id|url|tpl):(.+)$/', $data, $m ) ) {
		if ( 'tpl' === $m[1] ) {
			return (string) $tpl[ $m[2] ];
		}
		$id = (int) ( $signalry_media[ $m[2] ] ?? 0 );
		return 'id' === $m[1] ? $id : wp_get_attachment_url( $id );
	}
	return $data;
}

/**
 * Load one build file.
 *
 * @param string $name File name without .json.
 * @return array<mixed>
 */
function signalry_json( string $name ): array {
	return json_decode( (string) file_get_contents( __DIR__ . "/build/$name.json" ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions
}

/**
 * Save Elementor data on a post, as the editor does.
 *
 * @param int          $post_id Post ID.
 * @param array<mixed> $data    Elements.
 * @param string       $type    Document type (wp-page, header, footer, loop-item).
 */
function signalry_save( int $post_id, array $data, string $type ): void {
	update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
	update_post_meta( $post_id, '_elementor_template_type', $type );
	$document = Plugin::$instance->documents->get( $post_id, false );
	$document->save( array( 'elements' => $data ) );
}

/**
 * A Theme Builder / library template, created once and updated after.
 *
 * @param string $title Title.
 * @param string $type  Template type.
 * @return int
 */
function signalry_template( string $title, string $type ): int {
	$found = get_posts(
		array(
			'post_type'   => 'elementor_library',
			'title'       => $title,
			'post_status' => 'any',
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	$id = $found ? (int) $found[0] : (int) wp_insert_post(
		array(
			'post_title'  => $title,
			'post_type'   => 'elementor_library',
			'post_status' => 'publish',
		)
	);
	wp_set_object_terms( $id, $type, 'elementor_library_type' );
	return $id;
}

// 1. Custom font: the same Manrope variable woff2 as the Elite build,
// declared for the weights the design uses (one file, downloaded once).
$signalry_font_file = 'Manrope-VariableFont_wght.woff2';
$signalry_font_att  = (int) get_option( 'signalry_font_attachment' );
if ( ! $signalry_font_att || ! get_post( $signalry_font_att ) ) {
	$uploads = wp_upload_dir();
	$dest    = trailingslashit( $uploads['path'] ) . $signalry_font_file;
	copy( '/var/www/html/demo-media/fonts/' . $signalry_font_file, $dest );
	$signalry_font_att = (int) wp_insert_attachment(
		array(
			'post_title'     => 'Manrope',
			'post_mime_type' => 'font/woff2',
			'guid'           => trailingslashit( $uploads['url'] ) . $signalry_font_file,
		),
		$dest
	);
	update_option( 'signalry_font_attachment', $signalry_font_att );
}
$signalry_font_url = wp_get_attachment_url( $signalry_font_att );
$signalry_font     = get_posts(
	array(
		'post_type'   => 'elementor_font',
		'title'       => 'Manrope VF',
		'numberposts' => 1,
		'fields'      => 'ids',
	)
);
$signalry_font_id  = $signalry_font ? (int) $signalry_font[0] : (int) wp_insert_post(
	array(
		'post_title'  => 'Manrope VF',
		'post_type'   => 'elementor_font',
		'post_status' => 'publish',
	)
);
wp_set_object_terms( $signalry_font_id, 'custom', 'elementor_font_type' );
$signalry_faces = array();
foreach ( array( '400', '500', '600', '700', '800' ) as $weight ) {
	$signalry_faces[] = array(
		'font_weight' => $weight,
		'font_style'  => 'normal',
		'woff2'       => array(
			'id'  => $signalry_font_att,
			'url' => $signalry_font_url,
		),
	);
}
update_post_meta( $signalry_font_id, 'elementor_font_files', $signalry_faces );
$signalry_custom_fonts = new \ElementorPro\Modules\AssetsManager\AssetTypes\Fonts\Custom_Fonts();
update_post_meta( $signalry_font_id, 'elementor_font_face', $signalry_custom_fonts->generate_font_face( $signalry_font_id ) );
delete_option( 'elementor_fonts_manager_fonts' );
delete_option( 'elementor_fonts_manager_font_types' );

// 2. Kit (Site Settings).
Plugin::$instance->kits_manager->get_active_kit()->save( array( 'settings' => array_merge( (array) Plugin::$instance->kits_manager->get_active_kit()->get_settings(), signalry_json( 'kit' ) ) ) );

// 3. Theme Builder: loop item, header, footer, single post, archive.
$signalry_tpl = array(
	'loop'    => signalry_template( 'Blog card', 'loop-item' ),
	'header'  => signalry_template( 'Header', 'header' ),
	'footer'  => signalry_template( 'Footer', 'footer' ),
	'single'  => signalry_template( 'Single post', 'single-post' ),
	'archive' => signalry_template( 'Blog and archives', 'archive' ),
);
signalry_save( $signalry_tpl['loop'], signalry_fill( signalry_json( 'loop-item' ), $signalry_tpl ), 'loop-item' );
update_post_meta( $signalry_tpl['loop'], '_elementor_source', 'post' );
$signalry_conditions = array(
	'header'  => array( 'include/general' ),
	'footer'  => array( 'include/general' ),
	'single'  => array( 'include/singular/post' ),
	'archive' => array( 'include/archive' ),
);
foreach ( $signalry_conditions as $part => $conditions ) {
	$type = 'single' === $part ? 'single-post' : $part;
	signalry_save( $signalry_tpl[ $part ], signalry_fill( signalry_json( $part ), $signalry_tpl ), $type );
	update_post_meta( $signalry_tpl[ $part ], '_elementor_conditions', $conditions );
}
\ElementorPro\Modules\ThemeBuilder\Module::instance()->get_conditions_manager()->get_cache()->regenerate();

// 4. Pages: Elementor Full Width (the theme builder header and footer
// around Elementor content, no page title).
$signalry_pages = (array) get_option( 'signalry_pages', array() );
$signalry_saved = array();
foreach ( array( 'home' => (int) get_option( 'page_on_front' ), 'about' => (int) ( $signalry_pages['about'] ?? 0 ), 'pricing' => (int) ( $signalry_pages['pricing'] ?? 0 ), 'contact' => (int) ( $signalry_pages['contact'] ?? 0 ) ) as $name => $page_id ) {
	if ( ! $page_id ) {
		WP_CLI::warning( "No page for $name: run content/setup.php first." );
		continue;
	}
	update_post_meta( $page_id, '_wp_page_template', 'elementor_header_footer' );
	signalry_save( $page_id, signalry_fill( signalry_json( $name ), $signalry_tpl ), 'wp-page' );
	$signalry_saved[] = "$name $page_id";
}

// Round 2: Elementor's and Hello's defaults (round 1 printed the CSS in
// the page and turned Hello's CSS off), plus font-display: swap.
delete_option( 'elementor_css_print_method' );
delete_option( 'hello_elementor_settings_header_footer' );
delete_option( 'hello_elementor_settings_hello_theme' );
update_option( 'elementor_font_display', 'swap' );

// 5. Regenerate CSS (Elementor writes post CSS files on the next view).
Plugin::$instance->files_manager->clear_cache();

WP_CLI::success( sprintf( 'Saved pages: %s; templates %s; font %d', implode( ', ', $signalry_saved ), wp_json_encode( $signalry_tpl ), $signalry_font_id ) );
