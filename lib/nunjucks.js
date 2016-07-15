'use strict';

const Nunjucks = require('nunjucks');

module.exports = function(options){

    const opts = Object.assign({}, options);
    delete opts.type;
    delete opts.engine;

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

    const nunjucks = this.util
        .object(opts)
        .merge({
            compileMode: 'async',
            path       : [this.path.root].concat(options.path),
            engines    : { html: null }
        });

    nunjucks.engines.html = {
        prepare : (opt, next) => {
            opt.compileOptions.environment = Nunjucks.configure(opt.path, engine);
            return next();
        },
        compile : (src, opt, next) => {
            const tmpl = new Nunjucks.Template(src, opt.environment, opt.filename, true);
            if (!tmpl) return next(this.error('Could not compile'));
            next(null, (vars, opt, cback) => tmpl.render(vars, (err, body) => {
                if (err) return cback(err);
                return cback(null, body);
            }))
        }
    };

    return nunjucks;
}
