import axios from "axios";

const instance = axios.create({
    baseURL:process.env.NEXT_PUBLIC_BASE_API,
    headers:{
        'Content-Type':'application/json'
    },
    timeout: 25000,
});
export const req = instance;