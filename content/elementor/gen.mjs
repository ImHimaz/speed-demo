/**
 * The Signalry demo built with Elementor 4.3.6 + PRO Elements 4.3.2, as an
 * Elementor expert would: containers, standard widgets, Theme Builder header
 * and footer, a Loop Grid with a loop item template, global colours and type
 * in the Kit, the same self-hosted Manrope file (Custom Fonts). Custom CSS
 * (a Pro feature) only where a widget has no control for the design.
 *
 * Writes build/*.json; apply.php saves them (media IDs come from the shared
 * setup: "@id:<slug>" / "@url:<slug>" placeholders).
 *
 * Run: node gen.mjs
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';

const uid = () => randomBytes( 4 ).toString( 'hex' ).slice( 0, 7 );
const px = ( size ) => ( { unit: 'px', size, sizes: [] } );
const em = ( size ) => ( { unit: 'em', size, sizes: [] } );
const pct = ( size ) => ( { unit: '%', size, sizes: [] } );
const cu = ( size ) => ( { unit: 'custom', size, sizes: [] } );
const dim = ( t, r, b, l, unit = 'px' ) => ( { unit, top: String( t ), right: String( r ), bottom: String( b ), left: String( l ), isLinked: false } );
const gap = ( row, column = row ) => ( { row: String( row ), column: String( column ), isLinked: row === column, unit: 'px' } );
const media = ( slug ) => ( { id: `@id:${ slug }`, url: `@url:${ slug }`, alt: '', source: 'library', size: '' } );
const FONT = 'Manrope VF';

const C = {
	ink: '#0E1525', text: '#3B4558', muted: '#6B7487', line: '#E6E9F0', surface: '#F5F7FB',
	primary: '#3D5AFE', primaryDark: '#2238C9', primarySoft: '#E9EDFF', mint: '#16C79A', mintSoft: '#E2F8F1',
	coral: '#FF7A59', coralSoft: '#FFEEE8', amber: '#F5B83D', amberSoft: '#FFF4DC', navy: '#0B1430', navyText: '#A9B3CC', white: '#FFFFFF',
};

/** Typography settings under a control prefix ('typography' for most widgets). */
const T = ( { size, tablet, mobile, weight, lh, ls, prefix = 'typography' } ) => {
	const s = { [ `${ prefix }_typography` ]: 'custom', [ `${ prefix }_font_family` ]: FONT };
	if ( size !== undefined ) s[ `${ prefix }_font_size` ] = typeof size === 'string' ? cu( size ) : px( size );
	if ( tablet !== undefined ) s[ `${ prefix }_font_size_tablet` ] = px( tablet );
	if ( mobile !== undefined ) s[ `${ prefix }_font_size_mobile` ] = px( mobile );
	if ( weight ) s[ `${ prefix }_font_weight` ] = String( weight );
	if ( lh ) s[ `${ prefix }_line_height` ] = em( lh );
	if ( ls !== undefined ) s[ `${ prefix }_letter_spacing` ] = em( ls );
	return s;
};

/** A container. */
const box = ( settings, elements = [], isInner = true ) => ( { id: uid(), elType: 'container', isInner, settings, elements } );
/** A widget. */
const w = ( widgetType, settings ) => ( { id: uid(), elType: 'widget', widgetType, isInner: false, settings, elements: [] } );

// Text widgets with their global defaults cleared (the settings here win).
const noGlobals = ( ...keys ) => ( { __globals__: Object.fromEntries( keys.map( ( k ) => [ k, '' ] ) ) } );
const heading = ( title, tag, typo, extra = {} ) => w( 'heading', { title, header_size: tag, title_color: C.ink, ...T( typo ), ...noGlobals( 'title_color', 'typography_typography' ), ...extra } );
const text = ( html, typo = { size: 16, weight: 400, lh: 1.6 }, extra = {} ) => w( 'text-editor', { editor: html, text_color: C.text, ...T( typo ), ...noGlobals( 'text_color', 'typography_typography' ), ...extra } );
const eyebrow = ( t, align ) => heading( t, 'div', { size: 13, weight: 800, lh: 1.4, ls: 0.12 }, { title_color: C.primary, typography_text_transform: 'uppercase', ...( align ? { align } : {} ), _margin: dim( 0, 0, 0, 0 ) } );
const lead = ( t, align ) => text( `<p>${ t }</p>`, { size: 'clamp(17px, 1.5vw, 20px)', weight: 400, lh: 1.6 }, align ? { align } : {} );

// Buttons: the Kit sets the primary look; secondary and link change it.
const BTN = { ...T( { size: 16, mobile: 15, weight: 700, lh: 1.2 } ), text_padding: dim( 14, 26, 14, 26 ), text_padding_mobile: dim( 13, 22, 13, 22 ), border_radius: dim( 10, 10, 10, 10 ) };
const button = ( t, url, look = 'primary', extra = {} ) => {
	const looks = {
		primary: { background_color: C.primary, button_text_color: C.white, button_background_hover_color: C.primaryDark, hover_color: C.white, border_border: 'solid', border_width: dim( 2, 2, 2, 2 ), border_color: 'transparent' },
		secondary: { background_color: C.white, button_text_color: C.ink, button_background_hover_color: C.white, hover_color: C.ink, border_border: 'solid', border_width: dim( 2, 2, 2, 2 ), border_color: C.line, button_hover_border_color: C.ink },
		link: { background_color: 'transparent', button_text_color: C.primary, hover_color: C.primaryDark, button_background_hover_color: 'transparent', text_padding: dim( 0, 0, 0, 0 ), text_padding_mobile: dim( 0, 0, 0, 0 ), ...T( { size: 16, weight: 700, lh: 1.2 } ) },
	};
	return w( 'button', { text: t, link: { url, is_external: '', nofollow: '' }, ...BTN, ...looks[ look ], ...noGlobals( 'background_color', 'button_text_color', 'typography_typography' ), ...extra } );
};
const arrowIcon = { selected_icon: { value: 'fas fa-arrow-right', library: 'fa-solid' }, icon_align: 'row-reverse', icon_indent: px( 8 ) };

// Sections: boxed 1200px content, 120 / 96 / 72px top and bottom.
const SPACE = { padding: dim( 120, 32, 120, 32 ), padding_tablet: dim( 96, 32, 96, 32 ), padding_mobile: dim( 72, 20, 72, 20 ) };
const section = ( settings, elements ) => box( { content_width: 'boxed', html_tag: 'section', flex_direction: 'column', flex_gap: gap( 0 ), ...SPACE, ...settings }, elements, false );
const head = ( eb, title, ld ) => box( { content_width: 'boxed', boxed_width: px( 680 ), flex_direction: 'column', flex_align_items: 'center', flex_gap: gap( 14 ), padding: dim( 0, 0, 56, 0 ), padding_mobile: dim( 0, 0, 40, 0 ) }, [
	eyebrow( eb, 'center' ),
	heading( title, 'h2', { size: 'clamp(30px, 4.2vw, 48px)', weight: 700, lh: 1.12, ls: -0.025 }, { align: 'center' } ),
	...( ld ? [ lead( ld, 'center' ) ] : [] ),
] );
const H2 = { size: 'clamp(30px, 4.2vw, 48px)', weight: 700, lh: 1.12, ls: -0.025 };

/* ------------------------------------------------------------------ */
/* Kit (Site Settings): colours, type, buttons, layout.                */
/* ------------------------------------------------------------------ */
const kit = {
	system_colors: [
		{ _id: 'primary', title: 'Primary', color: C.primary },
		{ _id: 'secondary', title: 'Secondary', color: C.mint },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.coral },
	],
	custom_colors: [
		{ _id: 'ink', title: 'Ink', color: C.ink }, { _id: 'muted', title: 'Muted', color: C.muted },
		{ _id: 'line', title: 'Line', color: C.line }, { _id: 'surface', title: 'Surface', color: C.surface },
		{ _id: 'navy', title: 'Navy', color: C.navy }, { _id: 'pdark', title: 'Primary dark', color: C.primaryDark },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '700' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '600' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '700' },
	],
	body_color: C.text,
	body_typography_typography: 'custom', body_typography_font_family: FONT, body_typography_font_size: px( 16 ), body_typography_line_height: em( 1.6 ),
	link_normal_color: C.primary, link_hover_color: C.primaryDark,
	...Object.fromEntries( [ 1, 2, 3, 4, 5, 6 ].flatMap( ( h ) => [ [ `h${ h }_color`, C.ink ], [ `h${ h }_typography_typography`, 'custom' ], [ `h${ h }_typography_font_family`, FONT ], [ `h${ h }_typography_font_weight`, '700' ] ] ) ),
	button_typography_typography: 'custom', button_typography_font_family: FONT, button_typography_font_size: px( 16 ), button_typography_font_weight: '700',
	button_text_color: C.white, button_background_color: C.primary, button_hover_text_color: C.white, button_hover_background_color: C.primaryDark,
	button_border_radius: dim( 10, 10, 10, 10 ), button_padding: dim( 14, 26, 14, 26 ),
	container_width: px( 1200 ),
	container_padding: dim( 0, 0, 0, 0 ), container_padding_tablet: dim( 0, 0, 0, 0 ), container_padding_mobile: dim( 0, 0, 0, 0 ),
	space_between_widgets: gap( 20 ),
};

