const Promise = require('bluebird');
const actionParser = require('../lib/action-parser');
const fs = require.requireMock('fs');

const originalFunc = require('./__mocks__/file.js');
const originalBar = require('./__mocks__/foo/bar.js');

const { clone, last } = require('lodash');

const BASE_CONFIG = {
    error: null,
    data: {},
};

describe('Action Parser', () => {
    const mockWith = kind => function () {
        const cb = last(arguments);
        const value = response[kind];
        cb(value.error, value.data);
    }

    const createResponse = () => ({
        lstat: clone(BASE_CONFIG),
        readdir: clone(BASE_CONFIG),
        readFile: clone(BASE_CONFIG),
    });

    let response = createResponse();

    beforeEach(() => {
        fs.lstat.mockImplementation(mockWith('lstat'));
        fs.readdir.mockImplementation(mockWith('readdir'));
        fs.readFile.mockImplementation(mockWith('readFile'));
    });

    afterEach(() => {
        jest.clearAllMocks();
        response = createResponse();
    });

    it('should parsex correctly only an item', () => {
        const file = `${__dirname}/__mocks__/file.js`;
        const prop = 'test';
        const parser = path => require(path)(prop);

        return actionParser({ file, prop, parser}).then(config => {
            expect(config).toEqual({ [prop]: originalFunc(prop) });
        });
    });

    it('should parsex correctly when lstat back an throw and onFalsy true', () => {
        const error = 'fakeError';
        const opts = { onFalsy: 'something' };
        const prop = 'test';

        response.lstat.error = error;

        return actionParser({ file: undefined, prop, opts }).then(config => {
            expect(config).toEqual({ [prop]: opts.onFalsy });
        });
    });

    it('should parsex correctly only an item', () => {
        const file = `${__dirname}/__mocks__/file.js`;
        const prop = 'test';

        return actionParser({ file, prop }).then(config => {
            expect(config).toEqual({ [prop]: file });
        });
    });

    it('should parsex correctly only configured item', () => {
        const file = `${__dirname}/__mocks__/file.js`;
        const prop = 'test';
        const fakeConfig = { test: 1 };
        const parser = (path, config) => require(path)(prop) + config.test;

        return actionParser({ file, prop, parser }, fakeConfig).then(config => {
            expect(config).toEqual({ [prop]: originalFunc(prop) + fakeConfig.test });
        });
    });

    it('should parsex correclty total dir', () => {
        const file = `${__dirname}/__mocks__/`;
        const prop = 'test';

        return actionParser({ file, prop, parser: require }).then(config => {
            expect(config).toEqual({
                [prop]: {
                    foo: { bar: originalBar },
                    file: originalFunc
                }
            });
        });
    });

    it('should parsex correclty total dir with skip', () => {
        const file = `test/__mocks__/`;
        const prop = 'test';
        const opts = { skip: 'file.js' };

        return actionParser({ file, prop, opts, parser: require }).then(config => {
            expect(config).toEqual({
                [prop]: {
                    foo: { bar: originalBar },
                }
            });
        });
    });

    it('should parsex correclty total dir with only', () => {
        const file = `test/__mocks__/`;
        const prop = 'test';
        const opts = { only: 'file.js' };

        return actionParser({ file, prop, opts, parser: require }).then(config => {
            expect(config).toEqual({
                [prop]: originalFunc
            });
        });
    });

    it('should parsex correclty with > alias', () => {
        const file = `${__dirname}/__mocks__/`;
        const appProp = 'app';
        const prop = 'test';
        const skip = 'foo'
        const opts = { skip: '>  app.skip' };
        const fakeConfig = {
            [appProp]: { file, prop, skip }
        };

        return actionParser({ file: '> app.file', prop: '>app.prop', opts, parser: require }, fakeConfig).then(config => {
            expect(config).toEqual({
                [appProp]: fakeConfig.app,
                [prop]: {
                    file: originalFunc
                }
            });
        });
    });

    it('should parsex correclty with > alias that isn`t a file', () => {
        const file = [ 1, 2 ];
        const prop = 'test';
        const parser = items => items.map(n => n + 1);

        return actionParser({ file, prop, parser }).then(config => {
            expect(config).toEqual({
                [prop]: [ 2, 3 ]
            });
        });
    });
});