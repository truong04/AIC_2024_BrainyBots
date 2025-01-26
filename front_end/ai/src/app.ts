// Runtime configuration

export async function getInitialState(): Promise<{ name: string }> {
    return {name: '@umijs/max'};
}

import logo from '@/assets/logo.webp';

export const layout = () => {
    return {
        logo: logo,
        title: "AIO_BrainyBots",
        menu: {
            locale: false,
        },

    };
};
