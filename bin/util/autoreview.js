'use strict';

const $ = require( './jquery.js' );

async function autoreview( wikitext = '', $parseHTML = $() ) {
	let delval = {
		tags: [
			// 表格
			'table',
			'tbody',
			'td',
			'tr',
			'th',
			'pre',
			// 樣式
			'style',
			// 標題常常解析出一堆亂象
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6'
		],
		ids: [
			// 小作品標籤
			'stub',
			// 目錄
			'toc'
		],
		classes: [
			// NoteTA
			'noteTA',
			// 表格
			'infobox',
			'wikitable',
			'navbox',
			// &#60;syntaxhighlight&#62;
			'mw-highlight',
			// 圖片說明
			'thumb',
			// &#60;reference /&#62;
			'reflist',
			'references',
			'reference',
			// 不印出來的
			'noprint',
			// 消歧義
			'hatnote',
			'navigation-not-searchable',
			// 目錄
			'toc',
			// edit
			'mw-editsection',
			// {{AFC comment}}
			'afc-comment'
		]
	};

	let $countHTML = $parseHTML.clone();

	$countHTML.find( function () {
		let selector = '';

		delval.tags.forEach( function ( tag ) {
			selector += selector === '' ? tag : `, ${ tag }`;
		} );

		delval.ids.forEach( function ( id ) {
			selector += `, #${ id }`;
		} );

		delval.classes.forEach( function ( thisclass ) {
			selector += `, .${ thisclass }`;
		} );

		return selector;
	}() ).remove();

	let countText = $countHTML.text().replace( /\n/g, '' );

	let issues = [];
	let elements = {};

	elements.intLinks = wikitext.match( /\[\[.*?\]\]/g );
	wikitext.replace( /<ref.*?>.*?<\/ref>/gi, '' );

	let refs = {};
	refs.wt = ( wikitext.match( /<ref.*?>.*?<\/ref>/gi ) || [] ).map( ( x, i ) => [ i, x ] );
	refs.$ele = $parseHTML.find( 'ol.references' );
	refs.$ele.find( '.mw-cite-backlink' ).remove();

	elements.refs = {
		all: refs,
		default: refs.wt.filter( function ( [ _i, x ] ) {
			return !/group=/i.test( x );
		} ),
		$references: refs.$ele.filter( function ( _i, ele ) {
			return $( ele ).find( 'a' ).length;
		} ),
		$disallowed: refs.$ele.filter( function ( _i, ele ) {
			return !!$( ele ).html().match( /baike.baidu.com|百度|quora.com|toutiao.com|pincong.rocks|zhihu.com|知乎/ );
		} ),
		$unreliable: refs.$ele.filter( function ( _i, ele ) {
			return !!$( ele ).html().match( /百家[号號]|baijiahao.baidu.com|bigexam.hk|boxun.com|bowenpress.com|hkgpao.com|peopo.org|qyer.com|speakout.hk|songshuhui.net|youtube.com|youtu.be|acfun.cn|bilibili.com/ );
		} )
	};
	elements.cats = wikitext.match( /\[\[(?:[Cc]at|[Cc]ategory|分[类類]):/gi ) || [];

	let contentLen = countText.length - countText.match( /\p{L}/i ) * 0.5;
	if ( contentLen === 0 ) {
		issues.push( 'size-zero' );
	} else if ( contentLen <= 50 ) {
		issues.push( 'substub' );
	} else if ( contentLen <= 220 ) {
		issues.push( 'stub' );
	} else if ( contentLen >= 15000 ) {
		issues.push( 'lengthy' );
	}

	if ( !/\[\[|\{\{|\{\||==|<ref|''|<code|<pre|<source|\[http|\|-|\|}|^[*#]/.test( wikitext ) ) {
		issues.push( 'wikify' );
	}

	if ( elements.refs.$references.length === 0 && elements.refs.all.$ele.length === 0 ) {
		issues.push( 'unreferenced' );
	} else {
		if ( $( '<div>' ).append( elements.refs.$references ).length < contentLen / 200 ) {
			issues.push( 'ref-improve' );
		}

		if ( elements.refs.$disallowed.length ) {
			issues.push( 'ref-disallowed' );
		}

		if ( elements.refs.$unreliable.length ) {
			issues.push( 'ref-unreliable' );
		}

		if (
			elements.refs.$unreliable.length + elements.refs.$disallowed.length >=
			elements.refs.$references.length * 0.5
		) {
			issues.push( 'need-rs' );
		}
	}

	if ( elements.cats.length === 0 ) {
		issues.push( 'uncategorized' );
	}

	let em = wikitext
		.replace( /<ref.*?<\/ref>/g, '' )
		.match( /(?:''|<(?:em|i|b)>|【)(?:.*?)(?:''|<\/(?:em|i|b)>|】)/g ) || [];
	let emCnt = em.length;
	if ( emCnt > ( wikitext.match( /==(?:.*?)==/g ) || [] ).length ) {
		issues.push( 'over-emphasize' );
	}

	if (
		wikitext.split( '\n' ).filter( function ( x ) {
			return x.match( /^\s+(?!$)/ );
		} ).length &&
		$parseHTML.find( 'pre' ).filter( function ( _i, ele ) {
			let parent = $( ele ).parent().get( 0 );
			return Array.from( parent.classList ).indexOf( 'mw-0highlight' ) > -1;
		} ).length
	) {
		issues.push( 'bad-indents' );
	}

	return {
		issues,
		elements
	};
}

const issuesData = {
	'size-zero': '疑似只有模板及表格',
	substub: '<a href="https://zh.wikipedia.org/wiki/WP:SUBSTUB">小小作品</a>，內容少於50字元',
	stub: '<a href="https://zh.wikipedia.org/wiki/WP:STUB">小作品</a>',
	lengthy: '<a href="https://zh.wikipedia.org/wiki/WP:LENGTH">內容過長</a>',
	wikify: '欠缺<a href="https://zh.wikipedia.org/wiki/WP:WIKIFY">維基化</a>',
	unreferenced: '沒有附上來源',
	'ref-improve': '缺少來源（總長度/200）',
	'ref-disallowed': '包含禁用的不可靠來源',
	'ref-unreliable': '包含不建議使用的不可靠來源',
	'need-rs': '缺少可靠來源，不可靠來源佔來源數過半',
	uncategorized: '沒有加入分類',
	'over-emphasize': '<a href="https://zh.wikipedia.org/wiki/MOS:OEM">過度使用強調格式</a>',
	'bad-indents': '不當縮排',
	copyvio: '可能侵權的內容'
};

module.exports = {
	autoreview,
	issuesData
};
