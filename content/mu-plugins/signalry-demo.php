<?php
/**
 * Plugin Name: Signalry demo (shared)
 * Description: The same small site settings on both speed-test builds (Elite Blocks and Elementor). Must-use plugin.
 *
 * - The demo author's avatar is a local image (the media library's
 *   avatar-sr), not Gravatar: no third-party request on post pages, the same
 *   on both builds.
 * - Contact Form 7 prints the forms' markup as written (no automatic <p> and
 *   <br>), so the two-field rows are real grid rows on both builds.
 *
 * @package SignalryDemo
 */

declare( strict_types = 1 );

add_filter( 'wpcf7_autop_or_not', '__return_false' );

add_filter(
	'pre_get_avatar_data',
	static function ( array $args, $id_or_email ): array {
		$user = $id_or_email instanceof WP_User ? $id_or_email : null;
		if ( ! $user && is_numeric( $id_or_email ) ) {
			$user = get_user_by( 'id', (int) $id_or_email );
		}
		if ( ! $user && $id_or_email instanceof WP_Post ) {
			$user = get_user_by( 'id', (int) $id_or_email->post_author );
		}
		if ( ! $user && $id_or_email instanceof WP_Comment ) {
			$user = get_user_by( 'id', (int) $id_or_email->user_id );
		}
		$media = (array) get_option( 'signalry_media', array() );
		if ( $user && 'sara' === $user->user_login && ! empty( $media['avatar-sr'] ) ) {
			$args['url']          = wp_get_attachment_image_url( (int) $media['avatar-sr'], 'thumbnail' );
			$args['found_avatar'] = true;
		}
		return $args;
	},
	10,
	2
);
