"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.sessionDb = exports.skillDb = exports.levelDb = exports.userDb = void 0;
exports.initializeDb = initializeDb;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var crypto_1 = require("crypto");
// Define the data directory
var DATA_DIR = path_1.default.join(process.cwd(), 'data');
var USERS_FILE = path_1.default.join(DATA_DIR, 'users.json');
var LEVELS_FILE = path_1.default.join(DATA_DIR, 'levels.json');
var SKILLS_FILE = path_1.default.join(DATA_DIR, 'skills.json');
var SESSIONS_FILE = path_1.default.join(DATA_DIR, 'sessions.json');
// Initialize the database
function initializeDb() {
    return __awaiter(this, void 0, void 0, function () {
        var files, _i, files_1, file, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    // Create data directory if it doesn't exist
                    return [4 /*yield*/, promises_1.default.mkdir(DATA_DIR, { recursive: true })];
                case 1:
                    // Create data directory if it doesn't exist
                    _b.sent();
                    files = [
                        { path: USERS_FILE, defaultContent: '[]' },
                        { path: LEVELS_FILE, defaultContent: '[]' },
                        { path: SKILLS_FILE, defaultContent: '[]' },
                        { path: SESSIONS_FILE, defaultContent: '[]' },
                    ];
                    _i = 0, files_1 = files;
                    _b.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 8];
                    file = files_1[_i];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 7]);
                    return [4 /*yield*/, promises_1.default.access(file.path)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 5:
                    _a = _b.sent();
                    return [4 /*yield*/, promises_1.default.writeFile(file.path, file.defaultContent)];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_1 = _b.sent();
                    console.error('Error initializing database:', error_1);
                    throw error_1;
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Generic read function
function readData(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf-8')];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, JSON.parse(data)];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error reading from ".concat(filePath, ":"), error_2);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Generic write function
function writeData(filePath, data) {
    return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promises_1.default.writeFile(filePath, JSON.stringify(data, null, 2))];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error writing to ".concat(filePath, ":"), error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// User CRUD operations
exports.userDb = {
    findUnique: function (where) { return __awaiter(void 0, void 0, void 0, function () {
        var users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(USERS_FILE)];
                case 1:
                    users = _a.sent();
                    return [2 /*return*/, users.find(function (user) {
                            return (where.id && user.id === where.id) ||
                                (where.username && user.username === where.username);
                        }) || null];
            }
        });
    }); },
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var users, newUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(USERS_FILE)];
                case 1:
                    users = _a.sent();
                    newUser = __assign(__assign({}, data), { id: (0, crypto_1.randomUUID)(), createdAt: new Date(), updatedAt: new Date() });
                    users.push(newUser);
                    return [4 /*yield*/, writeData(USERS_FILE, users)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, newUser];
            }
        });
    }); },
    update: function (where, data) { return __awaiter(void 0, void 0, void 0, function () {
        var users, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(USERS_FILE)];
                case 1:
                    users = _a.sent();
                    index = users.findIndex(function (user) { return user.id === where.id; });
                    if (index === -1)
                        throw new Error("User with id ".concat(where.id, " not found"));
                    users[index] = __assign(__assign(__assign({}, users[index]), data), { updatedAt: new Date() });
                    return [4 /*yield*/, writeData(USERS_FILE, users)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, users[index]];
            }
        });
    }); },
    findMany: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, readData(USERS_FILE)];
        });
    }); },
    delete: function (where) { return __awaiter(void 0, void 0, void 0, function () {
        var users, index, deletedUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(USERS_FILE)];
                case 1:
                    users = _a.sent();
                    index = users.findIndex(function (user) { return user.id === where.id; });
                    if (index === -1)
                        throw new Error("User with id ".concat(where.id, " not found"));
                    deletedUser = users[index];
                    users.splice(index, 1);
                    return [4 /*yield*/, writeData(USERS_FILE, users)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, deletedUser];
            }
        });
    }); },
    upsert: function (where, update, create) { return __awaiter(void 0, void 0, void 0, function () {
        var existingUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.userDb.findUnique(where)];
                case 1:
                    existingUser = _a.sent();
                    if (existingUser) {
                        return [2 /*return*/, exports.userDb.update({ id: existingUser.id }, update)];
                    }
                    else {
                        return [2 /*return*/, exports.userDb.create(create)];
                    }
                    return [2 /*return*/];
            }
        });
    }); }
};
// Level CRUD operations
exports.levelDb = {
    findFirst: function (where) { return __awaiter(void 0, void 0, void 0, function () {
        var levels;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(LEVELS_FILE)];
                case 1:
                    levels = _a.sent();
                    return [2 /*return*/, levels.find(function (level) {
                            return (where.name && level.name === where.name);
                        }) || null];
            }
        });
    }); },
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var levels, newLevel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(LEVELS_FILE)];
                case 1:
                    levels = _a.sent();
                    newLevel = __assign(__assign({}, data), { id: (0, crypto_1.randomUUID)() });
                    levels.push(newLevel);
                    return [4 /*yield*/, writeData(LEVELS_FILE, levels)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, newLevel];
            }
        });
    }); },
    update: function (where, data) { return __awaiter(void 0, void 0, void 0, function () {
        var levels, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(LEVELS_FILE)];
                case 1:
                    levels = _a.sent();
                    index = levels.findIndex(function (level) { return level.id === where.id; });
                    if (index === -1)
                        throw new Error("Level with id ".concat(where.id, " not found"));
                    levels[index] = __assign(__assign({}, levels[index]), data);
                    return [4 /*yield*/, writeData(LEVELS_FILE, levels)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, levels[index]];
            }
        });
    }); },
    findMany: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, readData(LEVELS_FILE)];
        });
    }); },
};
// Skill CRUD operations
exports.skillDb = {
    findFirst: function (where) { return __awaiter(void 0, void 0, void 0, function () {
        var skills;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(SKILLS_FILE)];
                case 1:
                    skills = _a.sent();
                    return [2 /*return*/, skills.find(function (skill) {
                            return (where.name && skill.name === where.name);
                        }) || null];
            }
        });
    }); },
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var skills, newSkill;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(SKILLS_FILE)];
                case 1:
                    skills = _a.sent();
                    newSkill = __assign(__assign({}, data), { id: (0, crypto_1.randomUUID)() });
                    skills.push(newSkill);
                    return [4 /*yield*/, writeData(SKILLS_FILE, skills)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, newSkill];
            }
        });
    }); },
    update: function (where, data) { return __awaiter(void 0, void 0, void 0, function () {
        var skills, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(SKILLS_FILE)];
                case 1:
                    skills = _a.sent();
                    index = skills.findIndex(function (skill) { return skill.id === where.id; });
                    if (index === -1)
                        throw new Error("Skill with id ".concat(where.id, " not found"));
                    skills[index] = __assign(__assign({}, skills[index]), data);
                    return [4 /*yield*/, writeData(SKILLS_FILE, skills)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, skills[index]];
            }
        });
    }); },
    findMany: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, readData(SKILLS_FILE)];
        });
    }); },
    delete: function (where) { return __awaiter(void 0, void 0, void 0, function () {
        var skills, index, deletedSkill;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(SKILLS_FILE)];
                case 1:
                    skills = _a.sent();
                    index = skills.findIndex(function (skill) { return skill.id === where.id; });
                    if (index === -1)
                        throw new Error("Skill with id ".concat(where.id, " not found"));
                    deletedSkill = skills[index];
                    skills.splice(index, 1);
                    return [4 /*yield*/, writeData(SKILLS_FILE, skills)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, deletedSkill];
            }
        });
    }); },
};
// Session CRUD operations
exports.sessionDb = {
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var sessions, newSession;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(SESSIONS_FILE)];
                case 1:
                    sessions = _a.sent();
                    newSession = __assign(__assign({}, data), { id: (0, crypto_1.randomUUID)() });
                    sessions.push(newSession);
                    return [4 /*yield*/, writeData(SESSIONS_FILE, sessions)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, newSession];
            }
        });
    }); },
    findUnique: function (where) { return __awaiter(void 0, void 0, void 0, function () {
        var sessions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(SESSIONS_FILE)];
                case 1:
                    sessions = _a.sent();
                    return [2 /*return*/, sessions.find(function (session) { return session.id === where.id; }) || null];
            }
        });
    }); },
    findMany: function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (where) {
            var sessions;
            if (where === void 0) { where = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, readData(SESSIONS_FILE)];
                    case 1:
                        sessions = _a.sent();
                        if (where.userId) {
                            return [2 /*return*/, sessions.filter(function (session) { return session.userId === where.userId; })];
                        }
                        return [2 /*return*/, sessions];
                }
            });
        });
    },
    delete: function (where) { return __awaiter(void 0, void 0, void 0, function () {
        var sessions, index, deletedSession;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readData(SESSIONS_FILE)];
                case 1:
                    sessions = _a.sent();
                    index = sessions.findIndex(function (session) { return session.id === where.id; });
                    if (index === -1)
                        throw new Error("Session with id ".concat(where.id, " not found"));
                    deletedSession = sessions[index];
                    sessions.splice(index, 1);
                    return [4 /*yield*/, writeData(SESSIONS_FILE, sessions)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, deletedSession];
            }
        });
    }); },
};
// Export a db object that mimics Prisma client structure
exports.db = {
    user: exports.userDb,
    level: exports.levelDb,
    skill: exports.skillDb,
    session: exports.sessionDb,
};
