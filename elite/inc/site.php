<?php
/**
 * This site's own settings for the base theme's features (the files they
 * change stay as in the base theme, so its fixes merge in).
 *
 * @package WpElite
 */

declare( strict_types = 1 );

namespace WpElite\Site;

/*
 * Speed (tested on a throttled phone over a slow line, Nov 2026):
 *
 * - (No font preload: now the base theme's default, inc/fonts.php.)
 * - All CSS printed in the page (inc/performance.php): no stylesheet
 *   requests before the first paint (about 0.2 s more on first visits). The
 *   cost: shared CSS isn't cached between pages, so every page carries it.
 */
add_filter( 'wp_elite_cached_styles', '__return_empty_array' );
add_filter( 'wp_elite_styles_inline_size_limit', static fn (): int => 150 * KB_IN_BYTES );

/*
 * Category and tag archives look like the blog page: the same intro and post
 * cards (pages/blog loads on the body class "blog"; templates/archive.html
 * has the blog page's layout with the archive's name as its title).
 */
add_filter(
	'body_class',
	static function ( array $classes ): array {
		if ( is_category() || is_tag() ) {
			$classes[] = 'blog';
		}
		return $classes;
	}
);