/* ------------------------------------------------------------------ */
/* Header (Theme Builder): sticky, logo, mega menu, two buttons.       */
/* ------------------------------------------------------------------ */
const dropLink = ( title, desc, soft, url ) => w( 'icon-box', {
	selected_icon: { value: 'fas fa-square', library: 'fa-solid' }, view: 'stacked', shape: 'rounded', position: 'left',
	title_text: title, description_text: desc, link: { url }, title_size: 'div',
	primary_color: soft, secondary_color: soft, icon_size: px( 16 ), icon_padding: px( 10 ), icon_space: px( 14 ), border_radius: dim( 10, 10, 10, 10 ),
	content_vertical_alignment: 'top', title_bottom_space: px( 2 ),
	title_color: C.ink, ...T( { prefix: 'title_typography', size: 15, weight: 700, lh: 1.3 } ),
	description_color: C.muted, ...T( { prefix: 'description_typography', size: 13, weight: 500, lh: 1.4 } ),
	_padding: dim( 12, 12, 12, 12 ), _border_radius: dim( 10, 10, 10, 10 ),
	...noGlobals( 'primary_color', 'title_color', 'description_color', 'title_typography_typography', 'description_typography_typography' ),
	custom_css: 'selector:hover{background:#F5F7FB}',
} );
const dropdown = ( links ) => box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 0 ), width: px( 340 ), padding: dim( 10, 10, 10, 10 ), background_background: 'classic', background_color: C.white, border_border: 'solid', border_width: dim( 1, 1, 1, 1 ), border_color: C.line, border_radius: dim( 16, 16, 16, 16 ), box_shadow_box_shadow_type: 'yes', box_shadow_box_shadow: { horizontal: 0, vertical: 30, blur: 60, spread: -30, color: 'rgba(14,21,37,0.35)' } }, links );
const menuItems = [
	{ title: 'Product', url: '/#features', drop: [ [ 'Feedback inbox', 'Every ticket, survey and review in one place', C.primarySoft, '/#features' ], [ 'AI insights', 'Themes and weekly summaries, found for you', C.mintSoft, '/#features' ], [ 'Roadmaps', 'Link requests to revenue and ship what matters', C.coralSoft, '/#features' ], [ 'Integrations', 'Help desk, chat, CRM, reviews and more', C.amberSoft, '/#features' ] ] },
	{ title: 'Solutions', url: '/#tabs', drop: [ [ 'Product teams', 'Decide what to build next', C.primarySoft, '/#tabs' ], [ 'Support teams', 'Tag and route tickets automatically', C.mintSoft, '/#tabs' ], [ 'Marketing teams', 'Find promoters and real quotes', C.coralSoft, '/#tabs' ] ] },
	{ title: 'Pricing', url: '/pricing/' }, { title: 'Blog', url: '/blog/' },
	{ title: 'Company', url: '/about/', drop: [ [ 'About us', 'Who we are and why we built Signalry', C.primarySoft, '/about/' ], [ 'Customers', 'Teams that listen better', C.mintSoft, '/#customers' ], [ 'Contact', 'Talk to sales or get help', C.coralSoft, '/contact/' ] ] },
];
const megaMenu = {
	id: uid(), elType: 'widget', widgetType: 'mega-menu', isInner: false,
	settings: {
		menu_name: 'Main', item_layout: 'horizontal', item_position_horizontal: 'start', content_width: 'fit_to_content', content_horizontal_position: 'left',
		open_on: 'hover', breakpoint_selector: 'tablet',
		menu_items: menuItems.map( ( m ) => ( { _id: uid(), item_title: m.title, item_link: { url: m.url }, item_dropdown_content: m.drop ? 'yes' : '' } ) ),
		menu_item_title_space_between: px( 4 ), menu_item_title_distance_from_content: px( 8 ),
		...T( { prefix: 'menu_item_title_typography', size: 15, weight: 600, lh: 1.2 } ),
		menu_item_title_text_color_normal: C.ink, menu_item_title_text_color_hover: C.ink, menu_item_title_text_color_active: C.ink,
		menu_item_title_padding: dim( 10, 12, 10, 12 ), menu_item_title_border_radius: dim( 8, 8, 8, 8 ),
		menu_item_title_background_color_hover_background: 'classic', menu_item_title_background_color_hover_color: C.surface,
		menu_toggle_icon_color_normal: C.ink, style_menu_toggle_icon_size: px( 26 ),
		__globals__: { menu_item_title_typography_typography: '', menu_item_title_text_color_normal: '', menu_item_title_text_color_hover: '', menu_item_title_text_color_active: '' },
		hide_mobile: '',
		custom_css: '@media (max-width:1024px){selector .e-n-menu-wrapper{background:#fff;padding:4px 20px 24px;border-top:1px solid #E6E9F0;box-shadow:0 30px 60px -30px rgba(14,21,37,.35);max-height:calc(100vh - 68px);overflow-y:auto}selector .e-n-menu-item{border-bottom:1px solid #E6E9F0}selector .e-n-menu-title{padding:16px 0!important;background:none!important}selector .e-n-menu-title-text{font-size:18px;font-weight:700}selector .e-n-menu-content>.e-con{padding:0 0 10px!important}selector .e-n-menu-content .e-con>.e-con{width:100%!important;border:0!important;box-shadow:none!important;padding:0!important;background:none!important}selector .elementor-icon-box-icon,selector .elementor-icon-box-description{display:none}selector .elementor-icon-box-wrapper{text-align:start}selector .elementor-widget-icon-box{padding:8px 0!important}selector .elementor-icon-box-title,selector .elementor-icon-box-title a{color:#3B4558!important;font-weight:600!important}}',
	},
	elements: menuItems.map( ( m ) => box( { _title: m.title, content_width: 'full' }, m.drop ? [ dropdown( m.drop.map( ( d ) => dropLink( ...d ) ) ) ] : [], false ) ),
};
const header = [
	box( {
		html_tag: 'header', content_width: 'boxed', flex_direction: 'row', flex_justify_content: 'space-between', flex_align_items: 'center', flex_wrap: 'nowrap', flex_gap: gap( 24 ),
		min_height: px( 76 ), min_height_mobile: px( 68 ), padding: dim( 0, 32, 0, 32 ), padding_mobile: dim( 0, 20, 0, 20 ),
		background_background: 'classic', background_color: 'rgba(255,255,255,0.92)', border_border: 'solid', border_width: dim( 0, 0, 1, 0 ), border_color: C.line,
		sticky: 'top', sticky_on: [ 'desktop', 'tablet', 'mobile' ], sticky_offset: 0, sticky_effects_offset: 0, z_index: 300,
		custom_css: 'selector{backdrop-filter:blur(12px)}',
	}, [
		w( 'theme-site-logo', { width: px( 132 ), image_size: 'full', _flex_size: 'none', __dynamic__: { image: '[elementor-tag id="" name="site-logo" settings="%7B%7D"]' } } ),
		{ ...megaMenu, settings: { ...megaMenu.settings, _flex_size: 'grow', _margin: dim( 0, 0, 0, 24 ), _margin_tablet: dim( 0, 0, 0, 0 ) } },
		box( { content_width: 'full', width: cu( 'auto' ), flex_direction: 'row', flex_align_items: 'center', flex_gap: gap( 8 ), _flex_size: 'none', hide_mobile: 'hidden-mobile' }, [
			button( 'Sign in', '#', 'link', { button_text_color: C.ink, hover_color: C.primary, text_padding: dim( 12, 12, 12, 12 ), ...T( { size: 15, weight: 700, lh: 1.2 } ) } ),
			button( 'Start free', '/pricing/', 'primary', { text_padding: dim( 11, 20, 11, 20 ), ...T( { size: 15, mobile: 14, weight: 700, lh: 1.2 } ) } ),
		] ),
	], false ),
];

/* ------------------------------------------------------------------ */
/* Footer (Theme Builder).                                             */
/* ------------------------------------------------------------------ */
const linkCol = ( title, links ) => box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), width: pct( 25 ), width_mobile: pct( 50 ) }, [
	heading( title, 'h4', { size: 15, weight: 700, lh: 1.4 }, { title_color: C.white } ),
	w( 'icon-list', {
		view: 'traditional', icon_list: links.map( ( [ t, url ] ) => ( { _id: uid(), text: t, selected_icon: { value: '', library: '' }, link: { url } } ) ),
		space_between: px( 18 ), text_color: C.navyText, text_color_hover: C.white, ...T( { prefix: 'icon_typography', size: 15, weight: 400, lh: 1.6 } ),
		...noGlobals( 'text_color', 'icon_typography_typography' ),
	} ),
] );
const footer = [
	box( {
		html_tag: 'footer', content_width: 'boxed', flex_direction: 'column', flex_gap: gap( 0 ),
		padding: dim( 88, 32, 28, 32 ), padding_mobile: dim( 64, 20, 28, 20 ), background_background: 'classic', background_color: C.navy,
	}, [
		box( { content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_gap: gap( 40, 64 ) }, [
			box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 16 ), width: pct( 33.333 ), width_tablet: pct( 100 ) }, [
				w( 'image', { image: media( 'signalry-logo-light' ), image_size: 'full', width: px( 132 ), align: 'start' } ),
				text( '<p>Customer feedback analytics for teams that want to listen better. Signalry is a made-up product for a performance demo.</p>', { size: 15, weight: 400, lh: 1.6 }, { text_color: C.navyText, _element_width: 'initial', _element_custom_width: px( 320 ) } ),
				w( 'social-icons', {
					social_icon_list: [ [ 'fab fa-linkedin', 'LinkedIn' ], [ 'fab fa-x-twitter', 'X' ], [ 'fab fa-youtube', 'YouTube' ] ].map( ( [ value ] ) => ( { _id: uid(), social_icon: { value, library: 'fa-brands' }, link: { url: '#' }, item_icon_color: 'custom', item_icon_primary_color: 'rgba(255,255,255,0.07)', item_icon_secondary_color: C.white } ) ),
					shape: 'rounded', align: 'start', icon_size: px( 16 ), icon_padding: em( 0.75 ), icon_spacing: px( 10 ), border_radius: dim( 10, 10, 10, 10 ),
					hover_primary_color: C.primary, hover_secondary_color: C.white,
				} ),
			] ),
			box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_gap: gap( 32, 0 ), width: pct( 66.666 ), width_tablet: pct( 100 ) }, [
				linkCol( 'Product', [ [ 'Feedback inbox', '/#features' ], [ 'AI insights', '/#features' ], [ 'Roadmaps', '/#features' ], [ 'Integrations', '/#features' ], [ 'Pricing', '/pricing/' ] ] ),
				linkCol( 'Solutions', [ [ 'Product teams', '/#tabs' ], [ 'Support teams', '/#tabs' ], [ 'Marketing teams', '/#tabs' ], [ 'Enterprise', '/contact/' ] ] ),
				linkCol( 'Resources', [ [ 'Blog', '/blog/' ], [ 'Guides', '/category/guides/' ], [ 'Help centre', '#' ], [ 'API docs', '#' ] ] ),
				linkCol( 'Company', [ [ 'About', '/about/' ], [ 'Careers', '#' ], [ 'Contact', '/contact/' ], [ 'Security', '#' ] ] ),
			] ),
		] ),
		box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_justify_content: 'space-between', flex_gap: gap( 12, 24 ), margin: dim( 48, 0, 0, 0 ), padding: dim( 24, 0, 0, 0 ), border_border: 'solid', border_width: dim( 1, 0, 0, 0 ), border_color: 'rgba(255,255,255,0.1)' }, [
			text( '<p>© 2026 Signalry. A demo site.</p>', { size: 14, weight: 400, lh: 1.5 }, { text_color: C.navyText, _element_width: 'auto' } ),
			text( '<p><a href="#">Privacy</a> · <a href="#">Terms</a></p>', { size: 14, weight: 400, lh: 1.5 }, { text_color: C.navyText, _element_width: 'auto', custom_css: 'selector a{color:inherit}selector a:hover{color:#fff}' } ),
		] ),
	], false ),
];

