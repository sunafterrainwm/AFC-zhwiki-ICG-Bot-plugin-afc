'use strict';

const TurndownService = new ( require( 'turndown' ) )();

/**
 * @typedef {import('turndown')} TurndownService
 */

/**
 * @type {typeof TurndownService.turndown}
 */
module.exports = TurndownService.turndown.bind( TurndownService );
