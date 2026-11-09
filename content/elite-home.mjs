/**
 * Builds the Signalry home page with Elite Blocks, in the real editor:
 * blocks are created with WordPress's own createBlock (so their saved markup
 * is exactly what the editor writes), then the page is saved.
 *
 * Run: node elite-home.mjs   (site at http://localhost:8894, wp-env login)
 */
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';

const SITE = 'http://localhost:8894';
const PAGE_ID = 26;

const browser = await chromium.launch();
const page = await browser.newPage( { viewport: { width: 1440, height: 900 } } );
page.on( 'pageerror', ( e ) => console.log( 'pageerror', e.message ) );

await page.goto( `${ SITE }/wp-login.php` );
await page.fill( '#user_login', 'admin' );
await page.fill( '#user_pass', 'password' );
await page.click( '#wp-submit' );
await page.waitForURL( /wp-admin/ );

await page.goto( `${ SITE }/wp-admin/post.php?post=${ PAGE_ID }&action=edit` );
await page.waitForFunction( () => window.wp?.blocks?.getBlockType?.( 'elite/section' ) && window.wp.data.select( 'core/editor' ).getCurrentPostId() );
// Close the welcome guide if it shows.
await page.evaluate( () => window.wp.data.dispatch( 'core/preferences' )?.set( 'core/edit-post', 'welcomeGuide', false ) );

const media = await page.evaluate( async () => {
	const res = await window.wp.apiFetch( { path: '/wp/v2/media?per_page=50&_fields=id,source_url,media_details' } );
	return Object.fromEntries( res.map( ( m ) => [ m.source_url.split( '/' ).pop().replace( /(-\d+)?\.(webp|mp4)$/, '' ), { id: m.id, url: m.source_url } ] ) );
} );

