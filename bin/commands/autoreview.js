'use strict';

const Discord = require( 'discord.js' );

const mwbot = require( '../util/mwbot.js' ),
	$ = require( '../util/jquery.js' ),
	turndown = require( '../util/turndown' ),
	{ autoreview, issuesData } = require( '../util/autoreview.js' );

function htmllink( title ) {
	return `<a href="https://zh.wikipedia.org/wiki/${ encodeURIComponent( title ) }">${ title }</a>`;
}

function mdlink( title ) {
	return turndown( htmllink( title ) );
}

module.exports = {
	name: 'autoreview',
	usage: 'autoreview',
	aliases: [ '自動審閱', '自动审阅' ],
	description: '自動審閱頁面並找出可能存在的問題',
	run: async function ( args = [ '' ] ) {
		if ( !args.length ) {
			return {
				tMsg: '請輸入頁面名稱！',
				dMsg: new Discord.MessageEmbed()
					.setColor( 'RED' )
					.setDescription( '請輸入頁面名稱！' )
			};
		}
		const title = args.join( ' ' );

		/**
		 * @type {import('mwn').MwnPage}
		 */
		let page;
		try {
			page = new mwbot.page( title );
		} catch ( e ) {
			return {
				tMsg: `標題${ htmllink( title ) }不合法或是頁面不存在。`,
				dMsg: new Discord.MessageEmbed()
					.setColor( 'RED' )
					.setDescription( `標題${ mdlink( title ) }不合法或是頁面不存在。` )
			};
		}

		let redirect = false;
		let redirecttarget = '';
		try {
			redirect = await page.isRedirect();
			redirecttarget = await page.getRedirectTarget();
		} catch ( e ) {
			return {
				tMsg: `頁面${ htmllink( title ) }不存在。`,
				dMsg: new Discord.MessageEmbed()
					.setColor( 'RED' )
					.setDescription( `頁面${ mdlink( title ) }不存在。` )
			};
		}

		if ( redirect ) {
			page = new mwbot.page( redirecttarget );
		}

		if ( [ 0, 2, 118 ].indexOf( page.namespace ) === -1 ) {
			if ( redirect && page.namespace >= 0 ) {
				return {
					tMsg: `頁面${ htmllink( redirecttarget ) }（重新導向自${ htmllink( title ) } ）不在條目命名空間、使用者命名空間或草稿命名空間，不予解析。`,
					dMsg: new Discord.MessageEmbed()
						.setColor( 'YELLOW' )
						.setDescription( `頁面${ mdlink( redirecttarget ) }（重新導向自${ mdlink( title ) } ）不在條目命名空間、使用者命名空間或草稿命名空間，不予解析。` )
				};
			} else {
				return {
					tMsg: `頁面${ htmllink( title ) }不在條目命名空間、使用者命名空間或草稿命名空間，不予解析。`,
					dMsg: new Discord.MessageEmbed()
						.setColor( 'YELLOW' )
						.setDescription( `頁面${ mdlink( title ) }不在條目命名空間、使用者命名空間或草稿命名空間，不予解析。` )
				};
			}
		}
		const wikitext = await page.text();

		const html = await mwbot.parseWikitext( wikitext, {
			title: title,
			uselang: 'zh-hant'
		} );
		const $parseHTML = $( $.parseHTML( html ) );

		const { issues } = await autoreview( wikitext, $parseHTML );

		let outputpage = '';

		if ( redirect ) {
			outputpage += `${ htmllink( redirecttarget ) }（重新導向自${ htmllink( title ) } ）`;
		} else {
			outputpage += htmllink( title );
		}

		const dMsg = new Discord.MessageEmbed()
			.setColor( issues && issues.length ? 'RED' : 'GREEN' )
			.setTitle( '自動審閱系統' )
			.setDescription( `系統剛剛自動審閱了頁面${ turndown( outputpage ) }` )
			.setTimestamp();

		let tMsg = `<b>自動審閱系統</b>\n系統剛剛自動審閱了頁面${ outputpage }，檢查結果：`;

		if ( issues && issues.length > 0 ) {
			dMsg.addField( '檢查結果', issues.map( ( x ) => `• ${ turndown( issuesData[ x ] ) } (${ x })` ) );
			tMsg += '\n• ' + issues.map( ( x ) => `${ issuesData[ x ] } (${ x })` ).join( '\n• ' );
		} else {
			dMsg.addField( '檢查結果', [ '• 沒有發現顯著的問題。' ] );
			tMsg += '\n• 沒有發現顯著的問題。';
		}

		if ( $parseHTML.find( '#disambigbox' ) ) {
			dMsg.setFooter( '提醒：本頁為消歧義頁，審閱結果可能不準確。' );
			tMsg += '\n<b>提醒</b>：本頁為消歧義頁，審閱結果可能不準確。';
		}

		return {
			dMsg,
			tMsg
		};
	}
};
