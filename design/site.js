/*
 * Signalry demo design: the shared header, mobile menu and footer (written
 * into [data-part] placeholders, so every page has the same ones), then the
 * page behaviours. Mockup only: the builds use each builder's own widgets.
 */
const chevron = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const page = location.pathname.split( '/' ).pop() || 'index.html';
const current = ( href ) => ( href === page ? ' aria-current="page"' : '' );

const nav = [
	{ label: 'Product', items: [
		[ 'Feedback inbox', 'Every ticket, survey and review in one place', 'index.html#features', 'var(--brand-soft)' ],
		[ 'AI insights', 'Themes and weekly summaries, found for you', 'index.html#features', 'var(--mint-soft)' ],
		[ 'Roadmaps', 'Link requests to revenue and ship what matters', 'index.html#features', 'var(--coral-soft)' ],
		[ 'Integrations', 'Help desk, chat, CRM, reviews and more', 'index.html#features', 'var(--amber-soft)' ],
	] },
	{ label: 'Solutions', items: [
		[ 'Product teams', 'Decide what to build next', 'index.html#tabs', 'var(--brand-soft)' ],
		[ 'Support teams', 'Tag and route tickets automatically', 'index.html#tabs', 'var(--mint-soft)' ],
		[ 'Marketing teams', 'Find promoters and real quotes', 'index.html#tabs', 'var(--coral-soft)' ],
	] },
	{ label: 'Pricing', href: 'pricing.html' },
	{ label: 'Blog', href: 'post.html' },
	{ label: 'Company', items: [
		[ 'About us', 'Who we are and why we built Signalry', 'about.html', 'var(--brand-soft)' ],
		[ 'Customers', 'Teams that listen better', 'index.html#customers', 'var(--mint-soft)' ],
		[ 'Contact', 'Talk to sales or get help', 'contact.html', 'var(--coral-soft)' ],
	] },
];

const parts = {
	header: `
<header class="header">
	<div class="container header__inner">
		<a class="logo" href="index.html"><span class="logo__mark"></span>Signalry</a>
		<nav class="nav" aria-label="Main"><ul>
			${ nav.map( ( n ) => n.items
				? `<li class="nav__item"><button class="nav__link" aria-haspopup="true">${ n.label } ${ chevron }</button><div class="dropdown">${ n.items.map( ( [ t, d, h, c ] ) => `<a href="${ h }"><i style="background:${ c }"></i><div><strong>${ t }</strong><span>${ d }</span></div></a>` ).join( '' ) }</div></li>`
				: `<li class="nav__item"><a class="nav__link" href="${ n.href }"${ current( n.href ) }>${ n.label }</a></li>` ).join( '' ) }
		</ul></nav>
		<div class="header__actions">
			<a class="header__signin" href="#">Sign in</a>
			<a class="btn btn--primary btn--small" href="pricing.html">Start free</a>
			<button class="burger" aria-label="Open menu" aria-expanded="false" data-menu-open><svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M4 8h18M4 13h18M4 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
		</div>
	</div>
</header>
<div class="menu" id="menu" aria-label="Menu">
	<div class="menu__top">
		<a class="logo" href="index.html"><span class="logo__mark"></span>Signalry</a>
		<button class="burger" aria-label="Close menu" data-menu-close><svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M6 6l14 14M20 6 6 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
	</div>
	<ul>
		${ nav.map( ( n ) => n.items
			? `<li><button class="menu__link" data-sub>${ n.label } ${ chevron }</button><ul class="menu__sub">${ n.items.map( ( [ t, , h ] ) => `<li><a href="${ h }">${ t }</a></li>` ).join( '' ) }</ul></li>`
			: `<li><a class="menu__link" href="${ n.href }">${ n.label }</a></li>` ).join( '' ) }
	</ul>
	<div class="menu__actions">
		<a class="btn btn--secondary" href="#">Sign in</a>
		<a class="btn btn--primary" href="pricing.html">Start free trial</a>
	</div>
</div>`,
	footer: `
<footer class="footer">
	<div class="container">
		<div class="footer__grid">
			<div class="footer__about">
				<a class="logo" href="index.html"><span class="logo__mark"></span>Signalry</a>
				<p>Customer feedback analytics for teams that want to listen better. Signalry is a made-up product for a performance demo.</p>
				<div class="social">
					<a href="#" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4z"/></svg></a>
					<a href="#" aria-label="X"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77zm-1.08 16.17h1.7L7.4 4.73H5.58z"/></svg></a>
					<a href="#" aria-label="YouTube"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12z"/></svg></a>
				</div>
			</div>
			<div class="footer__cols">
				<div><h4>Product</h4><ul><li><a href="index.html#features">Feedback inbox</a></li><li><a href="index.html#features">AI insights</a></li><li><a href="index.html#features">Roadmaps</a></li><li><a href="index.html#features">Integrations</a></li><li><a href="pricing.html">Pricing</a></li></ul></div>
				<div><h4>Solutions</h4><ul><li><a href="index.html#tabs">Product teams</a></li><li><a href="index.html#tabs">Support teams</a></li><li><a href="index.html#tabs">Marketing teams</a></li><li><a href="contact.html">Enterprise</a></li></ul></div>
				<div><h4>Resources</h4><ul><li><a href="post.html">Blog</a></li><li><a href="post.html">Guides</a></li><li><a href="#">Help centre</a></li><li><a href="#">API docs</a></li></ul></div>
				<div><h4>Company</h4><ul><li><a href="about.html">About</a></li><li><a href="#">Careers</a></li><li><a href="contact.html">Contact</a></li><li><a href="#">Security</a></li></ul></div>
			</div>
		</div>
		<div class="footer__bottom">
			<span>© 2026 Signalry. A demo site.</span>
			<span><a href="#">Privacy</a> · <a href="#">Terms</a></span>
		</div>
	</div>
</footer>`,
};
document.querySelectorAll( '[data-part]' ).forEach( ( el ) => {
	el.outerHTML = parts[ el.dataset.part ];
} );

