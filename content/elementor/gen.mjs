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
const dropLink = ( title, desc, soft ) => w( 'icon-box', {
	selected_icon: { value: 'fas fa-square', library: 'fa-solid' }, view: 'stacked', shape: 'rounded', position: 'left',
	title_text: title, description_text: desc, link: { url: '#' }, title_size: 'div',
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
	{ title: 'Product', url: '#', drop: [ [ 'Feedback inbox', 'Every ticket, survey and review in one place', C.primarySoft ], [ 'AI insights', 'Themes and weekly summaries, found for you', C.mintSoft ], [ 'Roadmaps', 'Link requests to revenue and ship what matters', C.coralSoft ], [ 'Integrations', 'Help desk, chat, CRM, reviews and more', C.amberSoft ] ] },
	{ title: 'Solutions', url: '/#tabs', drop: [ [ 'Product teams', 'Decide what to build next', C.primarySoft ], [ 'Support teams', 'Tag and route tickets automatically', C.mintSoft ], [ 'Marketing teams', 'Find promoters and real quotes', C.coralSoft ] ] },
	{ title: 'Pricing', url: '#' }, { title: 'Blog', url: '/#blog' }, { title: 'Customers', url: '/#customers' },
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
			button( 'Start free', '#', 'primary', { text_padding: dim( 11, 20, 11, 20 ), ...T( { size: 15, mobile: 14, weight: 700, lh: 1.2 } ) } ),
		] ),
	], false ),
];

/* ------------------------------------------------------------------ */
/* Footer (Theme Builder).                                             */
/* ------------------------------------------------------------------ */
const linkCol = ( title, links ) => box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), width: pct( 25 ), width_mobile: pct( 50 ) }, [
	heading( title, 'h4', { size: 15, weight: 700, lh: 1.4 }, { title_color: C.white } ),
	w( 'icon-list', {
		view: 'traditional', icon_list: links.map( ( t ) => ( { _id: uid(), text: t, selected_icon: { value: '', library: '' }, link: { url: '#' } } ) ),
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
				linkCol( 'Product', [ 'Feedback inbox', 'AI insights', 'Roadmaps', 'Integrations', 'Pricing' ] ),
				linkCol( 'Solutions', [ 'Product teams', 'Support teams', 'Marketing teams', 'Enterprise' ] ),
				linkCol( 'Resources', [ 'Blog', 'Guides', 'Help centre', 'API docs' ] ),
				linkCol( 'Company', [ 'About', 'Careers', 'Contact', 'Security' ] ),
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
			button( 'Start free trial', '#', 'primary', arrowIcon ),
			button( 'Watch the tour', '#tour', 'secondary' ),
		] ),
		text( '<p>Free for 14 days · No card needed</p>', { size: 14, weight: 400, lh: 1.5 }, { text_color: C.muted, align: 'center', _margin: dim( 16, 0, 0, 0 ) } ),
	] ),
	w( 'image', { image: media( 'dashboard' ), image_size: 'full', width: pct( 100 ), _element_width: 'initial', _element_custom_width: px( 1100 ), _element_custom_width_mobile: pct( 100 ), _flex_align_self: 'center', _margin: dim( 64, 0, 0, 0 ), _margin_mobile: dim( 48, 0, 0, 0 ), custom_css: 'selector{max-width:100%}selector img{width:100%;border-radius:18px 18px 0 0;box-shadow:0 -10px 80px -20px rgba(61,90,254,.35)}' } ),
] );

