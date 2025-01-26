import axios from 'axios';
import {BASE_URL} from "@/constants";

export default axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

