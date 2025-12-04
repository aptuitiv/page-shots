import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;

import { pageShots } from '../src/main.js';

// Confirm that the base URL is properly set
describe('setBaseUrl', function () {
    it('should set valid base URL', function () {
        let url = 'http://mysite.com';
        pageShots.setBaseUrl(url);
        assert.equal(url, pageShots.baseUrl);
    });
    it('should set valid base URL with the / removed', function () {
        let url = 'http://mysite.com/',
            finalUrl = 'http://mysite.com';
        pageShots.setBaseUrl(url);
        assert.equal(finalUrl, pageShots.baseUrl);
    });
    it('should be set in the URL object', function () {
        let baseUrl = 'http://mysite.com';
        let url = '/page';
        pageShots.urls = [];
        pageShots.setBaseUrl(baseUrl);
        pageShots.addUrl(url);
        let urlObj = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal(baseUrl, urlObj.baseUrl);
        assert.equal(baseUrl + url, urlObj.url);
    });
    it('should remove the trailing "/"', function () {
        let baseUrl = 'https://mysite.com/';
        let url = '/page';
        pageShots.setBaseUrl(baseUrl);
        pageShots.urls = [];
        pageShots.addUrl(url);
        let urlObj = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal('https://mysite.com', urlObj.baseUrl);
        assert.equal('https://mysite.com/page', urlObj.url);
    });
    it('should add a / between the base URL and the page if the base URL does not end with "/" and the URL does not start with "/"', function () {
        pageShots.urls = [];
        pageShots.setBaseUrl('https://www.mysite.com');
        pageShots.addUrl('my-page');
        let urlObj = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal('https://www.mysite.com/my-page', urlObj.url);
    });
    it('should ensure that only one "/" is between the base URL and the page URL', function () {
        pageShots.urls = [];
        pageShots.setBaseUrl('https://www.mysite.com/');
        pageShots.addUrl('/my-page');
        let urlObj = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal('https://www.mysite.com/my-page', urlObj.url);
    });
});


// Confirm that the directory gets properly set
describe('setDirectory', function () {
    it('should set the directory', function () {
        let dir = 'testdir';
        pageShots.setDir(dir);
        assert.equal(dir, pageShots.dir);
    });
});

// Confirm that the file type gets properly set
describe('setFileType', function () {
    it('should set the file type to png', function () {
        let type = 'png';
        pageShots.setFileType(type);
        assert.equal(type, pageShots.fileType);
    });
    it('should set the file type to jpg', function () {
        let type = 'jpg';
        pageShots.setFileType(type);
        assert.equal(type, pageShots.fileType);
    });
    it('should not allow an invaliid page type to be set', function () {
        let type = 'gif';
        let originalType = pageShots.fileType;
        pageShots.setFileType(type);
        assert.equal(originalType, pageShots.fileType);
    });
});


// Confirm that adding URL works
describe('addUrl', function () {
    it('adding a single URL should increment the URLs array by 1', function () {
        let numUrls = pageShots.urls.length;
        pageShots.addUrl('URL');
        expect(pageShots.urls).to.have.lengthOf(numUrls + 1);
    });
    it('adding 2 URLs should increment the URLs array by 2', function () {
        let numUrls = pageShots.urls.length;
        pageShots.addUrl(['URL', 'URL2']);
        expect(pageShots.urls).to.have.lengthOf(numUrls + 2);
    });
});