const html = await page.evaluate( ( M ) => {
	const { createBlock: B, serialize } = window.wp.blocks;
	const H = ( content, level, textStyle, className ) => B( 'elite/heading', { content, level, textStyle, className } );
	const P = ( content, className, textStyle ) => B( 'elite/paragraph', { content, className, textStyle } );
	const Btn = ( text, url, className, extra = {} ) => B( 'elite/button', { text, link: { url }, className, ...extra } );
	const Div = ( className, inner, extra = {} ) => B( 'elite/div', { className, ...extra }, inner );
	const Section = ( className, label, anchor, inner ) => B( 'elite/section', { className, label, anchor }, inner );
	const Row = ( attrs, cols ) => B( 'elite/row', attrs, cols );
	const Col = ( size, inner, className ) => B( 'elite/column', { size, className }, inner );
	const Img = ( m, extra = {} ) => B( 'elite/image', { images: { desktop: { id: m.id, url: m.url } }, ...extra } );
	const Checks = ( items ) => B( 'core/list', { className: 'core-list--checks' }, items.map( ( content ) => B( 'core/list-item', { content } ) ) );
	const full = { mobile: { width: 12 } };

	// Hero (image)
	const hero = Section( 'elite-section--hero', 'Hero', '', [
		Div( 'elite-div--hero-copy', [
			P( '<strong>New</strong> Weekly AI summaries', 'elite-paragraph--hero-badge' ),
			H( 'Hear what every customer is <span class="elite-span elite-span--gradient">telling you</span>', 1, 'title-1' ),
			P( 'Signalry gathers feedback from tickets, surveys, reviews and calls, then shows your team which problems matter most.', 'elite-paragraph--hero-lead', 'lead' ),
			Div( 'elite-div--hero-actions', [
				Btn( 'Start free trial', '#', 'elite-button--primary', { iconEnd: 'arrow-right' } ),
				Btn( 'Watch the tour', '#tour', 'elite-button--secondary' ),
			] ),
			P( 'Free for 14 days · No card needed', 'elite-paragraph--hero-note', 'small' ),
		] ),
		Img( M.dashboard, { lazyLoad: false, priority: true, sizeSlug: 'full', className: 'elite-image--hero-shot' } ),
	] );

	// Counters
	const stat = ( end, suffix, label, decimals = 0 ) => Col( { mobile: { width: 6 }, tablet: { width: 3 } }, [
		B( 'elite/counter', { end, suffix, decimals, separator: 'comma', textStyle: 'stat', className: 'elite-counter--stat' } ),
		P( label, 'elite-paragraph--stat-label' ),
	], 'elite-column--stat' );
	const stats = Section( 'elite-section--stats', 'Stats', '', [
		Row( {}, [
			stat( 18, 'M+', 'Pieces of feedback analysed' ),
			stat( 2400, '+', 'Teams listening with Signalry' ),
			stat( 31, 'h', 'Saved per team, every week' ),
			stat( 4.8, '/5', 'Average rating from customers', 1 ),
		] ),
	] );

	// Video
	const head = ( eyebrow, title, lead ) => Div( 'elite-div--section-head', [
		P( eyebrow, 'elite-paragraph--eyebrow', 'eyebrow' ),
		H( title, 2, 'title-2' ),
		...( lead ? [ P( lead, 'elite-paragraph--section-lead', 'lead' ) ] : [] ),
	] );
	const tour = Section( 'elite-section--tour', 'Product tour', 'tour', [
		head( 'Product tour', 'See Signalry in 15 seconds', 'From scattered feedback to a clear list of what to fix and build next.' ),
		B( 'elite/video', {
			mode: 'player',
			file: { id: M[ 'signalry-tour' ].id, url: M[ 'signalry-tour' ].url },
			poster: { id: M[ 'video-poster' ].id, url: M[ 'video-poster' ].url },
			title: 'Signalry product tour',
			ratio: { desktop: '16/9' },
			className: 'elite-video--tour',
		} ),
	] );

	// Tab slider
	const tab = ( label, title, text, checks, link, img ) => B( 'elite/tab', {}, [
		B( 'elite/tab-label', {}, [ P( label, 'elite-paragraph--tab-label' ) ] ),
		B( 'elite/tab-content', {}, [
			Row( { flex: { laptop: { align: 'center' } } }, [
				Col( { ...full, laptop: { width: 5 } }, [
					H( title, 3, 'title-3' ),
					P( text, 'elite-paragraph--tab-text' ),
					Checks( checks ),
					Btn( link, '#', 'elite-button--link' ),
				] ),
				Col( { ...full, laptop: { width: 7 } }, [
					Div( 'elite-div--tab-media', [ Img( img, { sizeSlug: 'full' } ) ] ),
				] ),
			] ),
		] ),
	] );
	const solutions = Section( 'elite-section--solutions', 'Solutions', 'tabs', [
		head( 'Solutions', 'Built for every team that talks to customers' ),
		B( 'elite/tab-slider', { className: 'elite-tab-slider--pills', ariaLabel: 'Teams', effect: 'fade' }, [
			tab( 'Product teams', 'Know what to build next', 'See which requests come up most, who asks for them and how much revenue is behind each one.', [ 'Requests ranked by customers and ARR', 'Link feedback to roadmap items', 'Tell customers when you ship' ], 'Signalry for product teams →', M[ 'tab-product' ] ),
			tab( 'Support teams', 'Tag tickets before anyone reads them', 'Every ticket gets a theme and a sentiment the moment it arrives, so trends show up in hours, not weeks.', [ 'Automatic themes and sentiment', 'Alerts when an issue spikes', 'Hand-offs to product in one click' ], 'Signalry for support teams →', M[ 'tab-support' ] ),
			tab( 'Marketing teams', 'Find your happiest customers', 'Spot promoters by segment, collect approved quotes and turn real praise into reviews and case studies.', [ 'NPS by segment and plan', 'Approved quotes, ready to use', 'Review requests at the right time' ], 'Signalry for marketing teams →', M[ 'tab-marketing' ] ),
		] ),
	] );

	// Testimonials slider
	const quote = ( text, name, role, avatar ) => B( 'elite/slide', {}, [
		Div( 'elite-div--quote', [
			P( '★★★★★', 'elite-paragraph--quote-stars' ),
			P( `“${ text }”`, 'elite-paragraph--quote-text', 'quote' ),
			Div( 'elite-div--quote-author', [
				Img( avatar, { sizeSlug: 'thumbnail', className: 'elite-image--avatar', ratio: { desktop: '1/1' } } ),
				Div( 'elite-div--quote-person', [
					P( `<strong>${ name }</strong>`, 'elite-paragraph--quote-name' ),
					P( role, 'elite-paragraph--quote-role', 'small' ),
				] ),
			] ),
		] ),
	] );
	const customers = Section( 'elite-section--customers', 'Customers', 'customers', [
		Div( 'elite-div--section-head-left', [
			P( 'Customers', 'elite-paragraph--eyebrow', 'eyebrow' ),
			H( 'Teams that listen better', 2, 'title-2' ),
		] ),
		B( 'elite/slider', {
			className: 'elite-slider--quotes',
			ariaLabel: 'Customer testimonials',
			loop: false,
			arrowsPosition: 'top',
			layout: {
				desktop: { perView: 3, gap: 20, arrows: true, pagination: true },
				tablet: { perView: 2, arrows: true, pagination: true },
				mobile: { perView: 1, arrows: true, pagination: true },
			},
		}, [
			quote( 'We used to guess what customers wanted. Now the weekly summary tells us, and it’s usually right.', 'Maya Alvarez', 'Head of Product, Northwind Apps', M[ 'avatar-ma' ] ),
			quote( 'Ticket tagging went from a Friday chore to something that just happens. Our team got four hours back each week.', 'James Kim', 'Support Lead, Brightside Health', M[ 'avatar-jk' ] ),
			quote( 'We found our biggest churn reason in the first week. It was hiding in app reviews nobody read.', 'Sara Rahman', 'VP Customer Success, Fieldnote', M[ 'avatar-sr' ] ),
			quote( 'Every roadmap meeting now starts with real numbers: how many customers asked, and what they’re worth.', 'Daniel Lee', 'CPO, Orbitly', M[ 'avatar-dl' ] ),
		] ),
	] );

	// FAQ accordion
	const item = ( title, answer ) => B( 'elite/accordion-item', { title }, [
		B( 'elite/accordion-header' ),
		B( 'elite/accordion-body', {}, [ P( answer ) ] ),
		B( 'elite/accordion-panel' ),
	] );
	const faq = Section( 'elite-section--faq', 'FAQ', 'faq', [
		Row( {}, [
			Col( { ...full, laptop: { width: 4 } }, [
				P( 'FAQ', 'elite-paragraph--eyebrow', 'eyebrow' ),
				H( 'Questions, answered', 2, 'title-2' ),
				P( 'Can’t find what you’re looking for? Our team replies within a few hours.', 'elite-paragraph--section-lead', 'lead' ),
				Btn( 'Contact sales', '#', 'elite-button--secondary' ),
			], 'elite-column--faq-intro' ),
			Col( { ...full, laptop: { width: 7, offset: 1 } }, [
				B( 'elite/accordion', { start: 'first', indicator: 'plus', headingLevel: 3, className: 'elite-accordion--faq' }, [
					item( 'How long does setup take?', 'Most teams connect their first source in under ten minutes. Signalry starts finding themes as soon as feedback arrives, and the first weekly summary is ready the following Monday.' ),
					item( 'Which tools does Signalry connect to?', 'Help desks, live chat, survey tools, CRMs, app stores and call recorders. You can also upload a CSV or forward emails to your Signalry inbox.' ),
					item( 'Is our customer data safe?', 'Data is encrypted in transit and at rest, stored in the region you choose, and never used to train shared models. SSO and audit logs come with every paid plan.' ),
					item( 'Can we try it before we pay?', 'Yes. Every plan has a 14-day free trial with all features, and you don’t need a card to start.' ),
					item( 'How is pricing calculated?', 'By the amount of feedback analysed each month, not by seats. Invite your whole company at no extra cost.' ),
				] ),
			] ),
		] ),
	] );

	// Posts query
	const blog = Section( 'elite-section--blog', 'Blog', 'blog', [
		Div( 'elite-div--blog-head', [
			Div( 'elite-div--section-head-left', [
				P( 'Blog', 'elite-paragraph--eyebrow', 'eyebrow' ),
				H( 'Latest from the blog', 2, 'title-2' ),
			] ),
			Btn( 'View all posts', '#', 'elite-button--link', { iconEnd: 'arrow-right' } ),
		] ),
		B( 'elite/posts', {
			className: 'elite-posts--blog',
			query: { source: 'latest', perPage: 3, postType: 'post', taxonomies: [], fill: true, exclude: [], order: 'date-desc', terms: {}, termsMatch: 'any', posts: [], featured: 'any' },
			columns: { desktop: 3, tablet: 2, mobile: 1 },
		}, [
			B( 'elite/post-template', { lock: { remove: true, move: false } }, [
				B( 'elite/post', {}, [
					B( 'core/post-featured-image', { aspectRatio: '16/10' } ),
					B( 'elite/post-field', { taxonomy: 'category', termLinks: false } ),
					B( 'core/post-title', { level: 3 } ),
					B( 'core/post-excerpt', { excerptLength: 20 } ),
					Div( 'elite-post__meta', [ B( 'core/post-date' ), B( 'elite/post-reading-time' ) ] ),
				] ),
			] ),
		] ),
	] );

	return serialize( [ hero, stats, tour, solutions, customers, faq, blog ] );
}, media );

// Save through the REST API (raw content, as the editor would).
const saved = await page.evaluate( async ( { id, content } ) => {
	const res = await window.wp.apiFetch( { path: `/wp/v2/pages/${ id }`, method: 'POST', data: { content, status: 'publish' } } );
	return res.id;
}, { id: PAGE_ID, content: html } );
console.log( 'Saved page', saved, `(${ html.length } chars)` );

// Reload the editor and report any blocks it can't validate.
await page.reload();
await page.waitForFunction( () => window.wp?.data?.select( 'core/block-editor' ).getBlocks().length > 0 );
const invalid = await page.evaluate( () => {
	const out = [];
	const walk = ( blocks ) => blocks.forEach( ( b ) => { if ( ! b.isValid ) out.push( b.name ); walk( b.innerBlocks ); } );
	walk( window.wp.data.select( 'core/block-editor' ).getBlocks() );
	return out;
} );
console.log( 'Invalid blocks:', invalid.length ? invalid : 'none' );
await browser.close();
