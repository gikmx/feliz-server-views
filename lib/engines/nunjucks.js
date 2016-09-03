'use strict';

const PATH     = require('path');
const Nunjucks = require('nunjucks');
const Minimize = require('minimize');
const Pretty   = require('pretty');

module.exports = function Engine({engine, vision}){

    const debug = this.debug('plugins:views');
    let environment;

    engine = this.util
        .object({
            autoescape       : true,
            throwOnUndefined : true,
            trimBlocks       : false,
            lstripBlocks     : false,
            watch            : false,
            noCache          : false,
            web              : { useCache: false, async: true }
        })
        .merge(engine || {});

    vision = this.util
        .object({
            compileMode        : 'async',
            allowAbsolutePaths : true,
            engines            : {},
        })
        .merge(vision || {});

    vision.engines.html = {};

    vision.engines.html.prepare = (opts, next) => {
        debug('nunjucks:prepare');
        // Make all view paths available for the engine.
        const paths = Object
            .keys(this.path.views)
            .map(name => {
                const path = this.path.views[name];
                if (!PATH.isAbsolute(path)) return null;
                return path;
            })
            .filter(Boolean)
            .reverse();
        Nunjucks.configure(engine);
        const loader = new Nunjucks.FileSystemLoader(paths);
        environment = new Nunjucks.Environment(loader, engine);
        next();
    };

    vision.engines.html.compile = (src, opts, next) => {
        debug('nunjucks:compile', 'init');
        const templ = new Nunjucks.Template(src, environment, opts.filename, false);
        return next(null, (vars, opts, next) => templ.render(vars, (err, body) => {
            if (err) return next(this.error(err.message));
            const onCompile = body => {
                debug('nunjucks:compile', 'done');
                return next(null, body);
            };
            if (!this.conf.views.minify) return onCompile(Pretty(body));
            const minify = new Minimize();
            minify.parse(body, (err, body)=> {
                if (err) return next(this.error(err.message));
                onCompile(body);
            });
        }));
    }
    return vision;
}

module.exports.ext = '.html';