/* ------------------------------------------------------------------ */
/* Loop item (a blog card).                                            */
/* ------------------------------------------------------------------ */
const loopItem = [
	box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 0 ), padding: dim( 0, 0, 0, 0 ), custom_css: 'selector:hover img{transform:scale(1.04)}selector img{transition:transform .4s ease}selector:hover .elementor-heading-title{color:#3D5AFE}' }, [
		w( 'theme-post-featured-image', { image_size: 'large', link_to: 'custom', link: { url: '', is_external: '', nofollow: '' }, __dynamic__: { image: '[elementor-tag id="" name="post-featured-image" settings="%7B%7D"]', link: '[elementor-tag id="" name="post-url" settings="%7B%7D"]' }, height: px( 220 ), object_fit: 'cover', image_border_radius: dim( 16, 16, 16, 16 ), custom_css: 'selector{overflow:hidden;border-radius:16px}selector img{aspect-ratio:16/10;height:auto!important}' } ),
		w( 'post-info', {
			view: 'inline', icon_list: [ { _id: uid(), type: 'terms', taxonomy: 'category', link: '', show_icon: 'none', selected_icon: { value: '', library: '' } } ],
			text_color: C.primary, ...T( { prefix: 'icon_typography', size: 13, weight: 800, lh: 1.4, ls: 0.12 } ), icon_typography_text_transform: 'uppercase',
			_margin: dim( 20, 0, 0, 0 ), ...noGlobals( 'text_color', 'icon_typography_typography' ),
		} ),
		w( 'theme-post-title', { header_size: 'h3', link: '', __dynamic__: { title: '[elementor-tag id="" name="post-title" settings="%7B%7D"]', link: '[elementor-tag id="" name="post-url" settings="%7B%7D"]' }, title_color: C.ink, ...T( { size: 21, weight: 700, lh: 1.3, ls: -0.02 } ), _margin: dim( 8, 0, 0, 0 ), ...noGlobals( 'title_color', 'typography_typography' ) } ),
		w( 'theme-post-excerpt', { __dynamic__: { excerpt: '[elementor-tag id="" name="post-excerpt" settings="%7B%22max_length%22%3A%2220%22%7D"]' }, excerpt_length: 20, align: 'start', text_color: C.text, ...T( { size: 16, weight: 400, lh: 1.6 } ), _margin: dim( 10, 0, 0, 0 ), ...noGlobals( 'text_color', 'typography_typography' ) } ),
		w( 'post-info', {
			view: 'inline', icon_list: [ { _id: uid(), type: 'date', date_format: 'custom', custom_date_format: 'F j, Y', show_icon: 'none', selected_icon: { value: '', library: '' } } ],
			text_color: C.muted, ...T( { prefix: 'icon_typography', size: 14, weight: 400, lh: 1.5 } ), _margin: dim( 14, 0, 0, 0 ), ...noGlobals( 'text_color', 'icon_typography_typography' ),
		} ),
	], false ),
];

/* ------------------------------------------------------------------ */
/* Home page.                                                           */
/* ------------------------------------------------------------------ */
const hero = section( {
	padding: dim( 88, 32, 0, 32 ), padding_tablet: dim( 88, 32, 0, 32 ), padding_mobile: dim( 56, 20, 0, 20 ), flex_align_items: 'center', overflow: 'hidden',
	custom_css: 'selector{background:radial-gradient(ellipse 60% 50% at 85% 10%,#e3e8ff,transparent 70%),radial-gradient(ellipse 50% 40% at 0% 30%,#dcf6ee,transparent 70%),#fff}',
}, [
	box( { content_width: 'boxed', boxed_width: px( 820 ), flex_direction: 'column', flex_align_items: 'center', flex_gap: gap( 0 ) }, [
		text( '<p><strong>New</strong> Weekly AI summaries</p>', { size: 14, weight: 650, lh: 1.5 }, { _margin: dim( 0, 0, 22, 0 ), _element_width: 'auto', custom_css: 'selector{padding:6px 14px 6px 6px;border:1px solid #E6E9F0;border-radius:999px;background:#fff}selector p{margin:0}selector strong{padding:3px 10px;margin-right:4px;border-radius:999px;background:#E9EDFF;color:#2238C9;font-size:12px}' } ),
		heading( 'Hear what every customer is <span class="signalry-gradient">telling you</span>', 'h1', { size: 'clamp(40px, 6.2vw, 76px)', weight: 700, lh: 1.04, ls: -0.035 }, { align: 'center', custom_css: 'selector .elementor-heading-title{text-wrap:balance}selector .signalry-gradient{background:linear-gradient(90deg,#3D5AFE,#16C79A);-webkit-background-clip:text;background-clip:text;color:transparent}' } ),
		text( '<p>Signalry gathers feedback from tickets, surveys, reviews and calls, then shows your team which problems matter most.</p>', { size: 'clamp(17px, 1.5vw, 20px)', weight: 400, lh: 1.6 }, { align: 'center', _margin: dim( 22, 0, 0, 0 ), _element_width: 'initial', _element_custom_width: px( 620 ), custom_css: 'selector{max-width:100%}' } ),
		box( { content_width: 'full', flex_direction: 'row', flex_justify_content: 'center', flex_wrap: 'wrap', flex_gap: gap( 12 ), margin: dim( 32, 0, 0, 0 ), padding: dim( 0, 0, 0, 0 ) }, [
			button( 'Start free trial', '/pricing/', 'primary', arrowIcon ),
			button( 'Watch the tour', '#tour', 'secondary' ),
		] ),
		text( '<p>Free for 14 days · No card needed</p>', { size: 14, weight: 400, lh: 1.5 }, { text_color: C.muted, align: 'center', _margin: dim( 16, 0, 0, 0 ) } ),
	] ),
	w( 'image', { image: media( 'dashboard' ), image_size: 'full', width: pct( 100 ), _element_width: 'initial', _element_custom_width: px( 1100 ), _element_custom_width_mobile: pct( 100 ), _flex_align_self: 'center', _margin: dim( 64, 0, 0, 0 ), _margin_mobile: dim( 48, 0, 0, 0 ), custom_css: 'selector{max-width:100%}selector img{width:100%;border-radius:18px 18px 0 0;box-shadow:0 -10px 80px -20px rgba(61,90,254,.35)}' } ),
] );

const stat = ( end, suffix, label, decimals, separator = true ) => box( { content_width: 'full', flex_direction: 'column', width: pct( 25 ), width_tablet: pct( 25 ), width_mobile: pct( 50 ), padding: dim( 0, 0, 0, 24 ), padding_mobile: dim( 0, 0, 0, 0 ), border_border: 'solid', border_width: dim( 0, 0, 0, 1 ), border_width_mobile: dim( 0, 0, 0, 0 ), border_color: 'rgba(255,255,255,0.12)' }, [
	w( 'counter', {
		starting_number: 0, ending_number: end, suffix, title: label, thousand_separator: separator ? 'yes' : '', thousand_separator_char: '', duration: 2000,
		title_position: 'after', title_horizontal_alignment: 'start', number_position: 'start', number_alignment: 'start', title_gap: px( 10 ),
		number_color: C.white, ...T( { prefix: 'typography_number', size: 'clamp(36px, 4.6vw, 56px)', weight: 800, lh: 1, ls: -0.03 } ),
		title_color: '#C9D1E6', ...T( { prefix: 'typography_title', size: 15, weight: 400, lh: 1.5 } ),
		...noGlobals( 'number_color', 'typography_number_typography', 'title_color', 'typography_title_typography' ),
		custom_css: `selector .elementor-counter-number-suffix{color:#16C79A}${ decimals ? '' : '' }`,
	} ),
] );
const statsSection = ( items ) => section( { padding: dim( 64, 32, 64, 32 ), padding_tablet: dim( 64, 32, 64, 32 ), padding_mobile: dim( 48, 20, 48, 20 ), background_background: 'classic', background_color: C.navy }, [
	box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_gap: gap( 32, 0 ) }, items ),
] );
const stats = statsSection( [
	stat( 18, 'M+', 'Pieces of feedback analysed' ),
	stat( 2400, '+', 'Teams listening with Signalry' ),
	stat( 31, 'h', 'Saved per team, every week' ),
	stat( 4.8, '/5', 'Average rating from customers', 1 ),
] );

const tour = section( { _element_id: 'tour', background_background: 'classic', background_color: C.surface }, [
	head( 'Product tour', 'See Signalry in 15 seconds', 'From scattered feedback to a clear list of what to fix and build next.' ),
	w( 'video', {
		video_type: 'hosted', hosted_url: { id: '@id:signalry-tour', url: '@url:signalry-tour' }, controls: 'yes', preload: 'none',
		show_image_overlay: 'yes', image_overlay: media( 'video-poster' ), image_overlay_size: 'full', show_play_icon: 'yes', play_icon: { value: 'fas fa-play', library: 'fa-solid' }, aspect_ratio: '169',
		play_icon_color: C.primary, play_icon_size: px( 28 ),
		_element_width: 'initial', _element_custom_width: px( 960 ), _element_custom_width_mobile: pct( 100 ), _flex_align_self: 'center',
		custom_css: 'selector{max-width:100%}selector .elementor-wrapper{border-radius:16px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(14,21,37,.35);background:#0B1430}selector .elementor-custom-embed-play svg{margin-left:4px}selector .elementor-custom-embed-play{width:92px;height:92px;border-radius:50%;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.3);display:grid;place-items:center;transition:transform .2s}selector .elementor-custom-embed-image-overlay:hover .elementor-custom-embed-play{transform:translate(-50%,-50%) scale(1.08)}@media (max-width:767px){selector .elementor-custom-embed-play{width:72px;height:72px}}',
	} ),
] );

