'use strict';

const Discord = require( 'discord.js' ),
	turndown = require( '../util/turndown' ),
	getBacklogInfo = require( '../util/backlogInfo.js' );

function htmllink( title ) {
	return `<a href="https://zh.wikipedia.org/wiki/${ encodeURIComponent( title ) }">${ title }</a>`;
}

function mdlink( title ) {
	return turndown( htmllink( title ) );
}

module.exports = {
	name: 'waitlist',
	usage: 'waitlist',
	aliases: [ '候審', '候审' ],
	description: '查看積壓狀況',
	run: async function ( args = [ '' ] ) {
		const { list } = await getBacklogInfo();
		let i = -1, len = 0, j = 0, s = 0;
		for ( let page of list ) {
			let link = mdlink( page.title );
			if ( len + link.length > 2048 ) {
				j++;
				len = 0;
				s = i;
			}
			if ( j === args[ 0 ] ) {
				break;
			}
			i++;
			len += link.length;
		}

		const dMsg = new Discord.MessageEmbed()
			.setColor( 0x708ad7 )
			.setTitle( '候審草稿列表' )
			.setDescription( list.map( function ( page ) {
				return mdlink( page.title ).slice( s, i + 1 ).join( '' );
			} ) )
			.setTimestamp()
			.setFooter( `顯示第 ${ s + 1 } 至 ${ i + 1 } 項（共 ${ list.length } 項）` );

		const tMsg = `<b>候審草稿列表</b>\n${ list.map( function ( page ) {
			return `• ${ htmllink( page.title ) }`;
		} ).join( '\n' ) }\n顯示第 ${ s + 1 } 至 ${ i + 1 } 項（共 ${ list.length } 項）`;

		return {
			tMsg,
			dMsg
		};
	}
};
