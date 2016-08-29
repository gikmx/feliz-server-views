'use strict';

const Conf = module.exports = {};

/**
 * The default configuration options.
 * @module Configuration
 * @type object
 */
Conf.views = {
    /**
     * The view engine to use.
     * @type object
     * @kind __required__ property
     */
    engine:{
        /**
         * The view engine identifier.
         * Available engines:
         * - [pug](https://pugjs.org/api) (default),
         * - [ejs](http://ejs.co)
         * - [nunjucks](https://mozilla.github.io/nunjucks/)
         * - raw (custom defined)
         * @type string
         * @kind __required__ property
         */
        name: 'pug',

        /**
         * The view engine configuration.
         * @type object
         * @kind __required__ property.
         */
        conf: {}
    },

    /**
     * The identifier for index files.
     * @type string
     * @kind __required__ property
     */
    index: 'index'

};

Conf.path = {}

/**
 * The extension used for view files.
 * By default each engine defines its own extension default:
 * - pug: .pug
 * - ejs: .ejs
 * - nunjucks: .html
 * If you define a 'raw' engine, then you must manually set this.
 */
if (Conf.views.engine.name != 'raw') Conf.path = {
    'views.ext': {
        type : 'join',
        args : [require(`../engines/${Conf.views.engine.name}`).ext]
    },
    'views.root':{ type:'join', args:['${bundles}'] }
}
