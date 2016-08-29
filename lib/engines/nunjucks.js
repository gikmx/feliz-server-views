'use strict';

const Nunjucks = require('nunjucks');
const Minimize = require('minimize');
const Pretty   = require('pretty');

module.exports = function(conf){

    const opts = Object.assign({}, conf);
    delete opts.type;
    delete opts.engine;

    const engine = this.util
        .object({
            autoescape       : true,
            minimize         : true,  // not part of spec
            throwOnUndefined : false,
            trimBlocks       : false,
            lstripBlocks     : false,
            watch            : false,
            noCache          : false,
            web              : { useCache:false, async:true }
        })
        .merge(conf.engine);

    const nunjucks = this.util
        .object(opts)
        .merge({
            compileMode: 'async',
            path       : [this.path.root].concat(conf.path),
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
            next(null, (vars, opt, cback) => {
                tmpl.render(vars, (err, body) => {
                    if (err) return cback(err);
                    if (!engine.minimize) return cback(null, Pretty(body));
                    const minimize = new Minimize();
                    minimize.parse(body, (err, data) => {
                        if (err) return cback(err);
                        return cback(null, data);
                    })
                })
            })
        }
    }

    return nunjucks;
}

module.exports.ext = '.html';