// Confirm that setting the file name works
describe('setName', function () {
    it('should set the first URL name value for a simple name if no URL has been set yet', function () {
        let name = 'home.jpg';
        pageShots.urls = [];
        pageShots.setName(name);
        assert.equal(name, pageShots.firstUrlName);
        assert.equal('jpg', pageShots.firstUrlType);
    });
    it('should set the first URL name value for a simple name if at least one URL has been set', function () {
        let name = 'home.jpg';
        pageShots.urls = [];
        pageShots.addUrl('url');
        pageShots.setName(name);
        assert.equal(name, pageShots.urls[0].name);
        assert.equal('jpg', pageShots.urls[0].type);
    });
    it('should set the name pattern', function () {
        let name = '{url}-{width}-{height}';
        pageShots.setName(name);
        assert.equal(name, pageShots.nameFormat);
    });
    it('should set the correct file name', function () {
        let name = '{url}-{width}-{height}-{quality}.png';
        pageShots.urls = [];
        pageShots.firstUrlName = pageShots.firstUrlType = '';
        pageShots.setName(name);
        pageShots.addUrl('http://www.aptuitiv.com/contact');
        pageShots.setWidth('1000');
        pageShots.setHeight('900');
        let url = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal(url.filename, 'www-aptuitiv-com-contact-1000-900-100.png');
    });
    it('should set the file type to "png"', function () {
        pageShots.urls = [];
        pageShots.firstUrlName = pageShots.firstUrlType = '';
        pageShots.addUrl('https://www.aptuitiv.com');
        pageShots.setName('home-{width}.png');
        let url = pageShots._setupUrl(pageShots.urls[0]);
        assert.equal(url.type, 'png');
    });
});

// Confirm setting a delay
describe('setDelay', function () {
    it('should default to 0', function () {
        assert.equal(0, pageShots.delay);
    });
    it('should set a number delay', function () {
        pageShots.delay = 0;
        let delay = 1000;
        pageShots.setDelay(delay);
        assert.equal(delay, pageShots.delay);
    });
    it('should not go above ' + pageShots.maxDelay, function () {
        pageShots.delay = 0;
        pageShots.setDelay(100000);
        assert.equal(pageShots.maxDelay, pageShots.delay);
    });
    it('should not go below 0', function () {
        pageShots.delay = 0;
        pageShots.setDelay(-1);
        assert.equal(0, pageShots.delay);
    });
    it('should ignore strings', function () {
        pageShots.delay = 0;
        pageShots.setDelay('time');
        assert.equal(0, pageShots.delay);
    });
    it('should ignore parseInt', function () {
        pageShots.delay = 0;
        pageShots.setDelay('300');
        assert.equal(300, pageShots.delay);
    });
});

describe('addSize', function () {
    it('should add a size from a string', function () {
        pageShots.sizes = [];
        pageShots.addSize('200 x 100');
        let size = pageShots.sizes[0];
        expect(size).to.be.an('object');
        assert.equal(200, size.width);
        assert.equal(100, size.height);
    });
    it('should not add a size from an invalid string', function () {
        pageShots.sizes = [];
        pageShots.addSize('200px / 100px');
        let size = pageShots.sizes[0];
        expect(size).to.be.undefined;
    });
    it('should accept an array for a single size', function () {
        pageShots.sizes = [];
        pageShots.addSize(['300x200']);
        let size = pageShots.sizes[0];
        expect(size).to.be.an('object');
        assert.equal(300, size.width);
        assert.equal(200, size.height);
    });
    it('should not accept an array with incorrect values', function () {
        pageShots.sizes = [];
        pageShots.addSize(['blah']);
        let size = pageShots.sizes[0];
        expect(size).to.be.undefined;
    });
    it('should accept and array with multiple string sizes', function () {
        pageShots.sizes = [];
        pageShots.addSize(['1000x800', '800x600', '400x200']);
        let sizes = pageShots.sizes;
        expect(sizes).to.have.length(3);
        assert.equal(1000, sizes[0].width);
        assert.equal(800, sizes[0].height);

        assert.equal(800, sizes[1].width);
        assert.equal(600, sizes[1].height);

        assert.equal(400, sizes[2].width);
        assert.equal(200, sizes[2].height);
    });
    it('should accept an object for the width and height values', function () {
        pageShots.sizes = [];
        pageShots.addSize({ width: 800, height: 400 });
        let size = pageShots.sizes[0];
        expect(size).to.be.an('object');
        assert.equal(800, size.width);
        assert.equal(400, size.height);
    });
    it('should not accept an object that is missing the width', function () {
        pageShots.sizes = [];
        pageShots.addSize({ x: 800, height: 400 });
        let size = pageShots.sizes[0];
        expect(size).to.be.undefined;
    });
    it('should not accept an object that is missing the height', function () {
        pageShots.sizes = [];
        pageShots.addSize({ width: 800 });
        let size = pageShots.sizes[0];
        expect(size).to.be.undefined;
    });
});