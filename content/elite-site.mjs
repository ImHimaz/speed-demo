/**
 * Builds the Signalry pages with Elite Blocks, in the real editor: blocks
 * are created with WordPress's own createBlock (so their saved markup is
 * exactly what the editor writes), then each page is saved. Round 2 ("a real
 * project"): Home (with the logos, features, pricing and demo-form sections),
 * About, Pricing and Contact. The single post and blog page are theme
 * templates (elite/templates).
 *
 * Also sets up the two Elite Forms (Contact Form 7 provider) for the forms
 * content/setup.php made.
 *
 * Run: node elite-site.mjs   (site at http://localhost:8894, wp-env login)
 */
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';

const SITE = process.env.SITE || 'http://localhost:8894';

const browser = await chromium.launch();
const page = await browser.newPage( { viewport: { width: 1440, height: 900 } } );
page.on( 'pageerror', ( e ) => console.log( 'pageerror', e.message ) );

await page.goto( `${ SITE }/wp-login.php` );
await page.fill( '#user_login', 'admin' );
await page.fill( '#user_pass', 'password' );
await page.click( '#wp-submit' );
await page.waitForURL( /wp-admin/ );

// Any page's editor: the block library and apiFetch are what we need.
const opts = await ( async () => {
	await page.goto( `${ SITE }/wp-admin/post-new.php?post_type=page` );
	await page.waitForFunction( () => window.wp?.blocks?.getBlockType?.( 'elite/section' ) );
	await page.evaluate( () => window.wp.data.dispatch( 'core/preferences' )?.set( 'core/edit-post', 'welcomeGuide', false ) );
	return page.evaluate( async () => {
		const get = ( name ) => window.wp.apiFetch( { path: `/wp/v2/settings` } ).then( ( s ) => s[ name ] );
		const pages = await window.wp.apiFetch( { path: '/wp/v2/pages?per_page=50&_fields=id,slug' } );
		return {
			pages: Object.fromEntries( pages.map( ( p ) => [ p.slug, p.id ] ) ),
			front: await get( 'page_on_front' ),
		};
	} );
} )();

const media = await page.evaluate( async () => {
	const res = await window.wp.apiFetch( { path: '/wp/v2/media?per_page=100&_fields=id,source_url' } );
	return Object.fromEntries( res.map( ( m ) => [ m.source_url.split( '/' ).pop().replace( /(-\d+)?\.(webp|mp4|svg)$/, '' ), { id: m.id, url: m.source_url } ] ) );
} );

// Elite Forms: one per Contact Form 7 form (made once; found by title after).
const forms = await page.evaluate( async () => {
	const cf7 = await window.wp.apiFetch( { path: '/contact-form-7/v1/contact-forms?per_page=20' } );
	const existing = await window.wp.apiFetch( { path: '/wp/v2/elite-forms?per_page=50&status=publish,draft&_fields=id,title' } );
	const out = {};
	for ( const f of cf7 ) {
		const title = `${ f.title } (Contact Form 7)`;
		const found = existing.find( ( e ) => e.title.rendered === title );
		const data = { title, status: 'publish', content: '<!-- wp:elite/form-setup /-->', meta: { elite_form: { provider: 'cf7', plugin: { id: String( f.id ) }, height: 400 } } };
		const saved = await window.wp.apiFetch( { path: `/wp/v2/elite-forms${ found ? `/${ found.id }` : '' }`, method: 'POST', data } );
		out[ f.slug || f.title ] = saved.id;
		out[ f.title ] = saved.id;
	}
	return out;
} );
console.log( 'Elite Forms:', forms );

