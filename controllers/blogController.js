const controller = {};
const models = require("../models");
const { Op } = require('sequelize');


async function fetchCategoriesAndTags() {
    return {
        categories: await models.Category.findAll({
            attributes: ['id', 'name'],
            include: [{ model: models.Blog }]
        }),
        tags: await models.Category.findAll({
            attributes: ['id', 'name']
        })
    };
}

function getCurrentUrl(req) {
    return req.protocol + '://' + req.get('host') + req.originalUrl;
}


controller.showList = async (req, res) => {
    const category = req.query.category;
    const tag = req.query.tag;
    const search = req.query.search;
    const currentPage = parseInt(req.query.page) || 1;
    const sizePage = 2;
    res.locals.currentUrl = getCurrentUrl(req);

    let blogQuery = {
        attributes: ['id', 'title', 'imagePath', 'summary', 'createdAt'],
        include: [{ model: models.Comment }],
        order: [['id', 'ASC']],
        offset: (currentPage - 1) * sizePage,
        limit: sizePage
    };

    if (category != null && category != 'all') {
        // If category is specified, filter blogs by category ID
        blogQuery.include.push({
            model: models.Category,
            where: { id: category },
        });
    }

    if (tag != null) {
        // If tag is specified, filter blogs by tag ID using the through option
        blogQuery.include.push({
            model: models.Tag,
            where: { id: tag },
        });
    }

    if (search != null) {
        blogQuery.where = {
            [Op.or]: [
                { title: { [Op.like]: `%${search}%` } },
                { summary: { [Op.like]: `%${search}%` } },
            ]
        };
    }

    res.locals.blogs = await models.Blog.findAll(blogQuery);

    const { categories, tags } = await fetchCategoriesAndTags();
    res.locals.categories = categories;
    res.locals.tags = tags;


    const totalBlogs = await models.Blog.count();

    res.render("index", {currentPage, totalPage: Math.ceil(totalBlogs / sizePage)});
}

controller.showDetails = async (req, res) => {
    res.locals.currentUrl = getCurrentUrl(req);
    let id = isNaN(req.params.id) ? 0 : parseInt(req.params.id);
    res.locals.blog = await models.Blog.findOne({
        attributes: ['id', 'title', 'imagePath', 'summary', 'createdAt', 'description'],
        where: {id: id},
        include: [
            { model: models.Category},
            { model: models.User},
            { model: models.Tag},
            { model: models.Comment},
        ]
    });

    console.log(res.locals.blog);

    const { categories, tags } = await fetchCategoriesAndTags();
    res.locals.categories = categories;
    res.locals.tags = tags;
    res.render("details");
}

module.exports = controller;