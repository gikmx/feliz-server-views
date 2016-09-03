'use strict';

const PATH = require('path');
const Vision = require('vision');

const Conf = require('./support/conf');
const Name = 'plugins:views';

module.exports = function views(){
    if (this.plugins.indexOf('server') !== -1)
        throw this.error(`${Name} should be loaded after plugins:server`)
    // Wait for the initial server plugins load, then load Vision, then inject engine.
    const vision$ = this.observable
        .fromEvent(this.events.internal(), 'plugins:server:plugins')
        .switchMap(({server}) => this.observable
            .bindNodeCallback(server.register.bind(server))(Vision)
            .mapTo(server))
        .map(onReady.bind(this))
        .subscribe();
    // no need to wait, carry on.
    return this.observable.of(this)
}

function onReady(server){
    // Make sure the configuration set here won't override the one defined by the user
    if (!this.conf.views) this.conf = Conf;
    else {
        this.conf = this.util.object(Conf).merge({ views: this.conf.views });
        if (Conf.path) this.path = Conf.path;
    }
    const conf = this.conf.views;
    // Validate the resulting configuration
    if (!this.util.is(conf).object()) throw this.error.type({
        name: `${Name}`,
        type: 'Object',
        data: conf
    });
    if (!this.util.is(conf.index).string()) throw this.error.type({
        name: `${Name}.index`,
        type: 'String',
        data: conf.index
    });
    if (!this.util.is(conf.engine).object()) throw this.error.type({
        name: `${Name}.engine`,
        type: 'Object',
        data: conf.engine
    });
    // Require the engine-specific configuration.
    let engine;
    if (conf.engine.name == 'raw') engine = conf.engine.conf;
    else {
        try {
            engine = require(`./engines/${conf.engine.name}`)
        } catch (e) {
            throw this.error(`Invalid ${conf.engine.name} engine: ${e.message}`);
        }
        this.path = { 'views.ext': {
            type: 'join',
            args: [conf.engine.ext || engine.ext]
        }};
        this.path = { 'views.index': {
            type:'join',
            args: [`${conf.index}${this.path.views.ext}`]
        }};
        // Obtain engine-specific conf
        engine = engine.call(this, { engine: conf.engine.conf, vision: conf.vision });
    }
    // Register the corresponding view engine
    server.views(engine);
    // Add a middleware for requests (to extend vision)
    server.ext('onRequest', onRequest.bind(this));
}

function onRequest(request, reply){
    // Determine if this is a request we should extend (defined on router)
    const route = this.router.routes.filter(route => route.path == request.path).shift();
    if (!route) return reply.continue();
    // Keep a copy of the original view renderer (vision)
    const renderer = reply.view;
    // Create a new renderer by hacking into Hapi.
    // TODO: Normally this should be done via «this.server.decorate»
    //       but I haven't found a way of doing it this way. Improve this.
    const feliz = this;
    this.server._replier._decorations.view = function(...args){
        // Obtain the bundle directory and set it as the current folder for views
        const root = PATH.dirname(route.bundle.path);
        feliz.path = { 'views.curr': { type:'join', args:[root] }}
        let path   = PATH.join(root, feliz.path.views.index);
        // if no arguments sent, load the default view.
        if (!args.length) return renderer.call(this, path);
        // is there only one argument and it is an object? load default view with context
        if (args.length === 1 && feliz.util.is(args[0]).object())
            return renderer.call(this, path, args[0]);
        // At self point the first argument must always be a string
        if (!feliz.util.is(args[0]).string()) throw feliz.error({
            name: `${Name}:${route.bundle.name}:reply.view path`,
            type: 'String',
            data: args[0]
        });
        // If relative path sent, resolve it.
        path = args.shift();
        if (!PATH.isAbsolute(path)) path = PATH.resolve(root, path);
        args.unshift(path);
        return renderer.apply(this, args);
    }
    reply.continue();
}
