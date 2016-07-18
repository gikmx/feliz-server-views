'use strict';
const PATH   = require('path');
const Vision = require('vision');

module.exports = {
    name: 'views',
    data: Vision,
    when: { 'plugin:views': function(){

        const DEFAULT = 'pug';
        let options   = this.options.views;

        if (!this.util.is(options).object()) options = {};
        if (!this.util.is(options.type).string()) options.type = DEFAULT;
        if (!this.util.is(options.path).array()) options.path = [this.path.bundles];
        if (!this.util.is(options.index).string()) options.index = 'index';
        if (!this.util.is(options.engine).object()) options.engine = {};

        // Get rid of non-vision options
        let index = options.index;
        let ext   = options.ext;
        delete options.index;
        delete options.ext;

        // get the type of view-handlers available
        const types = ['pug', 'ejs', 'nunjucks']
            .reduce(function(acc,cur){
                acc[cur] = require(`./${cur}`);
                return acc;
            }, {});

        // Allow the user to manually set a view-handler
        types.raw = () => options.engine;

        if (!types[options.type]) throw this.error.type({
            name: 'feliz.views.type',
            type: Object.keys(types).join(' || '),
            data: options.type
        });

        const handler = types[options.type];
        if (!this.util.is(ext).string()) ext = handler.ext;

        // Absolute urls should always be allowed, the internal handler needs them.
        options.allowAbsolutePaths = true;

        this.server.views(handler.call(this, options));

        // Replace default view handler with an improved one.
        this.server.ext('onRequest', (request, reply) => {
            // determine if this is a request we should extend
            const route = this.routes
                .filter(route => route.conf.path === request.path)
                .shift();
            if (!route) return reply.continue();
            route.root = PATH.dirname(route.path);
            // keep a copy of the original view-renderer (Vision)
            const renderer = reply.view;
            // overwrite it internally. (this.server.decorate would disallow it)
            this.server._replier._decorations.view = function(){
                const args = Array.prototype.slice.call(arguments);
                // if no arguments sent, let the original renderer deal with it.
                if (!args.length) return renderer.apply(this, args);
                // if more than one arguments are sent, use the normal renderer.
                // but if a relative path is sent, resolve it.
                if (args.length > 1){
                    let path = args.shift();
                    if (path[0] == '.') path = PATH.resolve(route.root, path);
                    args.unshift(path);
                    return renderer.apply(this, args);
                }
                // if only one argument is sent, try to load the default view
                args.unshift(PATH.join(route.root, `${index}${ext}`))
                return renderer.apply(this, args);
            };
            reply.continue();
        })
    }}
}
