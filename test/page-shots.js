import { assert, expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe, it } from 'mocha';

import { pageShots } from '../src/main.js';

// Set up the chai-as-promised plugin
use(chaiAsPromised);

/* eslint-disable no-unused-expressions -- Some ofthe "expect" calls appear like unused expressions, but they are not */

// Confirm that the base URL is properly set
describe('setBaseUrl', () => {
    it('should set valid base URL', () => {
        const url = 'http://mysite.com';
        pageShots.setBaseUrl(url);
        assert.equal(url, pageShots.baseUrl);
    });
    it('should set valid base URL with the / removed', () => {
        const url = 'http://mysite.com/',
            finalUrl = 'http://mysite.com';
        pageShots.setBaseUrl(url);
        assert.equal(finalUrl, pageShots.baseUrl);
    });
    it('should be set in the URL object', () => {
        const baseUrl = 'http://mysite.com';
        const url = '/page';
        pageShots.urls = [];
        pageShots.setBaseUrl(baseUrl);
        pageShots.addUrl(url);
        const urlObj = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal(baseUrl, urlObj.baseUrl);
        assert.equal(baseUrl + url, urlObj.url);
    });
    it('should remove the trailing "/"', () => {
        const baseUrl = 'https://mysite.com/';
        const url = '/page';
        pageShots.setBaseUrl(baseUrl);
        pageShots.urls = [];
        pageShots.addUrl(url);
        const urlObj = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal('https://mysite.com', urlObj.baseUrl);
        assert.equal('https://mysite.com/page', urlObj.url);
    });
    it('should add a / between the base URL and the page if the base URL does not end with "/" and the URL does not start with "/"', () => {
        pageShots.urls = [];
        pageShots.setBaseUrl('https://www.mysite.com');
        pageShots.addUrl('my-page');
        const urlObj = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal('https://www.mysite.com/my-page', urlObj.url);
    });
    it('should ensure that only one "/" is between the base URL and the page URL', () => {
        pageShots.urls = [];
        pageShots.setBaseUrl('https://www.mysite.com/');
        pageShots.addUrl('/my-page');
        const urlObj = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal('https://www.mysite.com/my-page', urlObj.url);
    });
});


// Confirm that the directory gets properly set
describe('setDirectory', () => {
    it('should set the directory', () => {
        const dir = 'testdir';
        pageShots.setDir(dir);
        assert.equal(dir, pageShots.dir);
    });
});

// Confirm that the file type gets properly set
describe('setFileType', () => {
    it('should set the file type to png', () => {
        const type = 'png';
        pageShots.setFileType(type);
        assert.equal(type, pageShots.fileType);
    });
    it('should set the file type to jpg', () => {
        const type = 'jpg';
        pageShots.setFileType(type);
        assert.equal(type, pageShots.fileType);
    });
    it('should not allow an invaliid page type to be set', () => {
        const type = 'gif';
        const originalType = pageShots.fileType;
        pageShots.setFileType(type);
        assert.equal(originalType, pageShots.fileType);
    });
});


// Confirm that adding URL works
describe('addUrl', () => {
    it('adding a single URL should increment the URLs array by 1', () => {
        const numUrls = pageShots.urls.length;
        pageShots.addUrl('URL');
        expect(pageShots.urls).to.have.lengthOf(numUrls + 1);
    });
    it('adding 2 URLs should increment the URLs array by 2', () => {
        const numUrls = pageShots.urls.length;
        pageShots.addUrl(['URL', 'URL2']);
        expect(pageShots.urls).to.have.lengthOf(numUrls + 2);
    });
});