const stat = ( end, suffix, label, decimals ) => box( { content_width: 'full', flex_direction: 'column', width: pct( 25 ), width_tablet: pct( 25 ), width_mobile: pct( 50 ), padding: dim( 0, 0, 0, 24 ), padding_mobile: dim( 0, 0, 0, 0 ), border_border: 'solid', border_width: dim( 0, 0, 0, 1 ), border_width_mobile: dim( 0, 0, 0, 0 ), border_color: 'rgba(255,255,255,0.12)' }, [
	w( 'counter', {
		starting_number: 0, ending_number: end, suffix, title: label, thousand_separator: 'yes', thousand_separator_char: '', duration: 2000,
		title_position: 'after', title_horizontal_alignment: 'start', number_position: 'start', number_alignment: 'start', title_gap: px( 10 ),
		number_color: C.white, ...T( { prefix: 'typography_number', size: 'clamp(36px, 4.6vw, 56px)', weight: 800, lh: 1, ls: -0.03 } ),
		title_color: '#C9D1E6', ...T( { prefix: 'typography_title', size: 15, weight: 400, lh: 1.5 } ),
		...noGlobals( 'number_color', 'typography_number_typography', 'title_color', 'typography_title_typography' ),
		custom_css: `selector .elementor-counter-number-suffix{color:#16C79A}${ decimals ? '' : '' }`,
	} ),
] );
const stats = section( { padding: dim( 64, 32, 64, 32 ), padding_tablet: dim( 64, 32, 64, 32 ), padding_mobile: dim( 48, 20, 48, 20 ), background_background: 'classic', background_color: C.navy }, [
	box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_gap: gap( 32, 0 ) }, [
		stat( 18, 'M+', 'Pieces of feedback analysed' ),
		stat( 2400, '+', 'Teams listening with Signalry' ),
		stat( 31, 'h', 'Saved per team, every week' ),
		stat( 4.8, '/5', 'Average rating from customers', 1 ),
	] ),
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
const accordion = {
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
};
const faq = section( { _element_id: 'faq' }, [
	box( { content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_gap: gap( 32, 80 ) }, [
		box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), width: pct( 33.333 ), width_tablet: pct( 100 ) }, [
			eyebrow( 'FAQ' ),
			heading( 'Questions, answered', 'h2', H2 ),
			lead( 'Can’t find what you’re looking for? Our team replies within a few hours.' ),
			button( 'Contact sales', '#', 'secondary', { _element_width: 'auto', _margin: dim( 10, 0, 0, 0 ) } ),
		] ),
		box( { content_width: 'full', flex_direction: 'column', width: pct( 58.333 ), width_tablet: pct( 100 ), margin: dim( 0, 0, 0, 0 ), custom_css: 'selector{margin-left:auto}' }, [ accordion ] ),
	] ),
] );

const blog = section( { _element_id: 'blog', padding: dim( 0, 32, 120, 32 ), padding_tablet: dim( 0, 32, 96, 32 ), padding_mobile: dim( 0, 20, 72, 20 ) }, [
	box( { content_width: 'full', flex_direction: 'row', flex_wrap: 'wrap', flex_justify_content: 'space-between', flex_align_items: 'flex-end', flex_gap: gap( 16 ), padding: dim( 0, 0, 36, 0 ) }, [
		box( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 14 ), width: pct( 60 ), width_mobile: pct( 100 ) }, [ eyebrow( 'Blog' ), heading( 'Latest from the blog', 'h2', H2 ) ] ),
		button( 'View all posts', '#', 'link', { ...arrowIcon, _element_width: 'auto' } ),
	] ),
	w( 'loop-grid', {
		template_id: '@tpl:loop', posts_per_page: 3, columns: '3', columns_tablet: '2', columns_mobile: '1',
		post_query_post_type: 'post', post_query_orderby: 'post_date', post_query_order: 'desc',
		column_gap: px( 32 ), row_gap: px( 28 ), equal_height: '',
	} ),
] );

const home = [ hero, stats, tour, solutions, customers, faq, blog ];

mkdirSync( new URL( './build/', import.meta.url ), { recursive: true } );
for ( const [ name, data ] of Object.entries( { kit, header, footer, 'loop-item': loopItem, home } ) ) {
	writeFileSync( new URL( `./build/${ name }.json`, import.meta.url ), JSON.stringify( data ) );
}
console.log( 'Wrote build/{kit,header,footer,loop-item,home}.json' );