const checks = ( items ) => w( 'icon-list', {
	view: 'traditional', icon_list: items.map( ( t ) => ( { _id: uid(), text: t, selected_icon: { value: 'fas fa-check-circle', library: 'fa-solid' } } ) ),
	space_between: px( 20 ), icon_color: C.mint, icon_size: px( 20 ), text_indent: px( 12 ), text_color: C.ink, ...T( { prefix: 'icon_typography', size: 16, weight: 600, lh: 1.6 } ),
	_margin: dim( 22, 0, 26, 0 ), ...noGlobals( 'icon_color', 'text_color', 'icon_typography_typography' ),
} );
const tabPanel = ( title, body, items, link, img ) => box( { _title: title, content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_align_items: 'center', flex_gap: gap( 32, 64 ), padding: dim( 0, 0, 0, 0 ) }, [
	box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 0 ), width: pct( 41.666 ), width_tablet: pct( 100 ) }, [
		heading( title, 'h3', { size: 'clamp(24px, 2.6vw, 32px)', weight: 700, lh: 1.15, ls: -0.025 } ),
		text( `<p>${ body }</p>`, { size: 16, weight: 400, lh: 1.6 }, { _margin: dim( 14, 0, 0, 0 ) } ),
		checks( items ),
		button( link, '#', 'link', { _element_width: 'auto' } ),
	] ),
	box( { content_width: 'full', flex_direction: 'column', width: pct( 58.333 ), width_tablet: pct( 100 ), padding: dim( 36, 36, 36, 36 ), padding_mobile: dim( 20, 20, 20, 20 ), border_radius: dim( 16, 16, 16, 16 ), background_background: 'gradient', background_color: C.primarySoft, background_color_b: C.mintSoft, background_gradient_angle: { unit: 'deg', size: 135 } }, [
		w( 'image', { image: media( img ), image_size: 'full', width: pct( 100 ), image_border_radius: dim( 12, 12, 12, 12 ), image_box_shadow_box_shadow_type: 'yes', image_box_shadow_box_shadow: { horizontal: 0, vertical: 30, blur: 60, spread: -30, color: 'rgba(14,21,37,0.35)' } } ),
	] ),
] );
const tabsData = [
	[ 'Product teams', 'Know what to build next', 'See which requests come up most, who asks for them and how much revenue is behind each one.', [ 'Requests ranked by customers and ARR', 'Link feedback to roadmap items', 'Tell customers when you ship' ], 'Signalry for product teams →', 'tab-product' ],
	[ 'Support teams', 'Tag tickets before anyone reads them', 'Every ticket gets a theme and a sentiment the moment it arrives, so trends show up in hours, not weeks.', [ 'Automatic themes and sentiment', 'Alerts when an issue spikes', 'Hand-offs to product in one click' ], 'Signalry for support teams →', 'tab-support' ],
	[ 'Marketing teams', 'Find your happiest customers', 'Spot promoters by segment, collect approved quotes and turn real praise into reviews and case studies.', [ 'NPS by segment and plan', 'Approved quotes, ready to use', 'Review requests at the right time' ], 'Signalry for marketing teams →', 'tab-marketing' ],
];
const tabs = {
	id: uid(), elType: 'widget', widgetType: 'nested-tabs', isInner: false,
	settings: {
		tabs: tabsData.map( ( t ) => ( { _id: uid(), tab_title: t[ 0 ] } ) ),
		tabs_direction: 'block-start', tabs_justify_horizontal: 'center', breakpoint_selector: 'none', horizontal_scroll: 'enable',
		tabs_title_space_between: px( 6 ), tabs_title_spacing: px( 32 ),
		tabs_title_background_color_background: 'classic', tabs_title_background_color_color: 'transparent',
		tabs_title_background_color_active_background: 'classic', tabs_title_background_color_active_color: C.white,
		tabs_title_border_border: 'none', tabs_title_border_radius: dim( 10, 10, 10, 10 ), tabs_title_padding: dim( 12, 18, 12, 18 ),
		tabs_title_box_shadow_active_box_shadow_type: 'yes', tabs_title_box_shadow_active_box_shadow: { horizontal: 0, vertical: 6, blur: 20, spread: -10, color: 'rgba(14,21,37,0.35)' },
		...T( { prefix: 'title_typography', size: 15, weight: 700, lh: 1.2 } ), title_text_color: C.text, title_text_color_hover: C.ink, title_text_color_active: C.ink,
		box_background_color_background: 'classic', box_background_color_color: 'transparent', box_border_border: 'none', box_padding: dim( 0, 0, 0, 0 ),
		__globals__: { title_typography_typography: '', title_text_color: '', title_text_color_hover: '', title_text_color_active: '' },
		custom_css: 'selector .e-n-tabs-heading{width:max-content;max-width:100%;margin:0 auto;padding:6px;border-radius:14px;background:#F5F7FB}',
	},
	elements: tabsData.map( ( t ) => tabPanel( t[ 1 ], t[ 2 ], t[ 3 ], t[ 4 ], t[ 5 ] ) ),
};
const solutions = section( { _element_id: 'tabs' }, [ head( 'Solutions', 'Built for every team that talks to customers' ), tabs ] );

const quote = ( q, name, role, avatar ) => box( { _title: name, content_width: 'full', flex_direction: 'column', flex_gap: gap( 0 ), padding: dim( 32, 32, 32, 32 ), padding_mobile: dim( 28, 28, 28, 28 ), background_background: 'classic', background_color: C.white, border_radius: dim( 16, 16, 16, 16 ), min_height: pct( 100 ) }, [
	heading( '★★★★★', 'div', { size: 16, weight: 400, lh: 1.6 }, { title_color: C.amber } ),
	text( `<p>“${ q }”</p>`, { size: 18, weight: 600, lh: 1.5 }, { text_color: C.ink, _margin: dim( 14, 0, 24, 0 ) } ),
	box( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_wrap: 'nowrap', flex_align_items: 'center', flex_gap: gap( 14 ), margin: dim( 0, 0, 0, 0 ), custom_css: 'selector{margin-top:auto}' }, [
		w( 'image', { image: media( avatar ), image_size: 'thumbnail', width: px( 48 ), image_border_radius: dim( 50, 50, 50, 50, '%' ), _element_width: 'auto', _flex_size: 'none' } ),
		box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 2 ), width: cu( 'auto' ), _flex_size: 'grow' }, [
			heading( name, 'div', { size: 15, weight: 700, lh: 1.3 } ),
			text( `<p>${ role }</p>`, { size: 14, weight: 400, lh: 1.5 } ),
		] ),
	] ),
] );
const quotes = [
	[ 'We used to guess what customers wanted. Now the weekly summary tells us, and it’s usually right.', 'Maya Alvarez', 'Head of Product, Northwind Apps', 'avatar-ma' ],
	[ 'Ticket tagging went from a Friday chore to something that just happens. Our team got four hours back each week.', 'James Kim', 'Support Lead, Brightside Health', 'avatar-jk' ],
	[ 'We found our biggest churn reason in the first week. It was hiding in app reviews nobody read.', 'Sara Rahman', 'VP Customer Success, Fieldnote', 'avatar-sr' ],
	[ 'Every roadmap meeting now starts with real numbers: how many customers asked, and what they’re worth.', 'Daniel Lee', 'CPO, Orbitly', 'avatar-dl' ],
];
const carousel = {
	id: uid(), elType: 'widget', widgetType: 'nested-carousel', isInner: false,
	settings: {
		carousel_name: 'Testimonials', carousel_items: quotes.map( ( q ) => ( { _id: uid(), slide_title: q[ 1 ] } ) ),
		slides_to_show: '3', slides_to_show_tablet: '2', slides_to_show_mobile: '1', slides_to_scroll: '1',
		autoplay: 'no', infinite: 'no', speed: 500, equal_height: 'yes', image_spacing_custom: px( 20 ),
		arrows: 'yes', pagination: 'bullets',
		navigation_previous_icon: { value: 'fas fa-arrow-left', library: 'fa-solid' }, navigation_next_icon: { value: 'fas fa-arrow-right', library: 'fa-solid' },
		arrows_size: px( 18 ), arrow_normal_color: C.ink,
		custom_css: 'selector{padding-bottom:36px}selector .elementor-swiper-button{top:-84px!important;bottom:auto;transform:none;width:48px;height:48px;border:1px solid #E6E9F0;border-radius:50%;background:#fff;display:grid;place-items:center}selector .elementor-swiper-button-prev{left:auto!important;right:58px!important}selector .elementor-swiper-button-next{right:0!important}selector .swiper-pagination-bullet{width:8px;height:8px;border-radius:9px;background:#c9cfdb;opacity:1;transition:width .2s}selector .swiper-pagination-bullet-active{width:26px;background:#3D5AFE}selector .swiper-pagination{bottom:0!important}@media (max-width:767px){selector .elementor-swiper-button{top:-60px!important}}',
	},
	elements: quotes.map( ( q ) => quote( ...q ) ),
};
const customers = section( { _element_id: 'customers', background_background: 'classic', background_color: C.surface, overflow: 'hidden' }, [
	box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), padding: dim( 0, 0, 36, 0 ), padding_mobile: dim( 0, 0, 84, 0 ) }, [
		eyebrow( 'Customers' ),
		heading( 'Teams that listen better', 'h2', H2 ),
	] ),
	carousel,
] );

