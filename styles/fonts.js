import { Kanit, Lato, Source_Serif_4 } from 'next/font/google';

export const kanit = Kanit({
    weight: ['100','200','300','400','500','600','700', '800','900'],
    subsets: ['latin'],
    variable: '--font-kanit',

});
export const lato = Lato({
    weight: ['100','300','400','700','900'],
    subsets: ['latin'],
    variable: '--font-lato',
});
// Fonte editorial usada só nas páginas de evento (título/masthead) — eventos
// acadêmicos pedem um tratamento tipográfico mais sóbrio que o Kanit do resto do site.
export const sourceSerif = Source_Serif_4({
    weight: ['400','500','600','700'],
    subsets: ['latin'],
    variable: '--font-source-serif',
});



