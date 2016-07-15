'use strict';

const Pug = require('pug');

module.exports = function(options){
    return {
        engines        : { jade: Pug },
        path           : options.path,
        compileOptions : this.util
            .object({ basedir:this.path.root })
            .merge(options.engine)
    };
}