const faqItems = [
	[ 'How long does setup take?', 'Most teams connect their first source in under ten minutes. Signalry starts finding themes as soon as feedback arrives, and the first weekly summary is ready the following Monday.' ],
	[ 'Which tools does Signalry connect to?', 'Help desks, live chat, survey tools, CRMs, app stores and call recorders. You can also upload a CSV or forward emails to your Signalry inbox.' ],
	[ 'Is our customer data safe?', 'Data is encrypted in transit and at rest, stored in the region you choose, and never used to train shared models. SSO and audit logs come with every paid plan.' ],
	[ 'Can we try it before we pay?', 'Yes. Every plan has a 14-day free trial with all features, and you don’t need a card to start.' ],
	[ 'How is pricing calculated?', 'By the amount of feedback analysed each month, not by seats. Invite your whole company at no extra cost.' ],
];
const accordionOf = ( faqItems ) => ( {
	id: uid(), elType: 'widget', widgetType: 'nested-accordion', isInner: false,
	settings: {
		items: faqItems.map( ( f ) => ( { _id: uid(), item_title: f[ 0 ] } ) ),
		default_state: 'expanded', max_items_expended: 'multiple', title_tag: 'h3',
		accordion_item_title_position_horizontal: 'stretch', accordion_item_title_icon_position: 'end',
		accordion_item_title_icon: { value: 'fas fa-plus', library: 'fa-solid' }, accordion_item_title_icon_active: { value: 'fas fa-minus', library: 'fa-solid' },
		accordion_item_title_space_between: px( 0 ), accordion_item_title_distance_from_content: px( 0 ),
		accordion_border_normal_border: 'solid', accordion_border_normal_width: dim( 0, 0, 1, 0 ), accordion_border_normal_color: C.line,
		accordion_padding: dim( 22, 0, 22, 0 ),
		...T( { prefix: 'title_typography', size: 18, weight: 700, lh: 1.4, ls: -0.01 } ), normal_title_text_color: C.ink,
		icon_size: px( 12 ), normal_icon_color: C.ink, active_icon_color: C.white,
		content_padding: dim( 0, 48, 24, 0 ), content_border_border: 'none',
		__globals__: { title_typography_typography: '', normal_title_text_color: '' },
		custom_css: 'selector .e-n-accordion-item:first-child{border-top:1px solid #E6E9F0}selector .e-n-accordion-item-title-icon{width:32px;height:32px;border-radius:50%;background:#F5F7FB;display:grid;place-items:center;flex:none}selector .e-n-accordion-item[open] .e-n-accordion-item-title-icon{background:#3D5AFE}',
	},
	elements: faqItems.map( ( f ) => box( { _title: f[ 0 ], content_width: 'full', padding: dim( 0, 0, 0, 0 ) }, [ text( `<p>${ f[ 1 ] }</p>` ) ] ) ),
} );
const faqSection = ( eb, title, ld, btn, items ) => section( { _element_id: 'faq', background_background: 'classic', background_color: C.surface }, [
	box( { content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_gap: gap( 32, 80 ) }, [
		box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), width: pct( 33.333 ), width_tablet: pct( 100 ) }, [
			eyebrow( eb ),
			heading( title, 'h2', H2 ),
			lead( ld ),
			...( btn ? [ button( btn, '/contact/', 'secondary', { _element_width: 'auto', _margin: dim( 10, 0, 0, 0 ) } ) ] : [] ),
		] ),
		box( { content_width: 'full', flex_direction: 'column', width: pct( 58.333 ), width_tablet: pct( 100 ), margin: dim( 0, 0, 0, 0 ), custom_css: 'selector{margin-left:auto}' }, [ accordionOf( items ) ] ),
	] ),
] );
const faq = faqSection( 'FAQ', 'Questions, answered', 'Can’t find what you’re looking for? Our team replies within a few hours.', 'Contact sales', faqItems );

const blog = section( { _element_id: 'blog', padding: dim( 0, 32, 120, 32 ), padding_tablet: dim( 0, 32, 96, 32 ), padding_mobile: dim( 0, 20, 72, 20 ) }, [
	box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_justify_content: 'space-between', flex_align_items: 'flex-end', flex_gap: gap( 16 ), padding: dim( 0, 0, 36, 0 ) }, [
		box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), width: pct( 60 ), width_mobile: pct( 100 ) }, [ eyebrow( 'Blog' ), heading( 'Latest from the blog', 'h2', H2 ) ] ),
		button( 'View all posts', '/blog/', 'link', { ...arrowIcon, _element_width: 'auto' } ),
	] ),
	w( 'loop-grid', {
		template_id: '@tpl:loop', posts_per_page: 3, columns: '3', columns_tablet: '2', columns_mobile: '1',
		post_query_post_type: 'post', post_query_orderby: 'post_date', post_query_order: 'desc',
		column_gap: px( 32 ), row_gap: px( 28 ), equal_height: '',
	} ),
] );

/* ------------------------------------------------------------------ */
/* Round 2 ("a real project"): shared parts.                            */
/* ------------------------------------------------------------------ */

// Contact Form 7, styled with custom CSS on the card (the same look as the
// Elite build's Form Card); the form is CF7's shortcode in a Shortcode widget.
const FORM_CSS = 'selector{box-shadow:0 30px 60px -30px rgba(14,21,37,.35)}selector .wpcf7-form{display:grid;gap:16px}selector .wpcf7-form p{margin:0}selector .form__row{display:grid;gap:16px}@media (min-width:640px){selector .form__row{grid-template-columns:1fr 1fr}}selector label{display:block;color:#0E1525;font-size:14px;font-weight:700;line-height:1.4}selector .wpcf7-form-control-wrap{display:block;margin-top:6px}selector input[type=text],selector input[type=email],selector select,selector textarea{box-sizing:border-box;width:100%;min-height:48px;padding:12px 14px;border:1px solid #cfd5e1;border-radius:10px;background:#fff;color:#0E1525;font-family:inherit;font-size:16px;line-height:1.4;transition:border-color .2s,box-shadow .2s}selector textarea{min-height:120px;resize:vertical}selector input:focus,selector select:focus,selector textarea:focus{border-color:#3D5AFE;outline:0;box-shadow:0 0 0 4px #E9EDFF}selector .form__consent .wpcf7-list-item{margin:0}selector .form__consent label{display:flex;gap:10px;align-items:flex-start;color:#6B7487;font-size:13px;font-weight:400;line-height:1.5}selector .form__consent input{flex:none;width:18px;height:18px;margin:2px 0 0;accent-color:#3D5AFE}selector .wpcf7-submit{width:100%;min-height:52px;padding:0 22px;border:0;border-radius:10px;background:#3D5AFE;color:#fff;font-family:inherit;font-size:16px;font-weight:700;cursor:pointer;transition:background-color .2s}selector .wpcf7-submit:hover{background:#2238C9}@media (max-width:767px){selector .wpcf7-submit{min-height:48px;font-size:15px}}selector .wpcf7-spinner{position:absolute}selector .wpcf7-response-output{margin:0;font-size:14px}';
const formCard = ( title, note, form ) => box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 0 ), padding: dim( 36, 36, 36, 36 ), padding_mobile: dim( 28, 28, 28, 28 ), background_background: 'classic', background_color: C.white, border_radius: dim( 16, 16, 16, 16 ), custom_css: FORM_CSS }, [
	heading( title, 'h3', { size: 21, weight: 700, lh: 1.3, ls: -0.02 }, { _margin: dim( 0, 0, 6, 0 ) } ),
	text( `<p>${ note }</p>`, { size: 15, weight: 400, lh: 1.6 }, { text_color: C.muted, _margin: dim( 0, 0, 20, 0 ) } ),
	w( 'shortcode', { shortcode: `[contact-form-7 id="@cf7:${ form }"]` } ),
] );

const GLOW = 'radial-gradient(ellipse 60% 80% at 100% 0%,rgba(61,90,254,.45),transparent 70%),radial-gradient(ellipse 50% 70% at 0% 100%,rgba(22,199,154,.25),transparent 70%),#0B1430';
const whiteChecks = ( items ) => ( { ...checks( items ), settings: { ...checks( items ).settings, text_color: C.white } } );
const demo = ( eb, title, ld, items ) => section( { _element_id: 'demo', custom_css: `selector{background:${ GLOW }}` }, [
	box( { content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_align_items: 'center', flex_gap: gap( 40, 80 ) }, [
		box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), width: pct( 50 ), width_tablet: pct( 100 ) }, [
			eyebrow( eb ),
			heading( title, 'h2', H2, { title_color: C.white } ),
			lead( ld ),
			...( items ? [ whiteChecks( items ) ] : [] ),
		].map( ( e, i ) => ( i === 0 ? { ...e, settings: { ...e.settings, title_color: C.mint } } : i === 2 ? { ...e, settings: { ...e.settings, text_color: '#C9D1E6' } } : e ) ) ),
		box( { content_width: 'full', flex_direction: 'column', width: pct( 41.666 ), width_tablet: pct( 100 ), custom_css: 'selector{margin-left:auto}' }, [ formCard( 'Book your demo', 'We reply within one working day.', 'demo' ) ] ),
	] ),
] );

// Logo row: the Image Carousel scrolling without stops (a common Elementor
// way to make a marquee: no Pro widget for it), logos grey until hovered.
const LOGOS = [ 'northwind', 'brightside', 'fieldnote', 'orbitly', 'lumen', 'kitepay', 'harbor', 'quanta' ];
const logos = ( boxed = false ) => section( {
	padding: dim( 56, 32, 56, 32 ), padding_tablet: dim( 56, 32, 56, 32 ), padding_mobile: dim( 40, 20, 40, 20 ),
	border_border: 'solid', border_width: dim( boxed ? 1 : 0, 0, 1, 0 ), border_color: C.line,
}, [
	text( '<p>Trusted by 2,400+ product, support and marketing teams</p>', { size: 14, weight: 700, lh: 1.5 }, { text_color: C.muted, align: 'center', _margin: dim( 0, 0, 24, 0 ) } ),
	w( 'image-carousel', {
		carousel: LOGOS.map( ( l ) => ( { id: `@id:logo-${ l }`, url: `@url:logo-${ l }` } ) ), thumbnail_size: 'full',
		slides_to_show: '6', slides_to_show_tablet: '4', slides_to_show_mobile: '3', slides_to_scroll: '1',
		navigation: 'none', autoplay: 'yes', autoplay_speed: 1, pause_on_hover: 'yes', pause_on_interaction: 'yes', infinite: 'yes', speed: 3500,
		image_spacing: 'custom', image_spacing_custom: px( 56 ), image_stretch: 'no',
		custom_css: 'selector .swiper-wrapper{transition-timing-function:linear!important}selector .swiper-slide{display:flex;align-items:center;justify-content:center}selector .swiper-slide-image{width:auto!important;height:36px;opacity:.55;filter:grayscale(1);transition:opacity .2s,filter .2s}selector .swiper-slide-image:hover{opacity:1;filter:none}@media (max-width:767px){selector .swiper-slide-image{height:32px}}selector{-webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}',
	} ),
] );

