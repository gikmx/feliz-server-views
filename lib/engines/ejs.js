'use strict';

const Ejs = require('ejs');

module.exports = function(conf){

    return this.util
        .object(this.util
            .object({
                relativeTo : this.path.root,
                path       : this.path.bundles,
                layout     : false
            })
            .merge(conf.engine)
        )
        .merge({ engines: { ejs: Ejs } });
}

module.exports.ext = '.ejs';
