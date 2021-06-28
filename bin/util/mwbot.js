'use strict';

const { mwn } = require( 'mwn' ),
	credentials = require( '../../../credentials.json' );

Object.assign( credentials.mwn, {
	apiUrl: 'https://zh.wikipedia.org/w/api.php',
	defaultParams: {
		assert: 'user'
	}
} );

const mwbot = new mwn( credentials.mwn );

if ( credentials.mwn.OAuthCredentials ) {
	mwbot.getTokensAndSiteInfo();
} else {
	mwbot.login();
}

module.exports = mwbot;
