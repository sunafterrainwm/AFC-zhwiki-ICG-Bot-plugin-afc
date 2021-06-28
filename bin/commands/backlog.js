'use strict';

const getBacklogInfo = require( '../util/backlogInfo.js' );

module.exports = {
	name: 'backlog',
	usage: 'backlog',
	aliases: [ '積壓', '积压' ],
	description: '查看積壓狀況',
	run: async function () {
		const { tMsg, dMsg } = await getBacklogInfo();

		return {
			tMsg,
			dMsg
		};
	}
};
