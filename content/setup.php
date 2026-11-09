<?php
/**
 * Shared demo content for both builds (Elite Blocks and Elementor), so the
 * two sites differ only in how the home page is built.
 *
 * Run: wp eval-file /var/www/html/demo-content/setup.php
 * (the design folder is mapped at /var/www/html/demo-media).
 *
 * - Site title, tagline, permalinks.
 * - The same media files: images, logos, the video (option signalry_media:
 *   slug => attachment ID).
 * - Blog categories and six posts with featured images (the home page shows
 *   the latest three).
 *
 * Safe to run again: existing media and posts are kept.
 *
 * @package SignalryDemo
 */

require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

update_option( 'blogname', 'Signalry' );
update_option( 'blogdescription', 'Customer feedback analytics' );
update_option( 'permalink_structure', '/%postname%/' );
flush_rewrite_rules();

// Media: every file from the design folder, imported once.
$signalry_dir   = '/var/www/html/demo-media';
$signalry_files = array(
	'dashboard'           => array( 'images/dashboard.webp', 'The Signalry overview: feedback counts, NPS, sentiment over time and top themes' ),
	'tab-product'         => array( 'images/tab-product.webp', 'A table of the most requested features, with customer counts and revenue' ),
	'tab-support'         => array( 'images/tab-support.webp', 'Incoming tickets, each tagged with a theme and sentiment' ),
	'tab-marketing'       => array( 'images/tab-marketing.webp', 'NPS by customer segment, and promoter counts' ),
	'video-poster'        => array( 'images/video-poster.webp', '' ),
	'cover-1'             => array( 'images/cover-1.webp', '' ),
	'cover-2'             => array( 'images/cover-2.webp', '' ),
	'cover-3'             => array( 'images/cover-3.webp', '' ),
	'avatar-ma'           => array( 'images/avatar-ma.webp', '' ),
	'avatar-jk'           => array( 'images/avatar-jk.webp', '' ),
	'avatar-sr'           => array( 'images/avatar-sr.webp', '' ),
	'avatar-dl'           => array( 'images/avatar-dl.webp', '' ),
	'signalry-logo'       => array( 'images/signalry-logo.webp', 'Signalry' ),
	'signalry-logo-light' => array( 'images/signalry-logo-light.webp', 'Signalry' ),
	'signalry-tour'       => array( 'media/signalry-tour.mp4', '' ),
);
$signalry_media = (array) get_option( 'signalry_media', array() );
foreach ( $signalry_files as $slug => [ $file, $alt ] ) {
	if ( ! empty( $signalry_media[ $slug ] ) && get_post( $signalry_media[ $slug ] ) ) {
		continue;
	}
	$tmp = wp_tempnam( basename( $file ) );
	copy( "$signalry_dir/$file", $tmp );
	$id = media_handle_sideload(
		array(
			'name'     => basename( $file ),
			'tmp_name' => $tmp,
		),
		0
	);
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( "$file: " . $id->get_error_message() );
		continue;
	}
	if ( '' !== $alt ) {
		update_post_meta( $id, '_wp_attachment_image_alt', $alt );
	}
	$signalry_media[ $slug ] = $id;
	WP_CLI::log( "Imported $file as $id" );
}
update_option( 'signalry_media', $signalry_media );

// Logos: the site logo (dark) and Elite Blocks' secondary logo (light, the
// footer). The Elementor build reads the same IDs.
set_theme_mod( 'custom_logo', $signalry_media['signalry-logo'] );
update_option( 'site_logo', $signalry_media['signalry-logo'] );
update_option( 'elite_blocks_secondary_logo', $signalry_media['signalry-logo-light'] );

// Blog: categories and posts (newest first on the home page).
$signalry_cats = array();
foreach ( array( 'Guides', 'Research', 'Product' ) as $name ) {
	$term                   = term_exists( $name, 'category' ) ?: wp_insert_term( $name, 'category' );
	$signalry_cats[ $name ] = (int) $term['term_id'];
}

$signalry_body = static fn ( string $lead ): string => implode(
	"\n\n",
	array(
		"<!-- wp:paragraph -->\n<p>$lead</p>\n<!-- /wp:paragraph -->",
		"<!-- wp:paragraph -->\n<p>Feedback arrives everywhere: support tickets, survey comments, app reviews, sales calls. Each team sees its own slice, and the patterns that matter most sit between them.</p>\n<!-- /wp:paragraph -->",
		"<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Start with one question</h2>\n<!-- /wp:heading -->",
		"<!-- wp:paragraph -->\n<p>Pick the decision you need to make this month, then look only at the feedback that informs it. A short list of themes beats a long dashboard nobody opens.</p>\n<!-- /wp:paragraph -->",
		"<!-- wp:paragraph -->\n<p>Signalry is a made-up product for a performance demo; this post is sample content.</p>\n<!-- /wp:paragraph -->",
	)
);

$signalry_posts = array(
	array( 'Introducing weekly AI summaries', 'Every Monday, a short read on what changed, what’s new and what needs attention.', 'Product', '2026-09-30 09:00:00', 'cover-3' ),
	array( 'What 18 million pieces of feedback taught us about churn', 'The early warning signs customers give before they leave, and where to find them.', 'Research', '2026-10-14 09:00:00', 'cover-2' ),
	array( 'How to run a feedback review your whole team will join', 'A 30-minute weekly ritual that keeps product, support and marketing on the same page.', 'Guides', '2026-10-28 09:00:00', 'cover-1' ),
	array( 'Tagging tickets without a taxonomy meeting', 'Let themes emerge from what customers actually say, then name them.', 'Guides', '2026-08-19 09:00:00', 'cover-1' ),
	array( 'NPS is a number; the comments are the point', 'Why the reason behind a score tells you more than the score itself.', 'Research', '2026-07-22 09:00:00', 'cover-2' ),
	array( 'Roadmaps linked to revenue', 'How product teams use customer counts and ARR to settle priority debates.', 'Product', '2026-06-10 09:00:00', 'cover-3' ),
);
foreach ( $signalry_posts as [ $title, $excerpt, $cat, $date, $cover ] ) {
	if ( get_posts( array( 'title' => $title, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids' ) ) ) {
		continue;
	}
	$id = wp_insert_post(
		array(
			'post_title'    => $title,
			'post_excerpt'  => $excerpt,
			'post_content'  => $signalry_body( $excerpt ),
			'post_status'   => 'publish',
			'post_date'     => $date,
			'post_category' => array( $signalry_cats[ $cat ] ),
		)
	);
	set_post_thumbnail( $id, $signalry_media[ $cover ] );
	WP_CLI::log( "Post $id: $title" );
}

// The default "Hello world!" post and sample page aren't part of the demo.
foreach ( array( 'hello-world' => 'post', 'sample-page' => 'page' ) as $name => $type ) {
	$old = get_page_by_path( $name, OBJECT, $type );
	if ( $old ) {
		wp_delete_post( $old->ID, true );
	}
}

// The home page (its content is each build's own).
$signalry_home = get_page_by_path( 'home' );
if ( ! $signalry_home ) {
	$signalry_home = get_post(
		wp_insert_post(
			array(
				'post_title'  => 'Home',
				'post_name'   => 'home',
				'post_type'   => 'page',
				'post_status' => 'publish',
			)
		)
	);
}
update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $signalry_home->ID );
WP_CLI::success( 'Demo content ready. Home page: ' . $signalry_home->ID );
