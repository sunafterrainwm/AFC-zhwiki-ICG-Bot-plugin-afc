'use strict';

const { CronJob } = require( 'cron' ),
	getBacklogInfo = require( '../util/backlogInfo.js' );

module.exports = {
	name: 'backlog',
	fire: function ( send ) {
		let backlogNotif = new CronJob( '0 0 * * * *', async function () {
			try {
				const { tMsg, dMsg } = await getBacklogInfo();

				send( {
					tMsg,
					dMsg
				} );

			} catch ( err ) {
				console.log( err );
			}
		} );
		backlogNotif.start();
	}
};
