'use strict';

const BridgeMsg = require( '../../transport/BridgeMsg.js' );

const pluginManager = require( '../../../init.js' );

const dc = pluginManager.handlers.get( 'Discord' );
const tg = pluginManager.handlers.get( 'Telegram' );

async function reply( context, { dMsg, tMsg } ) {
	let that = BridgeMsg.parseUID( context.to_uid );
	if ( context.to_uid.startsWith( 'discord/' ) ) {
		dc.say( that.id, dMsg );
	} else if ( context.to_uid.startsWith( 'telegram/' ) ) {
		tg.say( that.id, tMsg, {
			reply_to_message_id: context._rawdata.message.message_id,
			disable_web_page_preview: true,
			parse_mode: 'HTML'
		} );
	}

	// 若互聯且在公開群組調用，則讓其他群也看到
	if ( context.extra.mapto ) {
		await ( new Promise( function ( resolve ) {
			setTimeout( function () {
				resolve();
			}, 1000 );
		} ) );

		for ( let t of context.extra.mapto ) {
			if ( t === context.to_uid ) {
				continue;
			}
			let self = BridgeMsg.parseUID( t );
			switch ( self.client.toLowerCase() ) {
				case 'telegram':
					tg.say( self.id, tMsg, {
						noPrefix: true,
						disable_web_page_preview: true,
						parse_mode: 'HTML'
					} );
					break;
				case 'discord':
					dc.say( self.id, dMsg );
					break;
				default:
					break;
			}
		}
	}
}

async function send( { dcid, tgid }, { dMsg, tMsg } ) {
	dc.say( dcid, dMsg );
	tg.say( tgid, tMsg, {
		disable_web_page_preview: true,
		parse_mode: 'HTML'
	} );
}

module.exports = {
	reply,
	send
};
