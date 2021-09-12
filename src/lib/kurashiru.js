const axios = require('axios');
const { JSDOM } = require('jsdom')

const verifyKurashiruUrl = string => {
    const regex = new RegExp('https://www.kurashiru.com/recipes/.+');
    return regex.test(string)
}

const getRecipeFromWeb = async url => {
    const res = await axios.get(url);
    try {
        const doc = new JSDOM(res.data).window.document
        const title = doc.querySelector('head > title').textContent.trim().replace(' 作り方・レシピ | クラシル', '');
        const thumbnail = doc.querySelector('head > meta[name="thumbnail"]').getAttribute("content");
        const ingredients = Array.from(doc.querySelectorAll('section.ingredients > ul > li > a'), a => a.textContent.replace(/\(.+\)/i, '').trim())
        return {
            title: title,
            thumbnail: thumbnail,
            ingredients: ingredients
        }
    } catch (e) {
        console.error(e)
    }
}

if (typeof (module) != 'undefined') {
    module.exports = {
        verifyKurashiruUrl: verifyKurashiruUrl,
        getRecipeFromWeb: getRecipeFromWeb,
    };
}
