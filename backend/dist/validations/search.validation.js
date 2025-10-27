import Joi from 'joi';
const webSearch = {
    body: Joi.object().keys({
        query: Joi.string().required().min(1).max(500),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(10),
        filters: Joi.object()
            .keys({
            contentType: Joi.string().valid('web', 'news', 'images', 'videos'),
            sortBy: Joi.string().valid('relevance', 'date', 'popularity'),
            domain: Joi.string(),
            dateRange: Joi.object().keys({
                from: Joi.date().iso(),
                to: Joi.date().iso().min(Joi.ref('from'))
            })
        })
            .optional()
    })
};
const searchSuggestions = {
    query: Joi.object().keys({
        q: Joi.string().required().min(1).max(100)
    })
};
const getSearchHistory = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        searchTerm: Joi.string().max(500),
        fromDate: Joi.date().iso(),
        toDate: Joi.date().iso().min(Joi.ref('fromDate'))
    })
};
const saveSearchHistory = {
    body: Joi.object().keys({
        query: Joi.string().required().min(1).max(500),
        resultCount: Joi.number().integer().min(0).required(),
        filters: Joi.object().optional()
    })
};
const deleteSearchHistoryItem = {
    params: Joi.object().keys({
        id: Joi.string().uuid().required()
    })
};
export default {
    webSearch,
    searchSuggestions,
    getSearchHistory,
    saveSearchHistory,
    deleteSearchHistoryItem
};