// Feature grid: Icon Box widgets in bordered cards.
const feature = ( icon, soft, ink, title, body ) => box( { content_width: 'full', flex_direction: 'column', width: pct( 33.333 ), width_tablet: pct( 50 ), width_mobile: pct( 100 ), padding: dim( 32, 32, 32, 32 ), padding_mobile: dim( 28, 28, 28, 28 ), background_background: 'classic', background_color: C.white, border_border: 'solid', border_width: dim( 1, 1, 1, 1 ), border_color: C.line, border_radius: dim( 16, 16, 16, 16 ), custom_css: 'selector{transition:border-color .2s,box-shadow .2s,transform .2s}selector:hover{border-color:transparent;box-shadow:0 30px 60px -30px rgba(14,21,37,.35);transform:translateY(-3px)}' }, [
	w( 'icon-box', {
		selected_icon: { value: icon, library: 'fa-solid' }, view: 'stacked', shape: 'rounded', position: 'top', text_align: 'left',
		title_text: title, description_text: body, title_size: 'h3',
		primary_color: soft, secondary_color: ink, icon_size: px( 22 ), icon_padding: px( 13 ), icon_space: px( 20 ), border_radius: dim( 12, 12, 12, 12 ), title_bottom_space: px( 10 ),
		title_color: C.ink, ...T( { prefix: 'title_typography', size: 18, weight: 700, lh: 1.3, ls: -0.01 } ),
		description_color: C.text, ...T( { prefix: 'description_typography', size: 15, weight: 400, lh: 1.6 } ),
		...noGlobals( 'primary_color', 'title_color', 'description_color', 'title_typography_typography', 'description_typography_typography' ),
	} ),
] );
const features = section( { _element_id: 'features' }, [
	head( 'Features', 'Everything customers say, finally in one place', 'Connect your tools once. Signalry reads, tags and sums up every piece of feedback, so nobody has to.' ),
	box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_gap: gap( 24 ), flex_gap_mobile: gap( 20 ), custom_css: 'selector>.e-con{flex-grow:0;width:calc((100% - 48px)/3)}@media (max-width:1024px){selector>.e-con{width:calc((100% - 24px)/2)}}@media (max-width:767px){selector>.e-con{width:100%}}' }, [
		feature( 'fas fa-inbox', C.primarySoft, C.primary, 'One feedback inbox', 'Tickets, surveys, app reviews, calls and chats arrive in one place, without copy and paste.' ),
		feature( 'fas fa-magic', C.mintSoft, '#0B8A68', 'Themes found by AI', 'Every piece of feedback gets a theme and a sentiment the moment it lands. You review, it learns.' ),
		feature( 'fas fa-chart-line', C.coralSoft, '#E25A37', 'Trends you can trust', 'See which issues grow week by week, by plan, segment or region, with real numbers behind every chart.' ),
		feature( 'fas fa-file-alt', C.amberSoft, '#B7811B', 'Weekly AI summaries', 'Every Monday, a short read on what changed, what’s new and what needs attention, for the whole team.' ),
		feature( 'fas fa-route', C.primarySoft, C.primary, 'Roadmaps with revenue', 'Link requests to roadmap items and see how many customers, and how much revenue, each one represents.' ),
		feature( 'fas fa-bell', C.mintSoft, '#0B8A68', 'Alerts when issues spike', 'Get a Slack or email alert when a theme suddenly grows, so you hear about problems before churn does.' ),
	] ),
] );

// Pricing: Nested Tabs (Monthly / Yearly), three plan cards in each.
const plan = ( name, forWho, price, perMonth, note, cta, url, look, items, popular = false ) => box( {
	content_width: 'full', flex_direction: 'column', flex_gap: gap( 0 ), width: pct( 33.333 ), width_tablet: pct( 100 ),
	padding: dim( 36, 32, 36, 32 ), padding_mobile: dim( 32, 28, 32, 28 ), background_background: 'classic', background_color: C.white,
	border_border: 'solid', border_width: popular ? dim( 2, 2, 2, 2 ) : dim( 1, 1, 1, 1 ), border_color: popular ? C.primary : C.line, border_radius: dim( 16, 16, 16, 16 ),
	custom_css: popular ? 'selector{position:relative;box-shadow:0 30px 60px -30px rgba(14,21,37,.35)}@media (min-width:1025px){selector{margin-top:-12px;padding-top:48px;padding-bottom:48px}}' : '',
}, [
	...( popular ? [ heading( 'Most popular', 'div', { size: 12, weight: 800, lh: 1.4, ls: 0.04 }, { title_color: C.white, _position: 'absolute', _offset_orientation_h: 'start', _offset_x: px( 28 ), _offset_y: px( -13 ), _element_width: 'auto', custom_css: 'selector{padding:4px 12px;border-radius:999px;background:#3D5AFE}' } ) ] : [] ),
	heading( name, 'h3', { size: 18, weight: 700, lh: 1.3, ls: -0.01 } ),
	text( `<p>${ forWho }</p>`, { size: 15, weight: 400, lh: 1.6 }, { text_color: C.muted, _margin: dim( 6, 0, 0, 0 ) } ),
	text( `<p><strong>${ price }</strong>${ perMonth ? ' / month' : '' }</p>`, { size: 15, weight: 400, lh: 1.6 }, { text_color: C.muted, _margin: dim( 24, 0, 4, 0 ), custom_css: 'selector strong{color:#0E1525;font-size:48px;font-weight:800;line-height:1;letter-spacing:-.03em;margin-right:6px}' } ),
	text( `<p>${ note }</p>`, { size: 14, weight: 400, lh: 1.5 }, { text_color: C.muted } ),
	button( cta, url, look, { align: 'justify', _margin: dim( 24, 0, 0, 0 ) } ),
	{ ...checks( items ), settings: { ...checks( items ).settings, text_color: C.text, ...T( { prefix: 'icon_typography', size: 15, weight: 550, lh: 1.6 } ), _margin: dim( 28, 0, 0, 0 ), _padding: dim( 24, 0, 0, 0 ), _border_border: 'solid', _border_width: dim( 1, 0, 0, 0 ), _border_color: C.line, space_between: px( 16 ) } },
] );
const plans = ( yearly ) => box( { _title: yearly ? 'Yearly' : 'Monthly', content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_align_items: 'flex-start', flex_align_items_tablet: 'stretch', flex_gap: gap( 24, 24 ), flex_gap_tablet: gap( 20, 20 ), padding: dim( 28, 0, 0, 0 ) }, [
	plan( 'Starter', 'For small teams getting started', yearly ? '$47' : '$59', true, yearly ? '$564 billed yearly' : 'Up to 2,000 pieces of feedback a month', 'Start free trial', '/pricing/', 'secondary', [ '3 sources', 'AI themes and sentiment', 'Weekly summaries', 'Email support' ] ),
	plan( 'Growth', 'For teams that run on feedback', yearly ? '$143' : '$179', true, yearly ? '$1,716 billed yearly' : 'Up to 10,000 pieces of feedback a month', 'Start free trial', '/pricing/', 'primary', [ 'Unlimited sources', 'Roadmaps with revenue', 'Spike alerts in Slack', 'Priority support' ], true ),
	plan( 'Enterprise', 'For larger companies', 'Custom', false, 'Any volume, billed yearly', 'Talk to sales', '/contact/', 'secondary', [ 'SSO and audit logs', 'Data region of your choice', 'Custom AI models', 'Dedicated success manager' ] ),
] );
const billing = () => ( {
	...tabs,
	id: uid(),
	settings: {
		...tabs.settings,
		tabs: [ { _id: uid(), tab_title: 'Monthly' }, { _id: uid(), tab_title: 'Yearly <small>−20%</small>' } ],
		custom_css: tabs.settings.custom_css + 'selector .e-n-tab-title small{margin-left:6px;padding:2px 8px;border-radius:999px;background:#E2F8F1;color:#067A5B;font-size:12px;font-weight:800}',
	},
	elements: [ plans( false ), plans( true ) ],
} );
const pricingNote = ( html ) => text( `<p>${ html }</p>`, { size: 14, weight: 400, lh: 1.5 }, { text_color: C.muted, align: 'center', _margin: dim( 28, 0, 0, 0 ) } );
const pricing = section( { _element_id: 'pricing' }, [
	head( 'Pricing', 'Pay for feedback, not for seats', 'Every plan includes unlimited users and a 14-day free trial.' ),
	billing(),
	pricingNote( 'Prices in USD, excluding tax. <a href="/pricing/">Compare all features →</a>' ),
] );

const home = [
	hero, logos(), stats, features, tour, solutions, customers, pricing, faq, blog,
	demo( 'Book a demo', 'See what your customers are telling you', 'A 30-minute call with our team, using your own feedback. No slides, no pressure.', [ 'Bring a CSV or connect a source on the call', 'Get your top five themes, free', 'Leave with a plan, whether you buy or not' ] ),
];

/* ------------------------------------------------------------------ */
/* Inner pages.                                                         */
/* ------------------------------------------------------------------ */
const GRADIENT_CSS = 'selector .elementor-heading-title{text-wrap:balance}selector .signalry-gradient{background:linear-gradient(90deg,#3D5AFE,#16C79A);-webkit-background-clip:text;background-clip:text;color:transparent}';
const pageHero = ( eb, title, ld ) => section( {
	padding: dim( 88, 32, 80, 32 ), padding_tablet: dim( 88, 32, 80, 32 ), padding_mobile: dim( 56, 20, 48, 20 ), flex_align_items: 'center', flex_gap: gap( 0 ),
	custom_css: 'selector{background:radial-gradient(ellipse 55% 70% at 90% 0%,#e3e8ff,transparent 70%),radial-gradient(ellipse 45% 60% at 0% 100%,#dcf6ee,transparent 70%),#fff}',
}, [
	eyebrow( eb, 'center' ),
	heading( title, 'h1', { size: 'clamp(36px, 5.2vw, 64px)', weight: 700, lh: 1.06, ls: -0.035 }, { align: 'center', _margin: dim( 14, 0, 0, 0 ), _element_width: 'initial', _element_custom_width: px( 820 ), custom_css: GRADIENT_CSS + 'selector{max-width:100%}' } ),
	text( `<p>${ ld }</p>`, { size: 'clamp(17px, 1.5vw, 20px)', weight: 400, lh: 1.6 }, { align: 'center', _margin: dim( 20, 0, 0, 0 ), _element_width: 'initial', _element_custom_width: px( 640 ), custom_css: 'selector{max-width:100%}' } ),
] );
const grad = ( t ) => `<span class="signalry-gradient">${ t }</span>`;
const card = ( settings, elements ) => box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 0 ), padding: dim( 28, 28, 28, 28 ), border_radius: dim( 16, 16, 16, 16 ), background_background: 'classic', background_color: C.white, ...settings }, elements );
const row = ( settings, elements ) => box( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_gap: gap( 20, 24 ), ...settings }, elements );

