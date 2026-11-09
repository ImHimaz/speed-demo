<?php
/**
 * Title: Header menu
 * Slug: wp-elite/header-menu
 * Inserter: no
 * Description: The header's menu: Max Mega Menu (location "Header menu") when it's active, else WordPress's Navigation block.
 *
 * @package WpElite
 */

declare( strict_types = 1 );

if ( \WpElite\MegaMenu\active() ) : ?>
<!-- wp:maxmegamenu/location {"location":"primary"} /-->
<?php else : ?>
<!-- wp:navigation {"layout":{"type":"flex","justifyContent":"right"}} /-->
<?php endif; ?>
