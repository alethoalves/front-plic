import { Kanit, Lato } from 'next/font/google';

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