// About
const about = [
	pageHero( 'About us', `We help companies ${ grad( 'actually listen' ) } to their customers`, 'Signalry started with a simple question: why does it take a churned customer for a team to hear a problem everyone already mentioned?' ),
	section( { padding: dim( 0, 32, 120, 32 ), padding_tablet: dim( 0, 32, 96, 32 ), padding_mobile: dim( 0, 20, 72, 20 ) }, [
		box( { content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_align_items: 'center', flex_gap: gap( 40, 80 ) }, [
			box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 0 ), width: pct( 50 ), width_tablet: pct( 100 ) }, [
				eyebrow( 'Our story' ),
				heading( 'Feedback was everywhere. Answers weren’t.', 'h2', H2, { _margin: dim( 14, 0, 0, 0 ) } ),
				lead( 'In 2021 our founders ran product and support at a fast-growing SaaS company. They had thousands of tickets, three survey tools and a spreadsheet nobody trusted.' ),
				text( '<p>So they built a tool that read everything, grouped it into themes and sent a short summary every Monday. Within a quarter, churn fell by a third. Other teams asked to use it, and Signalry was born.</p><p>Today more than 2,400 teams use Signalry to decide what to fix, what to build and who to thank.</p>', undefined, { _margin: dim( 16, 0, 0, 0 ), custom_css: 'selector p{margin:0 0 16px}selector p:last-child{margin:0}' } ),
			].map( ( e, i ) => ( i === 2 ? { ...e, settings: { ...e.settings, _margin: dim( 20, 0, 0, 0 ) } } : e ) ) ),
			box( { content_width: 'full', flex_direction: 'column', width: pct( 50 ), width_tablet: pct( 100 ) }, [
				w( 'image', { image: media( 'insights' ), image_size: 'full', width: pct( 100 ), image_border_radius: dim( 16, 16, 16, 16 ), image_box_shadow_box_shadow_type: 'yes', image_box_shadow_box_shadow: { horizontal: 0, vertical: 30, blur: 60, spread: -30, color: 'rgba(14,21,37,0.35)' } } ),
			] ),
		] ),
	] ),
	statsSection( [
		stat( 2021, '', 'Founded, in San Francisco', 0, false ),
		stat( 64, '', 'People across 11 countries' ),
		stat( 2400, '+', 'Teams listening with Signalry' ),
		stat( 18, 'M+', 'Pieces of feedback analysed' ),
	] ),
	section( { background_background: 'classic', background_color: C.surface }, [
		head( 'What we believe', 'Three ideas behind everything we build' ),
		row( { flex_direction_tablet: 'row' }, [
			[ '01', 'Every customer deserves to be heard', 'Not just the loudest ones. Signalry gives a quiet app review the same weight as an angry escalation.' ],
			[ '02', 'Show the numbers, not the noise', 'Every theme comes with how many customers mentioned it and what they’re worth, so decisions are easy to defend.' ],
			[ '03', 'Your data stays yours', 'We never train shared models on customer data, and you choose where it lives. Trust is the product.' ],
		].map( ( [ n, t, d ] ) => card( { width: pct( 33.333 ), width_mobile: pct( 100 ) }, [
			heading( n, 'div', { size: 32, weight: 800, lh: 1 }, { title_color: C.primary, _margin: dim( 0, 0, 14, 0 ) } ),
			heading( t, 'h3', { size: 18, weight: 700, lh: 1.3, ls: -0.01 } ),
			text( `<p>${ d }</p>`, { size: 15, weight: 400, lh: 1.6 }, { _margin: dim( 10, 0, 0, 0 ) } ),
		] ) ) ),
	] ),
	section( {}, [
		head( 'Leadership', 'The team behind Signalry' ),
		box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_gap: gap( 32, 20 ), custom_css: 'selector>.e-con{flex-grow:0;width:calc((100% - 60px)/4)}@media (max-width:767px){selector>.e-con{width:calc((100% - 20px)/2)}}' }, [
			[ 'avatar-ma', 'Maya Alvarez', 'Co-founder & CEO' ],
			[ 'avatar-dl', 'Daniel Lee', 'Co-founder & CTO' ],
			[ 'avatar-sr', 'Sara Rahman', 'VP Customer Success' ],
			[ 'avatar-jk', 'James Kim', 'Head of AI' ],
		].map( ( [ a, n, r ] ) => box( { content_width: 'full', flex_direction: 'column', flex_align_items: 'center', flex_gap: gap( 0 ) }, [
			w( 'image', { image: media( a ), image_size: 'thumbnail', width: px( 160 ), image_border_radius: dim( 50, 50, 50, 50, '%' ), _margin: dim( 0, 0, 16, 0 ), custom_css: 'selector{max-width:100%}' } ),
			heading( n, 'h3', { size: 17, weight: 700, lh: 1.3 }, { align: 'center' } ),
			text( `<p>${ r }</p>`, { size: 14, weight: 400, lh: 1.5 }, { text_color: C.muted, align: 'center', _margin: dim( 4, 0, 0, 0 ) } ),
		] ) ) ),
	] ),
	demo( 'Join us', 'Want to hear what your customers say?', 'Book a 30-minute demo with the team that built Signalry.' ),
];

// Pricing
const yes = '<span class="yes">Included</span>';
const no = '<span class="no">—</span>';
const tr = ( cells ) => `<tr>${ cells.map( ( c, i ) => ( i === 0 ? `<th scope="row">${ c }</th>` : `<td>${ c }</td>` ) ).join( '' ) }</tr>`;
const group = ( name ) => `<tr class="group"><th colspan="4">${ name }</th></tr>`;
const TABLE = `<table><thead><tr><th scope="col">Feature</th><th scope="col">Starter</th><th scope="col">Growth</th><th scope="col">Enterprise</th></tr></thead><tbody>${ [
	group( 'Collect' ), tr( [ 'Feedback each month', '2,000', '10,000', 'Unlimited' ] ), tr( [ 'Sources', '3', 'Unlimited', 'Unlimited' ] ), tr( [ 'CSV upload and email forwarding', yes, yes, yes ] ),
	group( 'Understand' ), tr( [ 'AI themes and sentiment', yes, yes, yes ] ), tr( [ 'Weekly AI summaries', yes, yes, yes ] ), tr( [ 'Spike alerts (Slack, email)', no, yes, yes ] ), tr( [ 'Custom AI models', no, no, yes ] ),
	group( 'Act' ), tr( [ 'Roadmaps with revenue', no, yes, yes ] ), tr( [ 'Help desk and CRM sync', no, yes, yes ] ),
	group( 'Security and support' ), tr( [ 'SSO and audit logs', no, no, yes ] ), tr( [ 'Data region', 'US', 'US or EU', 'Your choice' ] ), tr( [ 'Support', 'Email', 'Priority', 'Dedicated manager' ] ),
].join( '' ) }</tbody></table>`;
const TABLE_CSS = "selector{overflow-x:auto;border:1px solid #E6E9F0;border-radius:16px}selector table{width:100%;min-width:640px;margin:0;border:0;border-collapse:collapse;font-size:15px}selector th,selector td{padding:16px 20px;border:0;border-bottom:1px solid #E6E9F0;background:none;text-align:center}selector th[scope=row]{color:#0E1525;font-weight:600;text-align:left}selector thead th{background:#F5F7FB;color:#0E1525;font-weight:800}selector thead th:first-child{text-align:left}selector tr.group th{padding-top:24px;color:#3D5AFE;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;text-align:left}selector tbody tr:last-child>*{border-bottom:0}selector .yes{display:inline-block;width:20px;height:20px;overflow:hidden;border-radius:50%;background:#16C79A url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M6 10.5l2.5 2.5L14 7.5' fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") center/20px no-repeat;color:transparent;vertical-align:middle}selector .no{color:#b7bdca}selector tbody>tr:nth-child(odd)>td,selector tbody>tr:nth-child(odd)>th{background:none}";
const cta = ( title, ld, buttons ) => section( { flex_align_items: 'center', custom_css: `selector{background:${ GLOW }}` }, [
	heading( title, 'h2', H2, { title_color: C.white, align: 'center' } ),
	text( `<p>${ ld }</p>`, { size: 'clamp(17px, 1.5vw, 20px)', weight: 400, lh: 1.6 }, { text_color: '#C9D1E6', align: 'center', _margin: dim( 16, 0, 0, 0 ), _element_width: 'initial', _element_custom_width: px( 600 ), custom_css: 'selector{max-width:100%}' } ),
	box( { content_width: 'full', flex_direction: 'row', flex_justify_content: 'center', flex_wrap: 'wrap', flex_gap: gap( 12 ), margin: dim( 32, 0, 0, 0 ), width: cu( 'auto' ) }, buttons ),
] );
const pricingPage = [
	pageHero( 'Pricing', `Simple pricing that grows ${ grad( 'with your feedback' ) }`, 'Pay for the feedback you analyse, never for seats. Every plan starts with a 14-day free trial, no card needed.' ),
	section( { _element_id: 'plans', padding: dim( 0, 32, 120, 32 ), padding_tablet: dim( 0, 32, 96, 32 ), padding_mobile: dim( 0, 20, 72, 20 ) }, [
		billing(),
		pricingNote( 'Prices in USD, excluding tax. Need more feedback each month? Every plan scales in steps of 1,000.' ),
	] ),
	logos( true ),
	section( { _element_id: 'compare' }, [
		head( 'Compare plans', 'Every feature, side by side' ),
		text( TABLE, { size: 15, weight: 400, lh: 1.6 }, { custom_css: TABLE_CSS } ),
	] ),
	faqSection( 'Pricing FAQ', 'Questions about billing', 'Still unsure which plan fits? Tell us how much feedback you get and we’ll suggest one.', 'Ask our team', [
		[ 'What counts as a piece of feedback?', 'One ticket, survey answer, review, chat or call transcript. Replies in the same ticket count once.' ],
		[ 'What happens if we go over our limit?', 'Nothing breaks. We keep collecting and let you know, and you can move up a step or wait for next month.' ],
		[ 'Can we change plans later?', 'Yes, at any time. Upgrades apply straight away; downgrades apply at the end of your billing period.' ],
		[ 'Do you offer discounts for nonprofits and startups?', 'Yes: 50% off for registered nonprofits, and our startup programme gives a year of Growth at Starter prices.' ],
		[ 'Which payment methods do you accept?', 'All major cards. Yearly plans can also pay by bank transfer against an invoice.' ],
	] ),
	cta( 'Start listening in ten minutes', 'Connect a source, see your first themes today and your first summary on Monday.', [
		button( 'Start free trial', '#', 'primary' ),
		button( 'Talk to sales', '/contact/', 'secondary' ),
	] ),
];

// Contact
const contactItem = ( icon, label, body ) => box( { content_width: 'full', padding: dim( 20, 20, 20, 20 ), border_border: 'solid', border_width: dim( 1, 1, 1, 1 ), border_color: C.line, border_radius: dim( 16, 16, 16, 16 ) }, [
	w( 'icon-box', {
		selected_icon: { value: icon, library: 'fa-solid' }, view: 'stacked', shape: 'rounded', position: 'left', content_vertical_alignment: 'top',
		title_text: label, description_text: body, title_size: 'div',
		primary_color: C.primarySoft, secondary_color: C.primary, icon_size: px( 18 ), icon_padding: px( 13 ), icon_space: px( 16 ), border_radius: dim( 12, 12, 12, 12 ), title_bottom_space: px( 2 ),
		title_color: C.ink, ...T( { prefix: 'title_typography', size: 16, weight: 700, lh: 1.4 } ),
		description_color: C.muted, ...T( { prefix: 'description_typography', size: 15, weight: 400, lh: 1.6 } ),
		...noGlobals( 'primary_color', 'title_color', 'description_color', 'title_typography_typography', 'description_typography_typography' ),
	} ),
] );
const contact = [
	pageHero( 'Contact', `Talk to ${ grad( 'a real person' ) }`, 'Questions about plans, security or a demo? Send us a note and someone from our team will reply within one working day.' ),
	section( { padding: dim( 0, 32, 120, 32 ), padding_tablet: dim( 0, 32, 96, 32 ), padding_mobile: dim( 0, 20, 72, 20 ) }, [
		box( { content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_align_items: 'flex-start', flex_align_items_tablet: 'stretch', flex_gap: gap( 40, 64 ) }, [
			box( { content_width: 'full', flex_direction: 'column', width: pct( 58.333 ), width_tablet: pct( 100 ) }, [ formCard( 'Send us a message', 'All fields marked * are required.', 'contact' ) ] ),
			box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), width: pct( 41.666 ), width_tablet: pct( 100 ) }, [
				contactItem( 'fas fa-envelope', 'Email', 'hello@signalry.example' ),
				contactItem( 'fas fa-phone', 'Sales', '+1 (415) 555-0142 · Mon–Fri, 9am–6pm PT' ),
				contactItem( 'fas fa-map-marker-alt', 'Office', '120 Market Street, Suite 400, San Francisco, CA 94105' ),
				w( 'image', { image: media( 'map' ), image_size: 'full', width: pct( 100 ), image_border_radius: dim( 16, 16, 16, 16 ) } ),
			] ),
		] ),
	] ),
	faqSection( 'Before you write', 'Quick answers', 'These come up most. If yours isn’t here, the form is the fastest way to reach us.', '', [
		[ 'How fast will you reply?', 'Within one working day, usually within a few hours during US office hours.' ],
		[ 'I already have an account. Where do I get help?', 'Use the chat in the Signalry app or email support@signalry.example. Growth and Enterprise plans have priority support.' ],
		[ 'Can I get your security documents?', 'Yes. Choose “Security and compliance” above and we’ll send our SOC 2 report and DPA.' ],
	] ),
];