// Header border on scroll
const header = document.querySelector( '.header' );
addEventListener( 'scroll', () => header.classList.toggle( 'is-scrolled', scrollY > 8 ), { passive: true } );

// Mobile menu and its submenus
const menu = document.getElementById( 'menu' );
const opener = document.querySelector( '[data-menu-open]' );
opener.addEventListener( 'click', () => {
	menu.classList.add( 'is-open' );
	opener.setAttribute( 'aria-expanded', 'true' );
} );
menu.querySelector( '[data-menu-close]' ).addEventListener( 'click', () => {
	menu.classList.remove( 'is-open' );
	opener.setAttribute( 'aria-expanded', 'false' );
} );
menu.querySelectorAll( '[data-sub]' ).forEach( ( b ) => b.addEventListener( 'click', () => b.parentElement.classList.toggle( 'is-open' ) ) );
menu.querySelectorAll( 'a' ).forEach( ( a ) => a.addEventListener( 'click', () => menu.classList.remove( 'is-open' ) ) );

// Counters: count up once, when they scroll into view
const countUp = ( el ) => {
	const end = parseFloat( el.dataset.count ), dec = +( el.dataset.decimals || 0 ), t0 = performance.now();
	const step = ( now ) => {
		const p = Math.min( ( now - t0 ) / 1600, 1 ), e = 1 - Math.pow( 1 - p, 3 );
		el.textContent = ( end * e ).toLocaleString( 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec } );
		if ( p < 1 ) {
			requestAnimationFrame( step );
		}
	};
	requestAnimationFrame( step );
};
const io = new IntersectionObserver( ( es ) => es.forEach( ( e ) => {
	if ( e.isIntersecting ) {
		countUp( e.target );
		io.unobserve( e.target );
	}
} ), { threshold: 0.6 } );
document.querySelectorAll( '[data-count]' ).forEach( ( c ) => io.observe( c ) );

// Video: play on click
document.querySelectorAll( '.video__frame' ).forEach( ( frame ) => frame.querySelector( '.video__play' ).addEventListener( 'click', ( e ) => {
	const v = frame.querySelector( 'video' );
	v.controls = true;
	v.play();
	e.currentTarget.remove();
} ) );

// Tab sliders (solutions: slide; pricing: show the chosen panel)
document.querySelectorAll( '[data-tabs]' ).forEach( ( root ) => {
	const tabs = [ ...root.querySelectorAll( '.tabs__tab' ) ];
	const panels = [ ...root.querySelectorAll( '.tabs__panel' ) ];
	const track = root.querySelector( '.tabs__track' );
	const show = ( i ) => {
		tabs.forEach( ( x, j ) => x.setAttribute( 'aria-selected', i === j ) );
		panels.forEach( ( p, j ) => p.classList.toggle( 'is-active', i === j ) );
		if ( root.dataset.tabs === 'slide' ) {
			track.style.transform = `translateX(-${ i * 100 }%)`;
		}
	};
	tabs.forEach( ( t, i ) => t.addEventListener( 'click', () => show( i ) ) );
	show( 0 );
} );

// Testimonials slider: scroll snap + arrows + dots
const strack = document.querySelector( '.slider__track' );
if ( strack ) {
	const slides = [ ...strack.children ];
	const dots = document.querySelector( '.slider__dots' );
	const prev = document.querySelector( '[data-prev]' ), next = document.querySelector( '[data-next]' );
	const gap = 20;
	const perView = () => Math.max( 1, Math.round( strack.clientWidth / ( slides[ 0 ].offsetWidth + gap ) ) );
	const pages = () => slides.length - perView() + 1;
	const go = ( i ) => strack.scrollTo( { left: slides[ Math.max( 0, Math.min( i, slides.length - 1 ) ) ].offsetLeft - slides[ 0 ].offsetLeft } );
	const at = () => Math.round( strack.scrollLeft / ( slides[ 0 ].offsetWidth + gap ) );
	const update = () => {
		const c = at();
		[ ...dots.children ].forEach( ( d, i ) => d.setAttribute( 'aria-current', i === c ) );
		prev.disabled = c <= 0;
		next.disabled = c >= pages() - 1;
	};
	const renderDots = () => {
		dots.innerHTML = '';
		for ( let i = 0; i < pages(); i++ ) {
			const d = document.createElement( 'button' );
			d.setAttribute( 'aria-label', `Slide ${ i + 1 }` );
			d.onclick = () => go( i );
			dots.append( d );
		}
		update();
	};
	prev.onclick = () => go( at() - 1 );
	next.onclick = () => go( at() + 1 );
	strack.addEventListener( 'scroll', () => requestAnimationFrame( update ), { passive: true } );
	addEventListener( 'resize', renderDots );
	renderDots();
}

// Forms: the mockup doesn't send anything.
document.querySelectorAll( 'form' ).forEach( ( f ) => f.addEventListener( 'submit', ( e ) => {
	e.preventDefault();
	f.querySelector( '[type=submit]' ).textContent = 'Thanks, we’ll be in touch';
} ) );
