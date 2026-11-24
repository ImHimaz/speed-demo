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
	// Round 2 ("a real project").
	'insights'            => array( 'images/insights.webp', 'Signalry’s insights view: themes ranked by how often they come up' ),
	'map'                 => array( 'images/map.svg', 'Map showing our office on Market Street, San Francisco' ),
	'logo-northwind'      => array( 'images/logos/northwind.svg', 'Northwind' ),
	'logo-brightside'     => array( 'images/logos/brightside.svg', 'Brightside' ),
	'logo-fieldnote'      => array( 'images/logos/fieldnote.svg', 'Fieldnote' ),
	'logo-orbitly'        => array( 'images/logos/orbitly.svg', 'Orbitly' ),
	'logo-lumen'          => array( 'images/logos/lumen.svg', 'Lumen' ),
	'logo-kitepay'        => array( 'images/logos/kitepay.svg', 'Kitepay' ),
	'logo-harbor'         => array( 'images/logos/harbor.svg', 'Harbor' ),
	'logo-quanta'         => array( 'images/logos/quanta.svg', 'Quanta' ),
);
// SVG logos and the map: allowed for this import only (both builds).
add_filter( 'upload_mimes', static fn ( array $mimes ): array => $mimes + array( 'svg' => 'image/svg+xml' ) );
add_filter(
	'wp_check_filetype_and_ext',
	static fn ( array $data, string $file, string $filename ): array => str_ends_with( $filename, '.svg' )
		? array(
			'ext'             => 'svg',
			'type'            => 'image/svg+xml',
			'proper_filename' => false,
		)
		: $data,
	10,
	3
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

// SVGs get no size metadata on upload, and some widgets (Elementor's Image
// Carousel) find no image without it: record width and height from the file,
// as SVG plugins do.
foreach ( $signalry_media as $slug => $id ) {
	$file = (string) get_attached_file( $id );
	if ( ! str_ends_with( $file, '.svg' ) || ! empty( wp_get_attachment_metadata( $id )['width'] ) ) {
		continue;
	}
	$svg = simplexml_load_file( $file );
	if ( $svg ) {
		wp_update_attachment_metadata(
			$id,
			array(
				'width'  => (int) $svg['width'],
				'height' => (int) $svg['height'],
				'file'   => _wp_relative_upload_path( $file ),
				'sizes'  => array(),
			)
		);
	}
}

// Logos: the site logo (dark) and Elite Blocks' secondary logo (light, the
// footer). The Elementor build reads the same IDs.
set_theme_mod( 'custom_logo', $signalry_media['signalry-logo'] );
update_option( 'site_logo', $signalry_media['signalry-logo'] );
update_option( 'elite_blocks_secondary_logo', $signalry_media['signalry-logo-light'] );

// The author of every post (her avatar is a local image: mu-plugins/signalry-demo.php).
$signalry_author = get_user_by( 'login', 'sara' );
if ( ! $signalry_author ) {
	$signalry_author = get_user_by(
		'id',
		wp_insert_user(
			array(
				'user_login'   => 'sara',
				'user_email'   => 'sara@signalry.example',
				'user_pass'    => wp_generate_password( 32 ),
				'display_name' => 'Sara Rahman',
				'first_name'   => 'Sara',
				'last_name'    => 'Rahman',
				'role'         => 'author',
			)
		)
	);
}
update_user_meta( $signalry_author->ID, 'description', 'VP Customer Success at Signalry. Sara has run feedback programmes at three SaaS companies and still reads every NPS comment.' );

// Blog: categories and 25 posts (newest first; the blog page shows 9 a page).
$signalry_cats = array();
foreach ( array( 'Guides', 'Research', 'Product', 'Customer stories' ) as $name ) {
	$term                   = term_exists( $name, 'category' ) ?: wp_insert_term( $name, 'category' );
	$signalry_cats[ $name ] = (int) $term['term_id'];
}

$signalry_p  = static fn ( string $html ): string => "<!-- wp:paragraph -->\n<p>$html</p>\n<!-- /wp:paragraph -->";
$signalry_h2 = static fn ( string $text ): string => "<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">$text</h2>\n<!-- /wp:heading -->";
$signalry_ul = static fn ( array $items, bool $ordered = false ): string => sprintf(
	"<!-- wp:list%1\$s -->\n<%2\$s class=\"wp-block-list\">%3\$s</%2\$s>\n<!-- /wp:list -->",
	$ordered ? ' {"ordered":true}' : '',
	$ordered ? 'ol' : 'ul',
	implode( '', array_map( static fn ( string $i ): string => "<!-- wp:list-item -->\n<li>$i</li>\n<!-- /wp:list-item -->", $items ) )
);

// A typical post: about 450 words, two headings, a list.
$signalry_body = static fn ( string $lead ): string => implode(
	"\n\n",
	array(
		$signalry_p( $lead ),
		$signalry_p( 'Feedback arrives everywhere: support tickets, survey comments, app reviews, sales calls. Each team sees its own slice, and the patterns that matter most sit between them. The result is familiar: everyone agrees customers matter, and nobody can say which three problems to fix this quarter.' ),
		$signalry_h2( 'Start with one question' ),
		$signalry_p( 'Pick the decision you need to make this month, then look only at the feedback that informs it. A short list of themes beats a long dashboard nobody opens. If the question is “why do trials stall?”, read trial-stage tickets and onboarding surveys, not everything since 2019.' ),
		$signalry_ul( array( 'Write the decision down before you open any data', 'Limit sources to the ones that speak to it', 'Set a date to decide, and keep it' ) ),
		$signalry_p( 'This sounds obvious, but most feedback programmes start from the data and hope a decision appears. It rarely does. Starting from the decision keeps the work small enough to finish.' ),
		$signalry_h2( 'Count, then read' ),
		$signalry_p( 'Numbers tell you where to look; words tell you what to do. Group feedback into themes, count how many customers mention each one and what they are worth, then read twenty comments from the top theme in full. You will learn more in that half hour than in a month of charts.' ),
		$signalry_p( 'Finally, close the loop. Tell the customers who raised an issue when it is fixed. It takes minutes, and it is the single best way to get more, and better, feedback next time.' ),
		$signalry_p( '<em>Signalry is a made-up product for a performance demo; this post is sample content.</em>' ),
	)
);

// The featured guide (the design's blog post), in full.
$signalry_guide = implode(
	"\n\n",
	array(
		$signalry_p( 'Most teams agree that customer feedback matters. Far fewer have a habit that turns it into decisions. The fix isn’t another dashboard: it’s a 30-minute meeting, once a week, that product, support and marketing actually want to attend.' ),
		$signalry_p( 'Here’s the format we use at Signalry, and the one our customers copy most often.' ),
		$signalry_h2( '1. Start with what changed, not everything' ),
		$signalry_p( 'Nobody wants to scroll through 400 tickets. Open with the three themes that grew most since last week, and one that shrank. Change is what makes people lean in.' ),
		$signalry_ul( array( 'Top three growing themes, with counts', 'One theme that went down, and why', 'One quote that says it better than a chart' ) ),
		$signalry_h2( '2. Put a number on every theme' ),
		$signalry_p( '“Customers are confused by billing” starts a debate. “42 customers, $310k in ARR, mentioned billing this month” starts a plan. Attach customer counts and revenue to every theme you discuss.' ),
		"<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><!-- wp:paragraph -->\n<p>The meeting got shorter the day we started showing revenue next to each theme. Nobody argues with the number.</p>\n<!-- /wp:paragraph --></blockquote>\n<!-- /wp:quote -->",
		'%INSIGHTS%',
		$signalry_h2( '3. Leave with owners, not opinions' ),
		$signalry_p( 'End with a short list: each item gets an owner and a date. Product takes the roadmap items, support takes the help articles and macros, marketing takes the quotes worth sharing.' ),
		$signalry_ul( array( 'Decide: fix, build, explain or ignore', 'Assign one owner per item', 'Check last week’s items first next time' ), true ),
		$signalry_h2( '4. Close the loop with customers' ),
		$signalry_p( 'When something ships, tell the customers who asked for it. It takes minutes with a saved list, and it’s the single best way to get more feedback next time.' ),
		$signalry_p( 'Try it for four weeks. If the meeting isn’t worth the time by then, change the format. In our experience, it will be.' ),
	)
);
$signalry_insights = $signalry_media['insights'];
$signalry_guide    = str_replace(
	'%INSIGHTS%',
	sprintf(
		"<!-- wp:image {\"id\":%1\$d,\"sizeSlug\":\"large\",\"linkDestination\":\"none\"} -->\n<figure class=\"wp-block-image size-large\"><img src=\"%2\$s\" alt=\"Signalry’s insights view: themes ranked by mentions and revenue\" class=\"wp-image-%1\$d\"/><figcaption class=\"wp-element-caption\">Themes ranked by mentions, with the revenue behind each one.</figcaption></figure>\n<!-- /wp:image -->",
		$signalry_insights,
		esc_url( (string) wp_get_attachment_image_url( $signalry_insights, 'large' ) )
	),
	$signalry_guide
);

$signalry_posts = array(
	array( 'How to run a feedback review your whole team will join', 'A 30-minute weekly ritual that keeps product, support and marketing on the same page.', 'Guides', '2026-10-28 09:00:00', 'cover-1' ),
	array( 'What 18 million pieces of feedback taught us about churn', 'The early warning signs customers give before they leave, and where to find them.', 'Research', '2026-10-14 09:00:00', 'cover-2' ),
	array( 'How Northwind cut churn by a third in one quarter', 'A product team, a weekly summary and the onboarding bug nobody had counted.', 'Customer stories', '2026-10-07 09:00:00', 'cover-3' ),
	array( 'Introducing weekly AI summaries', 'Every Monday, a short read on what changed, what’s new and what needs attention.', 'Product', '2026-09-30 09:00:00', 'cover-3' ),
	array( 'Five survey questions that actually predict churn', 'Short, specific questions that tell you who is about to leave, and why.', 'Guides', '2026-09-16 09:00:00', 'cover-1' ),
	array( 'Why support teams should own the voice of the customer', 'They hear it first, every day. Here is how to make that count across the company.', 'Research', '2026-09-02 09:00:00', 'cover-2' ),
	array( 'Spike alerts: hear about problems before your customers tweet', 'Get a Slack message the hour a theme starts growing, not the week after.', 'Product', '2026-08-26 09:00:00', 'cover-3' ),
	array( 'Tagging tickets without a taxonomy meeting', 'Let themes emerge from what customers actually say, then name them.', 'Guides', '2026-08-19 09:00:00', 'cover-1' ),
	array( 'Brightside Health got four hours back every week', 'How a support team of six stopped tagging tickets by hand.', 'Customer stories', '2026-08-05 09:00:00', 'cover-2' ),
	array( 'NPS is a number; the comments are the point', 'Why the reason behind a score tells you more than the score itself.', 'Research', '2026-07-22 09:00:00', 'cover-2' ),
	array( 'Connecting your help desk in ten minutes', 'A step-by-step guide to your first source, from sign-in to first theme.', 'Guides', '2026-07-08 09:00:00', 'cover-1' ),
	array( 'Roadmaps linked to revenue', 'How product teams use customer counts and ARR to settle priority debates.', 'Product', '2026-06-10 09:00:00', 'cover-3' ),
	array( 'The quiet customers: reading app reviews at scale', 'Most unhappy customers never open a ticket. They leave a two-star review instead.', 'Research', '2026-05-27 09:00:00', 'cover-2' ),
	array( 'Fieldnote found its biggest churn reason in a week', 'It was hiding in app reviews nobody read. Here is what they changed.', 'Customer stories', '2026-05-13 09:00:00', 'cover-1' ),
	array( 'Writing a feedback summary people actually read', 'Five lines, three numbers, one quote. A template for your Monday email.', 'Guides', '2026-04-29 09:00:00', 'cover-3' ),
	array( 'Sentiment is not a score', 'Why a “negative” ticket can be your most useful one, and how we model it.', 'Research', '2026-04-15 09:00:00', 'cover-2' ),
	array( 'New: Slack and Teams digests', 'Your weekly summary, where your team already talks.', 'Product', '2026-04-01 09:00:00', 'cover-3' ),
	array( 'Feedback for B2B: weighing customers by revenue', 'Not every request counts the same. How to be fair and still listen to everyone.', 'Guides', '2026-03-18 09:00:00', 'cover-1' ),
	array( 'Orbitly’s roadmap meeting now takes 20 minutes', 'Real numbers in the room ended the loudest-voice debates.', 'Customer stories', '2026-03-04 09:00:00', 'cover-2' ),
	array( 'What we learned reading 50,000 cancellation reasons', 'Price is rarely the real reason. Here is what usually is.', 'Research', '2026-02-18 09:00:00', 'cover-2' ),
	array( 'Themes you can edit: teaching the AI your words', 'Rename, merge and split themes, and Signalry learns from every change.', 'Product', '2026-02-04 09:00:00', 'cover-3' ),
	array( 'A feedback programme for a team of one', 'No analyst, no budget, one hour a week. Where to start.', 'Guides', '2026-01-21 09:00:00', 'cover-1' ),
	array( 'The cost of ignoring a feature request', 'We followed 300 requests for a year. The ones we ignored cost the most.', 'Research', '2026-01-07 09:00:00', 'cover-2' ),
	array( 'Signalry 2025: the year in feedback', 'What our customers asked for most, and what we shipped in return.', 'Product', '2025-12-17 09:00:00', 'cover-3' ),
	array( 'Kitepay’s support team now ships product fixes', 'Hand-offs to product in one click turned tickets into a real backlog.', 'Customer stories', '2025-12-03 09:00:00', 'cover-1' ),
);
foreach ( $signalry_posts as [ $title, $excerpt, $cat, $date, $cover ] ) {
	$content = 'How to run a feedback review your whole team will join' === $title ? $signalry_guide : $signalry_body( $excerpt );
	$found   = get_posts(
		array(
			'title'       => $title,
			'post_status' => 'any',
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	$post    = array(
		'post_title'    => $title,
		'post_excerpt'  => $excerpt,
		'post_content'  => $content,
		'post_status'   => 'publish',
		'post_date'     => $date,
		'post_author'   => $signalry_author->ID,
		'post_category' => array( $signalry_cats[ $cat ] ),
	);
	if ( $found ) {
		$post['ID'] = $found[0];
		$id         = wp_update_post( $post );
	} else {
		$id = wp_insert_post( $post );
		WP_CLI::log( "Post $id: $title" );
	}
	set_post_thumbnail( $id, $signalry_media[ $cover ] );
	// Yoast SEO: the meta description (a real site fills these in).
	update_post_meta( $id, '_yoast_wpseo_metadesc', $excerpt );
}

// Pages: each build writes their content; Blog is the posts page.
$signalry_pages = array();
foreach ( array( 'about' => 'About', 'pricing' => 'Pricing', 'contact' => 'Contact', 'blog' => 'Blog' ) as $slug => $title ) {
	$page = get_page_by_path( $slug );
	if ( ! $page ) {
		$page = get_post(
			wp_insert_post(
				array(
					'post_title'  => $title,
					'post_name'   => $slug,
					'post_type'   => 'page',
					'post_status' => 'publish',
				)
			)
		);
	}
	$signalry_pages[ $slug ] = $page->ID;
}
update_option( 'page_for_posts', $signalry_pages['blog'] );

// Yoast SEO meta descriptions for the pages (the home page set below).
$signalry_descriptions = array(
	'about'   => 'Signalry helps companies hear every customer: the story, the numbers and the team behind customer feedback analytics.',
	'pricing' => 'Simple Signalry pricing: pay for the feedback you analyse, never for seats. Every plan has a 14-day free trial, no card needed.',
	'contact' => 'Talk to the Signalry team about plans, security or a demo. We reply within one working day.',
	'blog'    => 'Guides, research and product news on turning customer feedback into decisions, from the Signalry team.',
);
foreach ( $signalry_descriptions as $slug => $description ) {
	update_post_meta( $signalry_pages[ $slug ], '_yoast_wpseo_metadesc', $description );
}
update_option( 'posts_per_page', 9 );
update_option( 'signalry_pages', $signalry_pages );

// Contact Form 7: the same two forms on both builds (demo mode: nothing is
// emailed; the form answers as if it was).
if ( class_exists( 'WPCF7_ContactForm' ) ) {
	$signalry_consent = '<div class="form__consent">[acceptance consent] I agree to Signalry contacting me about this request. See our privacy policy. [/acceptance]</div>';
	$signalry_forms   = (array) get_option( 'signalry_forms', array() );
	$signalry_defs    = array(
		'demo'    => array(
			'Book a demo',
			"<div class=\"form__row\">\n<label>Full name [text* your-name autocomplete:name]</label>\n<label>Work email [email* your-email autocomplete:email]</label>\n</div>\n<div class=\"form__row\">\n<label>Company [text company autocomplete:organization]</label>\n<label>Team size [select team-size \"1–10\" \"11–50\" \"51–200\" \"201+\"]</label>\n</div>\n$signalry_consent\n[submit \"Book my demo\"]",
		),
		'contact' => array(
			'Contact us',
			"<div class=\"form__row\">\n<label>Full name * [text* your-name autocomplete:name]</label>\n<label>Work email * [email* your-email autocomplete:email]</label>\n</div>\n<div class=\"form__row\">\n<label>Company [text company autocomplete:organization]</label>\n<label>What’s it about? * [select* topic \"A demo\" \"Pricing and plans\" \"Security and compliance\" \"Support for my account\" \"Something else\"]</label>\n</div>\n<label>Message * [textarea* your-message]</label>\n$signalry_consent\n[submit \"Send message\"]",
		),
	);
	foreach ( $signalry_defs as $key => [ $title, $form ] ) {
		$cf = ! empty( $signalry_forms[ $key ] ) ? WPCF7_ContactForm::get_instance( $signalry_forms[ $key ] ) : null;
		if ( ! $cf ) {
			$cf = WPCF7_ContactForm::get_template( array( 'title' => $title ) );
		}
		$cf->set_title( $title );
		$cf->set_properties(
			array(
				'form'                => $form,
				'additional_settings' => 'demo_mode: on',
			)
		);
		$cf->save();
		$signalry_forms[ $key ] = $cf->id();
	}
	update_option( 'signalry_forms', $signalry_forms );
	WP_CLI::log( 'Forms: ' . wp_json_encode( $signalry_forms ) );

	// The sample form Contact Form 7 makes on activation isn't used.
	foreach ( get_posts( array( 'post_type' => 'wpcf7_contact_form', 'title' => 'Contact form 1', 'numberposts' => -1, 'fields' => 'ids' ) ) as $sample ) {
		wp_delete_post( $sample, true );
	}
}

// Google Tag Manager (GTM4WP): the same container on both builds (it holds
// the GA4 tag, G-3Q1PMWLJE0). Plugin defaults otherwise: code in the head,
// the noscript frame in the footer.
if ( defined( 'GTM4WP_OPTIONS' ) && defined( 'GTM4WP_OPTION_GTM_CODE' ) ) {
	$signalry_gtm                           = (array) get_option( GTM4WP_OPTIONS, array() );
	$signalry_gtm[ GTM4WP_OPTION_GTM_CODE ] = 'GTM-TLMPX83X';
	update_option( GTM4WP_OPTIONS, $signalry_gtm );
}

// New pages and the posts page: rebuild the permalinks (init first: the
// structure was set in this same run).
$GLOBALS['wp_rewrite']->init();
flush_rewrite_rules();

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
update_post_meta( $signalry_home->ID, '_yoast_wpseo_metadesc', 'Signalry gathers feedback from tickets, surveys, reviews and calls, then shows your team which problems matter most. Free for 14 days.' );
WP_CLI::success( 'Demo content ready. Home page: ' . $signalry_home->ID );
