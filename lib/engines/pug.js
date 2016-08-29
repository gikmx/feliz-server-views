'use strict';

const Pug = require('pug');

module.exports = function(conf){ return this.util.object({
    /**
     * Mapping extension to an engine.
     * @type object
     */
    engines : { 'jade' : Pug, 'pug' : Pug },

    /**
     * The resolver path for the views
     * @type array
     */
    path : [this.path.root, this.path.bundles],

    /**
     * The options sent to the core view engine
     * @type object
     */
    compileOptions : { basedir:this.path.root }

}).merge(conf || {})}

module.exports.ext = '.pug';