const pagesHtml = await page.evaluate( ( { M, F } ) => {
	const { createBlock: B, serialize } = window.wp.blocks;
	const H = ( content, level, textStyle, className ) => B( 'elite/heading', { content, level, textStyle, className } );
	const P = ( content, className, textStyle ) => B( 'elite/paragraph', { content, className, textStyle } );
	const Btn = ( text, url, className, extra = {} ) => B( 'elite/button', { text, link: { url }, className, ...extra } );
	const Div = ( className, inner, extra = {} ) => B( 'elite/div', { className, ...extra }, inner );
	const Section = ( className, label, anchor, inner ) => B( 'elite/section', { className, label, anchor }, inner );
	const Row = ( attrs, cols ) => B( 'elite/row', attrs, cols );
	const Col = ( size, inner, className ) => B( 'elite/column', { size, className }, inner );
	const Img = ( m, extra = {} ) => B( 'elite/image', { images: { desktop: { id: m.id, url: m.url } }, ...extra } );
	const Icon = ( icon ) => B( 'elite/icon', { icon, size: { desktop: 24 } } );
	const Checks = ( items ) => B( 'core/list', { className: 'core-list--checks' }, items.map( ( content ) => B( 'core/list-item', { content } ) ) );
	const full = { mobile: { width: 12 } };
	const head = ( eyebrow, title, lead ) => Div( 'elite-div--section-head', [
		P( eyebrow, 'elite-paragraph--eyebrow', 'eyebrow' ),
		H( title, 2, 'title-2' ),
		...( lead ? [ P( lead, 'elite-paragraph--section-lead', 'lead' ) ] : [] ),
	] );
	const url = ( slug ) => `/${ slug }/`;

	// ---------- Shared sections ----------

	const logos = ( boxed = false ) => Section( `elite-section--logos${ boxed ? ' is-boxed' : '' }`, 'Logos', '', [
		P( 'Trusted by 2,400+ product, support and marketing teams', 'elite-paragraph--logos-title' ),
		B( 'elite/marquee', {
			className: 'elite-marquee--logos',
			speed: 40,
			fadeEdges: true,
			layout: { desktop: { gap: 80, height: 36 }, mobile: { gap: 56, height: 32 } },
		}, [ 'northwind', 'brightside', 'fieldnote', 'orbitly', 'lumen', 'kitepay', 'harbor', 'quanta' ].map( ( n ) => Img( M[ n ], { sizeSlug: 'full', alt: n[ 0 ].toUpperCase() + n.slice( 1 ) } ) ) ),
	] );

	const stat = ( end, suffix, label, decimals = 0, separator = 'comma' ) => Col( { mobile: { width: 6 }, tablet: { width: 3 } }, [
		B( 'elite/counter', { end, suffix, decimals, separator, textStyle: 'stat', className: 'elite-counter--stat' } ),
		P( label, 'elite-paragraph--stat-label' ),
	], 'elite-column--stat' );

	const item = ( title, answer ) => B( 'elite/accordion-item', { title }, [
		B( 'elite/accordion-header' ),
		B( 'elite/accordion-body', {}, [ P( answer ) ] ),
		B( 'elite/accordion-panel' ),
	] );
	const faq = ( eyebrow, title, lead, button, items ) => Section( 'elite-section--faq', 'FAQ', 'faq', [
		Row( {}, [
			Col( { ...full, laptop: { width: 4 } }, [
				P( eyebrow, 'elite-paragraph--eyebrow', 'eyebrow' ),
				H( title, 2, 'title-2' ),
				P( lead, 'elite-paragraph--section-lead', 'lead' ),
				...( button ? [ Btn( button, url( 'contact' ), 'elite-button--secondary' ) ] : [] ),
			], 'elite-column--faq-intro' ),
			Col( { ...full, laptop: { width: 7, offset: 1 } }, [
				B( 'elite/accordion', { start: 'first', indicator: 'plus', headingLevel: 3, className: 'elite-accordion--faq' }, items.map( ( [ q, a ] ) => item( q, a ) ) ),
			] ),
		] ),
	] );

	const plan = ( name, forWho, price, perMonth, note, button, buttonUrl, buttonClass, checks, popular = false ) => Col( { ...full, laptop: { width: 4 } }, [
		Div( `elite-div--plan${ popular ? ' elite-div--plan-popular' : '' }`, [
			...( popular ? [ P( 'Most popular', 'elite-paragraph--plan-tag' ) ] : [] ),
			H( name, 3 ),
			P( forWho, 'elite-paragraph--plan-meta' ),
			P( `<strong>${ price }</strong>${ perMonth ? ' / month' : '' }`, 'elite-paragraph--plan-price' ),
			P( note, 'elite-paragraph--plan-meta' ),
			Btn( button, buttonUrl, buttonClass ),
			Checks( checks ),
		] ),
	] );
	const plans = ( yearly ) => Row( {}, [
		plan( 'Starter', 'For small teams getting started', yearly ? '$47' : '$59', true, yearly ? '$564 billed yearly' : 'Up to 2,000 pieces of feedback a month', 'Start free trial', url( 'pricing' ), 'elite-button--secondary', [ '3 sources', 'AI themes and sentiment', 'Weekly summaries', 'Email support' ] ),
		plan( 'Growth', 'For teams that run on feedback', yearly ? '$143' : '$179', true, yearly ? '$1,716 billed yearly' : 'Up to 10,000 pieces of feedback a month', 'Start free trial', url( 'pricing' ), 'elite-button--primary', [ 'Unlimited sources', 'Roadmaps with revenue', 'Spike alerts in Slack', 'Priority support' ], true ),
		plan( 'Enterprise', 'For larger companies', 'Custom', false, 'Any volume, billed yearly', 'Talk to sales', url( 'contact' ), 'elite-button--secondary', [ 'SSO and audit logs', 'Data region of your choice', 'Custom AI models', 'Dedicated success manager' ] ),
	] );
	const billing = () => B( 'elite/tab-slider', { className: 'elite-tab-slider--pills', ariaLabel: 'Billing', effect: 'fade' }, [
		B( 'elite/tab', {}, [ B( 'elite/tab-label', {}, [ P( 'Monthly', 'elite-paragraph--tab-label' ) ] ), B( 'elite/tab-content', {}, [ plans( false ) ] ) ] ),
		B( 'elite/tab', {}, [ B( 'elite/tab-label', {}, [ P( 'Yearly <small>−20%</small>', 'elite-paragraph--tab-label' ) ] ), B( 'elite/tab-content', {}, [ plans( true ) ] ) ] ),
	] );

	const demo = ( eyebrow, title, lead, checks ) => Section( 'elite-section--demo', 'Book a demo', 'demo', [
		Row( { flex: { laptop: { align: 'center' } } }, [
			Col( { ...full, laptop: { width: 6 } }, [
				P( eyebrow, 'elite-paragraph--eyebrow', 'eyebrow' ),
				H( title, 2, 'title-2' ),
				P( lead, 'elite-paragraph--section-lead', 'lead' ),
				...( checks ? [ Checks( checks ) ] : [] ),
			] ),
			Col( { ...full, laptop: { width: 5, offset: 1 } }, [
				Div( 'elite-div--form-card', [
					H( 'Book your demo', 3 ),
					P( 'We reply within one working day.' ),
					B( 'elite/form', { form: F[ 'Book a demo' ] } ),
				] ),
			] ),
		] ),
	] );

	const pageHero = ( eyebrow, title, lead ) => Section( 'elite-section--page-hero', 'Page hero', '', [
		P( eyebrow, 'elite-paragraph--eyebrow', 'eyebrow' ),
		H( title, 1 ),
		P( lead, 'elite-paragraph--section-lead', 'lead' ),
	] );
	const gradient = ( text ) => `<span class="elite-span elite-span--gradient">${ text }</span>`;

	// ---------- Home ----------

	const hero = Section( 'elite-section--hero', 'Hero', '', [
		Div( 'elite-div--hero-copy', [
			P( '<strong>New</strong> Weekly AI summaries', 'elite-paragraph--hero-badge' ),
			H( `Hear what every customer is ${ gradient( 'telling you' ) }`, 1, 'title-1' ),
			P( 'Signalry gathers feedback from tickets, surveys, reviews and calls, then shows your team which problems matter most.', 'elite-paragraph--hero-lead', 'lead' ),
			Div( 'elite-div--hero-actions', [
				Btn( 'Start free trial', url( 'pricing' ), 'elite-button--primary', { iconEnd: 'arrow-right' } ),
				Btn( 'Watch the tour', '#tour', 'elite-button--secondary' ),
			] ),
			P( 'Free for 14 days · No card needed', 'elite-paragraph--hero-note', 'small' ),
		] ),
		Img( M.dashboard, { lazyLoad: false, priority: true, sizeSlug: 'full', className: 'elite-image--hero-shot' } ),
	] );

	const stats = Section( 'elite-section--stats', 'Stats', '', [
		Row( {}, [
			stat( 18, 'M+', 'Pieces of feedback analysed' ),
			stat( 2400, '+', 'Teams listening with Signalry' ),
			stat( 31, 'h', 'Saved per team, every week' ),
			stat( 4.8, '/5', 'Average rating from customers', 1 ),
		] ),
	] );

	const feature = ( icon, title, text ) => Col( { ...full, tablet: { width: 6 }, laptop: { width: 4 } }, [
		Div( 'elite-div--feature', [ Icon( icon ), H( title, 3 ), P( text ) ] ),
	] );
	const features = Section( 'elite-section--features', 'Features', 'features', [
		head( 'Features', 'Everything customers say, finally in one place', 'Connect your tools once. Signalry reads, tags and sums up every piece of feedback, so nobody has to.' ),
		Row( {}, [
			feature( 'layers', 'One feedback inbox', 'Tickets, surveys, app reviews, calls and chats arrive in one place, without copy and paste.' ),
			feature( 'zap', 'Themes found by AI', 'Every piece of feedback gets a theme and a sentiment the moment it lands. You review, it learns.' ),
			feature( 'trending-up', 'Trends you can trust', 'See which issues grow week by week, by plan, segment or region, with real numbers behind every chart.' ),
			feature( 'file-text', 'Weekly AI summaries', 'Every Monday, a short read on what changed, what’s new and what needs attention, for the whole team.' ),
			feature( 'bar-chart', 'Roadmaps with revenue', 'Link requests to roadmap items and see how many customers, and how much revenue, each one represents.' ),
			feature( 'bell', 'Alerts when issues spike', 'Get a Slack or email alert when a theme suddenly grows, so you hear about problems before churn does.' ),
		] ),
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
		B( 'elite/tab-slider', { className: 'elite-tab-slider--pills', ariaLabel: 'Teams', effect: 'fade', layout: { mobile: { tabsPerView: 3, tabsGap: 4 } } }, [
			tab( 'Product teams', 'Know what to build next', 'See which requests come up most, who asks for them and how much revenue is behind each one.', [ 'Requests ranked by customers and ARR', 'Link feedback to roadmap items', 'Tell customers when you ship' ], 'Signalry for product teams →', M[ 'tab-product' ] ),
			tab( 'Support teams', 'Tag tickets before anyone reads them', 'Every ticket gets a theme and a sentiment the moment it arrives, so trends show up in hours, not weeks.', [ 'Automatic themes and sentiment', 'Alerts when an issue spikes', 'Hand-offs to product in one click' ], 'Signalry for support teams →', M[ 'tab-support' ] ),
			tab( 'Marketing teams', 'Find your happiest customers', 'Spot promoters by segment, collect approved quotes and turn real praise into reviews and case studies.', [ 'NPS by segment and plan', 'Approved quotes, ready to use', 'Review requests at the right time' ], 'Signalry for marketing teams →', M[ 'tab-marketing' ] ),
		] ),
	] );

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

	const pricing = Section( 'elite-section--pricing', 'Pricing', 'pricing', [
		head( 'Pricing', 'Pay for feedback, not for seats', 'Every plan includes unlimited users and a 14-day free trial.' ),
		billing(),
		P( `Prices in USD, excluding tax. <a href="${ url( 'pricing' ) }">Compare all features →</a>`, 'elite-paragraph--plan-meta' ),
	] );

	const homeFaq = faq( 'FAQ', 'Questions, answered', 'Can’t find what you’re looking for? Our team replies within a few hours.', 'Contact sales', [
		[ 'How long does setup take?', 'Most teams connect their first source in under ten minutes. Signalry starts finding themes as soon as feedback arrives, and the first weekly summary is ready the following Monday.' ],
		[ 'Which tools does Signalry connect to?', 'Help desks, live chat, survey tools, CRMs, app stores and call recorders. You can also upload a CSV or forward emails to your Signalry inbox.' ],
		[ 'Is our customer data safe?', 'Data is encrypted in transit and at rest, stored in the region you choose, and never used to train shared models. SSO and audit logs come with every paid plan.' ],
		[ 'Can we try it before we pay?', 'Yes. Every plan has a 14-day free trial with all features, and you don’t need a card to start.' ],
		[ 'How is pricing calculated?', 'By the amount of feedback analysed each month, not by seats. Invite your whole company at no extra cost.' ],
	] );

	const blog = Section( 'elite-section--blog', 'Blog', 'blog', [
		Div( 'elite-div--blog-head', [
			Div( 'elite-div--section-head-left', [
				P( 'Blog', 'elite-paragraph--eyebrow', 'eyebrow' ),
				H( 'Latest from the blog', 2, 'title-2' ),
			] ),
			Btn( 'View all posts', url( 'blog' ), 'elite-button--link', { iconEnd: 'arrow-right' } ),
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

	const home = [
		hero, logos(), stats, features, tour, solutions, customers, pricing, homeFaq, blog,
		demo( 'Book a demo', 'See what your customers are telling you', 'A 30-minute call with our team, using your own feedback. No slides, no pressure.', [ 'Bring a CSV or connect a source on the call', 'Get your top five themes, free', 'Leave with a plan, whether you buy or not' ] ),
	];

	// ---------- About ----------

	const about = [
		pageHero( 'About us', `We help companies ${ gradient( 'actually listen' ) } to their customers`, 'Signalry started with a simple question: why does it take a churned customer for a team to hear a problem everyone already mentioned?' ),
		Section( 'elite-section--story', 'Our story', '', [
			Row( { flex: { laptop: { align: 'center' } } }, [
				Col( { ...full, laptop: { width: 6 } }, [
					P( 'Our story', 'elite-paragraph--eyebrow', 'eyebrow' ),
					H( 'Feedback was everywhere. Answers weren’t.', 2, 'title-2' ),
					P( 'In 2021 our founders ran product and support at a fast-growing SaaS company. They had thousands of tickets, three survey tools and a spreadsheet nobody trusted.', 'elite-paragraph--section-lead', 'lead' ),
					P( 'So they built a tool that read everything, grouped it into themes and sent a short summary every Monday. Within a quarter, churn fell by a third. Other teams asked to use it, and Signalry was born.' ),
					P( 'Today more than 2,400 teams use Signalry to decide what to fix, what to build and who to thank.' ),
				] ),
				Col( { ...full, laptop: { width: 6 } }, [ Img( M.insights, { sizeSlug: 'full' } ) ] ),
			] ),
		] ),
		Section( 'elite-section--stats', 'Stats', '', [
			Row( {}, [
				stat( 2021, '', 'Founded, in San Francisco', 0, 'none' ),
				stat( 64, '', 'People across 11 countries' ),
				stat( 2400, '+', 'Teams listening with Signalry' ),
				stat( 18, 'M+', 'Pieces of feedback analysed' ),
			] ),
		] ),
		Section( 'elite-section--values', 'Values', '', [
			head( 'What we believe', 'Three ideas behind everything we build' ),
			Row( {}, [
				[ '01', 'Every customer deserves to be heard', 'Not just the loudest ones. Signalry gives a quiet app review the same weight as an angry escalation.' ],
				[ '02', 'Show the numbers, not the noise', 'Every theme comes with how many customers mentioned it and what they’re worth, so decisions are easy to defend.' ],
				[ '03', 'Your data stays yours', 'We never train shared models on customer data, and you choose where it lives. Trust is the product.' ],
			].map( ( [ n, t, d ] ) => Col( { ...full, tablet: { width: 4 } }, [ Div( 'elite-div--value', [ P( n, 'elite-paragraph--value-number' ), H( t, 3 ), P( d ) ] ) ] ) ) ),
		] ),
		Section( 'elite-section--team', 'Team', '', [
			head( 'Leadership', 'The team behind Signalry' ),
			Row( {}, [
				[ 'avatar-ma', 'Maya Alvarez', 'Co-founder & CEO' ],
				[ 'avatar-dl', 'Daniel Lee', 'Co-founder & CTO' ],
				[ 'avatar-sr', 'Sara Rahman', 'VP Customer Success' ],
				[ 'avatar-jk', 'James Kim', 'Head of AI' ],
			].map( ( [ a, n, r ] ) => Col( { mobile: { width: 6 }, tablet: { width: 3 } }, [
				Div( 'elite-div--member', [ Img( M[ a ], { sizeSlug: 'thumbnail', ratio: { desktop: '1/1' } } ), H( n, 3 ), P( r ) ] ),
			] ) ) ),
		] ),
		demo( 'Join us', 'Want to hear what your customers say?', 'Book a 30-minute demo with the team that built Signalry.' ),
	];

	// ---------- Pricing ----------

	const yes = '<mark>Included</mark>';
	const no = '<s>—</s>';
	const cells = ( row ) => ( { cells: row.map( ( content, i ) => ( { content, tag: 'td', ...( i === 0 ? {} : {} ) } ) ) } );
	const group = ( name ) => cells( [ `<strong>${ name }</strong>`, '', '', '' ] );
	const table = B( 'core/table', {
		className: 'core-table--compare',
		hasFixedLayout: false,
		head: [ { cells: [ 'Feature', 'Starter', 'Growth', 'Enterprise' ].map( ( content ) => ( { content, tag: 'th', scope: 'col' } ) ) } ],
		body: [
			group( 'Collect' ),
			cells( [ 'Feedback each month', '2,000', '10,000', 'Unlimited' ] ),
			cells( [ 'Sources', '3', 'Unlimited', 'Unlimited' ] ),
			cells( [ 'CSV upload and email forwarding', yes, yes, yes ] ),
			group( 'Understand' ),
			cells( [ 'AI themes and sentiment', yes, yes, yes ] ),
			cells( [ 'Weekly AI summaries', yes, yes, yes ] ),
			cells( [ 'Spike alerts (Slack, email)', no, yes, yes ] ),
			cells( [ 'Custom AI models', no, no, yes ] ),
			group( 'Act' ),
			cells( [ 'Roadmaps with revenue', no, yes, yes ] ),
			cells( [ 'Help desk and CRM sync', no, yes, yes ] ),
			group( 'Security and support' ),
			cells( [ 'SSO and audit logs', no, no, yes ] ),
			cells( [ 'Data region', 'US', 'US or EU', 'Your choice' ] ),
			cells( [ 'Support', 'Email', 'Priority', 'Dedicated manager' ] ),
		],
	} );

	const pricingPage = [
		pageHero( 'Pricing', `Simple pricing that grows ${ gradient( 'with your feedback' ) }`, 'Pay for the feedback you analyse, never for seats. Every plan starts with a 14-day free trial, no card needed.' ),
		Section( 'elite-section--pricing is-flush-top', 'Plans', 'plans', [
			billing(),
			P( 'Prices in USD, excluding tax. Need more feedback each month? Every plan scales in steps of 1,000.', 'elite-paragraph--plan-meta' ),
		] ),
		logos( true ),
		Section( 'elite-section--compare', 'Compare plans', 'compare', [ head( 'Compare plans', 'Every feature, side by side' ), table ] ),
		faq( 'Pricing FAQ', 'Questions about billing', 'Still unsure which plan fits? Tell us how much feedback you get and we’ll suggest one.', 'Ask our team', [
			[ 'What counts as a piece of feedback?', 'One ticket, survey answer, review, chat or call transcript. Replies in the same ticket count once.' ],
			[ 'What happens if we go over our limit?', 'Nothing breaks. We keep collecting and let you know, and you can move up a step or wait for next month.' ],
			[ 'Can we change plans later?', 'Yes, at any time. Upgrades apply straight away; downgrades apply at the end of your billing period.' ],
			[ 'Do you offer discounts for nonprofits and startups?', 'Yes: 50% off for registered nonprofits, and our startup programme gives a year of Growth at Starter prices.' ],
			[ 'Which payment methods do you accept?', 'All major cards. Yearly plans can also pay by bank transfer against an invoice.' ],
		] ),
		Section( 'elite-section--cta', 'Call to action', '', [
			H( 'Start listening in ten minutes', 2, 'title-2' ),
			P( 'Connect a source, see your first themes today and your first summary on Monday.', 'elite-paragraph--section-lead', 'lead' ),
			Div( 'elite-div--cta-actions', [
				Btn( 'Start free trial', '#', 'elite-button--primary' ),
				Btn( 'Talk to sales', url( 'contact' ), 'elite-button--secondary' ),
			] ),
		] ),
	];

	// ---------- Contact ----------

	const contactItem = ( icon, label, text ) => Div( 'elite-div--contact-item', [ Icon( icon ), P( `<strong>${ label }</strong>${ text }` ) ] );
	const contact = [
		pageHero( 'Contact', `Talk to ${ gradient( 'a real person' ) }`, 'Questions about plans, security or a demo? Send us a note and someone from our team will reply within one working day.' ),
		Section( 'elite-section--contact', 'Contact', '', [
			Row( {}, [
				Col( { ...full, laptop: { width: 7 } }, [
					Div( 'elite-div--form-card', [
						H( 'Send us a message', 3 ),
						P( 'All fields marked * are required.' ),
						B( 'elite/form', { form: F[ 'Contact us' ] } ),
					] ),
				] ),
				Col( { ...full, laptop: { width: 5 } }, [
					contactItem( 'mail', 'Email', 'hello@signalry.example' ),
					contactItem( 'phone', 'Sales', '+1 (415) 555-0142 · Mon–Fri, 9am–6pm PT' ),
					contactItem( 'map-pin', 'Office', '120 Market Street, Suite 400, San Francisco, CA 94105' ),
					Img( M.map, { sizeSlug: 'full', className: 'elite-image--map' } ),
				] ),
			] ),
		] ),
		faq( 'Before you write', 'Quick answers', 'These come up most. If yours isn’t here, the form is the fastest way to reach us.', '', [
			[ 'How fast will you reply?', 'Within one working day, usually within a few hours during US office hours.' ],
			[ 'I already have an account. Where do I get help?', 'Use the chat in the Signalry app or email support@signalry.example. Growth and Enterprise plans have priority support.' ],
			[ 'Can I get your security documents?', 'Yes. Choose “Security and compliance” above and we’ll send our SOC 2 report and DPA.' ],
		] ),
	];

	return {
		home: serialize( home ),
		about: serialize( about ),
		pricing: serialize( pricingPage ),
		contact: serialize( contact ),
	};
}, { M: Object.fromEntries( Object.entries( media ).map( ( [ k, v ] ) => [ k.replace( /^logo-/, '' ), v ] ).concat( Object.entries( media ) ) ), F: forms } );

// Save each page through the REST API (raw content, as the editor would),
// then open it in the editor and report blocks it can't validate.
const ids = { home: opts.front, about: opts.pages.about, pricing: opts.pages.pricing, contact: opts.pages.contact };
for ( const [ key, html ] of Object.entries( pagesHtml ) ) {
	const id = ids[ key ];
	await page.evaluate( async ( { id, content } ) => window.wp.apiFetch( { path: `/wp/v2/pages/${ id }`, method: 'POST', data: { content, status: 'publish' } } ), { id, content: html } );
	await page.goto( `${ SITE }/wp-admin/post.php?post=${ id }&action=edit` );
	await page.waitForFunction( () => window.wp?.data?.select( 'core/block-editor' ).getBlocks().length > 0 );
	const invalid = await page.evaluate( () => {
		const out = [];
		const walk = ( blocks ) => blocks.forEach( ( b ) => {
			if ( ! b.isValid ) {
				out.push( b.name );
			}
			walk( b.innerBlocks );
		} );
		walk( window.wp.data.select( 'core/block-editor' ).getBlocks() );
		return out;
	} );
	console.log( `${ key } (page ${ id }, ${ html.length } chars): invalid blocks ${ invalid.length ? invalid.join( ', ' ) : 'none' }` );
}
await browser.close();
