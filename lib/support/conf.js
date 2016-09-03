'use strict';

/**
 * The initial configuration sent to the feliz instance.
 * @module Configuration
 * @type object
 */
module.exports = {
    views: {

        /**
         * The view engine to use.
         * @type object
         * @kind __required__ property
         */
        engine: {
            /**
             * The view engine identifier.
             * Available engines:
             * - [pug](https://pugjs.org/api) (default),
             * - [ejs](http://ejs.co)
             * - [nunjucks](https://mozilla.github.io/nunjucks/)
             * - raw (custom defined)
             * @type string
             * @kind __required__ property
             * @default
             */
            name: 'nunjucks',

            /**
             * The view engine configuration.
             * @type object
             * @kind __required__ property
             * @default
             */
            conf: {},

            /**
             * Override the default engine extension.
             * @type string
             * @kind __optional__ property
             * @default
             */
            ext: null
        },

        /**
         * The identifier for index files.
         * @type string
         * @kind __required__ property
         * @default
         */
        index: 'index',

        /**
         * Minify output?
         * @type boolean
         * @kind __optional__ property
         * @default
         */
        minify: process.env.NODE_ENV === 'production',

        /**
         * Extend (or override) vision configuration
         * @type object
         * @kind __optional__ property
         * @default
         */
        vision: {}
    },
    /**
     * Paths to register when setting up the views plugin.
     * All paths defined here will be made available to the views.
     * @type object
     * @kind __optional__ property
     * @default
     */
    path: {
        'views.root': { type:'join', args:['${bundles}'] }
    },

}
