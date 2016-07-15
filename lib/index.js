'use strict';

const Vision = require('vision');
const Pug    = require('pug');
const Ejs    = require('ejs');

module.exports = {
    name: 'views',
    data: Vision,
    when: { 'plugin:views': function(){

        const DEFAULT = 'pug';
        let options   = this.options.views;

        if (!this.util.is(options).object()) options = {};
        if (!this.util.is(options.type).string()) options.type = DEFAULT;
        if (!this.util.is(options.path).array()) options.path = [this.path.bundles];
        if (!this.util.is(options.engine).object()) options.engine = {};

        const types = {
            'raw': options.engine,
            'pug': {
                engines        : { jade: Pug },
                path           : options.path,
                compileOptions : this.util
                    .object({ basedir:this.path.root })
                    .merge(options.engine)
            },
            'ejs': this.util
                .object(this.util
                    .object({
                        relativeTo : this.path.root,
                        path       : options.path[0],
                        layout     : false
                    })
                    .merge(options.engine)
                )
                .merge({ engines: { ejs: Ejs } })
        };

        if (!types[options.type]) throw this.error.type({
            name: 'feliz.views.type',
            type: DEFAULT,
            data: options.type
        });

        this.server.views(types[options.type]);
    }}
}
