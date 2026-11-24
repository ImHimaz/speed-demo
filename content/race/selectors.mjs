import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';
const S = {
	elite: { url: 'https://elite.arcnestpreview.com/', menu: '.wp-block-navigation__responsive-container-open', close: '.wp-block-navigation__responsive-container-close', tab: '#tabs [role="tab"]', faq: '#faq .elite-accordion button, #faq .elite-accordion summary', next: '#customers .elite-slider__next' },
	elementor: { url: 'https://elementor.arcnestpreview.com/', menu: '.e-n-menu-toggle', close: '.e-n-menu-toggle', tab: '#tabs .e-n-tab-title', faq: '#faq .e-n-accordion-item-title', next: '#customers .elementor-swiper-button-next' },
};
const browser = await chromium.launch();
for ( const [ k, s ] of Object.entries( S ) ) {
	const page = await browser.newPage( { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } );
	await page.goto( s.url, { waitUntil: 'load' } );
	const out = {};
	for ( const key of [ 'menu', 'close', 'tab', 'faq', 'next' ] ) {
		out[ key ] = await page.locator( s[ key ] ).count();
	}
	console.log( k, JSON.stringify( out ) );
	await page.close();
}
await browser.close();
