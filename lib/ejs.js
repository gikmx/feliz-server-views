'use strict';

const Ejs = require('ejs');

module.exports = function(options){

    return this.util
        .object(this.util
            .object({
                relativeTo : this.path.root,
                path       : options.path[0],
                layout     : false
            })
            .merge(options.engine)
        )
        .merge({ engines: { ejs: Ejs } });
}

module.exports.ext = '.ejs';