/* ------------------------------------------------------------------ */
/* Theme Builder: single post and the blog / archives.                  */
/* ------------------------------------------------------------------ */
const POST_CSS = 'selector{font-size:18px;line-height:1.75;color:#3B4558}selector>*+*,selector .elementor-widget-container>*+*{margin-top:1.1em}selector h2{margin:1.8em 0 .6em;font-size:clamp(24px,2.6vw,30px);line-height:1.2;letter-spacing:-.025em;color:#0E1525}selector p{margin:0 0 1.1em}selector ul,selector ol{margin:0 0 1.1em;padding-left:1.3em}selector li+li{margin-top:.4em}selector blockquote{margin:1.6em 0;padding:4px 0 4px 24px;border-left:4px solid #3D5AFE;color:#0E1525;font-size:21px;font-weight:600;line-height:1.55}selector blockquote p{margin:0}selector figure{margin:2em 0}selector figure img{border-radius:16px}selector figcaption{margin-top:10px;color:#6B7487;font-size:14px;text-align:center}';
const single = [
	box( { content_width: 'boxed', boxed_width: px( 760 ), flex_direction: 'column', flex_align_items: 'center', flex_gap: gap( 0 ), padding: dim( 72, 32, 40, 32 ), padding_mobile: dim( 48, 20, 32, 20 ) }, [
		w( 'post-info', {
			view: 'inline', icon_list: [ { _id: uid(), type: 'terms', taxonomy: 'category', link: 'yes', show_icon: 'none', selected_icon: { value: '', library: '' } } ],
			text_color: C.primary, ...T( { prefix: 'icon_typography', size: 13, weight: 800, lh: 1.4, ls: 0.12 } ), icon_typography_text_transform: 'uppercase',
			...noGlobals( 'text_color', 'icon_typography_typography' ), custom_css: 'selector a{color:inherit}',
		} ),
		w( 'theme-post-title', { header_size: 'h1', align: 'center', __dynamic__: { title: '[elementor-tag id="" name="post-title" settings="%7B%7D"]' }, title_color: C.ink, ...T( { size: 'clamp(32px, 4.6vw, 52px)', weight: 700, lh: 1.1, ls: -0.03 } ), _margin: dim( 4, 0, 0, 0 ), ...noGlobals( 'title_color', 'typography_typography' ), custom_css: 'selector .elementor-heading-title{text-wrap:balance}' } ),
		w( 'post-info', {
			view: 'inline', icon_list: [
				{ _id: uid(), type: 'author', show_avatar: 'yes', avatar_size: px( 36 ), link: '', show_icon: 'none', selected_icon: { value: '', library: '' } },
				{ _id: uid(), type: 'date', date_format: 'custom', custom_date_format: 'F j, Y', show_icon: 'none', selected_icon: { value: '', library: '' } },
			],
			space_between: px( 28 ), divider: 'yes', divider_style: 'solid', divider_weight: px( 1 ), divider_height: pct( 40 ), divider_color: C.line,
			text_color: C.muted, ...T( { prefix: 'icon_typography', size: 15, weight: 400, lh: 1.5 } ), _margin: dim( 22, 0, 0, 0 ),
			...noGlobals( 'text_color', 'icon_typography_typography' ), custom_css: 'selector .elementor-post-info__item--type-author{color:#0E1525;font-weight:700}selector .elementor-post-info__item-prefix img,selector img{border-radius:50%}',
		} ),
	], false ),
	box( { content_width: 'boxed', boxed_width: px( 1040 ), padding: dim( 0, 32, 0, 32 ), padding_mobile: dim( 0, 20, 0, 20 ) }, [
		w( 'theme-post-featured-image', { image_size: 'full', __dynamic__: { image: '[elementor-tag id="" name="post-featured-image" settings="%7B%7D"]' }, image_border_radius: dim( 16, 16, 16, 16 ), custom_css: 'selector img{width:100%;aspect-ratio:16/9;object-fit:cover}' } ),
	], false ),
	box( { content_width: 'boxed', boxed_width: px( 760 ), flex_direction: 'column', flex_gap: gap( 0 ), padding: dim( 48, 32, 0, 32 ), padding_mobile: dim( 48, 20, 0, 20 ) }, [
		w( 'theme-post-content', { custom_css: POST_CSS } ),
		w( 'author-box', {
			source: 'current', show_avatar: 'yes', show_name: 'yes', show_biography: 'yes', show_link: '', layout: 'left', alignment: 'left',
			image_size: px( 72 ), image_gap: px( 20 ), image_border_radius: dim( 50, 50, 50, 50, '%' ), name_tag: 'div',
			name_color: C.ink, ...T( { prefix: 'name_typography', size: 17, weight: 700, lh: 1.3 } ), bio_color: C.text, ...T( { prefix: 'bio_typography', size: 15, weight: 400, lh: 1.6 } ),
			...noGlobals( 'name_color', 'bio_color', 'name_typography_typography', 'bio_typography_typography' ),
			_margin: dim( 56, 0, 0, 0 ), _padding: dim( 28, 28, 28, 28 ), _background_background: 'classic', _background_color: C.surface, _border_radius: dim( 16, 16, 16, 16 ),
			custom_css: 'selector .elementor-author-box{align-items:center}selector .elementor-author-box__bio p{margin:4px 0 0}',
		} ),
	], false ),
	section( {}, [
		box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_justify_content: 'space-between', flex_align_items: 'flex-end', flex_gap: gap( 16 ), padding: dim( 0, 0, 36, 0 ) }, [
			heading( 'Keep reading', 'h2', H2, { _element_width: 'auto' } ),
			button( 'All posts', '/blog/', 'link', { ...arrowIcon, _element_width: 'auto' } ),
		] ),
		w( 'loop-grid', {
			template_id: '@tpl:loop', posts_per_page: 3, columns: '3', columns_tablet: '2', columns_mobile: '1',
			post_query_post_type: 'related', post_query_related_taxonomies: [ 'category' ], post_query_include_term_ids: [], post_query_orderby: 'post_date', post_query_order: 'desc',
			column_gap: px( 32 ), row_gap: px( 28 ), equal_height: '',
		} ),
	] ),
];

const archive = [
	pageHero( 'Blog', 'Ideas for teams that listen', 'Guides, research and product news on turning customer feedback into decisions.' ),
	section( { padding: dim( 0, 32, 120, 32 ), padding_tablet: dim( 0, 32, 96, 32 ), padding_mobile: dim( 0, 20, 72, 20 ) }, [
		w( 'loop-grid', {
			template_id: '@tpl:loop', columns: '3', columns_tablet: '2', columns_mobile: '1',
			post_query_post_type: 'current_query', column_gap: px( 32 ), row_gap: px( 48 ), equal_height: '',
			pagination_type: 'numbers_and_prev_next', pagination_prev_label: 'Previous', pagination_next_label: 'Next', pagination_align: 'center', pagination_spacing_top: px( 56 ),
			custom_css: 'selector .elementor-pagination{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;font-weight:700}selector .elementor-pagination .page-numbers{display:inline-grid;min-width:44px;min-height:44px;place-items:center;padding:0 14px;margin:0!important;border:1px solid #E6E9F0;border-radius:10px;color:#0E1525;text-decoration:none}selector .elementor-pagination .page-numbers.current{border-color:#3D5AFE;background:#3D5AFE;color:#fff}selector .elementor-pagination a.page-numbers:hover{border-color:#0E1525}',
		} ),
	] ),
];

mkdirSync( new URL( './build/', import.meta.url ), { recursive: true } );
for ( const [ name, data ] of Object.entries( { kit, header, footer, 'loop-item': loopItem, home, about, pricing: pricingPage, contact, single, archive } ) ) {
	writeFileSync( new URL( `./build/${ name }.json`, import.meta.url ), JSON.stringify( data ) );
}
console.log( 'Wrote build/{kit,header,footer,loop-item,home,about,pricing,contact,single,archive}.json' );
