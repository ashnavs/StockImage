"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const console_1 = require("console");
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const corsOptions = {
    origin: 'https://stock-image-lmr1cv25g-ashna-v-ss-projects.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.options('*', (0, cors_1.default)(corsOptions));
app.use((0, cors_1.default)(corsOptions));
// Ensure headers are sent with each response
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://stock-image-lmr1cv25g-ashna-v-ss-projects.vercel.app');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
const port = process.env.PORT || 5000;
app.use('/api/users', userRoute_1.default);
app.listen(port, () => {
    (0, console_1.log)(`Server is running on the port ${port}`);
});
