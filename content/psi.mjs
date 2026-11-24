/**
 * PageSpeed Insights comparison of the two staging sites (Google's servers;
 * mobile: a mid-range phone on slow 4G, desktop: its desktop setup). For each
 * page and device, N runs per site, alternating so a slow moment hits both;
 * all four categories unless --perf-only. Results:
 * results/<round>/<device>-<page>/<site>-<n>.json and summary.json (median,
 * min–max), the same fields as lighthouse.mjs.
 *
 * Run: node psi.mjs <round-name> [runs=5] [--pages=home,pricing,post]
 *      [--devices=mobile,desktop] [--perf-only]
 * Needs a Google API key (PageSpeed Insights API): PSI_KEY, or ~/.psi-key.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const keyFile = `${ homedir() }/.psi-key`;
const key = process.env.PSI_KEY || ( existsSync( keyFile ) ? readFileSync( keyFile, 'utf8' ).trim() : '' );

const args = process.argv.slice( 2 );
const flag = ( name, fallback ) => ( args.find( ( a ) => a.startsWith( `--${ name }=` ) )?.split( '=' )[ 1 ] ?? fallback );
const positional = args.filter( ( a ) => ! a.startsWith( '--' ) );
const round = positional[ 0 ] || 'psi';
const runs = Number( positional[ 1 ] || 5 );
const perfOnly = args.includes( '--perf-only' );

const sites = {
	elite: 'https://elite.arcnestpreview.com',
	elementor: 'https://elementor.arcnestpreview.com',
};
const PAGES = {
	home: '/',
	pricing: '/pricing/',
	post: '/how-to-run-a-feedback-review-your-whole-team-will-join/',
	about: '/about/',
	contact: '/contact/',
	blog: '/blog/',
};
const pages = flag( 'pages', 'home' ).split( ',' );
const devices = flag( 'devices', 'mobile' ).split( ',' );
const categories = perfOnly ? [ 'performance' ] : [ 'performance', 'accessibility', 'best-practices', 'seo' ];

const api = ( url, device ) => {
	const q = new URLSearchParams( { url, strategy: device } );
	for ( const c of categories ) {
		q.append( 'category', c );
	}
	if ( key ) {
		q.set( 'key', key );
	}
	return `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${ q }`;
};

const run = async ( url, device ) => {
	for ( let attempt = 1; attempt <= 3; attempt++ ) {
		const res = await fetch( api( url, device ) );
		if ( res.ok ) {
			return ( await res.json() ).lighthouseResult;
		}
		const why = ( await res.json().catch( () => ( {} ) ) ).error?.message ?? '';
		process.stdout.write( `  ${ res.status } ${ why.slice( 0, 160 ) } (attempt ${ attempt }), retrying in 30 s\n` );
		await new Promise( ( r ) => setTimeout( r, 30000 ) );
	}
	throw new Error( `PSI failed for ${ url }` );
};

const pick = ( lhr ) => {
	const a = lhr.audits;
	const num = ( id ) => a[ id ]?.numericValue ?? null;
	const score = ( id ) => ( lhr.categories[ id ] ? Math.round( lhr.categories[ id ].score * 100 ) : null );
	const requests = a[ 'network-requests' ]?.details?.items ?? [];
	const by = ( type ) => requests.filter( ( r ) => r.resourceType === type );
	const kb = ( items ) => Math.round( items.reduce( ( s, r ) => s + ( r.transferSize || 0 ), 0 ) / 1024 );
	return {
		performance: score( 'performance' ),
		accessibility: score( 'accessibility' ),
		bestPractices: score( 'best-practices' ),
		seo: score( 'seo' ),
		fcp: num( 'first-contentful-paint' ),
		lcp: num( 'largest-contentful-paint' ),
		tbt: num( 'total-blocking-time' ),
		cls: num( 'cumulative-layout-shift' ),
		si: num( 'speed-index' ),
		ttfb: num( 'server-response-time' ),
		requests: requests.length,
		totalKB: Math.round( ( num( 'total-byte-weight' ) ?? 0 ) / 1024 ),
		jsKB: kb( by( 'Script' ) ),
		cssKB: kb( by( 'Stylesheet' ) ),
		jsFiles: by( 'Script' ).length,
		cssFiles: by( 'Stylesheet' ).length,
		dom: num( 'dom-size' ) ?? a[ 'dom-size-insight' ]?.numericValue ?? null,
	};
};
const median = ( xs ) => {
	const s = [ ...xs ].sort( ( p, q ) => p - q );
	return s[ Math.floor( s.length / 2 ) ];
};
const ms = [ 'fcp', 'lcp', 'si', 'tbt', 'ttfb' ];
const fmt = ( k, v ) => ( v === null || v === undefined ? '–' : ms.includes( k ) ? `${ Math.round( v ) } ms` : k === 'cls' ? v.toFixed( 3 ) : String( v ) );

// Warm up: PHP and Elementor's CSS on the server (not measured).
for ( const base of Object.values( sites ) ) {
	for ( const page of pages ) {
		await fetch( base + PAGES[ page ] );
	}
}

// PSI hands back its cached result for a URL it tested in the last minute or
// so; a unique query string makes every run a fresh one (WordPress ignores it).
const stamp = Date.now().toString( 36 );
const summary = {};
for ( const device of devices ) {
	for ( const page of pages ) {
		const dir = new URL( `./results/${ round }/${ device }-${ page }/`, import.meta.url );
		mkdirSync( dir, { recursive: true } );
		for ( let i = 1; i <= runs; i++ ) {
			for ( const [ name, base ] of Object.entries( sites ) ) {
				const lhr = await run( `${ base }${ PAGES[ page ] }?psi=${ stamp }-${ device }-${ i }`, device );
				writeFileSync( new URL( `${ name }-${ i }.json`, dir ), JSON.stringify( lhr ) );
				process.stdout.write( `${ device } ${ page } ${ name } run ${ i }: ${ Math.round( lhr.categories.performance.score * 100 ) }\n` );
			}
		}
		const key2 = `${ device } ${ page }`;
		summary[ key2 ] = {};
		for ( const name of Object.keys( sites ) ) {
			const rows = [];
			for ( let i = 1; i <= runs; i++ ) {
				rows.push( pick( JSON.parse( readFileSync( new URL( `${ name }-${ i }.json`, dir ), 'utf8' ) ) ) );
			}
			summary[ key2 ][ name ] = Object.fromEntries( Object.keys( rows[ 0 ] ).map( ( k ) => {
				const xs = rows.map( ( r ) => r[ k ] ).filter( ( x ) => x !== null );
				return [ k, xs.length ? { median: median( xs ), min: Math.min( ...xs ), max: Math.max( ...xs ) } : null ];
			} ) );
			summary[ key2 ][ name ].runs = rows;
		}
		writeFileSync( new URL( `./results/${ round }/summary.json`, import.meta.url ), JSON.stringify( summary, null, 1 ) );

		console.log( `\n${ round } · ${ key2 }: median (min–max) of ${ runs } runs` );
		console.log( 'metric'.padEnd( 14 ), 'Elite Blocks'.padEnd( 30 ), 'Elementor' );
		for ( const k of Object.keys( summary[ key2 ].elite ).filter( ( x ) => x !== 'runs' ) ) {
			const cell = ( s ) => ( s[ k ] ? `${ fmt( k, s[ k ].median ) } (${ fmt( k, s[ k ].min ) }–${ fmt( k, s[ k ].max ) })` : '–' );
			console.log( k.padEnd( 14 ), cell( summary[ key2 ].elite ).padEnd( 30 ), cell( summary[ key2 ].elementor ) );
		}
	}
}
