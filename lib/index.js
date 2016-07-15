'use strict';

const Vision = require('vision');
const Pug    = require('pug');
const Ejs    = require('ejs');
const NunJS  = require('nunjucks');

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

        const types = {};

        types.raw = options.engine;

        types.pug = {
            engines        : { jade: Pug },
            path           : options.path,
            compileOptions : this.util
                .object({ basedir:this.path.root })
                .merge(options.engine)
        };

        types.ejs = this.util
            .object(this.util
                .object({
                    relativeTo : this.path.root,
                    path       : options.path[0],
                    layout     : false
                })
                .merge(options.engine)
            )
            .merge({ engines: { ejs: Ejs } });

        const tmpNJ = Object.assign({}, options);
        delete tmpNJ.type;
        delete tmpNJ.engine;
        types.nunjucks = this.util
            .object(tmpNJ)
            .merge({
                compileMode: 'async',
                path       : [this.path.root].concat(options.path),
                engines    : { html: null }
            });
        types.nunjucks.engines.html = {
            prepare : (opt, next) => {
                const engine = this.util
                    .object({
                        autoescape       : true,
                        throwOnUndefined : false,
                        trimBlocks       : false,
                        lstripBlocks     : false,
                        watch            : false,
                        noCache          : false,
                        web              : { useCache:false, async:true }
                    })
                    .merge(options.engine);
                opt.compileOptions.environment = NunJS.configure(opt.path, engine);
                return next();
            },
            compile : (src, opt, next) => {
                const tmpl = new NunJS.Template(src, opt.environment, opt.filename, true);
                if (!tmpl) return next(this.error('Could not compile'));
                next(null, (vars, opt, cback) => tmpl.render(vars, (err, body) => {
                    if (err) return cback(err);
                    return cback(null, body);
                }))
            }
        };

        if (!types[options.type]) throw this.error.type({
            name: 'feliz.views.type',
            type: DEFAULT,
            data: options.type
        });

        this.server.views(types[options.type]);
    }}
}
