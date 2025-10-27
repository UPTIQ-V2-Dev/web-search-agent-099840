import config from "../../config/config.js";
import authRoute from "./auth.route.js";
import docsRoute from "./docs.route.js";
import mcpRoute from "./mcp.route.js";
import searchRoute from "./search.route.js";
import userRoute from "./user.route.js";
import express from 'express';
const router = express.Router();
const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute
    },
    {
        path: '/users',
        route: userRoute
    },
    {
        path: '/search',
        route: searchRoute
    },
    {
        path: '/mcp',
        route: mcpRoute
    }
];
const devRoutes = [
    // routes available only in development mode
    {
        path: '/docs',
        route: docsRoute
    }
];
defaultRoutes.forEach(route => {
    router.use(route.path, route.route);
});
/* istanbul ignore next */
if (config.env === 'development') {
    devRoutes.forEach(route => {
        router.use(route.path, route.route);
    });
}
export default router;