// Confirm that setting the file name works
describe('setName', () => {
    it('should set the first URL name value for a simple name if no URL has been set yet', () => {
        const name = 'home.jpg';
        pageShots.urls = [];
        pageShots.setName(name);
        assert.equal(name, pageShots.firstUrlName);
        assert.equal('jpg', pageShots.firstUrlType);
    });
    it('should set the first URL name value for a simple name if at least one URL has been set', () => {
        const name = 'home.jpg';
        pageShots.urls = [];
        pageShots.addUrl('url');
        pageShots.setName(name);
        assert.equal(name, pageShots.urls[0].name);
        assert.equal('jpg', pageShots.urls[0].type);
    });
    it('should set the name pattern', () => {
        const name = '{url}-{width}-{height}';
        pageShots.setName(name);
        assert.equal(name, pageShots.nameFormat);
    });
    it('should set the correct file name', () => {
        const name = '{url}-{width}-{height}-{quality}.png';
        pageShots.urls = [];
        pageShots.firstUrlName = pageShots.firstUrlType = '';
        pageShots.setName(name);
        pageShots.addUrl('http://www.aptuitiv.com/contact');
        pageShots.setWidth('1000');
        pageShots.setHeight('900');
        const url = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal(url.filename, 'www-aptuitiv-com-contact-1000-900-100.png');
    });
    it('should set the file type to "png"', () => {
        pageShots.urls = [];
        pageShots.firstUrlName = pageShots.firstUrlType = '';
        pageShots.addUrl('https://www.aptuitiv.com');
        pageShots.setName('home-{width}.png');
        const url = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal(url.type, 'png');
    });
});

// Confirm setting a delay
describe('setDelay', () => {
    it('should default to 0', () => {
        assert.equal(0, pageShots.delay);
    });
    it('should set a number delay', () => {
        pageShots.delay = 0;
        const delay = 1000;
        pageShots.setDelay(delay);
        assert.equal(delay, pageShots.delay);
    });
    it(`should not go above ${pageShots.maxDelay}`, () => {
        pageShots.delay = 0;
        pageShots.setDelay(100000);
        assert.equal(pageShots.maxDelay, pageShots.delay);
    });
    it('should not go below 0', () => {
        pageShots.delay = 0;
        pageShots.setDelay(-1);
        assert.equal(0, pageShots.delay);
    });
    it('should ignore strings', () => {
        pageShots.delay = 0;
        pageShots.setDelay('time');
        assert.equal(0, pageShots.delay);
    });
    it('should ignore parseInt', () => {
        pageShots.delay = 0;
        pageShots.setDelay('300');
        assert.equal(300, pageShots.delay);
    });
});

describe('addSize', () => {
    it('should add a size from a string', () => {
        pageShots.sizes = [];
        pageShots.addSize('200 x 100');
        const size = pageShots.sizes[0];
        expect(size).to.be.an('object');
        assert.equal(200, size.width);
        assert.equal(100, size.height);
    });
    it('should not add a size from an invalid string', () => {
        pageShots.sizes = [];
        pageShots.addSize('200px / 100px');
        const size = pageShots.sizes[0];
        expect(size).to.be.undefined;
    });
    it('should accept an array for a single size', () => {
        pageShots.sizes = [];
        pageShots.addSize(['300x200']);
        const size = pageShots.sizes[0];
        expect(size).to.be.an('object');
        assert.equal(300, size.width);
        assert.equal(200, size.height);
    });
    it('should not accept an array with incorrect values', () => {
        pageShots.sizes = [];
        pageShots.addSize(['blah']);
        const size = pageShots.sizes[0];
        expect(size).to.be.undefined;
    });
    it('should accept and array with multiple string sizes', () => {
        pageShots.sizes = [];
        pageShots.addSize(['1000x800', '800x600', '400x200']);
        const { sizes } = pageShots;
        expect(sizes).to.have.length(3);
        assert.equal(1000, sizes[0].width);
        assert.equal(800, sizes[0].height);

        assert.equal(800, sizes[1].width);
        assert.equal(600, sizes[1].height);

        assert.equal(400, sizes[2].width);
        assert.equal(200, sizes[2].height);
    });
    it('should accept an object for the width and height values', () => {
        pageShots.sizes = [];
        pageShots.addSize({ width: 800, height: 400 });
        const size = pageShots.sizes[0];
        expect(size).to.be.an('object');
        assert.equal(800, size.width);
        assert.equal(400, size.height);
    });
    it('should not accept an object that is missing the width', () => {
        pageShots.sizes = [];
        pageShots.addSize({ x: 800, height: 400 });
        const size = pageShots.sizes[0];
        expect(size).to.be.undefined;
    });
    it('should not accept an object that is missing the height', () => {
        pageShots.sizes = [];
        pageShots.addSize({ width: 800 });
        const size = pageShots.sizes[0];
        expect(size).to.be.undefined;
    });
});