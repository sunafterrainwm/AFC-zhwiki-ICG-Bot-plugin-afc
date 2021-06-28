'use strict';

module.exports = function ( pluginManager, config, logs = console ) {
	const fs = require( 'fs' ),
		path = require( 'path' );

	const dc = pluginManager.handlers.get( 'Discord' );
	const tg = pluginManager.handlers.get( 'Telegram' );

	logs.info( 'Loading commands:' );

	const commandFiles = fs
		.readdirSync( path.join( __dirname, 'bin/commands' ) )
		.filter( ( file ) => file.endsWith( '.js' ) );

	for ( const file of commandFiles ) {
		const command = require( `./bin/commands/${ file }` );
		logs.log( ` - ${ command.name }` );
		pluginManager.plugins.transport.addCommand( command.name, function ( context ) {
			if ( context.isPrivate ) {
				return Promise.resolve();
			} else if ( config.enable && config.enable.indexOf( context.from ) === -1 ) {
				return Promise.resolve();
			}
			let that = pluginManager.global.BridgeMsg.parseUID( context.to_uid );
			try {
				const { dMsg, tMsg } = await command.run( context.param.split( ' ' ) );
				if ( context.to_uid.startsWith( 'discord/' ) ) {
					dc.say( that.id, dMsg );
				} else if ( context.to_uid.startsWith( 'telegram/' ) ) {
					tg.say( that.id, tMsg, {
						reply_to_message_id: context._rawdata.message.message_id,
						disable_web_page_preview: true,
						parse_mode: 'HTML'
					} );
				}

				setTimeout( function () {
					if ( context.extra.mapto ) {

						for ( let t of context.extra.mapto ) {
							if ( t === context.to_uid ) {
								continue;
							}
							let self = pluginManager.global.BridgeMsg.parseUID( t );
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
				}, 1000 );

				return Promise.resolve();
			} catch ( e ) {
				return Promise.reject( e );
			}
		}
		);
	}

	logs.log( 'Loading events:' );

	const eventFiles = fs
		.readdirSync( path.join( __dirname, 'events' ) )
		.filter( ( file ) => file.endsWith( '.js' ) );

	for ( const file of eventFiles ) {
		const event = require( `./events/${ file }` );
		logs.log( ` - ${ event.name }` );
		event.fire( async function send( { dcid, tgid }, { dMsg, tMsg } ) {
			dc.say( dcid, dMsg );
			tg.say( tgid, tMsg, {
				disable_web_page_preview: true,
				parse_mode: 'HTML'
			} );
		} );
	}
};
