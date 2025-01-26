import {defineConfig} from '@umijs/max';

export default defineConfig({
    antd: {
        configProvider: {}
    },
    access: {},
    model: {},
    initialState: {
    },
    request: {
        dataField: '',
    },
    locale: {
        default: 'vi-VN',
        baseSeparator: '-',
    },
    layout: {
        title: '@umijs/max',
    },
    routes: [
        {
            path: '/',
            redirect: '/search',
        },
        {
            name: 'Search Page',
            path: '/search',
            component: './Search',
        },
        {
            name: 'Ignore Page',
            path: '/ignore-frames',
            component: './Ignore',
        },
         {
            name: 'Login Page',
            path: '/login',
            component: './Login',
        },
    ],
    npmClient: 'pnpm',
});
